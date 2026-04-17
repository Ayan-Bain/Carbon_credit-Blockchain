@echo off
TITLE Carbon Credit System Launcher
echo ==========================================
echo STARTING CARBON CREDIT SYSTEM
echo ==========================================

:: 1. Start Blockchain Network
echo [1/4] Starting Blockchain Network...
start "Blockchain Network" cmd /k "cd blockchain && npx hardhat node"

:: Wait for network to be ready
echo Waiting for network to initialize...
timeout /t 12 /nobreak

:: 2. Deploy Contracts
echo [2/4] Deploying Smart Contracts to Localhost...
start "Blockchain Deployment" cmd /k "cd blockchain && npx hardhat run scripts/deploy.ts --network localhost"

:: 3. Start Prisma Studio (Prisma Server)
echo [3/4] Starting Prisma Studio...
start "Prisma Studio" cmd /k "cd backend && npx prisma studio"

:: 4. Start Backend Server
echo [4/4] Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm run start:dev"

echo ==========================================
echo DONE: All processes are running in separate windows.
echo ==========================================
pause
