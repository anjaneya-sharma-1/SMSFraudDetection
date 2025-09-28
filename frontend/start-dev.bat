@echo off
echo 🚀 Starting SMS Fraud Detection System...

REM Check if Python virtual environment exists
if not exist ".venv" (
    echo ❌ Python virtual environment not found. Please run the setup first.
    echo    Run: python -m venv .venv ^&^& .venv\Scripts\activate ^&^& pip install -r ml_service\requirements.txt
    pause
    exit /b 1
)

echo 🤖 Starting ML Service on port 8000...
cd ml_service
start "ML Service" cmd /c "..\.venv\Scripts\python app.py"
cd ..

timeout /t 3 /nobreak > nul

echo 📱 Starting Next.js App on port 3000...
start "Next.js App" cmd /c "npm run dev"

echo.
echo ✅ Both services are starting...
echo 📱 Next.js App: http://localhost:3000
echo 🤖 ML Service: http://localhost:8000
echo 🏥 ML Health: http://localhost:8000/health
echo.
echo Press any key to exit...
pause > nul