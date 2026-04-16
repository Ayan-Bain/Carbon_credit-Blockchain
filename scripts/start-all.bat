@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "ROOT_DIR=%%~fI"
set "BLOCKCHAIN_DIR=%ROOT_DIR%\blockchain"
set "BACKEND_DIR=%ROOT_DIR%\backend"
set "BACKEND_ENV=%BACKEND_DIR%\.env"
set "DEPLOY_LOG=%TEMP%\carbon-credit-deploy.log"
set "RPC_URL=http://127.0.0.1:8545"

echo [1/5] Starting local Hardhat node...
start "Carbon Credit - Hardhat Node" cmd /k "cd /d ""%BLOCKCHAIN_DIR%"" && npx hardhat node"

echo [2/5] Waiting for RPC at %RPC_URL% ...
set /a ATTEMPT=0
:wait_for_rpc
set /a ATTEMPT+=1
powershell -NoProfile -Command ^
  "$body = '{\"jsonrpc\":\"2.0\",\"method\":\"web3_clientVersion\",\"params\":[],\"id\":1}';" ^
  "try { Invoke-RestMethod -Uri '%RPC_URL%' -Method Post -ContentType 'application/json' -Body $body | Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
  if !ATTEMPT! GEQ 31 (
    echo Failed to reach the Hardhat RPC after 30 attempts.
    echo Make sure no other process is blocking port 8545, then try again.
    exit /b 1
  )
  timeout /t 2 /nobreak >nul
  goto wait_for_rpc
)

echo [3/5] Deploying contracts to localhost...
if exist "%DEPLOY_LOG%" del /f /q "%DEPLOY_LOG%" >nul 2>&1
call :deploy_contracts
if errorlevel 1 exit /b 1

echo [4/5] Applying Prisma migrations...
pushd "%BACKEND_DIR%" >nul
call npx prisma migrate deploy --schema prisma/schema.prisma
if errorlevel 1 (
  popd >nul
  echo Prisma migration failed.
  exit /b 1
)
popd >nul

echo [5/5] Normalizing backend environment and starting backend + Prisma Studio...
call :normalize_backend_env
if errorlevel 1 exit /b 1
start "Carbon Credit - Backend + Prisma Studio" cmd /k ""%ROOT_DIR%\scripts\start-backend-with-studio.bat""

echo.
echo Startup sequence launched successfully.
echo PostgreSQL must already be running for the backend to connect.
echo Contract addresses in backend\.env were refreshed from the latest localhost deploy.
exit /b 0

:deploy_contracts
pushd "%BLOCKCHAIN_DIR%" >nul
call npx hardhat run scripts/deploy.ts --network localhost > "%DEPLOY_LOG%" 2>&1
set "DEPLOY_EXIT=%ERRORLEVEL%"
popd >nul

type "%DEPLOY_LOG%"

if not "%DEPLOY_EXIT%"=="0" (
  echo Contract deployment failed.
  exit /b 1
)

set "ACCESS_CONTROL_ADDRESS="
set "REGISTRY_ADDRESS="
set "TOKEN_ADDRESS="

for /f "usebackq tokens=1,* delims=:" %%A in ("%DEPLOY_LOG%") do (
  if /I "%%A"=="AccessControl deployed to" set "ACCESS_CONTROL_ADDRESS=%%B"
  if /I "%%A"=="REGISTRY_ADDRESS" set "REGISTRY_ADDRESS=%%B"
  if /I "%%A"=="TOKEN_ADDRESS" set "TOKEN_ADDRESS=%%B"
)

for %%V in (ACCESS_CONTROL_ADDRESS REGISTRY_ADDRESS TOKEN_ADDRESS) do (
  call set "VAL=%%%V%%"
  if defined VAL (
    for /f "tokens=* delims= " %%X in ("!VAL!") do set "%%V=%%X"
  )
)

if not defined ACCESS_CONTROL_ADDRESS (
  echo Could not parse ACCESS_CONTROL_ADDRESS from deploy output.
  exit /b 1
)

