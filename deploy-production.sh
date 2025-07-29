#!/bin/bash

# TruckFlow AI Production Deployment Script
# Version: 1.4.5
# Created: July 29, 2025

set -e  # Exit on any error

echo "🚛 TruckFlow AI Production Deployment v1.4.5"
echo "=============================================="

# Configuration
APP_NAME="truckflow-ai"
NODE_VERSION="20"
PM2_ECOSYSTEM="ecosystem.config.js"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Do not run this script as root. Run as ubuntu user."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the TruckFlow AI directory."
    exit 1
fi

print_status "Starting deployment process..."

# 1. Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js if not present
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js $NODE_VERSION..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    print_success "Node.js already installed: $(node --version)"
fi

# 3. Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
else
    print_success "PM2 already installed: $(pm2 --version)"
fi

# 4. Install application dependencies
print_status "Installing application dependencies..."
npm ci --production

# 5. Set up environment variables
if [ ! -f ".env" ]; then
    if [ -f ".env.production.template" ]; then
        print_warning "No .env file found. Copying from template..."
        cp .env.production.template .env
        print_warning "Please edit .env file with your actual configuration before continuing."
        read -p "Press Enter after updating .env file..."
    else
        print_error ".env file not found and no template available."
        exit 1
    fi
else
    print_success ".env file found"
fi

# 6. Verify required directories exist
print_status "Creating required directories..."
mkdir -p uploads logs

# 7. Set proper permissions
print_status "Setting file permissions..."
chmod +x dist/index.js
chmod 755 uploads logs

# 8. Stop existing PM2 processes
print_status "Stopping existing PM2 processes..."
pm2 stop $APP_NAME 2>/dev/null || true
pm2 delete $APP_NAME 2>/dev/null || true

# 9. Start application with PM2
print_status "Starting application with PM2..."
if [ -f "$PM2_ECOSYSTEM" ]; then
    pm2 start $PM2_ECOSYSTEM
else
    print_warning "PM2 ecosystem file not found. Starting with default configuration..."
    pm2 start dist/index.js --name $APP_NAME --node-args="--openssl-legacy-provider"
fi

# 10. Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

# 11. Set up PM2 startup script
print_status "Setting up PM2 startup script..."
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

# 12. Verify deployment
print_status "Verifying deployment..."
sleep 5

if pm2 list | grep -q $APP_NAME; then
    print_success "Application is running with PM2"
    pm2 show $APP_NAME
else
    print_error "Application failed to start"
    pm2 logs $APP_NAME --lines 20
    exit 1
fi

# 13. Test application endpoint
print_status "Testing application endpoint..."
sleep 3

if curl -f -s http://localhost:5000/health > /dev/null; then
    print_success "Application health check passed"
else
    print_warning "Health check endpoint not responding. Check application logs:"
    pm2 logs $APP_NAME --lines 10
fi

# 14. Display final status
echo ""
echo "=============================================="
print_success "🎉 TruckFlow AI Deployment Complete!"
echo "=============================================="
echo ""
print_status "Application Status:"
pm2 status
echo ""
print_status "Useful Commands:"
echo "  View logs:           pm2 logs $APP_NAME"
echo "  Restart app:         pm2 restart $APP_NAME"
echo "  Stop app:            pm2 stop $APP_NAME"
echo "  View app details:    pm2 show $APP_NAME"
echo "  Monitor processes:   pm2 monit"
echo ""
print_status "Application should be available at: http://your-server-ip:5000"
echo ""

# 15. Optional: Display current logs
read -p "Would you like to view the current logs? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pm2 logs $APP_NAME --lines 30
fi

print_success "Deployment script completed successfully!"