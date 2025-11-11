@echo off
echo Starting Android Emulator...

:: Set SDK paths
set EMULATOR_PATH=%LOCALAPPDATA%\Android\Sdk\emulator
set ADB_PATH=%LOCALAPPDATA%\Android\Sdk\platform-tools

:: List available AVDs
echo.
echo Available AVDs:
echo ================
cd /d "%EMULATOR_PATH%"
emulator -list-avds
echo ================

:: Get AVD name from user
echo.
set /p AVD_NAME="Enter AVD name to start (or press Enter for first one): "

:: If no input, use first AVD
if "%AVD_NAME%"=="" (
    for /f "tokens=*" %%i in ('emulator -list-avds') do (
        set AVD_NAME=%%i
        goto :start_emulator
    )
)

:start_emulator
echo.
echo Starting %AVD_NAME%...
start "" emulator -avd %AVD_NAME% -no-snapshot-load

:: Wait for device
echo Waiting for device to be ready...
cd /d "%ADB_PATH%"
adb wait-for-device

:: Check device status
echo.
echo Device is ready!
adb devices

:: Ask if user wants to install APK
echo.
set /p INSTALL_APK="Do you want to install an APK? (y/n): "
if /i "%INSTALL_APK%"=="y" (
    set /p APK_PATH="Enter full path to APK file: "
    echo Installing APK...
    adb install -r "%APK_PATH%"
    if %errorlevel%==0 (
        echo APK installed successfully!
    ) else (
        echo Failed to install APK.
    )
)

echo.
pause