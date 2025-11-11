@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul
echo ========================================
echo  ez2cook Mobile Test Server Start
echo ========================================
echo.

echo [1/4] Checking network configuration...
set LOCAL_IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4" ^| findstr /V "127.0.0.1"') do (
    set IP=%%a
    set IP=!IP: =!
    if not defined LOCAL_IP (
        set LOCAL_IP=!IP!
        echo Found local IP: !LOCAL_IP!
    )
)

if not defined LOCAL_IP (
    echo ERROR: Could not find local IP address
    echo Please check your network connection
    pause
    exit /b 1
)
echo.

echo [2/4] Starting Expo development server...
echo.
start cmd /k "npx expo start --clear"

echo.
echo [3/4] Waiting for server to start (15 seconds)...
timeout /t 15 /nobreak > nul

echo.
echo [4/4] Generating Expo Go QR code...
echo.
echo ========================================
echo  Scan this QR code with Expo Go app
echo ========================================
echo.

call npx qrcode-terminal "exp://!LOCAL_IP!:8081"

echo.
echo ========================================
echo  Instructions:
echo ========================================
echo 1. Download "Expo Go" app from App Store/Play Store
echo 2. Open Expo Go app on your mobile device
echo 3. Scan the QR code above
echo.
echo Connection URL: exp://!LOCAL_IP!:8081
echo.
echo To stop the server: mobile_test_end.bat
echo ========================================
pause
endlocal
