@echo off
cd /d "%~dp0"
echo Starting the CBQ demo at http://localhost:8080  (close this window to stop)
start "" http://localhost:8080
python -m http.server 8080 || py -m http.server 8080 || (echo Python was not found. See README.txt for other ways to open the demo. & pause)
