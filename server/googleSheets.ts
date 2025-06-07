import { google } from "googleapis";
import type { LoadRequest } from "@shared/schema";

let sheets: ReturnType<typeof google.sheets>;
let SPREADSHEET_ID: string | undefined;
const SHEET_NAME = "Load_Requests";

export function initializeGoogleSheetsClient(sheetId: string, client_email: string, private_key: string): void {
  // Initialize Google Sheets client with environment variables
  console.log(`Initializing Google Sheets client with sheet ID: ${sheetId}`);
  
  // Format the private key properly
  const formattedPrivateKey = private_key.replace(/\\n/g, '\n');
  
  // Create JWT client
  const auth = new google.auth.JWT(
    client_email,
    undefined,
    formattedPrivateKey,
    ['https://www.googleapis.com/auth/spreadsheets'],
    undefined
  );
  
  sheets = google.sheets({ version: "v4", auth });
  SPREADSHEET_ID = sheetId;
  console.log(`Google Sheets client initialized with sheet ID: ${SPREADSHEET_ID}`);
  
  if (!SPREADSHEET_ID) {
    throw new Error('GOOGLE_SHEETS_ID environment variable is required');
  }
}

// Initialize client when module is loaded
//initializeGoogleSheetsClient(process.env.GOOGLE_SHEETS_ID!, process.env.GOOGLE_SHEETS_CLIENT_EMAIL!, process.env.GOOGLE_SHEETS_PRIVATE_KEY!.replace(/\\n/g, '\n'));

export async function saveLoadToGoogleSheets (loadRequest: LoadRequest): Promise<void> {
  try {
    console.log('Attempting to save to Google Sheets');
    console.log('Spreadsheet ID:', SPREADSHEET_ID);
    console.log('Sheet Name:', SHEET_NAME);
    
    // First check if we can access the spreadsheet
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID
    });
    console.log('Successfully accessed spreadsheet:', spreadsheet.data.properties?.title);

    // Prepare the row data
    const rowData = [
      loadRequest.loadId,
      loadRequest.pickupLocation,
      loadRequest.deliveryLocation,
      loadRequest.customerPhone,
      loadRequest.cargoType,
      loadRequest.weight,
      loadRequest.truckType,
      loadRequest.pickupTime || "",
      loadRequest.deliveryTime || "",
      loadRequest.deadline || "",
      loadRequest.status,
      loadRequest.createdAt?.toISOString() || new Date().toISOString(),
      loadRequest.approvedAt?.toISOString() || "",
    ];

    // Try to append values
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:Q`,
      valueInputOption: "RAW",
      requestBody: {
        values: [rowData],
      },
    });

    console.log('Successfully appended row to Google Sheets');
    console.log(`Load ${loadRequest.loadId} saved to Google Sheets`);
  } catch (error) {
    console.error("Error saving to Google Sheets:", error);
    throw new Error("Failed to save to Google Sheets: " + (error as Error).message);
  }
}

export async function updateLoadStatusInGoogleSheets(loadId: string, status: string): Promise<void> {
  try {
    // In a real implementation, you would search for the row with the matching loadId
    // and update the status column. For now, we'll just log the update.
    console.log(`Google Sheets: Load ${loadId} status updated to ${status}`);
  } catch (error) {
    console.error("Error updating Google Sheets:", error);
    throw new Error("Failed to update Google Sheets: " + (error as Error).message);
  }
}

export async function initializeGoogleSheet(): Promise<void> {
  try {
    // Check if the sheet exists and create headers if needed
    const headers = [
      "Load ID",
      "Customer Name", 
      "Customer Phone",
      "Pickup Location",
      "Delivery Location",
      "Cargo Type",
      "Weight",
      "Truck Type",
      "Pickup Time",
      "Delivery Time",
      "Deadline",
      "Status",
      "Created At",
      "Approved At"
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:P1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [headers],
      },
    });

    console.log("Google Sheets initialized with headers");
  } catch (error) {
    console.error("Error initializing Google Sheets:", error);
  }
}
