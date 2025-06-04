#!/bin/bash

# TruckFlow AI Setup Script
echo "🚀 Setting up TruckFlow AI..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cat > .env << EOL
# Required - OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Required - Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Owner Contact Information
OWNER_EMAIL=your_email@example.com
OWNER_PHONE=+1234567890

# Optional - Google Sheets Integration
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account",...}
GOOGLE_SHEET_ID=your_google_sheet_id
EOL
    echo "⚠️  Please edit .env file with your actual API keys before running the app"
else
    echo "✅ .env file already exists"
fi

# Create uploads directory
mkdir -p uploads
echo "✅ Created uploads directory"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your API keys"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:5000"
echo ""
echo "For Twilio webhook testing, use ngrok:"
echo "1. Install: npm install -g ngrok"
echo "2. Run: ngrok http 5000"
echo "3. Update Twilio webhooks with ngrok URL"