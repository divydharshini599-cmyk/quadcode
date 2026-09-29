@echo off
cd /d "%~dp0"
if not exist node_modules echo No dependencies are required. Starting StockPilot...
node server.js
pause
