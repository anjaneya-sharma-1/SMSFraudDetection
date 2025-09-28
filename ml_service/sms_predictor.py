"""
SMS Classification Predictor
============================
This module provides a simple interface to classify SMS messages as ham, spam, or smishing
using a pre-trained machine learning model.

Requirements:
- spam_detection_model.pkl (trained model file)
- Required packages: scikit-learn, pandas, nltk, joblib

Usage:
    from sms_predictor import classify_sms
    result = classify_sms("Your SMS message here")
    print(result)
"""

import re
import joblib
import nltk
import pandas as pd
import warnings
from typing import Dict, Tuple, Optional

# Download required NLTK data (run only once)
try:
    from nltk.corpus import stopwords
    from nltk.tokenize import word_tokenize
except LookupError:
    nltk.download('stopwords', quiet=True)
    nltk.download('punkt', quiet=True)
    from nltk.corpus import stopwords
    from nltk.tokenize import word_tokenize

# Suppress warnings
warnings.filterwarnings('ignore')

class SMSClassifier:
    """
    SMS Classification class for detecting ham, spam, and smishing messages
    """
    
    def __init__(self, model_path: str = 'spam_detection_model.pkl'):
        """
        Initialize the SMS classifier
        
        Args:
            model_path (str): Path to the trained model file
        """
        self.model = None
        self.model_path = model_path
        self.stop_words = set(stopwords.words('english'))
        self.load_model()
    
    def load_model(self) -> None:
        """Load the trained model from file"""
        try:
            self.model = joblib.load(self.model_path)
            print(f"✅ Model loaded successfully from {self.model_path}")
        except FileNotFoundError:
            raise FileNotFoundError(f"Model file not found: {self.model_path}")
        except Exception as e:
            raise Exception(f"Error loading model: {str(e)}")
    
    def preprocess_text(self, text: str) -> str:
        """
        Basic text preprocessing
        
        Args:
            text (str): Raw input text
            
        Returns:
            str: Cleaned text
        """
        if pd.isna(text) or text is None:
            return ""
        
        # Convert to lowercase
        text = str(text).lower()
        
        # Remove URLs
        text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
        
        # Remove email addresses
        text = re.sub(r'\S+@\S+', '', text)
        
        # Remove phone numbers (various formats)
        text = re.sub(r'[\+]?[1-9]?[0-9]{7,15}', '', text)
        text = re.sub(r'\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}', '', text)
        
        # Remove special characters and digits
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        return text
    
    def advanced_preprocess(self, text: str) -> str:
        """
        Advanced preprocessing with stopword removal
        
        Args:
            text (str): Raw input text
            
        Returns:
            str: Processed text ready for model input
        """
        # Basic preprocessing
        text = self.preprocess_text(text)
        
        # Tokenize and remove stopwords
        try:
            tokens = word_tokenize(text)
            tokens = [token for token in tokens if token not in self.stop_words and len(token) > 2]
            return ' '.join(tokens)
        except:
            # Fallback if NLTK fails
            words = text.split()
            words = [word for word in words if word not in self.stop_words and len(word) > 2]
            return ' '.join(words)
    
    def predict(self, message: str) -> Dict:
        """
        Predict the class of an SMS message
        
        Args:
            message (str): SMS message to classify
            
        Returns:
            dict: Dictionary containing prediction results
        """
        if self.model is None:
            raise Exception("Model not loaded. Please check the model file.")
        
        # Preprocess the message
        processed_message = self.advanced_preprocess(message)
        
        # Handle empty processed message
        if not processed_message.strip():
            processed_message = self.preprocess_text(message)
        
        if not processed_message.strip():
            processed_message = "unknown"
        
        try:
            # Make prediction
            prediction = self.model.predict([processed_message])[0]
            probabilities = self.model.predict_proba([processed_message])[0]
            
            # Get class probabilities
            classes = self.model.classes_
            prob_dict = dict(zip(classes, probabilities))
            
            # Find confidence (max probability)
            confidence = max(probabilities)
            
            # Create result dictionary
            result = {
                'message': message,
                'prediction': prediction,
                'confidence': confidence,
                'probabilities': prob_dict,
                'processed_text': processed_message
            }
            
            return result
            
        except Exception as e:
            raise Exception(f"Error during prediction: {str(e)}")

# Global classifier instance
_classifier = None

def initialize_classifier(model_path: str = 'spam_detection_model.pkl') -> None:
    """
    Initialize the global classifier instance
    
    Args:
        model_path (str): Path to the trained model file
    """
    global _classifier
    _classifier = SMSClassifier(model_path)

