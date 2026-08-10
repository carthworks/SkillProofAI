@echo off
set "ROOT=%~dp0"

docker compose -f "%ROOT%docker-compose.yml" up -d

timeout /t 5 >nul

wt ^
new-tab --title "Backend" cmd /k "cd /d ""%ROOT%"" && npm run dev:backend" ^
; new-tab --title "Worker" cmd /k "cd /d ""%ROOT%"" && npm run dev:worker" ^
; new-tab --title "Frontend" cmd /k "cd /d ""%ROOT%"" && npm run dev:frontend"