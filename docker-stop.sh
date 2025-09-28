#!/bin/bash

# Docker Stop Script for CampusFin Application
echo "🛑 Stopping CampusFin Application..."
echo "=================================="

# Stop and remove containers
docker-compose down

# Optional: Remove images (uncomment if you want to clean up completely)
# echo "🧹 Removing Docker images..."
# docker-compose down --rmi all

# Optional: Remove volumes (uncomment if you want to clean up data)
# echo "🗑️  Removing Docker volumes..."
# docker-compose down -v

echo "✅ Application stopped successfully!"
