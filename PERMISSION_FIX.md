# Fix Permission Denied Error

## Quick Solution
Run this command on your EC2 to make the script executable:

```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

## Alternative: Run Without Script
If you prefer, run the commands directly:

```bash
# Stop existing app
pm2 stop truckflow 2>/dev/null || true
pm2 delete truckflow 2>/dev/null || true

# Install dependencies
npm install

# Start production server
NODE_ENV=production pm2 start dist/production-server.js --name truckflow

# Save PM2 configuration
pm2 startup
pm2 save

# Check status
pm2 status
```

The permission error happens because tar doesn't preserve executable permissions by default.