def classify_sms(message: str, detailed: bool = False) -> Dict:
    """
    Classify an SMS message as ham, spam, or smishing
    
    Args:
        message (str): SMS message to classify
        detailed (bool): If True, returns detailed information including probabilities
        
    Returns:
        dict: Classification results
        
    Example:
        >>> result = classify_sms("Congratulations! You've won $1000!")
        >>> print(result['prediction'])  # 'spam'
        >>> print(result['confidence'])  # 0.95
    """
    global _classifier
    
    # Initialize classifier if not already done
    if _classifier is None:
        initialize_classifier()
    
    # Get prediction
    result = _classifier.predict(message)
    
    if detailed:
        return result
    else:
        # Return simplified result
        return {
            'prediction': result['prediction'],
            'confidence': result['confidence'],
            'probabilities': result['probabilities']
        }

def batch_classify(messages: list, detailed: bool = False) -> list:
    """
    Classify multiple SMS messages
    
    Args:
        messages (list): List of SMS messages to classify
        detailed (bool): If True, returns detailed information for each message
        
    Returns:
        list: List of classification results
    """
    results = []
    for message in messages:
        try:
            result = classify_sms(message, detailed=detailed)
            results.append(result)
        except Exception as e:
            results.append({
                'message': message,
                'prediction': 'error',
                'confidence': 0.0,
                'error': str(e)
            })
    return results

def get_prediction_summary(message: str) -> str:
    """
    Get a human-readable summary of the prediction
    
    Args:
        message (str): SMS message to classify
        
    Returns:
        str: Human-readable prediction summary
    """
    try:
        result = classify_sms(message)
        prediction = result['prediction']
        confidence = result['confidence']
        
        # Create confidence level description
        if confidence >= 0.9:
            conf_level = "very high"
        elif confidence >= 0.7:
            conf_level = "high"
        elif confidence >= 0.5:
            conf_level = "moderate"
        else:
            conf_level = "low"
        
        summary = f"Prediction: {prediction.upper()} (confidence: {conf_level} - {confidence:.2%})"
        
        return summary
        
    except Exception as e:
        return f"Error: {str(e)}"

# Example usage and testing functions
def test_classifier():
    """Test the classifier with sample messages"""
    
    test_messages = [
        "Hey, are you free for lunch tomorrow?",  # Expected: ham
        "Congratulations! You've won $1000! Click here to claim now!",  # Expected: spam
        "URGENT: Your account will be suspended. Verify at fake-bank.com",  # Expected: smishing
        "Meeting scheduled for 3 PM in conference room B",  # Expected: ham
        "Free iPhone! Text STOP to unsubscribe. Limited time!",  # Expected: spam
        "Your OTP is 123456. Do not share with anyone.",  # Expected: ham
        "Click here to update your banking details immediately",  # Expected: smishing
    ]
    
    print("Testing SMS Classifier")
    print("=" * 50)
    
    for i, message in enumerate(test_messages, 1):
        print(f"\nTest {i}: {message[:50]}{'...' if len(message) > 50 else ''}")
        try:
            summary = get_prediction_summary(message)
            print(f"Result: {summary}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    # Run tests when script is executed directly
    try:
        # Initialize classifier
        print("Initializing SMS Classifier...")
        initialize_classifier()
        
        # Run tests
        test_classifier()
        
        print("\n" + "=" * 50)
        print("SMS Classifier is ready to use!")
        print("=" * 50)
        
        # Interactive mode
        print("\nInteractive mode - Enter SMS messages to classify (type 'quit' to exit):")
        
        while True:
            try:
                user_input = input("\nEnter SMS message: ").strip()
                
                if user_input.lower() in ['quit', 'exit', 'q']:
                    print("Goodbye!")
                    break
                
                if user_input:
                    result = classify_sms(user_input)
                    print(f"Prediction: {result['prediction'].upper()}")
                    print(f"Confidence: {result['confidence']:.2%}")
                    print("Probabilities:")
                    for label, prob in result['probabilities'].items():
                        print(f"  {label}: {prob:.2%}")
                else:
                    print("Please enter a message.")
                    
            except KeyboardInterrupt:
                print("\nGoodbye!")
                break
            except Exception as e:
                print(f"Error: {e}")
        
    except Exception as e:
        print(f"Failed to initialize classifier: {e}")
        print("Make sure 'spam_detection_model.pkl' is in the same directory.")
