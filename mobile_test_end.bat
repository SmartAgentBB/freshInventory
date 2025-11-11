@echo off
echo ========================================
echo  ez2cook Mobile Test Server Stop
echo ========================================
echo.

echo [1/3] Finding Expo/Metro processes...
echo.

REM Find and kill Node.js processes running Expo
for /f "tokens=2" %%a in ('tasklist ^| findstr "node.exe"') do (
    echo Checking process %%a...
    netstat -ano | findstr ":8081" | findstr "%%a" > nul
    if not errorlevel 1 (
        echo Killing Expo server process %%a
        taskkill /PID %%a /F
    )
)

echo.
echo [2/3] Killing remaining Metro Bundler processes...
taskkill /IM node.exe /F 2>nul
if errorlevel 1 (
    echo No Node.js processes found
) else (
    echo Node.js processes terminated
)

echo.
echo [3/3] Cleaning up port 8081...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8081"') do (
    echo Killing process on port 8081 (PID: %%a)
    taskkill /PID %%a /F
)

echo.
echo ========================================
echo  All servers stopped!
echo ========================================
echo.
echo You can safely close this window
echo.
pause
