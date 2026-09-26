@echo off
title CARVLAK Group | Hub Operativo Interno
echo ========================================================
echo   Iniciando CARVLAK Group (FASE 1: Base Comun)
echo   Automotora - DetailVlak - Inspeccion Vehicular
echo ========================================================

cd /d "%~dp0"

if not exist node_modules (
  echo Instalando dependencias necesarias por primera vez...
  call npm install
)

echo Abriendo servidor local de desarrollo...
start "" "http://localhost:3000"
call npm run dev
pause
