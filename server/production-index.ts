import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import * as dotenv from 'dotenv';
import { initializeTwilio } from './twilio';
import { initializeEmailClient } from './email';
import { initializeOpenAI } from './openai';
import { initializeGoogleSheetsClient } from './googleSheets';
import path from 'path';

// Load environment variables
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const sheetId = process.env.GOOGLE_SHEETS_ID;
const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

console.log(`Account SID from index: ${accountSid}`);
console.log(`Auth Token from index: ${authToken}`);

// Initialize clients - only initialize what we have credentials for
let twilioClient;
if (accountSid && authToken) {
  twilioClient = initializeTwilio(accountSid, authToken);
  console.log('Twilio client initialized');
} else {
  console.log('Twilio credentials not found - some features will be disabled');
}

let openaiClient;
if (openaiApiKey) {
  openaiClient = initializeOpenAI(openaiApiKey);
  console.log('OpenAI client initialized');
} else {
  console.log('OpenAI API key not found - AI features will be disabled');
}

let googleSheetsClient;
if (sheetId && clientEmail && privateKey) {
  googleSheetsClient = initializeGoogleSheetsClient(sheetId, clientEmail, privateKey.replace(/\\n/g, '\n'));
  console.log('Google Sheets client initialized');
} else {
  console.log('Google Sheets credentials not found - spreadsheet integration will be disabled');
}

const emailClient = initializeEmailClient();
console.log('Email client initialized');

// Initialize email monitoring
try {
  import('./email').then(email => {
    email.initializeEmailMonitoring();
  });
} catch (error) {
  console.log('Email monitoring disabled - dependencies not available');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  console.log('Serving static files from dist/public');
  app.use(express.static(path.join(process.cwd(), 'dist', 'public')));
  
  // Serve frontend for all non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/twilio')) {
      next();
    } else {
      res.sendFile(path.join(process.cwd(), 'dist', 'public', 'index.html'));
    }
  });
}

console.log('Registering routes');
const server = await registerRoutes(app);

console.log('Server registered successfully');

if (process.env.NODE_ENV === 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}