setlocal enabledelayedexpansion

echo Stopping all services...

:: Stop all running services
docker compose down

:: Uncomment the following line if you want to remove unused data
:: docker system prune -f

echo All services have been stopped.