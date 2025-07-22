# 🗄️ Database & Environment Setup for EC2

## 1. Environment Variables Setup

Create a `.env` file on your EC2 instance with these values:

```bash
# On EC2, create environment file
cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://postgres:password@host:5432/truckflow
PGHOST=localhost
PGPORT=5432  
PGUSER=postgres
PGPASSWORD=password
PGDATABASE=truckflow

# Application Environment
NODE_ENV=production
PORT=5000

# AI & Communication APIs (get these from respective services)
OPENAI_API_KEY=your-openai-key-here
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Address Validation
USPS_USER_ID=your-usps-user-id

# Security
JWT_SECRET=your-random-jwt-secret-min-32-chars
SESSION_SECRET=another-random-secret-for-sessions

# Email Configuration (optional)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-password
EOF
```

## 2. Database Options

### Option A: Use Replit's PostgreSQL (Recommended)
I've already created a database for you. Update your `.env` with the Replit database URL.

### Option B: Local PostgreSQL on EC2
```bash
# Install PostgreSQL
sudo yum update -y
sudo amazon-linux-extras install postgresql14
sudo yum install postgresql-server postgresql-contrib

# Initialize and start
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres createdb truckflow
sudo -u postgres psql -c "CREATE USER truckflow WITH PASSWORD 'securepassword';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE truckflow TO truckflow;"
```

### Option C: AWS RDS PostgreSQL (Production)
1. Go to AWS RDS Console
2. Create PostgreSQL database (free tier: db.t3.micro)
3. Database name: `truckflow`
4. Username: `truckflow_user`
5. Copy the endpoint to your `.env` as DATABASE_URL

## 3. Run Database Migrations

After setting up your database:

```bash
# On EC2, after setting DATABASE_URL
npm run db:push
```

## 4. Required API Keys

### OpenAI (for AI features)
1. Go to https://platform.openai.com/api-keys
2. Create new API key
3. Add to `.env` as `OPENAI_API_KEY`

### Twilio (for phone integration)
1. Go to https://console.twilio.com
2. Get Account SID and Auth Token from dashboard
3. Buy a phone number
4. Add all three to `.env`

### USPS (for address validation)
1. Register at https://www.usps.com/business/web-tools-apis/
2. Get User ID
3. Add to `.env` as `USPS_USER_ID`

## 5. Update Twilio Webhooks

After your app is running, configure Twilio webhooks:
- **Voice URL**: `http://YOUR-EC2-IP:5000/twilio/voice`
- **SMS URL**: `http://YOUR-EC2-IP:5000/twilio/sms`

## 6. Restart Application

After creating `.env`:
```bash
pm2 restart truckflow
pm2 logs truckflow  # Check for any errors
```

## 7. Test Database Connection

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Should return JSON with database status
```

Your TruckFlow application will now have full database persistence and all API integrations ready!