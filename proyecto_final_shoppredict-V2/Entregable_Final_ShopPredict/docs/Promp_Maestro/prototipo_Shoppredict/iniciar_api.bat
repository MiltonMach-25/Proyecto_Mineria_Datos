@echo off
setlocal
cd /d "%~dp0..\..\.."
python -m uvicorn backend.api_shoppredict:app --host 127.0.0.1 --port 8080
if errorlevel 1 (
  echo.
  echo No se pudo iniciar la API. Instala backend\requirements.txt desde esta carpeta.
  pause
)
