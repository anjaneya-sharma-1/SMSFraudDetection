# SMS Fraud Detection ML Service

A FastAPI service for serving the trained SVM + TF-IDF fraud detection model.

## Setup

1. Install dependencies:
```bash
cd ml_service
pip install -r requirements.txt
```

2. Copy your trained model files to this directory:
   - `tfidf_vectorizer.pkl` (or .joblib)
   - `svm_model.pkl` (or .joblib)

3. Run the service:
```bash
python app.py
```

The service will be available at http://localhost:8000

## API Endpoints

### Health Check
- `GET /health` - Check if service and models are loaded

### Single Prediction
- `POST /predict` - Predict a single SMS message
```json
{
  "text": "Congratulations! You've won $1000. Click here to claim your prize!"
}
```

Response:
```json
{
  "prediction": 1,
  "probability": 0.85,
  "confidence": 0.70,
  "features_used": 5000
}
```

### Batch Prediction
- `POST /batch_predict` - Predict multiple SMS messages
```json
[
  "Your package is ready for delivery",
  "URGENT: Your account will be suspended unless you verify now!"
]
```

## Integration with Next.js App

The Next.js app will call this service at http://localhost:8000/predict alongside the LLM agents for hybrid fraud detection.