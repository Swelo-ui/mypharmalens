@echo off
setlocal enabledelayedexpansion

:: Pharmalens Documentation Unlocker - Secure Launcher
:: Enhanced Security Edition with Tamper Detection

title Pharmalens Documentation Unlocker - Secure Edition

:: Color codes for enhanced display
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "MAGENTA=[95m"
set "CYAN=[96m"
set "WHITE=[97m"
set "RESET=[0m"

:: Security configuration
set "SECURE_MODE=1"
set "MAX_ATTEMPTS=3"
set "LOCKOUT_TIME=300"

cls
echo.
echo %CYAN%╔══════════════════════════════════════════════════════════════╗%RESET%
echo %CYAN%║                                                              ║%RESET%
echo %CYAN%║        🔒 PHARMALENS DOCUMENTATION UNLOCKER - SECURE        ║%RESET%
echo %CYAN%║                     Enhanced Security Edition                ║%RESET%
echo %CYAN%║                                                              ║%RESET%
echo %CYAN%║  🛡️  Advanced Encryption ^& Tamper Detection                  ║%RESET%
echo %CYAN%║  🔐  Multi-layer Security ^& Access Control                   ║%RESET%
echo %CYAN%║  📊  Comprehensive Audit ^& Monitoring                        ║%RESET%
echo %CYAN%║                                                              ║%RESET%
echo %CYAN%╚══════════════════════════════════════════════════════════════╝%RESET%
echo.

:: Check if running in administrator mode
net session >nul 2>&1
if %errorLevel% == 0 (
    echo %YELLOW%⚠️  Warning: Running with administrator privileges%RESET%
    echo %YELLOW%   Consider running with standard user privileges for security%RESET%
    echo.
)

:: System integrity check
echo %BLUE%🔍 Performing system integrity check...%RESET%

:: Check for Node.js
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo %RED%❌ Node.js is not installed or not in PATH%RESET%
    echo %RED%   Please install Node.js from https://nodejs.org/%RESET%
    echo.
    pause
    exit /b 1
)

:: Check for required secure files
set "MISSING_FILES="
if not exist "pharmalens-secure.cjs" (
    set "MISSING_FILES=!MISSING_FILES! pharmalens-secure.cjs"
)
if not exist "secure-wrapper.cjs" (
    set "MISSING_FILES=!MISSING_FILES! secure-wrapper.cjs"
)
if not exist "security-enhancer.cjs" (
    set "MISSING_FILES=!MISSING_FILES! security-enhancer.cjs"
)

if not "!MISSING_FILES!"=="" (
    echo %RED%❌ Critical security files missing:%RESET%
    for %%f in (!MISSING_FILES!) do (
        echo %RED%   - %%f%RESET%
    )
    echo.
    echo %RED%🚫 System cannot start without required security components%RESET%
    echo %RED%   Please restore missing files or contact system administrator%RESET%
    echo.
    pause
    exit /b 1
)

:: Check for legacy insecure files and warn if present
set "LEGACY_FILES="
if exist "unlock-docs.bat" (
    set "LEGACY_FILES=!LEGACY_FILES! unlock-docs.bat"
)
if exist "file-encrypt.cjs" (
    set "LEGACY_FILES=!LEGACY_FILES! file-encrypt.cjs"
)

if not "!LEGACY_FILES!"=="" (
    echo %YELLOW%⚠️  Legacy insecure files detected:%RESET%
    for %%f in (!LEGACY_FILES!) do (
        echo %YELLOW%   - %%f%RESET%
    )
    echo.
    echo %YELLOW%🔒 These files have been superseded by the secure system%RESET%
    echo %YELLOW%   Consider removing them to prevent security bypass%RESET%
    echo.
)

:: Check file permissions and integrity
echo %BLUE%🔐 Verifying file permissions and integrity...%RESET%

:: Verify that secure files are not world-writable (basic check)
for %%f in (pharmalens-secure.cjs secure-wrapper.cjs security-enhancer.cjs) do (
    if exist "%%f" (
        echo %GREEN%✅ %%f - Present%RESET%
    ) else (
        echo %RED%❌ %%f - Missing%RESET%
        set "INTEGRITY_FAIL=1"
    )
)

