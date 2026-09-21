@echo off
set "ROOT=%~dp0"

if not exist "%ROOT%.env" (
    if exist "%ROOT%.env.example" (
        echo [INFO] .env not found. Initializing .env from .env.example...
        copy "%ROOT%.env.example" "%ROOT%.env" >nul
    )
)

if not exist "%ROOT%backend\.env" (
    if exist "%ROOT%.env" (
        copy "%ROOT%.env" "%ROOT%backend\.env" >nul
    )
)

if not exist "%ROOT%node_modules" (
    echo [INFO] node_modules not found. Installing dependencies across all workspaces...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed. Please check the logs above.
        exit /b 1
    )
)

if not exist "%ROOT%backend\node_modules\.prisma\client\query_engine-windows.dll.node" (
    echo [INFO] Prisma Client not generated. Generating Prisma Client for backend...
    call npm --workspace backend exec prisma generate
)

docker compose -f "%ROOT%docker-compose.yml" up -d

timeout /t 5 >nul

wt ^
new-tab --title "Backend" cmd /k "cd /d ""%ROOT%"" && npm run dev:backend" ^
; new-tab --title "Worker" cmd /k "cd /d ""%ROOT%"" && npm run dev:worker" ^
; new-tab --title "Frontend" cmd /k "cd /d ""%ROOT%"" && npm run dev:frontend"