#!/bin/bash

# Deshi Sahayak Hub Deployment Script
# This script automates the deployment process for the Deshi Sahayak Hub application

# Exit on error
set -e

echo "🚀 Starting Deshi Sahayak Hub deployment..."

# Check if .env.production exists
if [ ! -f "./backend/.env.production" ]; then
    echo "❌ Error: .env.production file not found in backend directory"
    echo "Please create the .env.production file with your production environment variables"
    exit 1
fi

# Create SSL directory if it doesn't exist
if [ ! -d "./ssl" ]; then
    echo "📁 Creating SSL directory..."
    mkdir -p ./ssl
    echo "⚠️ Remember to add your SSL certificates to the ./ssl directory"
fi

# Build the application
echo "🔨 Building the application..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start the services
echo "🌐 Starting services..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

echo "✅ Deployment completed successfully!"
echo "📊 Backend API: https://your-domain.com/api/v1"
echo "🖥️ Frontend: https://your-domain.com"
echo "📚 API Documentation: https://your-domain.com/api/v1/docs"

echo "📝 Deployment logs can be viewed with: docker-compose logs -f"