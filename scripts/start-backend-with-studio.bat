@echo off
setlocal EnableExtensions

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "ROOT_DIR=%%~fI"
set "BACKEND_DIR=%ROOT_DIR%\backend"

cd /d "%BACKEND_DIR%"

echo Starting Prisma Studio in this terminal...
start "Prisma Studio" /b cmd /c "cd /d ""%BACKEND_DIR%"" && npx prisma studio"

echo Starting Nest backend in watch mode...
echo Prisma Studio logs and Nest logs will appear in this same window.
echo Prisma Studio default URL: http://localhost:5555
echo.

npm run start:dev