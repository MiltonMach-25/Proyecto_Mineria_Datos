@echo off
setlocal
cd /d "%~dp0"
python descargar_dataset_uci.py
if errorlevel 1 (
  echo.
  echo Descarga cancelada o fallida. Verifica Internet y requirements.txt.
  pause
)
