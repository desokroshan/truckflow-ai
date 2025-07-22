# 🌐 How to Access Your TruckFlow Application on EC2

## 📍 Step 1: Find Your Public IP Address

1. **AWS Console** → EC2 → Instances
2. **Click on your instance**
3. **Copy the "Public IPv4 address"** (e.g., 54.123.45.67)

## 🔒 Step 2: Configure Security Group (IMPORTANT)

Your app runs on port 5000, so you need to allow traffic:

1. **EC2 Console** → Select your instance
2. **Security** tab → Click on your Security Group
3. **Inbound rules** → Edit inbound rules
4. **Add rule**:
   - Type: Custom TCP
   - Port: 5000
   - Source: 0.0.0.0/0 (Anywhere)
5. **Save rules**

## 🌐 Step 3: Access Your Application

Your TruckFlow URL will be:
```
http://YOUR-PUBLIC-IP:5000
```

For example: `http://54.123.45.67:5000`

## ✅ Step 4: Verify It's Running

SSH into your EC2 instance and check:
```bash
# Check if your app is running
pm2 status

# If not running, start it:
cd /home/ec2-user/truckflow
NODE_ENV=production pm2 start dist/index.js --name truckflow

# Check logs if there are issues:
pm2 logs truckflow
```

## 🔧 Step 5: Environment Variables Setup

Before your app works fully, add environment variables:
```bash
# SSH into EC2 and create .env file
nano /home/ec2-user/truckflow/.env
```

Add these variables:
```
NODE_ENV=production
DATABASE_URL=your-postgres-connection-string
OPENAI_API_KEY=your-openai-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
USPS_USER_ID=your-usps-user-id
JWT_SECRET=your-random-secret-string
SESSION_SECRET=another-random-secret-string
```

Then restart:
```bash
pm2 restart truckflow
```

## 🎯 What You Should See

When you visit `http://your-ip:5000`:
- TruckFlow login/signup page
- Ability to create user accounts
- Dashboard interface

## 📞 Update Twilio Webhooks

Once your app is accessible:
1. **Twilio Console** → Phone Numbers
2. **Update webhooks**:
   - Voice URL: `http://your-ip:5000/twilio/voice`
   - SMS URL: `http://your-ip:5000/twilio/sms`

## 🗄️ Database Setup

For permanent data storage, create an RDS PostgreSQL database:
1. **RDS Console** → Create database
2. **PostgreSQL** → Free tier
3. **Get connection string** and add to .env file

Your application will then be fully functional with persistent data storage.

What's your EC2 instance's public IP address? I can help you troubleshoot if the app isn't accessible.