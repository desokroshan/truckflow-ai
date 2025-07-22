#!/bin/bash
echo "🚀 Deploying TruckFlow production server..."

# Stop existing app
pm2 stop truckflow 2>/dev/null || true
pm2 delete truckflow 2>/dev/null || true

# Install ALL dependencies (not just production)
echo "Installing dependencies..."
npm install

# Check if production server exists
if [ ! -f "dist/production-server.js" ]; then
    echo "❌ Production server not found!"
    exit 1
fi

# Start production server
echo "Starting TruckFlow server..."
NODE_ENV=production pm2 start dist/production-server.js --name truckflow

# Save PM2 configuration
pm2 startup
pm2 save

echo "✅ TruckFlow deployed successfully!"
echo "🌐 Access at: http://$(curl -s ifconfig.me):5000"

# Show status
pm2 status