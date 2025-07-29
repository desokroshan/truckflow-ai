#!/bin/bash

# TruckFlow AI Production Deployment Script
echo "Deploying TruckFlow AI..."

# Install dependencies
npm install --production

# Create uploads directory
mkdir -p uploads

# Stop any existing PM2 processes
pm2 stop truckflow-ai 2>/dev/null || true
pm2 delete truckflow-ai 2>/dev/null || true

# Start the application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

echo "Deployment complete!"
echo "Use 'pm2 logs truckflow-ai' to view logs"
echo "Use 'pm2 restart truckflow-ai' to restart"