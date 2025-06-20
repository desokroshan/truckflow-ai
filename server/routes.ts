import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLoadRequestSchema, insertCallLogSchema } from "@shared/schema";
import { transcribeAudio, extractLoadInfo, generateLoadSummary } from "./openai";
import { sendOwnerNotification, sendOwnerSMS } from "./email";
import express from "express";
import { Express } from "express";
import { saveLoadToGoogleSheets, initializeGoogleSheet, updateLoadStatusInGoogleSheets } from "./googleSheets";
import { processIncomingEmail } from "./email";
import { createTwiMLResponse, createSMSTwiMLResponse, handleIncomingCall, processRecordingWebhook, processSMSWebhook } from "./twilio";
import { assignmentEngine } from "./assignment";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { loginSchema, signupSchema, insertUserSchema } from "@shared/schema";

const upload = multer({ 
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'), false);
    }
  },
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  }
});

// JWT secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Authentication middleware
const authenticateToken = (req: any, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Role-based authorization middleware
const authorizeRole = (roles: string[]) => {
  return (req: any, res: express.Response, next: express.NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

export async function registerRoutes(app: express.Express): Promise<Server> {

  // Authentication routes
  app.post("/api/auth/register", async (req: express.Request, res: express.Response) => {
    try {
      const userData = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Remove password from response
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.post("/api/auth/login", async (req: express.Request, res: express.Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const { password: _, ...userResponse } = user;
      res.json({ token, user: userResponse });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/signup", async (req: express.Request, res: express.Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generate token for immediate login
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Remove password from response
      const { password, ...userResponse } = user;
      res.json({ token, user: userResponse });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res: express.Response) => {
    try {
      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  });

  // Initialize Google Sheets

  // Test endpoint for recording processing
  app.post('/api/test/recording', async (req, res) => {
    try {
      console.log(`Test recording received: ${JSON.stringify(req.body, null, 2)}`);
      const { RecordingUrl, RecordingSid, CallSid, RecordingDuration } = req.body;

      if (!RecordingUrl || !RecordingSid || !CallSid || !RecordingDuration) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Convert RecordingDuration to number
      const duration = parseInt(RecordingDuration, 10);
      if (isNaN(duration)) {
        return res.status(400).json({ error: 'Invalid RecordingDuration' });
      }

      // Simulate the recording webhook processing
      const result = await processRecordingWebhook(
        RecordingUrl,
        RecordingSid,
        CallSid,
        duration
      );

      console.log(`Test recording processed successfully: ${JSON.stringify(result, null, 2)}`);

      res.json({ success: true, result });
    } catch (error) {
      console.error('Error processing test recording:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error occurred' });
    }
  });

  // Test Google Sheets integration
  app.post("/api/test-google-sheets", async (req: express.Request, res: express.Response) => {
    try {
      // Create a test load request to verify column mapping
      const testLoadRequest = await storage.createLoadRequest({
        loadId: `TEST-${Date.now()}`,
        customerName: "John Smith",
        customerPhone: "+1-555-123-4567",
        pickupLocation: "Los Angeles, CA",
        pickupAddress: "123 Main St, Los Angeles, CA 90210",
        deliveryLocation: "Phoenix, AZ", 
        deliveryAddress: "456 Oak Ave, Phoenix, AZ 85001",
        cargoType: "Electronics",
        weight: "15000 lbs",
        truckType: "53ft Dry Van",
        pickupTime: "2025-06-10 09:00",
        deliveryTime: "2025-06-11 15:00",
        deadline: "2025-06-11 17:00",
        status: "pending",
        transcription: "Test transcription for column mapping verification",
        extractedData: JSON.stringify({
          customerName: "John Smith",
          customerPhone: "+1-555-123-4567",
          pickupLocation: "Los Angeles, CA",
          deliveryLocation: "Phoenix, AZ"
        }),
        notificationSent: false,
      });

      // Save to Google Sheets to test column mapping
      await saveLoadToGoogleSheets(testLoadRequest);

      res.json({ 
        success: true, 
        message: "Test load request created and saved to Google Sheets",
        loadId: testLoadRequest.loadId
      });
    } catch (error) {
      console.error('Error testing Google Sheets:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error occurred' });
    }
  });

  // Initialize Google Sheets
  try {
    await initializeGoogleSheet();
  } catch (error) {
    console.error("Failed to initialize Google Sheets:");
  }

  // Get all load requests (dispatcher only)
  app.get("/api/load-requests", authenticateToken, authorizeRole(['dispatcher']), async (req: express.Request, res: express.Response) => {
    try {
      const loadRequests = await storage.getAllLoadRequests();
      res.json(loadRequests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch load requests" });
    }
  });

  // Get shipper's load requests
  app.get("/api/shipper/load-requests", authenticateToken, authorizeRole(['shipper']), async (req: any, res: express.Response) => {
    try {
      const loadRequests = await storage.getLoadRequestsByShipper(req.user.id);
      res.json(loadRequests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch load requests" });
    }
  });

  // Create load request (shipper only)
  app.post("/api/shipper/load-requests", authenticateToken, authorizeRole(['shipper']), async (req: any, res: express.Response) => {
    try {
      const loadRequestData = insertLoadRequestSchema.parse(req.body);
      
      // Generate unique load ID
      const loadId = `EXT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
      
      const loadRequest = await storage.createLoadRequest({
        ...loadRequestData,
        loadId,
        shipperId: req.user.id, // Associate with the logged-in shipper
        status: "pending",
        notificationSent: false,
      });

      // Save to Google Sheets
      try {
        await saveLoadToGoogleSheets(loadRequest);
      } catch (error) {
        console.log("Google Sheets not configured, skipping...");
      }

      res.json(loadRequest);
    } catch (error) {
      console.error("Error creating load request:", error);
      res.status(500).json({ error: "Failed to create load request" });
    }
  });

  // Upload document (shipper only)
  app.post("/api/shipper/upload-document", authenticateToken, authorizeRole(['shipper']), upload.single('document'), async (req: any, res: express.Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No document uploaded" });
      }

      const { loadRequestId, documentType } = req.body;

      if (!loadRequestId || !documentType) {
        return res.status(400).json({ error: "loadRequestId and documentType are required" });
      }

      // Verify the load request belongs to the shipper
      const loadRequest = await storage.getLoadRequest(parseInt(loadRequestId));
      if (!loadRequest || loadRequest.shipperId !== req.user.id) {
        return res.status(403).json({ error: "Access denied to this load request" });
      }

      const document = await storage.createDocument({
        loadRequestId: parseInt(loadRequestId),
        uploadedBy: req.user.id,
        documentType,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
      });

      res.json({ message: "Document uploaded successfully", document });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  // Get documents for a load request
  app.get("/api/load-requests/:id/documents", authenticateToken, async (req: any, res: express.Response) => {
    try {
      const loadRequestId = parseInt(req.params.id);
      const loadRequest = await storage.getLoadRequest(loadRequestId);
      
      if (!loadRequest) {
        return res.status(404).json({ error: "Load request not found" });
      }

      // Check permissions
      if (req.user.role === 'shipper' && loadRequest.shipperId !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const documents = await storage.getDocumentsByLoadRequest(loadRequestId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Get single load request
  app.get("/api/load-requests/:id", async (req: express.Request, res: express.Response) => {
    try {
      const id = parseInt(req.params.id);
      const loadRequest = await storage.getLoadRequest(id);
      if (!loadRequest) {
        return res.status(404).json({ error: "Load request not found" });
      }
      res.json(loadRequest);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch load request" });
    }
  });

  // Create load request from call simulation
  app.post("/api/simulate-call", async (req: express.Request, res: express.Response) => {
    try {
      const { phoneNumber, customerName } = req.body;

      // Create call log
      const callLog = await storage.createCallLog({
        phoneNumber: phoneNumber || "+1 (555) 123-4567",
        duration: 0,
        status: "simulated",
        transcription: null,
        audioFileUrl: null,
        loadRequestId: null,
      });

      // Real audio processing will be handled by the Twilio recording webhook
      console.log(`Call log created. Waiting for recording webhook to process actual audio...`);

      res.json({ callId: callLog.id, status: "Call simulation started" });
    } catch (error) {
      console.error("Error starting call simulation:", error);
      res.status(500).json({ error: "Failed to start call simulation" });
    }
  });

  // Upload and process audio file
  app.post("/api/upload-audio", upload.single('audio'), async (req: express.Request, res: express.Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file uploaded" });
      }

      const audioFilePath = req.file.path;

      // Transcribe audio using OpenAI Whisper
      const { text: transcription, duration } = await transcribeAudio(audioFilePath);

      // Extract load information using GPT-4
      const extractedData = await extractLoadInfo(transcription);

      // Generate load ID for Expedite Transport
      const loadId = `EXT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

      // Create load request
      const loadRequest = await storage.createLoadRequest({
        loadId,
        customerName: extractedData.customerName,
        customerPhone: extractedData.customerPhone,
        pickupLocation: extractedData.pickupLocation,
        pickupAddress: extractedData.pickupAddress,
        deliveryLocation: extractedData.deliveryLocation,
        deliveryAddress: extractedData.deliveryAddress,
        cargoType: extractedData.cargoType,
        weight: extractedData.weight,
        truckType: extractedData.truckType,
        pickupTime: extractedData.pickupTime,
        deliveryTime: extractedData.deliveryTime,
        deadline: extractedData.deadline,
        status: "pending",
        transcription,
        extractedData: JSON.stringify(extractedData),
        notificationSent: false,
      });

      // Create call log
      await storage.createCallLog({
        phoneNumber: extractedData.customerPhone,
        duration: Math.round(duration),
        status: "processed",
        transcription,
        audioFileUrl: audioFilePath,
        loadRequestId: loadRequest.id,
      });

      // Save to Google Sheets
      await saveLoadToGoogleSheets(loadRequest);

      // Generate summary and send notification
      const summary = await generateLoadSummary(extractedData);
      const baseUrl = process.env.BASE_URL || "http://localhost:5000";
      const approveUrl = `${baseUrl}/api/load-requests/${loadRequest.id}/approve`;
      const rejectUrl = `${baseUrl}/api/load-requests/${loadRequest.id}/reject`;

      await sendOwnerNotification(
        process.env.OWNER_EMAIL || "owner@trucking.com",
        {
          loadId: loadRequest.loadId,
          customerName: extractedData.customerName,
          customerPhone: extractedData.customerPhone,
          route: `${extractedData.pickupLocation} → ${extractedData.deliveryLocation}`,
          cargoType: extractedData.cargoType,
          weight: extractedData.weight,
          truckType: extractedData.truckType,
          deadline: extractedData.deadline,
          summary,
        },
        approveUrl,
        rejectUrl
      );

      // Send SMS notification
      await sendOwnerSMS(
        process.env.OWNER_PHONE || "+1 (555) 999-8888",
        loadRequest.loadId,
        extractedData.customerName,
        `${extractedData.pickupLocation} → ${extractedData.deliveryLocation}`
      );

      // Clean up uploaded file
      fs.unlink(audioFilePath, (err) => {
        if (err) console.error("Error deleting uploaded file:", err);
      });

      res.json({
        loadRequest,
        transcription,
        extractedData,
        message: "Audio processed successfully and notifications sent"
      });

    } catch (error) {
      console.error("Error processing audio:", error);
      res.status(500).json({ error: "Failed to process audio file: " + (error as Error).message });
    }
  });

  // Approve load request
  app.post("/api/load-requests/:id/approve", async (req: express.Request, res: express.Response) => {
    try {
      const id = parseInt(req.params.id);
      const loadRequest = await storage.updateLoadRequestStatus(id, "approved", new Date());

      if (!loadRequest) {
        return res.status(404).json({ error: "Load request not found" });
      }

      // Update in Google Sheets
      await updateLoadStatusInGoogleSheets(loadRequest.loadId, "approved");

      res.json({ message: "Load request approved successfully", loadRequest });
    } catch (error) {
      console.error("Error approving load request:", error);
      res.status(500).json({ error: "Failed to approve load request" });
    }
  });

  // Reject load request
  app.post("/api/load-requests/:id/reject", async (req: express.Request, res: express.Response) => {
    try {
      const id = parseInt(req.params.id);
      const loadRequest = await storage.updateLoadRequestStatus(id, "rejected", new Date());

      if (!loadRequest) {
        return res.status(404).json({ error: "Load request not found" });
      }

      // Update in Google Sheets
      await updateLoadStatusInGoogleSheets(loadRequest.loadId, "rejected");

      res.json({ message: "Load request rejected", loadRequest });
    } catch (error) {
      console.error("Error rejecting load request:", error);
      res.status(500).json({ error: "Failed to reject load request" });
    }
  });

  // Get all call logs
  app.get("/api/call-logs", async (req: express.Request, res: express.Response) => {
    try {
      const callLogs = await storage.getAllCallLogs();
      res.json(callLogs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch call logs" });
    }
  });

  // Twilio webhook for incoming calls
  app.post("/api/twilio/voice", async (req: express.Request, res: express.Response) => {
    try {
      console.log("Incoming twilio call received", req.body);
      const { From: phoneNumber, CallSid: callSid } = req.body;

      // Handle incoming call
      await handleIncomingCall(phoneNumber, callSid);

      // Create TwiML response to handle the call
      const twiml = createTwiMLResponse();

      twiml.say({
        voice: "Polly.Joanna-Neural",
        language: "en-US"
      }, "Thank you for calling Expedite Transport. I'm your AI assistant and I'll help you with your shipping request. Please describe your shipping needs including pickup location, delivery location, cargo type, and any special requirements. I'll be recording this call to process your request.");

      // Record the conversation
      twiml.record({
        transcribe: false,
        maxLength: 300, // 5 minutes max
        action: `/api/twilio/recording`,
        method: "POST"
      });

      res.type('text/xml');
      res.send(twiml.toString());
    } catch (error) {
      console.error("Error handling Twilio voice webhook:", error);
      res.status(500).send("Error processing call");
    }
  });

  // Twilio webhook for SMS messages
  app.post("/api/twilio/sms", async (req: express.Request, res: express.Response) => {
    try {
      console.log("Incoming SMS received", req.body);
      const { 
        From: phoneNumber,
        Body: messageBody,
        MessageSid: messageSid
      } = req.body;

      console.log("SMS from:", phoneNumber);
      console.log("Message body:", messageBody);
      console.log("Message SID:", messageSid);

      // Process the SMS asynchronously
      processSMSWebhook(phoneNumber, messageBody, messageSid).catch(error => {
        console.error("Error processing SMS:", error);
      });

      // Respond with TwiML to send confirmation SMS
      const twiml = createSMSTwiMLResponse();
      twiml.message("Thank you for your load request! 🚛 We're processing your shipping details and will send them to our dispatch team. You'll receive a confirmation within 15 minutes. - Expedite Transport");

      res.type('text/xml');
      res.send(twiml.toString());
    } catch (error) {
      console.error("Error handling SMS webhook:", error);
      res.status(500).send("Error processing SMS");
    }
  });

  // Twilio webhook for recording completion
  app.post("/api/twilio/recording", async (req: express.Request, res: express.Response) => {
    try {
      console.log("Incoming twilio recording received", req.body);
      const { 
        RecordingUrl: recordingUrl,
        RecordingSid: recordingSid, 
        CallSid: callSid,
        RecordingDuration: duration 
      } = req.body;

      console.log("Recording SID:", recordingSid);
      console.log("Recording URL:", recordingUrl);
      console.log("Call SID:", callSid);
      console.log("Recording duration:", duration); 

      // Process the recording asynchronously
      processRecordingWebhook(
        recordingUrl,
        recordingSid,
        callSid,
        parseInt(duration) || 0
      ).catch(error => {
        console.error("Error processing recording:", error);
      });

      // Respond to caller
      const twiml = createTwiMLResponse();
      twiml.say({
        voice: "Polly.Joanna-Neural",
        language: "en-US"
      }, "Thank you for choosing Expedite Transport. I'm processing your information and will send the details to our dispatch team. You should receive a confirmation within 15 minutes for your expedited shipment. Have a great day!");

      twiml.hangup();

      res.type('text/xml');
      res.send(twiml.toString());
    } catch (error) {
      console.error("Error handling recording webhook:", error);
      res.status(500).send("Error processing recording");
    }
  });

  // Drivers routes
  app.get("/api/drivers", async (req, res) => {
    try {
      const drivers = await storage.getAllDrivers();
      res.json(drivers);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });

  app.get("/api/drivers/available", async (req, res) => {
    try {
      const drivers = await storage.getAvailableDrivers();
      res.json(drivers);
    } catch (error) {
      console.error("Error fetching available drivers:", error);
      res.status(500).json({ error: "Failed to fetch available drivers" });
    }
  });

  app.post("/api/drivers", async (req, res) => {
    try {
      const driver = await storage.createDriver(req.body);
      res.json(driver);
    } catch (error) {
      console.error("Error creating driver:", error);
      res.status(500).json({ error: "Failed to create driver" });
    }
  });

  app.put("/api/drivers/:id/availability", async (req, res) => {
    try {
      const { id } = req.params;
      const { isAvailable } = req.body;
      const driver = await storage.updateDriverAvailability(parseInt(id), isAvailable);
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      res.json(driver);
    } catch (error) {
      console.error("Error updating driver availability:", error);
      res.status(500).json({ error: "Failed to update driver availability" });
    }
  });

  // Trucks routes
  app.get("/api/trucks", async (req, res) => {
    try {
      const trucks = await storage.getAllTrucks();
      res.json(trucks);
    } catch (error) {
      console.error("Error fetching trucks:", error);
      res.status(500).json({ error: "Failed to fetch trucks" });
    }
  });

  app.get("/api/trucks/available", async (req, res) => {
    try {
      const trucks = await storage.getAvailableTrucks();
      res.json(trucks);
    } catch (error) {
      console.error("Error fetching available trucks:", error);
      res.status(500).json({ error: "Failed to fetch available trucks" });
    }
  });

  app.post("/api/trucks", async (req, res) => {
    try {
      const truck = await storage.createTruck(req.body);
      res.json(truck);
    } catch (error) {
      console.error("Error creating truck:", error);
      res.status(500).json({ error: "Failed to create truck" });
    }
  });

  app.put("/api/trucks/:id/availability", async (req, res) => {
    try {
      const { id } = req.params;
      const { isAvailable } = req.body;
      const truck = await storage.updateTruckAvailability(parseInt(id), isAvailable);
      if (!truck) {
        return res.status(404).json({ error: "Truck not found" });
      }
      res.json(truck);
    } catch (error) {
      console.error("Error updating truck availability:", error);
      res.status(500).json({ error: "Failed to update truck availability" });
    }
  });

  // Assignments routes
  app.get("/api/assignments", async (req, res) => {
    try {
      const assignments = await storage.getAllAssignments();
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  app.post("/api/assignments", async (req, res) => {
    try {
      const assignment = await storage.createAssignment(req.body);

      // Update driver and truck availability
      if (assignment.driverId) {
        await storage.updateDriverAvailability(assignment.driverId, false);
      }
      if (assignment.truckId) {
        await storage.updateTruckAvailability(assignment.truckId, false);
      }

      res.json(assignment);
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({ error: "Failed to create assignment" });
    }
  });

  app.get("/api/load-requests/:id/recommendations", async (req, res) => {
    try {
      const { id } = req.params;
      const loadRequest = await storage.getLoadRequest(parseInt(id));
      if (!loadRequest) {
        return res.status(404).json({ error: "Load request not found" });
      }

      const availableDrivers = await storage.getAvailableDrivers();
      const availableTrucks = await storage.getAvailableTrucks();

      // Use assignment engine for recommendations
      const recommendation = await assignmentEngine.getRecommendations(loadRequest);

      res.json({
        recommendedDriver: recommendation.recommendedDriver,
        recommendedTruck: recommendation.recommendedTruck,
        availableDrivers,
        availableTrucks,
        confidence: recommendation.confidence,
        reason: recommendation.reason
      });
    } catch (error) {
      console.error("Error getting recommendations:", error);
      res.status(500).json({ error: "Failed to get recommendations" });
    }
  });

  // Auto-assign route
  app.post("/api/load-requests/:id/auto-assign", async (req, res) => {
    try {
      const { id } = req.params;
      const loadRequestId = parseInt(id);

      const assignment = await assignmentEngine.autoAssign(loadRequestId);

      if (!assignment) {
        return res.status(400).json({ error: "Unable to auto-assign: no available drivers or trucks" });
      }

      res.json({
        message: "Auto-assignment successful",
        assignment
      });
    } catch (error) {
      console.error("Error auto-assigning:", error);
      res.status(500).json({ error: "Failed to auto-assign" });
    }
  });

  // Complete assignment route
  app.post("/api/assignments/:id/complete", async (req, res) => {
    try {
      const { id } = req.params;
      const assignmentId = parseInt(id);

      const assignment = await assignmentEngine.completeAssignment(assignmentId);

      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      res.json({
        message: "Assignment completed successfully",
        assignment
      });
    } catch (error) {
      console.error("Error completing assignment:", error);
      res.status(500).json({ error: "Failed to complete assignment" });
    }
  });

  // Test email ingestion endpoint
  app.post("/api/test-email-ingestion", async (req, res) => {
    try {
      const { emailContent, fromAddress } = req.body;

      if (!emailContent || !fromAddress) {
        return res.status(400).json({ error: "emailContent and fromAddress are required" });
      }

      // Process the email content
      await processIncomingEmail(emailContent, fromAddress);

      res.json({ 
        success: true, 
        message: "Email processed successfully and load request created" 
      });
    } catch (error) {
      console.error("Error testing email ingestion:", error);
      res.status(500).json({ error: "Failed to process email: " + (error as Error).message });
    }
  });

  // Get dashboard metrics
  app.get("/api/metrics", async (req, res) => {
    try {
      const loadRequests = await storage.getAllLoadRequests();
      const callLogs = await storage.getAllCallLogs();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaysCalls = callLogs.filter(call => 
        call.createdAt && new Date(call.createdAt) >= today
      ).length;

      const todaysLoads = loadRequests.filter(load => 
        load.createdAt && new Date(load.createdAt) >= today
      ).length;

      const pendingApproval = loadRequests.filter(load => load.status === "pending").length;

      const approvedLoads = loadRequests.filter(load => load.status === "approved");
      const totalRevenue = approvedLoads.length * 2500; // Mock revenue calculation

      res.json({
        callsToday: todaysCalls,
        loadsProcessed: todaysLoads,
        pendingApproval,
        revenue: totalRevenue,
        totalLoads: loadRequests.length,
        totalCalls: callLogs.length,
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}