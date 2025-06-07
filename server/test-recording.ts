import { initializeTwilio, testProcessRecording } from './twilio';
import * as dotenv from 'dotenv';

async function runRecordingTest() {
  try {
    console.log('Starting recording test...');
    dotenv.config();
    // Initialize Twilio client
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in environment variables');
    }

    initializeTwilio(accountSid, authToken);
    
    // Run the test
    const result = await testProcessRecording();
    console.log('Test completed successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run the test when script is executed
runRecordingTest();
