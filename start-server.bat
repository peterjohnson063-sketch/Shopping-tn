@echo off
echo Starting local web server for Shopping-tn...
echo.
echo The server will start on http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

REM Try to start Python HTTP server
python -m http.server 8000 2>nul
if %errorlevel% neq 0 (
    echo Python not found, trying Python3...
    python3 -m http.server 8000 2>nul
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Python not found. Please install Python or use a different method.
        echo.
        echo Alternative solutions:
        echo 1. Install Python from https://python.org
        echo 2. Use VS Code Live Server extension
        echo 3. Use any other local web server
        echo.
        pause
    )
)
