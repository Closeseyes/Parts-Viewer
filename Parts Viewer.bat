@echo off
setlocal enabledelayedexpansion

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"

REM Run the production Electron app
cd /d "%SCRIPT_DIR%"
node ./node_modules/electron/cli.js dist-electron/main.js

endlocal
