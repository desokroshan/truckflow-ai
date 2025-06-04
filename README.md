# TruckFlow AI - Automated Trucking Business Management

An AI-powered automation system for trucking businesses that processes customer calls, extracts shipping information, and manages load requests through an intelligent dashboard.

## 🚀 Live Demo

**Production**: [https://truckflow.jsonutil.dev](https://truckflow.jsonutil.dev)

## Features

- **AI Voice Processing**: Automatically handles incoming customer calls via Twilio
- **Smart Data Extraction**: Uses OpenAI GPT-4 and Whisper to extract shipping details from conversations
- **Real-time Dashboard**: Modern web interface for managing load requests and approvals
- **Automated Notifications**: Email and SMS alerts for new load requests
- **Load Filtering**: Filter requests by status (All, Pending, Approved)
- **Load Management**: Track and approve shipping requests with detailed metrics

## Tech Stack

- **Frontend**: React + TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Node.js + Express, TypeScript
- **AI Integration**: OpenAI GPT-4 and Whisper
- **Communications**: Twilio Voice API
- **Storage**: In-memory storage (production-ready for small scale)
- **Build Tool**: Vite

## Prerequisites

- Node.js 18+ 
- npm package manager
- Twilio account with phone number
- OpenAI API key

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/truckflow-ai.git
   cd truckflow-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
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
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

5. **Access the dashboard**
   Open [http://localhost:5000](http://localhost:5000) in your browser

## 🔧 Configuration

### Getting API Keys

#### OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create account or sign in
3. Navigate to API Keys section
4. Create new API key
5. Copy to your `.env` file

#### Twilio Setup
1. Create [Twilio account](https://www.twilio.com/try-twilio)
2. Purchase a phone number
3. Get Account SID and Auth Token from Console Dashboard
4. Configure webhook URLs (see below)

### Twilio Webhook Configuration

In your Twilio Console, configure your phone number with these webhook URLs:

**For local development:**
- **Voice URL**: `https://your-ngrok-url.ngrok.io/api/twilio/voice`
- **Recording Status Callback**: `https://your-ngrok-url.ngrok.io/api/twilio/recording`

**For production:**
- **Voice URL**: `https://your-domain.com/api/twilio/voice`
- **Recording Status Callback**: `https://your-domain.com/api/twilio/recording`

### Local Development with ngrok

To test Twilio webhooks locally:

1. **Install ngrok**
   ```bash
   npm install -g ngrok
   ```

2. **Start your app**
   ```bash
   npm run dev
   ```

3. **In another terminal, expose port 5000**
   ```bash
   ngrok http 5000
   ```

4. **Update Twilio webhooks** with the ngrok URL provided

## 🎯 How It Works

1. **Customer calls** your Twilio phone number
2. **AI assistant** greets them and records their shipping request  
3. **OpenAI Whisper** transcribes the audio recording
4. **GPT-4** extracts structured shipping data from the transcription
5. **Load request** is automatically created in the dashboard
6. **Owner receives** email/SMS notification for approval
7. **Dashboard** allows reviewing and approving requests

## 📋 Testing the System

### Sample Phone Call Script
Call your Twilio number and say:
> "Hi, I need to ship furniture from New York to Miami. The pickup is at 789 Broadway in Manhattan and delivery to 456 Ocean Drive in Miami Beach. The load weighs about 8,000 pounds and I need a box truck. Pickup should be Monday morning between 9 AM and 11 AM. This is for Miami Furniture Store, my name is Sarah Johnson and you can reach me at this number."

### Expected Results
- Load request appears in dashboard with your actual details
- AI Processing section shows your real transcription
- Customer name, locations, and cargo details match what you spoke

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── ui/         # shadcn/ui components
│   │   │   ├── load-dashboard-new.tsx  # Main dashboard with filtering
│   │   │   ├── call-simulator.tsx      # Audio upload interface
│   │   │   └── ai-processing.tsx       # AI transcription display
│   │   ├── pages/          # App pages  
│   │   ├── lib/            # Utilities
│   │   └── hooks/          # Custom hooks
├── server/                 # Express backend
│   ├── index.ts           # Main server file
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Data storage layer
│   ├── twilio.ts          # Twilio integration & real audio processing
│   ├── openai.ts          # OpenAI integration
│   ├── email.ts           # Email notifications
│   └── googleSheets.ts    # Google Sheets integration
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schemas
└── uploads/               # Audio file uploads
```

## 🛠 API Endpoints

- `GET /api/load-requests` - Get all load requests
- `POST /api/load-requests/:id/approve` - Approve a load request
- `GET /api/metrics` - Get dashboard metrics
- `POST /api/twilio/voice` - Twilio voice webhook
- `POST /api/twilio/recording` - Twilio recording webhook (processes real audio)
- `POST /api/upload-audio` - Upload audio for testing

## 🚀 Deployment Options

### Option 1: Replit (Recommended)
1. Import this repository to Replit
2. Add environment variables in Replit Secrets
3. Click "Deploy" 
4. Configure custom domain if desired

### Option 2: Vercel
1. Connect GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on git push

### Option 3: Railway
1. Connect GitHub repository to Railway
2. Add environment variables
3. Deploy with one click

### Option 4: Traditional VPS
1. Clone repository on server
2. Install Node.js and dependencies
3. Configure environment variables
4. Use PM2 for process management
5. Set up nginx reverse proxy

## 🔐 Security Notes

- Never commit `.env` file to git
- Use environment variables for all secrets
- Validate Twilio webhook signatures in production
- Implement rate limiting for API endpoints
- Use HTTPS in production

## 🐛 Troubleshooting

### Common Issues

**Placeholder data appearing instead of real transcription:**
- Check Twilio webhook URLs are correctly configured
- Verify OpenAI API key has sufficient credits
- Check server logs for transcription errors

**Webhooks not working:**
- Ensure webhooks point to your deployed URL, not localhost
- Verify webhook URLs are accessible externally
- Check Twilio Console for webhook delivery logs

**Audio processing errors:**
- Verify OpenAI API key is valid
- Check audio file formats are supported
- Ensure sufficient disk space for temporary files

## 📦 Git Setup Instructions

```bash
# Initialize git repository
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: TruckFlow AI automation system"

# Add remote repository
git remote add origin https://github.com/your-username/truckflow-ai.git

# Push to GitHub
git push -u origin main
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request