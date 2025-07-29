#!/bin/bash

# TruckFlow AI Production Deployment Script
echo "Deploying TruckFlow AI..."

# Check if we have the built application
if [ ! -f "dist/index.js" ]; then
    echo "Error: Built application not found (dist/index.js)"
    echo "Please ensure you've run 'npm run build' before deployment"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install --production

# Create required directories
mkdir -p uploads logs

# Copy ecosystem config to root if it doesn't exist
if [ ! -f "ecosystem.config.js" ] && [ -f "production-deployment/ecosystem.config.js" ]; then
    cp production-deployment/ecosystem.config.js .
fi

# Stop any existing PM2 processes
echo "Stopping existing processes..."
pm2 stop truckflow-ai 2>/dev/null || true
pm2 delete truckflow-ai 2>/dev/null || true

# Start the application with PM2
echo "Starting TruckFlow AI with PM2..."
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
else
    echo "No ecosystem config found, starting with default settings..."
    pm2 start dist/index.js --name truckflow-ai
fi

# Save PM2 configuration
pm2 save

# Show status
echo ""
echo "Deployment complete!"
echo ""
pm2 status
echo ""
echo "Useful commands:"
echo "  View logs:    pm2 logs truckflow-ai"
echo "  Restart:      pm2 restart truckflow-ai"
echo "  Stop:         pm2 stop truckflow-ai"
echo "  Monitor:      pm2 monit"