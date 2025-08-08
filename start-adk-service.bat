@echo off
echo Starting Python ADK Service...
echo.

cd python-agents

echo Activating virtual environment...
call .venv\Scripts\activate.bat

echo Installing/updating dependencies...
pip install -r requirements.txt

echo.
echo Starting Flask API server on http://localhost:5000
echo Press Ctrl+C to stop the service
echo.

python app.py

pause