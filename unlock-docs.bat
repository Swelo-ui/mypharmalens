@echo off
title Pharmalens Security Management Console
color 0B

REM Clear screen for clean presentation
cls

REM Display animated header
echo.
echo +================================================================+
echo ^|                                                                ^|
echo ^|  ######  ##   ##  ######   ######  ##     ##  ######   ##     ^|
echo ^|  ##  ##  ##   ##  ##   ##  ##  ##  ###   ###  ##   ##  ##     ^|
echo ^|  ######  #######  ######   ######  ## ### ##  ######   ##     ^|
echo ^|  ##      ##   ##  ##   ##  ##  ##  ##  #  ##  ##   ##  ##     ^|
echo ^|  ##      ##   ##  ##   ##  ##  ##  ##     ##  ##   ##  ###### ^|
echo ^|                                                                ^|
echo ^|              [*] SECURITY MANAGEMENT CONSOLE [*]              ^|
echo ^|                  Professional Document Protection             ^|
echo ^|                                                                ^|
echo +================================================================+
echo.
echo                    [!] System Status: ACTIVE [!]
echo                   [#]  Security Level: MAXIMUM [#]
echo.

REM System validation with enhanced feedback
echo +---------------------------------------------------------------+
echo ^|                    [?] SYSTEM VALIDATION                     ^|
echo +---------------------------------------------------------------+
echo.

REM Check if Node.js is available
echo [...] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [X] ERROR: Node.js is not installed or not in PATH
    echo.
    echo     [>>] Please install Node.js from: https://nodejs.org/
    echo     [>>] Then restart this console
    echo.
    pause
    exit /b 1
) else (
    echo [OK] Node.js detected and ready
)

REM Check if encrypt-docs.cjs exists
echo [...] Validating encryption module...
if not exist "encrypt-docs.cjs" (
    echo [X] ERROR: encrypt-docs.cjs not found in current directory
    echo.
    echo     [>>] Please ensure you're running this from the project root directory.
    echo.
    pause
    exit /b 1
) else (
    echo [OK] Encryption module validated
)

REM Check if file-encrypt.cjs exists
echo [...] Validating file encryption module...
if not exist "file-encrypt.cjs" (
    echo [X] ERROR: file-encrypt.cjs not found in current directory
    echo.
    echo     [>>] Please ensure you're running this from the project root directory.
    echo.
    pause
    exit /b 1
) else (
    echo [OK] File encryption module validated
)

echo.
echo +---------------------------------------------------------------+
echo ^|                  [OK] ALL SYSTEMS OPERATIONAL                 ^|
echo +---------------------------------------------------------------+
timeout /t 2 /nobreak >nul