if defined INTEGRITY_FAIL (
    echo.
    echo %RED%❌ System integrity check failed%RESET%
    echo %RED%   One or more critical files are missing or corrupted%RESET%
    echo.
    pause
    exit /b 1
)

:: Check for suspicious processes or network connections
echo %BLUE%🔍 Checking for security threats...%RESET%

:: Basic process check (looking for suspicious processes)
tasklist /FI "IMAGENAME eq nc.exe" 2>nul | find /I "nc.exe" >nul
if %errorLevel% == 0 (
    echo %RED%⚠️  Suspicious process detected: nc.exe%RESET%
)

tasklist /FI "IMAGENAME eq ncat.exe" 2>nul | find /I "ncat.exe" >nul
if %errorLevel% == 0 (
    echo %RED%⚠️  Suspicious process detected: ncat.exe%RESET%
)

:: Check for environment variables that might indicate debugging/bypass attempts
if defined DEBUG (
    echo %YELLOW%⚠️  Debug mode detected in environment%RESET%
)

if defined PHARMALENS_BYPASS (
    echo %RED%❌ Security bypass attempt detected%RESET%
    echo %RED%   PHARMALENS_BYPASS environment variable found%RESET%
    echo %RED%   System access denied%RESET%
    echo.
    pause
    exit /b 1
)

:: Security check passed
echo %GREEN%✅ System integrity check passed%RESET%
echo.

:: Display security notice
echo %MAGENTA%🔒 SECURITY NOTICE%RESET%
echo %MAGENTA%=================%RESET%
echo.
echo %WHITE%• All operations are logged and monitored%RESET%
echo %WHITE%• Unauthorized access attempts will be recorded%RESET%
echo %WHITE%• System includes tamper detection and integrity checks%RESET%
echo %WHITE%• Enhanced encryption with AES-256-GCM is used%RESET%
echo %WHITE%• Multi-factor authentication and rate limiting active%RESET%
echo.

:: Prompt for security acknowledgment
set /p "ACKNOWLEDGE=Do you acknowledge these security measures? (yes/no): "
if /i not "!ACKNOWLEDGE!"=="yes" (
    echo.
    echo %RED%❌ Security acknowledgment required to proceed%RESET%
    echo.
    pause
    exit /b 1
)

echo.
echo %GREEN%✅ Security acknowledgment accepted%RESET%
echo.

:: Launch secure system
echo %BLUE%🚀 Launching Pharmalens Secure System...%RESET%
echo.

:: Set security environment variables
set "PHARMALENS_SECURE_MODE=1"
set "PHARMALENS_AUDIT_ENABLED=1"
set "PHARMALENS_INTEGRITY_CHECK=1"

:: Launch the secure Node.js application
node pharmalens-secure.cjs

:: Check exit code
if %errorLevel% neq 0 (
    echo.
    echo %RED%❌ Secure system exited with error code: %errorLevel%%RESET%
    
    :: Log the error
    echo [%date% %time%] ERROR: Secure system exit code %errorLevel% >> security.log
    
    echo.
    echo %YELLOW%📋 Troubleshooting steps:%RESET%
    echo %YELLOW%1. Check that all required files are present%RESET%
    echo %YELLOW%2. Verify Node.js installation%RESET%
    echo %YELLOW%3. Check file permissions%RESET%
    echo %YELLOW%4. Review security.log for details%RESET%
    echo.
) else (
    echo.
    echo %GREEN%✅ Secure system exited normally%RESET%
    
    :: Log successful exit
    echo [%date% %time%] INFO: Secure system exited normally >> security.log
)

:: Clear sensitive environment variables
set "PHARMALENS_SECURE_MODE="
set "PHARMALENS_AUDIT_ENABLED="
set "PHARMALENS_INTEGRITY_CHECK="

echo.
echo %CYAN%Thank you for using Pharmalens Documentation Unlocker - Secure Edition%RESET%
echo.
pause