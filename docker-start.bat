@echo off
echo Starting AURA with MySQL and phpMyAdmin via Docker Compose...
docker-compose up -d --build
echo.
echo Application is running at: http://localhost:5000
echo phpMyAdmin is running at: http://localhost:8085
echo.
pause
