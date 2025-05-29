# TruckFlow AI - Automated Trucking Business Management

An AI-powered automation system for trucking businesses that processes customer calls, extracts shipping information, and manages load requests through an intelligent dashboard.

## Features

- **AI Voice Processing**: Automatically handles incoming customer calls via Twilio
- **Smart Data Extraction**: Uses OpenAI GPT-4 to extract shipping details from conversations
- **Real-time Dashboard**: Modern web interface for managing load requests and approvals
- **Automated Notifications**: Email and SMS alerts for new load requests
- **Call Simulation**: Built-in testing interface for development
- **Load Management**: Track and approve shipping requests with detailed metrics

## Tech Stack

- **Frontend**: React + TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Node.js + Express, TypeScript
- **AI Integration**: OpenAI GPT-4 and Whisper
- **Communications**: Twilio Voice API
- **Storage**: In-memory storage (easily configurable for PostgreSQL)
- **Build Tool**: Vite

## Prerequisites

- Node.js 18+ 
- npm or yarn package manager
- Twilio account with phone number
- OpenAI API key

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd truckflow-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with the following variables:

   ```env
   # Required - OpenAI API Key
   OPENAI_API_KEY=your_openai_api_key_here

   # Required - Twilio Configuration
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number

   # Optional - Email Notifications
   OWNER_EMAIL=your_email@example.com
   OWNER_PHONE=your_phone_number

   # Optional - Google Sheets Integration
   GOOGLE_SHEETS_CREDENTIALS={"type":"service_account",...}
   GOOGLE_SHEET_ID=your_google_sheet_id
   ```

## Getting API Keys

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env` file

### Twilio Setup
1. Create a [Twilio account](https://www.twilio.com/try-twilio)
2. Get a phone number from the Twilio Console
3. Find your Account SID and Auth Token in the Console Dashboard
4. Add these to your `.env` file

### Twilio Webhook Configuration
Configure your Twilio phone number webhooks:
- **Voice URL**: `https://your-domain.com/api/twilio/voice`
- **Recording Status Callback**: `https://your-domain.com/api/twilio/recording`

## Running the Application

### Development Mode
```bash
npm run dev
```

This starts both the backend server (port 5000) and frontend development server with hot reload.

### Access the Application
- **Dashboard**: http://localhost:5000
- **API**: http://localhost:5000/api/*

## How It Works

1. **Customer calls** your Twilio phone number
2. **AI assistant** greets them and records their shipping request
3. **OpenAI Whisper** transcribes the audio recording
4. **GPT-4** extracts structured shipping data from the transcription
5. **Load request** is automatically created in the dashboard
6. **Owner receives** email/SMS notification for approval
7. **Dashboard** allows reviewing and approving requests

## API Endpoints

- `GET /api/load-requests` - Get all load requests
- `POST /api/load-requests/:id/approve` - Approve a load request
- `GET /api/metrics` - Get dashboard metrics
- `POST /api/twilio/voice` - Twilio voice webhook
- `POST /api/twilio/recording` - Twilio recording webhook
- `POST /api/upload-audio` - Upload audio for testing

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # App pages
│   │   ├── lib/            # Utilities
│   │   └── hooks/          # Custom hooks
├── server/                 # Express backend
│   ├── index.ts           # Main server file
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Data storage layer
│   ├── twilio.ts          # Twilio integration
│   ├── openai.ts          # OpenAI integration
│   ├── email.ts           # Email notifications
│   └── googleSheets.ts    # Google Sheets integration
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schemas
└── uploads/               # Audio file uploads
```

## Testing the System

### Using Call Simulator
1. Open the dashboard
2. Go to the "Call Simulator" section
3. Upload an audio file or use the built-in test
4. Watch as the AI processes and creates a load request

### Making Real Phone Calls
1. Ensure Twilio webhooks are configured
2. Call your Twilio phone number
3. Speak your shipping request clearly
4. Check the dashboard for the new load request

## Sample Shipping Request

When testing, speak something like:
> "Hi, I need to ship electronics equipment from Dallas, Texas to Houston, Texas. The pickup is at 123 Industrial Drive in Dallas and delivery to 456 Commerce Street in Houston. The load weighs about 15,000 pounds and I need a dry van trailer. Pickup should be tomorrow between 8 AM and 10 AM, and I need same-day delivery if possible. This is for ABC Electronics, my name is John Smith."

## Optional Integrations

### Google Sheets Integration
Set up Google Sheets to automatically log all load requests:
1. Create a Google Cloud Project
2. Enable Google Sheets API
3. Create a service account and download credentials
4. Add credentials to `GOOGLE_SHEETS_CREDENTIALS` environment variable

### Email Notifications
Configure SMTP settings for email notifications:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## Deployment

### Replit Deployment
1. Connect your Replit to this repository
2. Add environment variables in Replit Secrets
3. Click "Deploy" to make it live

### Other Platforms
The application can be deployed to:
- Heroku
- Vercel
- AWS
- DigitalOcean
- Any Node.js hosting platform

## Database Configuration

By default, the app uses in-memory storage. To use PostgreSQL:

1. Install PostgreSQL
2. Update the storage configuration in `server/storage.ts`
3. Run database migrations

## Support

For issues or questions:
1. Check the console logs for error details
2. Verify all environment variables are set
3. Test Twilio webhook connectivity
4. Ensure OpenAI API key has sufficient credits

## License

This project is licensed under the MIT License.