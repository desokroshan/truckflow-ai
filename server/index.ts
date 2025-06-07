import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import * as dotenv from 'dotenv';
import { initializeTwilio } from './twilio';
import { initializeEmailClient } from './email';
import { initializeOpenAI } from './openai';
import { initializeGoogleSheetsClient } from './googleSheets';

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

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  console.log("Registering routes")
  const server = await registerRoutes(app);
  console.log("Server registered successfully")

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  console.log("vite setup done")

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
