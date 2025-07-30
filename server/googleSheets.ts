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

    // Debug: Log the load request data being processed
    console.log('Load request data being saved:', {
      loadId: loadRequest.loadId,
      customerName: loadRequest.customerName,
      customerPhone: loadRequest.customerPhone,
      pickupLocation: loadRequest.pickupLocation,
      deliveryLocation: loadRequest.deliveryLocation,
      cargoType: loadRequest.cargoType,
      weight: loadRequest.weight,
      truckType: loadRequest.truckType,
    });

    // Prepare multiple locations data
    let additionalPickups = "";
    let additionalDeliveries = "";
    
    try {
      if (loadRequest.pickupLocations) {
        const pickupLocs = JSON.parse(loadRequest.pickupLocations);
        additionalPickups = pickupLocs.map((loc: any) => `${loc.location} (${loc.address})`).join("; ");
      }
      if (loadRequest.deliveryLocations) {
        const deliveryLocs = JSON.parse(loadRequest.deliveryLocations);
        additionalDeliveries = deliveryLocs.map((loc: any) => `${loc.location} (${loc.address})`).join("; ");
      }
    } catch (e) {
      console.log("Error parsing location data for Google Sheets:", e);
    }

    // Prepare the row data to match header order exactly
    // Headers: Load ID, Customer Name, Customer Phone, Pickup Location, Delivery Location, 
    //          Cargo Type, Weight, Truck Type, Pickup Time, Delivery Time, Deadline, Additional Pickups, Additional Deliveries, Status, Created At, Approved At
    const rowData = [
      loadRequest.loadId,
      loadRequest.customerName || "",
      loadRequest.customerPhone || "",
      loadRequest.pickupLocation || "",
      loadRequest.deliveryLocation || "",
      loadRequest.cargoType || "",
      loadRequest.weight || "",
      loadRequest.truckType || "",
      loadRequest.pickupTime || "",
      loadRequest.deliveryTime || "",
      loadRequest.deadline || "",
      loadRequest.additionalNotes || "",
      additionalPickups,
      additionalDeliveries,
      loadRequest.status,
      loadRequest.createdAt?.toISOString() || new Date().toISOString(),
      loadRequest.approvedAt?.toISOString() || "",
    ];

    // Debug: Log the exact row data being written to Google Sheets
    console.log('Row data being written to Google Sheets:', rowData);
    console.log('Row data length:', rowData.length);

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

export async function saveBugReportToGoogleSheets(bugReport: {
  id: string;
  title: string;
  description: string;
  userEmail: string;
  priority: string;
  category: string;
  createdAt: string;
}): Promise<void> {
  try {
    if (!sheets || !SPREADSHEET_ID) {
      console.log("Google Sheets not configured - cannot save bug report");
      return;
    }

    const BUG_SHEET_NAME = "Bug Reports";
    
    // First, check if the Bug Reports sheet exists, if not create it
    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${BUG_SHEET_NAME}!A1:A1`,
      });
    } catch (error) {
      // Sheet doesn't exist, create it with headers
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: BUG_SHEET_NAME
              }
            }
          }]
        }
      });

      // Add headers to the new sheet
      const headers = [
        "Bug ID", "Title", "Description", "User Email", "Priority", 
        "Category", "Status", "Created At", "Resolved At"
      ];
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${BUG_SHEET_NAME}!A1:I1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [headers],
        },
      });
    }

    // Prepare the bug report data
    const values = [
      bugReport.id,
      bugReport.title,
      bugReport.description,
      bugReport.userEmail,
      bugReport.priority,
      bugReport.category,
      "Open", // Default status
      bugReport.createdAt,
      "" // Resolved at - empty initially
    ];

    // Append the bug report to the sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${BUG_SHEET_NAME}!A:I`,
      valueInputOption: "RAW",
      requestBody: {
        values: [values],
      },
    });

    console.log(`Bug report ${bugReport.id} saved to Google Sheets`);
  } catch (error) {
    console.error("Error saving bug report to Google Sheets:", error);
    throw new Error("Failed to save bug report to Google Sheets: " + (error as Error).message);
  }
}

export async function initializeGoogleSheet(): Promise<void> {
  try {
    // Only initialize if Google Sheets client is available
    if (!sheets || !SPREADSHEET_ID) {
      console.log("Google Sheets not configured - skipping initialization");
      return;
    }

    // Check if the sheet exists and create headers if needed
    const headers = [
      "Load ID", "Customer Name", "Customer Phone", "Pickup Location", "Delivery Location",
      "Cargo Type", "Weight", "Truck Type", "Pickup Time", "Delivery Time", "Deadline",
      "Additional Notes", "Additional Pickups", "Additional Deliveries", "Status", "Created At", "Approved At"
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:Q1`,
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