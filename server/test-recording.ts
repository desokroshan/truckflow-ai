import { initializeTwilio, testProcessRecording } from './twilio';
import * as dotenv from 'dotenv';
import { initializeGoogleSheetsClient, saveLoadToGoogleSheets } from './googleSheets';
import { initializeEmailClient } from './email';

async function runRecordingTest() {
  try {
    console.log('Starting recording test...');
    
    // Load environment variables
    dotenv.config();
    
    // Initialize Twilio client
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const sheetId = process.env.GOOGLE_SHEETS_ID;
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;

    if (!sheetId || !clientEmail || !privateKey) {
      throw new Error('GOOGLE_SHEETS_ID, GOOGLE_SHEETS_CLIENT_EMAIL, and GOOGLE_SHEETS_PRIVATE_KEY must be set in environment variables');
    }
    
    if (!accountSid || !authToken) {
      throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in environment variables');
    }

    initializeTwilio(accountSid, authToken);
    
    // Initialize Google Sheets client
    initializeGoogleSheetsClient(sheetId!, clientEmail!, privateKey!.replace(/\\n/g, '\n'));
    initializeEmailClient();
    // Run the test
    const result = await testProcessRecording();
    console.log('Test completed successfully!');
    console.log('Result:', JSON.stringify("Hello", null, 2));
    
  } catch (error) {
    console.error('Test failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run the test when script is executed
runRecordingTest();
