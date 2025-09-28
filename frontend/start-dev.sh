#!/bin/bash

# Quick Start Script for SMS Fraud Detection Development

echo "🚀 Starting SMS Fraud Detection System..."

# Check if Python virtual environment exists
if [ ! -d ".venv" ]; then
    echo "❌ Python virtual environment not found. Please run the setup first."
    echo "   Run: python -m venv .venv && .venv/Scripts/activate && pip install -r ml_service/requirements.txt"
    exit 1
fi

# Function to start ML service
start_ml_service() {
    echo "🤖 Starting ML Service on port 8000..."
    cd ml_service
    ../.venv/Scripts/python app.py &
    ML_PID=$!
    cd ..
    echo "ML Service PID: $ML_PID"
}

# Function to start Next.js app
start_nextjs() {
    echo "📱 Starting Next.js App on port 3000..."
    npm run dev &
    NEXTJS_PID=$!
    echo "Next.js PID: $NEXTJS_PID"
}

# Start both services
start_ml_service
sleep 3
start_nextjs

echo ""
echo "✅ Both services are starting..."
echo "📱 Next.js App: http://localhost:3000"
echo "🤖 ML Service: http://localhost:8000"
echo "🏥 ML Health: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for interrupt
wait