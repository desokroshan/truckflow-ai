#!/bin/bash
echo "🚀 Deploying TruckFlow production server..."

# Stop existing app
pm2 stop truckflow 2>/dev/null || true
pm2 delete truckflow 2>/dev/null || true

# Install production dependencies
npm install --production

# Start production server
NODE_ENV=production pm2 start dist/production-server.js --name truckflow

# Save PM2 configuration
pm2 startup
pm2 save

echo "✅ TruckFlow deployed successfully!"
echo "🌐 Access at: http://YOUR-EC2-IP:5000"