@echo off
title CareerX Server (http://127.0.0.1:5000)
cd /d "%~dp0"
echo Starting CareerX Server...
start http://127.0.0.1:5000
python app.py
pause
