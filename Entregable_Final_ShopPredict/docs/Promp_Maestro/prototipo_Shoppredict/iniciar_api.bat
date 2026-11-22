@echo off
setlocal
cd /d "%~dp0"
python -m uvicorn api_shoppredict:app --host 127.0.0.1 --port 8000
if errorlevel 1 (
  echo.
  echo No se pudo iniciar la API. Instala las dependencias de requirements.txt.
  pause
)
