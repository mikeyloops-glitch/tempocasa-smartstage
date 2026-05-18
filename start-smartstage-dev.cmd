@echo off
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%SystemRoot%\System32;%SystemRoot%;%SystemRoot%\System32\WindowsPowerShell\v1.0;%PATH%"
"C:\Program Files\nodejs\npm.cmd" run dev -- -H 0.0.0.0 -p 3000
if errorlevel 1 pause
