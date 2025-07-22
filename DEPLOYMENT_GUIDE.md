# 🚀 TruckFlow EC2 Deployment & Redeployment Guide

## 🛠 Initial Setup: Deploy Your Full TruckFlow Code

### Step 1: Build and Package
```bash
# In your Replit IDE
npm run build
esbuild server/production-server.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/production-server.js
```

### Step 2: Create Deployment Package
```bash
mkdir truckflow-full-deployment
cd truckflow-full-deployment

# Copy all necessary files
cp -r ../dist .
cp ../package.json .
cp ../package-lock.json .
cp -r ../migrations .
cp ../drizzle.config.ts .

# Create deployment script
cat > deploy-full.sh << 'EOF'
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
EOF

chmod +x deploy-full.sh

# Create package
tar -czf ../truckflow-full.tar.gz *
cd ..
```

### Step 3: Deploy to EC2
```bash
# Upload to EC2
scp -i your-key.pem truckflow-full.tar.gz ec2-user@YOUR-EC2-IP:~/

# SSH and deploy
ssh -i your-key.pem ec2-user@YOUR-EC2-IP
tar -xzf truckflow-full.tar.gz
cd truckflow-full-deployment
./deploy-full.sh
```

## 🔄 Redeployment Process (After Code Changes)

### Quick Redeployment Steps:
```bash
# 1. In your IDE, build the changes
npm run build
esbuild server/production-server.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/production-server.js

# 2. Create update package
tar -czf truckflow-update.tar.gz dist/ package.json

# 3. Upload to EC2
scp -i your-key.pem truckflow-update.tar.gz ec2-user@YOUR-EC2-IP:~/

# 4. Deploy update on EC2
ssh -i your-key.pem ec2-user@YOUR-EC2-IP
tar -xzf truckflow-update.tar.gz
pm2 restart truckflow
```

## 📋 Environment Variables Setup

Create `.env` file on EC2:
```bash
# On EC2, create environment file
cat > .env << 'EOF'
NODE_ENV=production
DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/truckflow
OPENAI_API_KEY=your-openai-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
USPS_USER_ID=your-usps-user-id
JWT_SECRET=your-random-secret-string
SESSION_SECRET=another-random-secret-string
EOF
```

Then restart: `pm2 restart truckflow`

## 🗄️ Database Setup

### Create RDS PostgreSQL:
1. **RDS Console** → Create Database
2. **PostgreSQL** → Free tier
3. **Database name**: truckflow
4. **Username**: truckflow_user
5. **Password**: [choose strong password]
6. **Copy endpoint** to DATABASE_URL

### Run Migrations:
```bash
# On EC2, after setting DATABASE_URL
npm run db:push
```

## 📞 Update Twilio Webhooks

After successful deployment:
- **Voice URL**: `http://YOUR-EC2-IP:5000/twilio/voice`
- **SMS URL**: `http://YOUR-EC2-IP:5000/twilio/sms`

## 🔍 Troubleshooting

### Check App Status:
```bash
pm2 status
pm2 logs truckflow
```

### Common Issues:
1. **Port 5000 blocked**: Update security group
2. **Database connection failed**: Check DATABASE_URL
3. **App not starting**: Check `pm2 logs truckflow`

## ⚡ Quick Commands Reference

```bash
# Check status
pm2 status

# Restart app
pm2 restart truckflow

# View logs
pm2 logs truckflow

# Stop app
pm2 stop truckflow

# Check if app is responding
curl http://localhost:5000/api/health
```

This gives you your full TruckFlow application with all features: authentication, load management, Twilio integration, AI processing, and database persistence.