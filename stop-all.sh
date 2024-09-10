#!/bin/bash

# Make sure the script exits on error
set -e

echo "Stopping all services..."

# Stop all running services
docker compose down

# docker system prune -f

echo "All services have been stopped."