if not defined REGISTRY_ADDRESS (
  echo Could not parse REGISTRY_ADDRESS from deploy output.
  exit /b 1
)

if not exist "%BACKEND_ENV%" (
  echo Missing backend environment file: %BACKEND_ENV%
  exit /b 1
)

powershell -NoProfile -Command ^
  "$path = '%BACKEND_ENV%';" ^
  "$content = Get-Content -LiteralPath $path;" ^
  "$pairs = @{" ^
  "  'ACCESS_CONTROL_ADDRESS' ='%ACCESS_CONTROL_ADDRESS%';" ^
  "  'REGISTRY_ADDRESS' ='%REGISTRY_ADDRESS%';" ^
  "};" ^
  "foreach ($key in $pairs.Keys) {" ^
  "  $value = $pairs[$key].Trim();" ^
  "  $quoted = '\"' + $value + '\"';" ^
  "  if ($content -match ('^' + [regex]::Escape($key) + '=')) {" ^
  "    $content = $content -replace ('^' + [regex]::Escape($key) + '=.*$'), ($key + '=' + $quoted);" ^
  "  } else {" ^
  "    $content += ($key + '=' + $quoted);" ^
  "  }" ^
  "}" ^
  "Set-Content -LiteralPath $path -Value $content"

if errorlevel 1 (
  echo Failed to update backend\.env with deployed contract addresses.
  exit /b 1
)

echo Updated backend\.env
echo   ACCESS_CONTROL_ADDRESS=%ACCESS_CONTROL_ADDRESS%
echo   REGISTRY_ADDRESS=%REGISTRY_ADDRESS%
if defined TOKEN_ADDRESS echo   TOKEN_ADDRESS=%TOKEN_ADDRESS%

exit /b 0

:normalize_backend_env
if not exist "%BACKEND_ENV%" (
  echo Missing backend environment file: %BACKEND_ENV%
  exit /b 1
)

powershell -NoProfile -Command ^
  "$path = '%BACKEND_ENV%';" ^
  "$content = Get-Content -LiteralPath $path;" ^
  "$keys = @(" ^
  "  'DATABASE_URL'," ^
  "  'RPC_URL'," ^
  "  'REGISTRY_ADDRESS'," ^
  "  'ACCESS_CONTROL_ADDRESS'," ^
  "  'ADMIN_PRIVATE_KEY'," ^
  "  'ADMIN_WALLET_ADDRESS'" ^
  ");" ^
  "$normalize = {" ^
  "  param([string]$rawValue, [bool]$stripInnerWhitespace = $false)" ^
  "  if ($null -eq $rawValue) { return $null }" ^
  "  $value = $rawValue.Trim();" ^
  "  if ($value.Length -ge 2 -and $value.StartsWith('\"') -and $value.EndsWith('\"')) {" ^
  "    $value = $value.Substring(1, $value.Length - 2).Trim();" ^
  "  }" ^
  "  if ($stripInnerWhitespace) {" ^
  "    $value = $value -replace '\s+', '';" ^
  "  }" ^
  "  return $value" ^
  "};" ^
  "for ($i = 0; $i -lt $content.Count; $i++) {" ^
  "  $line = $content[$i];" ^
  "  foreach ($key in $keys) {" ^
  "    if ($line -match ('^' + [regex]::Escape($key) + '\s*=(.*)$')) {" ^
  "      $value = & $normalize $matches[1] ($key -match 'ADDRESS|PRIVATE_KEY');" ^
  "      if ($null -ne $value -and $value -ne '') {" ^
  "        $content[$i] = $key + '=\"' + $value + '\"';" ^
  "      }" ^
  "      break" ^
  "    }" ^
  "  }" ^
  "}" ^
  "Set-Content -LiteralPath $path -Value $content"

if errorlevel 1 (
  echo Failed to normalize backend\.env values.
  exit /b 1
)

echo Normalized backend\.env
exit /b 0
