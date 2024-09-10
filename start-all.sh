#!/bin/bash

# Make sure the script exits on error
set -e

echo "Starting all services..."

# Pull the latest images (optional, if using remote images)
# docker-compose pull

# Build the images (optional, if you need to rebuild the images)
docker compose build

# Start all services in detached mode
docker compose up -d

echo "All services have been started."