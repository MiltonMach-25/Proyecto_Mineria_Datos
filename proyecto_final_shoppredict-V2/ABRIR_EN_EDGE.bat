@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ============================================================
echo   ShopPredict · Intencion de Compra (UNIMINUTO 2026)
echo   Inicio automatico en Microsoft Edge
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [AVISO] Node.js no esta instalado en este equipo.
  echo Abriendo la presentacion autonoma de 17 laminas directamente en Microsoft Edge...
  start msedge "%~dp0Entregable_Final_ShopPredict\index.html"
  exit /b 0
)

if not exist "node_modules" (
  echo [1/3] Instalando dependencias por primera vez (npm install)...
  call npm install
  if errorlevel 1 (
    echo [ERROR] Fallo npm install. Abriendo presentacion autonoma en Edge...
    start msedge "%~dp0Entregable_Final_ShopPredict\index.html"
    exit /b 1
  )
)

if not exist "Entregable_Final_ShopPredict\dist\index.html" (
  echo [2/3] Compilando dashboard React y servidor (npm run build)...
  call npm run build
)

echo [3/3] Iniciando servidor local en http://localhost:3000 ...
start "ShopPredict Servidor (No cerrar mientras expones)" cmd /k "npm run dev"

echo Esperando a que el servidor responda...
powershell -NoProfile -Command "for ($i=0; $i -lt 30; $i++) { try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:3000/health' -TimeoutSec 2; if ($r.StatusCode -eq 200) { break } } catch {}; Start-Sleep -Milliseconds 500 }"

echo Abriendo Microsoft Edge con la Presentacion (17 laminas) y el Dashboard...
start msedge "http://localhost:3000/index.html"
start msedge "http://localhost:3000/"
echo.
echo Listo. Si necesitas detener el servidor al terminar, cierra la ventana "ShopPredict Servidor".
endlocal
