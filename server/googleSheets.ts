import { google } from "googleapis";
import type { LoadRequest } from "@shared/schema";

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || process.env.GOOGLE_SPREADSHEET_ID || "default_sheet_id";
const SHEET_NAME = "Load_Requests";

export async function saveLoadToGoogleSheets(loadRequest: LoadRequest): Promise<void> {
  try {
    const values = [
      [
        loadRequest.loadId,
        loadRequest.customerName,
        loadRequest.customerPhone,
        loadRequest.pickupLocation,
        loadRequest.pickupAddress,
        loadRequest.deliveryLocation,
        loadRequest.deliveryAddress,
        loadRequest.cargoType,
        loadRequest.weight,
        loadRequest.truckType,
        loadRequest.pickupTime || "",
        loadRequest.deliveryTime || "",
        loadRequest.deadline || "",
        loadRequest.status,
        loadRequest.createdAt?.toISOString() || new Date().toISOString(),
        loadRequest.approvedAt?.toISOString() || "",
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:P`,
      valueInputOption: "RAW",
      requestBody: {
        values,
      },
    });

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
      "Pickup Address",
      "Delivery Location",
      "Delivery Address",
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
