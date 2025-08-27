@echo off
echo ===== Deshi Sahayak Hub Local Deployment =====

echo.
echo Step 1: Building the backend...
cd backend
call npm install
call node build-for-deployment.js

echo.
echo Step 2: Building the frontend...
cd ..
call npm install
call npm run build

echo.
echo Step 3: Starting the backend server...
cd backend
start cmd /k "npm run start"

echo.
echo Step 4: Starting the frontend server...
cd ..
start cmd /k "npx serve -s dist -l 5173"

echo.
echo ===== Deployment Complete =====
echo.
echo Backend API: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit...
pause > nul