REM Show menu
:menu
cls
echo.
echo +================================================================+
echo ^|              [*] SECURITY MANAGEMENT CONSOLE [*]              ^|
echo ^|                  Professional Document Protection             ^|
echo +================================================================+
echo.
echo +---------------------------------------------------------------+
echo ^|                     [#] OPERATION MENU                       ^|
echo +---------------------------------------------------------------+
echo.
echo  +---+--------------------------------------------------------+
echo  ^| 1 ^| [*] ENCRYPT Documentation                             ^|
echo  +---+--------------------------------------------------------+
echo  ^| 2 ^| [*] DECRYPT Documentation                             ^|
echo  +---+--------------------------------------------------------+
echo  ^| 3 ^| [*] CHECK Encryption Status                           ^|
echo  +---+--------------------------------------------------------+
echo  ^| 4 ^| [*] VERIFY Password Integrity                         ^|
echo  +---+--------------------------------------------------------+
echo  ^| 5 ^| [*] CLEANUP Decrypted Files                           ^|
echo  +---+--------------------------------------------------------+
echo  ^| 6 ^| [*] ENCRYPT Multiple Files                 [ADVANCED] ^|
echo  +---+--------------------------------------------------------+
echo  ^| 7 ^| [*] DECRYPT Multiple Files                 [ADVANCED] ^|
echo  +---+--------------------------------------------------------+
echo  ^| 8 ^| [*] LIST Encrypted Files                              ^|
echo  +---+--------------------------------------------------------+
echo  ^| 9 ^| [X] EXIT Console                                      ^|
echo  +---+--------------------------------------------------------+
echo.
echo                    [>>] Select Operation [1-9]:
set /p choice="                       >> "

if "%choice%"=="1" goto encrypt
if "%choice%"=="2" goto decrypt
if "%choice%"=="3" goto status
if "%choice%"=="4" goto verify
if "%choice%"=="5" goto cleanup
if "%choice%"=="6" goto encrypt_files
if "%choice%"=="7" goto decrypt_files
if "%choice%"=="8" goto list_files
if "%choice%"=="9" goto exit

echo.
echo +================================================================+
echo ^|                     [!] INVALID CHOICE [!]                    ^|
echo +================================================================+
echo ^|                                                                ^|
echo ^|  [WARNING] Invalid selection detected!                        ^|
echo ^|                                                                ^|
echo ^|  [INFO] Please select a valid option from the menu (1-9)      ^|
echo ^|                                                                ^|
echo ^|  [HELP] Available operations:                                 ^|
echo ^|         - Options 1-5: Standard operations                    ^|
echo ^|         - Options 6-8: Advanced operations                    ^|
echo ^|         - Option 9: Exit console                              ^|
echo ^|                                                                ^|
echo +================================================================+
echo.
echo                     Press any key to continue...
pause >nul
goto menu

:encrypt
cls
echo.
echo +================================================================+
echo ^|                    [*] ENCRYPTION PROCESS [*]                 ^|
echo +================================================================+
echo.
echo +-----------------------------------------------------------------------------+
echo ^|                        [>>] INITIALIZING ENCRYPTION                        ^|
echo +-----------------------------------------------------------------------------+
echo.
echo [WAIT] Starting secure encryption process...
echo [LOCK] Applying military-grade encryption algorithms...
echo.
node encrypt-docs.cjs encrypt
if errorlevel 1 (
    echo.
    echo +-----------------------------------------------------------------------------+
    echo ^|                            [X] ENCRYPTION FAILED                           ^|
    echo +-----------------------------------------------------------------------------+
    echo.
    echo     [CHECK] Please verify:
    echo        • File exists and is accessible
    echo        • Sufficient disk space available
    echo        • No file permission conflicts
    echo.
) else (
    echo.
    echo +-----------------------------------------------------------------------------+
    echo ^|                          [OK] ENCRYPTION SUCCESSFUL                        ^|
    echo +-----------------------------------------------------------------------------+
    echo.
    echo     [LOCK] Document successfully encrypted and secured
    echo     [FILE] Location: .trae\documents\pharmalens-identification-system-architecture.md.encrypted
    echo     [SAFE] Your data is now protected with enterprise-grade security
    echo.
)
echo.
echo                        Press any key to return to menu...
pause >nul
goto menu

:decrypt
cls
echo.
echo +================================================================+
echo ^|                    [*] DECRYPTION PROCESS [*]                 ^|
echo +================================================================+
echo.
echo +-----------------------------------------------------------------------------+
echo ^|                        [>>] INITIALIZING DECRYPTION                        ^|
echo +-----------------------------------------------------------------------------+
echo.
echo [WAIT] Starting secure decryption process...
echo [KEY] Validating credentials and unlocking data...
echo.
node encrypt-docs.cjs decrypt
if errorlevel 1 (
    echo.
    echo +-----------------------------------------------------------------------------+
    echo ^|                            [X] DECRYPTION FAILED                           ^|
    echo +-----------------------------------------------------------------------------+
    echo.
    echo     [CHECK] Please verify:
    echo        • Password is correct
    echo        • Encrypted file exists and is not corrupted
    echo        • File permissions allow access
    echo.
) else (
    echo.
    echo +-----------------------------------------------------------------------------+
    echo ^|                          [OK] DECRYPTION SUCCESSFUL                        ^|
    echo +-----------------------------------------------------------------------------+
    echo.
    echo     [OPEN] Document successfully unlocked and restored
    echo     [FILE] Location: .trae\documents\pharmalens-identification-system-architecture.md
    echo     [READ] Your document is now ready for access
    echo.
)
echo.
echo                        Press any key to return to menu...
pause >nul
goto menu

:status
cls
echo.
echo +================================================================+
echo ^|                      [*] STATUS CHECK [*]                     ^|
echo +================================================================+
echo.
echo +---------------------------------------------------------------+
echo ^|                    [#] ENCRYPTION STATUS                     ^|
echo +---------------------------------------------------------------+
echo.
echo [WAIT] Scanning file system...
echo [SCAN] Analyzing encryption status...
echo.
node encrypt-docs.cjs status
echo.
echo                        Press any key to return to menu...
pause >nul
goto menu

:verify
cls
echo.
echo +================================================================+
echo ^|                   [*] PASSWORD VERIFICATION [*]               ^|
echo +================================================================+
echo.
echo +-----------------------------------------------------------------------------+
echo ^|                       [>>] VALIDATING CREDENTIALS                          ^|
echo +-----------------------------------------------------------------------------+
echo.
echo [WAIT] Initializing password verification...
echo [TEST] Testing encryption key integrity...
echo.
node encrypt-docs.cjs verify
echo.
echo                        Press any key to return to menu...
pause >nul
goto menu

:encrypt_files
cls
echo.
echo +================================================================+
echo ^|                  [*] BATCH ENCRYPTION [*]                     ^|
echo +================================================================+
echo.
echo +-----------------------------------------------------------------------------+
echo ^|                       MULTIPLE FILE ENCRYPTION                           ^|
echo +-----------------------------------------------------------------------------+
echo.
echo [*] Initializing batch encryption...
echo [*] Scanning for eligible files...
echo [*] Applying encryption protocols...
echo.
node file-encrypt.cjs encrypt-files
if errorlevel 1 (
    echo.
    echo +-----------------------------------------------------------------------------+
    echo ^|                        BATCH ENCRYPTION FAILED                           ^|
    echo +-----------------------------------------------------------------------------+
    echo.
    echo     [!] Please verify:
    echo        • Files exist and are accessible
    echo        • Sufficient disk space available
    echo        • No file permission conflicts
    echo.
) else (
    echo.
    echo +-----------------------------------------------------------------------------+
    echo ^|                      BATCH ENCRYPTION SUCCESSFUL                         ^|
    echo +-----------------------------------------------------------------------------+
    echo.
    echo     [+] All files successfully encrypted and secured
    echo     [+] Your data is now protected with enterprise-grade security
    echo.
)
echo.
echo                        Press any key to return to menu...
pause >nul
goto menu

:decrypt_files
cls
echo.
echo +================================================================+
echo ^|                  [*] BATCH DECRYPTION [*]                     ^|
echo +================================================================+
echo.
echo +-----------------------------------------------------------------------------+
echo ^|                       MULTIPLE FILE DECRYPTION                           ^|
echo +-----------------------------------------------------------------------------+
echo.
echo [*] Initializing batch decryption...
echo [*] Scanning encrypted files...
echo [*] Applying decryption protocols...
echo.
node file-encrypt.cjs decrypt-files
if errorlevel 1 (
    echo.
    echo +-----------------------------------------------------------------------------+
    echo ^|                        BATCH DECRYPTION FAILED                           ^|
    echo +-----------------------------------------------------------------------------+
    echo.
    echo     [!] Please verify:
    echo        • Password is correct
    echo        • Encrypted files exist and are not corrupted
    echo        • File permissions allow access
    echo.
) else (
    echo.
    echo +-----------------------------------------------------------------------------+
    echo ^|                      BATCH DECRYPTION SUCCESSFUL                         ^|
    echo +-----------------------------------------------------------------------------+
    echo.
    echo     [+] All files successfully unlocked and restored
    echo     [+] Your documents are now ready for access
    echo.
)
echo.
echo                        Press any key to return to menu...
pause >nul
goto menu

:list_files
cls
echo.
echo +================================================================+
echo ^|                    [*] FILE LISTING [*]                       ^|
echo +================================================================+
echo.
echo +-----------------------------------------------------------------------------+
echo ^|                        FILE SYSTEM ANALYSIS                              ^|
echo +-----------------------------------------------------------------------------+
echo.
echo [*] Scanning file system...
echo [*] Analyzing encryption status...
echo [*] Generating inventory report...
echo.
node file-encrypt.cjs list
echo.
echo                        Press any key to return to menu...
pause >nul
goto menu

:cleanup
cls
echo.
echo +================================================================+
echo ^|                   [*] CLEANUP MANAGEMENT [*]                  ^|
echo +================================================================+
echo.
echo +-----------------------------------------------------------------------------+
echo ^|                      SECURITY CLEANUP WARNING                          ^|
echo +-----------------------------------------------------------------------------+
echo.
echo   This operation will permanently remove decrypted files from your system.
echo   This action cannot be undone and helps maintain document security.
echo.
echo +-----------------------------------------------------------------------------+
echo ^|                         CONFIRMATION REQUIRED                            ^|
echo +-----------------------------------------------------------------------------+
echo.
set /p confirm="   Are you sure you want to proceed? (Y/N): "
if /i "%confirm%"=="Y" (
    echo.
    echo [*] Initializing cleanup process...
    echo [*] Scanning for decrypted files...
    echo [*] Executing secure deletion...
    echo.
    node encrypt-docs.cjs cleanup-decrypted
    echo.
    echo                        Press any key to return to menu...
    pause >nul
) else (
    echo.
    echo +-----------------------------------------------------------------------------+
    echo ^|                         OPERATION CANCELLED                              ^|
    echo +-----------------------------------------------------------------------------+
    echo.
    echo   Cleanup operation has been cancelled. No files were modified.
    echo.
    echo                        Press any key to return to menu...
    pause >nul
)
goto menu

:exit
cls
echo.
echo +================================================================+
echo ^|                  [*] SESSION TERMINATION [*]                  ^|
echo +================================================================+
echo.
echo +-----------------------------------------------------------------------------+
echo ^|                          SECURITY SUMMARY                                ^|
echo +-----------------------------------------------------------------------------+
echo.
echo     [+] All operations completed successfully
echo     [+] Security protocols maintained
echo     [+] Sensitive data remains protected
echo.
echo +-----------------------------------------------------------------------------+
echo ^|                        Thank you for using Pharmalens                       ^|
echo ^|                      Security Management Console v2.0                       ^|
echo +-----------------------------------------------------------------------------+
echo.
echo                          Closing in 3 seconds...
timeout /t 3 /nobreak >nul
exit /b 0