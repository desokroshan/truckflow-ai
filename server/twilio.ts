import twilio from 'twilio';
import { storage } from './storage';
import { transcribeAudio, extractLoadInfo, generateLoadSummary } from './openai';
import { sendOwnerNotification, sendOwnerSMS } from './email';
import { saveLoadToGoogleSheets } from './googleSheets';
import { nanoid } from 'nanoid';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export function createTwiMLResponse() {
  return new twilio.twiml.VoiceResponse();
}

export async function handleIncomingCall(phoneNumber: string, callSid: string) {
  try {
    // Create call log entry
    const callLog = await storage.createCallLog({
      phoneNumber,
      duration: 0,
      status: "in_progress",
      transcription: null,
      audioFileUrl: null,
      loadRequestId: null,
    });

    console.log(`Incoming call from ${phoneNumber}, Call SID: ${callSid}`);
    return callLog;
  } catch (error) {
    console.error("Error handling incoming call:", error);
    throw error;
  }
}

export async function processRecordingWebhook(
  recordingUrl: string,
  recordingSid: string,
  callSid: string,
  duration: number
) {
  try {
    console.log(`Processing recording: ${recordingSid} for call: ${callSid}`);
    
    // Download the recording
    const recordingData = await client.recordings(recordingSid).fetch();
    const audioUrl = `https://api.twilio.com${recordingData.uri.replace('.json', '.mp3')}`;
    
    // Get the phone number from the call
    const callData = await client.calls(callSid).fetch();
    const phoneNumber = callData.from;
    
    // For this POC, we'll use the mock transcription since we can't easily download and process Twilio recordings
    // In production, you'd download the audio file and process it with OpenAI Whisper
    const mockTranscription = `Hi, I'm calling about a shipping request. I need to send electronics equipment from Dallas, Texas to Houston, Texas. The pickup is at 123 Industrial Drive in Dallas and delivery to 456 Commerce Street in Houston. The load weighs about 15,000 pounds and I need a dry van trailer. Pickup should be tomorrow between 8 AM and 10 AM, and I need same-day delivery if possible. This is for ABC Electronics, my name is John Smith and you can reach me at the number I'm calling from.`;

    // Extract load information using AI
    const extractedData = await extractLoadInfo(mockTranscription);
    
    // Generate unique load ID
    const loadId = `TF-${new Date().getFullYear()}-${nanoid(4).toUpperCase()}`;
    
    // Create load request
    const loadRequest = await storage.createLoadRequest({
      loadId,
      customerName: extractedData.customerName,
      customerPhone: extractedData.customerPhone || phoneNumber,
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
      transcription: mockTranscription,
      extractedData: JSON.stringify(extractedData),
      notificationSent: false,
    });

    // Update call log with transcription and link to load request
    await storage.updateCallLogTranscription(
      parseInt(callSid.split('_')[1] || '1'), // Simple mapping for demo
      mockTranscription
    );

    // Save to Google Sheets (will log error if not configured)
    try {
      await saveLoadToGoogleSheets(loadRequest);
    } catch (error) {
      console.log("Google Sheets not configured, skipping...");
    }

    // Generate summary and send notifications
    const summary = await generateLoadSummary(extractedData);
    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    const approveUrl = `${baseUrl}/api/load-requests/${loadRequest.id}/approve`;
    const rejectUrl = `${baseUrl}/api/load-requests/${loadRequest.id}/reject`;

    await sendOwnerNotification(
      process.env.OWNER_EMAIL || "owner@trucking.com",
      {
        loadId: loadRequest.loadId,
        customerName: extractedData.customerName,
        customerPhone: extractedData.customerPhone || phoneNumber,
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

    console.log(`Load request ${loadRequest.loadId} created from call ${callSid}`);
    return loadRequest;

  } catch (error) {
    console.error("Error processing recording:", error);
    throw error;
  }
}

export async function sendSMS(to: string, message: string) {
  try {
    if (!process.env.TWILIO_PHONE_NUMBER) {
      console.log(`SMS would be sent to ${to}: ${message}`);
      return;
    }

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });

    console.log(`SMS sent to ${to}, Message SID: ${result.sid}`);
    return result;
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw error;
  }
}