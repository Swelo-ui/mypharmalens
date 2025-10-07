@echo off
title Pharmalens Documentation Unlocker
color 0A

echo.
echo ========================================
echo   Pharmalens Documentation Unlocker
echo ========================================
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if encrypt-docs.cjs exists
if not exist "encrypt-docs.cjs" (
    echo ❌ Error: encrypt-docs.cjs not found in current directory
    echo.
    echo Please ensure you're running this from the project root directory.
    echo.
    pause
    exit /b 1
)

REM Check if file-encrypt.cjs exists
if not exist "file-encrypt.cjs" (
    echo ❌ Error: file-encrypt.cjs not found in current directory
    echo.
    echo Please ensure you're running this from the project root directory.
    echo.
    pause
    exit /b 1
)

REM Show menu
:menu
echo.
echo Select an option:
echo.
echo [1] 🔐 Encrypt documentation
echo [2] 🔓 Decrypt documentation
echo [3] 📊 Check encryption status  
echo [4] 🔍 Verify password
echo [5] 🧹 Cleanup encrypted files
echo [6] 📁 Encrypt multiple files (NEW!)
echo [7] 🔓 Decrypt multiple files (NEW!)
echo [8] 📋 List encrypted files
echo [9] ❌ Exit
echo.
set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" goto encrypt
if "%choice%"=="2" goto decrypt
if "%choice%"=="3" goto status
if "%choice%"=="4" goto verify
if "%choice%"=="5" goto cleanup
if "%choice%"=="6" goto encrypt_files
if "%choice%"=="7" goto decrypt_files
if "%choice%"=="8" goto list_files
if "%choice%"=="9" goto exit
echo Invalid choice. Please try again.
goto menu

:encrypt
echo.
echo 🔐 Starting encryption process...
echo.
node encrypt-docs.cjs encrypt
if errorlevel 1 (
    echo.
    echo ❌ Encryption failed. Please check if the file exists and try again.
) else (
    echo.
    echo ✅ Documentation successfully encrypted!
    echo 🔒 File encrypted at: .trae\documents\pharmalens-identification-system-architecture.md.encrypted
)
echo.
pause
goto menu

:decrypt
echo.
echo 🔓 Starting decryption process...
echo.
node encrypt-docs.cjs decrypt
if errorlevel 1 (
    echo.
    echo ❌ Decryption failed. Please check your password and try again.
) else (
    echo.
    echo ✅ Documentation successfully unlocked!
    echo 📁 File available at: .trae\documents\pharmalens-identification-system-architecture.md
)
echo.
pause
goto menu

:status
echo.
echo 📊 Checking encryption status...
echo.
node encrypt-docs.cjs status
echo.
pause
goto menu

:verify
echo.
echo 🔍 Verifying password...
echo.
node encrypt-docs.cjs verify
echo.
pause
goto menu

:encrypt_files
echo.
echo 📁 Starting multi-file encryption...
echo.
node file-encrypt.cjs encrypt-files
if errorlevel 1 (
    echo.
    echo ❌ Multi-file encryption failed. Please check the files and try again.
) else (
    echo.
    echo ✅ Multi-file encryption completed!
)
echo.
pause
goto menu

:decrypt_files
echo.
echo 🔓 Starting multi-file decryption...
echo.
node file-encrypt.cjs decrypt-files
if errorlevel 1 (
    echo.
    echo ❌ Multi-file decryption failed. Please check your password and try again.
) else (
    echo.
    echo ✅ Multi-file decryption completed!
)
echo.
pause
goto menu

:list_files
echo.
echo 📋 Listing encrypted files...
echo.
node file-encrypt.cjs list
echo.
pause
goto menu

:cleanup
echo.
echo ⚠️  WARNING: This will permanently delete encrypted files!
echo.
set /p confirm="Are you sure you want to continue? (y/N): "
if /i "%confirm%"=="y" (
    echo.
    echo 🧹 Starting cleanup...
    echo.
    node encrypt-docs.cjs cleanup
) else (
    echo.
    echo ❌ Cleanup cancelled.
)
echo.
pause
goto menu

:exit
echo.
echo 👋 Goodbye!
echo.
timeout /t 2 /nobreak >nul
exit /b 0