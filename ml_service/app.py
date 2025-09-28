from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import logging
import joblib
import os
import warnings
from typing import Dict, Optional
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Suppress sklearn warnings
warnings.filterwarnings('ignore')

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

# Global variable for the model
model = None

@app.on_event("startup")
async def load_models():
    """Load the trained models on startup"""
    global model
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
            import numpy
            logger.info(f"✅ Scikit-learn version: {sklearn.__version__}")
            logger.info(f"✅ NumPy version: {numpy.__version__}")
        except ImportError as ie:
            logger.error(f"❌ Missing required dependency: {ie}")
            raise ie
        
        # Load the model directly
        model_path = "spam_detection_model.pkl"
        logger.info(f"Looking for model file at: {os.path.abspath(model_path)}")
        
        if os.path.exists(model_path):
            logger.info(f"Model file found, loading...")
            model = joblib.load(model_path)
            logger.info(f"✅ Model loaded successfully from {model_path}")
            
            # Test the model immediately
            test_result = model.predict(['Hello test message'])
            test_proba = model.predict_proba(['Hello test message'])
            logger.info(f"✅ Test prediction successful: {test_result[0]}")
            logger.info(f"✅ Model is working properly!")
            
        else:
            logger.error(f"❌ Model file not found: {os.path.abspath(model_path)}")
            logger.error(f"Files in current directory: {os.listdir('.')}")
            raise FileNotFoundError(f"Model file not found: {model_path}")
            
    except Exception as e:
        logger.error(f"❌ Error loading model: {e}")
        logger.error(f"❌ Error type: {type(e).__name__}")
        import traceback
        logger.error(f"❌ Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to load model: {e}")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy" if model is not None else "unhealthy",
        model_loaded=model is not None
    )

@app.post("/predict", response_model=SMSResponse)
async def predict_fraud(request: SMSRequest):
    """Predict if SMS is fraudulent"""
    
    if model is None:
        logger.error("Model not loaded")
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Log the request for debugging
        logger.info(f"Received prediction request for text: {request.text[:50]}...")
        
        # Use the model directly
        prediction = model.predict([request.text])[0]
        probabilities = model.predict_proba([request.text])[0]
        
        logger.info(f"Prediction successful: {prediction} with confidence {max(probabilities)}")
        
        # Get class probabilities
        prob_dict = {}
        if hasattr(model, 'classes_'):
            for i, class_name in enumerate(model.classes_):
                prob_dict[class_name] = float(probabilities[i])
            confidence = max(probabilities)
        else:
            # Fallback if classes_ not available
            prob_dict = {str(prediction): 0.8}
            confidence = 0.8
        
        # Determine if message is fraudulent (spam or smishing)
        is_fraud = str(prediction).lower() in ['spam', 'smishing']
        
        return SMSResponse(
            prediction=str(prediction),
            confidence=float(confidence),
            probabilities=prob_dict,
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