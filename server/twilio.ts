import twilio from 'twilio';
import { storage } from './storage';
import { transcribeAudio, extractLoadInfo, generateLoadSummary } from './openai';
import { sendOwnerNotification, sendOwnerSMS } from './email';
import { saveLoadToGoogleSheets } from './googleSheets';
import { nanoid } from 'nanoid';

let client: ReturnType<typeof twilio>;

export function initializeTwilio(accountSid: string, authToken: string) {
  client = twilio(accountSid, authToken);
  return client;
}

// Export the client as a getter
export function getTwilioClient(): ReturnType<typeof twilio> {
  if (!client) {
    throw new Error('Twilio client not initialized. Call initializeTwilio() first.');
  }
  return client;
}

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
    console.log(`Processing recording from twilio: ${recordingSid} for call: ${callSid}`);
    
    // Download the recording
    const recordingData = await getTwilioClient().recordings(recordingSid).fetch();
    console.log(`Recording data is: ${JSON.stringify(recordingData, null, 2)}`);
    const audioUrl = `https://api.twilio.com${recordingData.uri.replace('.json', '.mp3')}`;
    console.log(`Recording URL: ${audioUrl}`);
    
    // Get the phone number from the call
    const callData = await getTwilioClient().calls(callSid).fetch();
    const phoneNumber = callData.from;
    console.log(`Phone number: ${phoneNumber}`);
    
    // Download and transcribe the actual audio recording
    // Construct the correct Twilio recording URL
    const twilioBaseUrl = 'https://api.twilio.com/2010-04-01/Accounts';
    const recordingUrl = `${twilioBaseUrl}/${process.env.TWILIO_ACCOUNT_SID}/Recordings/${recordingSid}.mp3`;
    console.log(`Downloading audio from: ${recordingUrl}`);
    
    const response = await fetch(recordingUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'Accept': 'audio/mpeg'
      }
    });
    
    if (!response.ok) {
      console.log(`Failed to download recording: ${response.statusText}`);
      throw new Error(`Failed to download recording: ${response.statusText}`);
    }
    
    const audioBuffer = await response.arrayBuffer();
    const audioPath = `uploads/recording_${recordingSid}.mp3`;
    console.log(`Audio path: ${audioPath}`);
    
    // Save audio file temporarily
    const fs = require('fs');
    fs.writeFileSync(audioPath, Buffer.from(audioBuffer));
    console.log(`Audio file saved to: ${audioPath}`);
    
    // Transcribe the actual audio using OpenAI Whisper
    console.log(`Transcribing audio file: ${audioPath}`);
    let actualTranscription: string;
    
    try {
      const transcriptionResult = await transcribeAudio(audioPath);
      actualTranscription = transcriptionResult.text;
      console.log(`Transcription successful: ${actualTranscription}`);
    } catch (transcriptionError) {
      console.error(`Transcription failed:`, transcriptionError);
      throw new Error(`Failed to transcribe audio: ${transcriptionError instanceof Error ? transcriptionError.message : 'Unknown error'}`);
    }
    
    // Clean up temporary file
    fs.unlinkSync(audioPath);

    // Extract load information using AI from the real transcription
    console.log(`Extracting load info from transcription...`);
    const extractedData = await extractLoadInfo(actualTranscription);
    console.log(`Extracted data:`, JSON.stringify(extractedData, null, 2));
    
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
      transcription: actualTranscription,
      extractedData: JSON.stringify(extractedData),
      notificationSent: false,
    });

    // Update call log with transcription and link to load request
    await storage.updateCallLogTranscription(
      parseInt(callSid.split('_')[1] || '1'), // Simple mapping for demo
      actualTranscription
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