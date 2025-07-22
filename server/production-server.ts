import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import * as dotenv from 'dotenv';
import { initializeTwilio } from './twilio';
import { initializeEmailClient } from './email';
import { initializeOpenAI } from './openai';
import { initializeGoogleSheetsClient } from './googleSheets';
import path from 'path';
import fs from 'fs';

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
  console.log('Email monitoring disabled - dependencies not available', error);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
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

      console.log(`[${new Date().toLocaleTimeString()}] [express] ${logLine}`);
    }
  });

  next();
});

(async () => {
  console.log("Registering routes");
  const server = await registerRoutes(app);
  console.log("Server registered successfully");

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Serve static files in production
  const distPath = path.resolve(process.cwd(), "dist", "public");
  if (fs.existsSync(distPath)) {
    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    
    // Fall through to index.html for client-side routing
    app.use("*", (req, res) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/twilio")) {
        res.status(404).json({ error: "Endpoint not found" });
      } else {
        res.sendFile(path.resolve(distPath, "index.html"));
      }
    });
  } else {
    console.log(`Build directory not found at: ${distPath}`);
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/twilio")) {
        res.status(404).json({ error: "Endpoint not found" });
      } else {
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head><title>TruckFlow</title></head>
            <body>
              <div id="root">
                <h1>TruckFlow Production Server</h1>
                <p>Build directory not found. Please run 'npm run build' first.</p>
              </div>
            </body>
          </html>
        `);
      }
    });
  }

  console.log("Production server setup complete");

  // Start server
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    console.log(`[${new Date().toLocaleTimeString()}] [express] TruckFlow production server running on port ${port}`);
  });
})();