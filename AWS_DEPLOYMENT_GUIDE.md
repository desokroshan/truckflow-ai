# TruckFlow AWS Deployment Guide

## Prerequisites
- AWS Account with billing enabled
- AWS CLI installed and configured
- Your application code ready (already done!)

## Option 1: AWS Elastic Beanstalk + RDS (Recommended)

### Step 1: Prepare Application for Deployment

1. **Update package.json start script** (already configured):
```json
{
  "scripts": {
    "start": "NODE_ENV=production node dist/index.js"
  }
}
```

2. **Build the application**:
```bash
npm run build
```

### Step 2: Create RDS PostgreSQL Database

1. **Go to AWS RDS Console**
   - Navigate to: https://console.aws.amazon.com/rds/

2. **Create Database**:
   - Engine: PostgreSQL
   - Version: 15.4 or latest
   - Templates: Production or Dev/Test
   - DB Instance Class: db.t3.micro (free tier) or db.t3.small
   - Storage: 20GB minimum
   - **Important**: Set Master username/password (save these!)

3. **Configure Security**:
   - VPC: Default VPC
   - Public Access: No (for security)
   - VPC Security Groups: Create new (allow port 5432)

### Step 3: Deploy to Elastic Beanstalk

1. **Go to Elastic Beanstalk Console**
   - Navigate to: https://console.aws.amazon.com/elasticbeanstalk/

2. **Create New Application**:
   - Application name: `truckflow-app`
   - Platform: Node.js
   - Platform version: Latest Node.js version
   - Application code: Upload your code

3. **Upload Code**:
   - Create ZIP file of your entire project
   - Exclude: `node_modules`, `.git`, `.env`
   - Include: All source code, package.json, package-lock.json

### Step 4: Configure Environment Variables

In Elastic Beanstalk Console > Configuration > Software:

```bash
# Database Configuration
DATABASE_URL=postgres://username:password@your-rds-endpoint:5432/database_name

# Essential API Keys
OPENAI_API_KEY=your-openai-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# Address Validation (Free)
USPS_USER_ID=your-usps-user-id

# Email Configuration (Optional)
GMAIL_EMAIL=your-email@gmail.com
GMAIL_PASSWORD=your-app-password

# Security
NODE_ENV=production
SESSION_SECRET=your-secure-random-string
```

### Step 5: Update Twilio Webhooks

After deployment, update your Twilio webhooks:
- Voice URL: `https://your-app.us-west-2.elasticbeanstalk.com/twilio/voice`
- SMS URL: `https://your-app.us-west-2.elasticbeanstalk.com/twilio/sms`

## Option 2: AWS EC2 + RDS (Advanced)

### Server Setup
1. **Launch EC2 Instance**:
   - AMI: Amazon Linux 2023
   - Instance Type: t3.micro (free tier) or t3.small
   - Security Groups: Allow HTTP(80), HTTPS(443), SSH(22)

2. **Install Dependencies**:
```bash
# Connect via SSH
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts

# Install PM2 (Process Manager)
npm install -g pm2
```

3. **Deploy Code**:
```bash
# Upload code (use SCP or Git)
git clone your-repository
cd truckflow
npm install
npm run build

# Start with PM2
pm2 start dist/index.js --name truckflow
pm2 startup
pm2 save
```

## Option 3: AWS Lambda Serverless (Cost-Optimized)

### Prerequisites
Install Serverless Framework:
```bash
npm install -g serverless
npm install serverless-http
```

### Create serverless.yml:
```yaml
service: truckflow-api
frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    DATABASE_URL: ${env:DATABASE_URL}
    OPENAI_API_KEY: ${env:OPENAI_API_KEY}
    TWILIO_ACCOUNT_SID: ${env:TWILIO_ACCOUNT_SID}
    TWILIO_AUTH_TOKEN: ${env:TWILIO_AUTH_TOKEN}

functions:
  api:
    handler: dist/lambda.handler
    events:
      - httpApi: '*'

plugins:
  - serverless-offline
```

## Cost Estimates (Monthly)

### Option 1: Elastic Beanstalk + RDS
- **Elastic Beanstalk**: Free (you pay for underlying EC2)
- **EC2 t3.micro**: $8.50/month (free tier: 750 hours/month)
- **RDS db.t3.micro**: $16/month (free tier: 750 hours/month)
- **Total**: ~$25/month (less with free tier)

### Option 2: EC2 + RDS
- **EC2 t3.small**: $17/month
- **RDS db.t3.micro**: $16/month
- **Total**: ~$33/month

### Option 3: Lambda + RDS
- **Lambda**: $0.20 per 1M requests
- **RDS**: $16/month (minimum)
- **Total**: $16+ per month (very low traffic)

## Database Migration

After RDS setup, run migrations:
```bash
# On your deployment server
npm run db:push
# or
npx drizzle-kit migrate
```

## Security Best Practices

1. **Environment Variables**: Use AWS Systems Manager Parameter Store for sensitive data
2. **Database**: Keep RDS in private subnet, no public access
3. **SSL/TLS**: Enable HTTPS with AWS Certificate Manager
4. **Backup**: Enable automated RDS backups
5. **Monitoring**: Set up CloudWatch alerts

## Recommended Deployment Flow

1. **Start with Elastic Beanstalk** (easiest)
2. **Test thoroughly** with staging environment
3. **Scale up** to dedicated EC2 if needed
4. **Consider Lambda** for cost optimization later

Your TruckFlow application is already configured with proper build scripts and database migrations, making it ready for AWS deployment!