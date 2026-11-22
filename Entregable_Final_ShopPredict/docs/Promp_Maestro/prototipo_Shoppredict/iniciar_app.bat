@echo off
setlocal
cd /d "%~dp0"
python app_shoppredict_gui.py
if errorlevel 1 (
  echo.
  echo No se pudo iniciar ShopPredict. Verifica Python y requirements.txt.
  pause
)
