from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import logging
import os
from typing import Dict, Optional
from sms_predictor import SMSClassifier

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SMS Fraud Detection ML Service", version="1.0.0")

class SMSRequest(BaseModel):
    text: str
    
class SMSResponse(BaseModel):
    prediction: str  # 'ham', 'spam', or 'smishing'
    confidence: float  # model confidence (0-1)
    probabilities: dict  # class probabilities
    is_fraud: bool  # True if spam or smishing

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool

# Global variable for the SMS classifier
sms_classifier = None

@app.on_event("startup")
async def load_models():
    """Load the trained models on startup"""
    global sms_classifier
    try:
        # Log system information
        import sys
        import platform
        logger.info(f"Python version: {sys.version}")
        logger.info(f"Platform: {platform.platform()}")
        logger.info(f"Working directory: {os.getcwd()}")
        
        # Check for required packages
        try:
            import sklearn
            import nltk
            import pandas
            import numpy
            logger.info(f"✅ Scikit-learn version: {sklearn.__version__}")
            logger.info(f"✅ NLTK version: {nltk.__version__}")
            logger.info(f"✅ Pandas version: {pandas.__version__}")
            logger.info(f"✅ NumPy version: {numpy.__version__}")
        except ImportError as ie:
            logger.error(f"❌ Missing required dependency: {ie}")
            raise ie
        
        # Initialize the SMS classifier
        model_path = "spam_detection_model.pkl"
        logger.info(f"Looking for model file at: {os.path.abspath(model_path)}")
        
        if os.path.exists(model_path):
            logger.info(f"Model file found, initializing SMS Classifier...")
            sms_classifier = SMSClassifier(model_path)
            logger.info(f"✅ SMS Classifier loaded successfully from {model_path}")
            
            # Test the classifier with a simple message
            test_result = sms_classifier.predict("Hello test")
            logger.info(f"✅ Test prediction successful: {test_result['prediction']}")
            
        else:
            logger.error(f"❌ Model file not found: {os.path.abspath(model_path)}")
            logger.error(f"Files in current directory: {os.listdir('.')}")
            raise FileNotFoundError(f"Model file not found: {model_path}")
    except Exception as e:
        logger.error(f"❌ Error loading SMS classifier: {e}")
        logger.error(f"❌ Error type: {type(e).__name__}")
        import traceback
        logger.error(f"❌ Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to load SMS classifier: {e}")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy" if sms_classifier is not None else "unhealthy",
        model_loaded=sms_classifier is not None
    )

@app.post("/predict", response_model=SMSResponse)
async def predict_fraud(request: SMSRequest):
    """Predict if SMS is fraudulent"""
    
    if sms_classifier is None:
        logger.error("SMS classifier not loaded")
        raise HTTPException(status_code=503, detail="SMS classifier not loaded")
    
    try:
        # Log the request for debugging
        logger.info(f"Received prediction request for text: {request.text[:50]}...")
        
        # Use the SMS classifier to get prediction
        result = sms_classifier.predict(request.text)
        logger.info(f"Prediction successful: {result['prediction']} with confidence {result['confidence']}")
        
        # Extract data from the result
        prediction = result['prediction']
        confidence = result['confidence']
        probabilities = result['probabilities']
        
        # Determine if message is fraudulent (spam or smishing)
        is_fraud = str(prediction).lower() in ['spam', 'smishing']
        
        return SMSResponse(
            prediction=str(prediction),
            confidence=float(confidence),
            probabilities=probabilities,
            is_fraud=is_fraud
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)