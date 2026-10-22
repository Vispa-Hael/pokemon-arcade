@echo off
cd /d "%~dp0"
node scripts\launch-arcade.mjs --stop
if errorlevel 1 pause
