# Fix: Script Not Found After Extraction

## The Issue
The deploy script isn't appearing after extracting the tar file.

## Solution
On your EC2, run these commands:

```bash
# First, clean up and re-extract properly
rm -rf dist/ package.json package-lock.json migrations/ drizzle.config.ts deploy-production.sh

# Extract the package
tar -xzf truckflow-v1.2.1-production.tar.gz

# List files to verify extraction
ls -la

# Make script executable and run
chmod +x deploy-production.sh
./deploy-production.sh
```

## If Script Still Missing
Run the deployment commands manually:

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

# Test the app
curl http://localhost:5000/api/health
```

## Verify Your App is Running
After successful deployment:
- Check `pm2 status` shows truckflow as "online"
- Visit `http://YOUR-EC2-IP:5000` to access TruckFlow
- Try logging in to test the authentication system