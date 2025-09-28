from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import logging
import joblib
import os
from typing import List, Optional

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

# Global variable for the model
model = None

@app.on_event("startup")
async def load_models():
    """Load the trained models on startup"""
    global model
    try:
        # Load the model from the pkl file
        model_path = "spam_detection_model.pkl"
        if os.path.exists(model_path):
            model = joblib.load(model_path)
            logger.info(f"✅ Model loaded successfully from {model_path}")
        else:
            logger.error(f"❌ Model file not found: {model_path}")
            raise FileNotFoundError(f"Model file not found: {model_path}")
    except Exception as e:
        logger.error(f"❌ Error loading model: {e}")
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
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Make prediction using the loaded model
        prediction = model.predict([request.text])[0]
        
        # Try to get prediction probabilities if available
        try:
            probabilities = model.predict_proba([request.text])[0]
            # Assuming classes are ordered as [ham, spam, smishing] or similar
            prob_dict = {}
            if hasattr(model, 'classes_'):
                for i, class_name in enumerate(model.classes_):
                    prob_dict[class_name] = float(probabilities[i])
                confidence = max(probabilities)
            else:
                # Fallback if classes_ not available
                prob_dict = {"unknown": float(max(probabilities))}
                confidence = float(max(probabilities))
        except AttributeError:
            # Model doesn't support predict_proba
            prob_dict = {str(prediction): 0.8}
            confidence = 0.8
        
        # Determine if message is fraudulent (spam or smishing)
        is_fraud = str(prediction).lower() in ['spam', 'smishing', '1']
        
        return SMSResponse(
            prediction=str(prediction),
            confidence=float(confidence),
            probabilities=prob_dict,
            is_fraud=is_fraud
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)