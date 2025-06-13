import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLoadRequestSchema, insertCallLogSchema } from "@shared/schema";
import { transcribeAudio, extractLoadInfo, generateLoadSummary } from "./openai";
import { sendOwnerNotification, sendOwnerSMS } from "./email";
import express from "express";
import { Express } from "express";
import { saveLoadToGoogleSheets, updateLoadStatusInGoogleSheets, initializeGoogleSheet } from "./googleSheets";
import { createTwiMLResponse, createSMSTwiMLResponse, handleIncomingCall, processRecordingWebhook, processSMSWebhook } from "./twilio";
import multer from "multer";
import path from "path";
import fs from "fs";

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

export async function registerRoutes(app: express.Express): Promise<Server> {
  
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

  // Get all load requests
  app.get("/api/load-requests", async (req: express.Request, res: express.Response) => {
    try {
      const loadRequests = await storage.getAllLoadRequests();
      res.json(loadRequests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch load requests" });
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

  // Get dashboard metrics
  app.get("/api/metrics", async (req: express.Request, res: express.Response) => {
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
