import OpenAI from "openai";
import fs from "fs";

let openaiClient: OpenAI;

export function initializeOpenAI(apiKey: string) {
  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

// Export the client as a getter
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized. Call initializeOpenAI() first.');
  }
  return openaiClient;
}

export async function transcribeAudio(audioFilePath: string): Promise<{ text: string, duration: number }> {
  try {
    const audioReadStream = fs.createReadStream(audioFilePath);

    // Optimized transcription with faster settings
    const transcription = await getOpenAIClient().audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
      response_format: "json", // Faster than verbose_json
      temperature: 0, // More deterministic, faster processing
    });

    return {
      text: transcription.text,
      duration: transcription.duration || 0,
    };
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to transcribe audio: " + (error as Error).message);
  }
}

interface ExtractedLoadInfo {
  customerName: string;
  customerPhone: string;
  pickupLocation: string;
  pickupAddress: string;
  pickupContactName?: string;
  pickupContactPhone?: string;
  deliveryLocation: string;
  deliveryAddress: string;
  cargoType: string;
  weight: string;
  truckType: string;
  pickupTime?: string;
  deliveryTime?: string;
  deadline?: string;
  additionalNotes?: string;
  additionalPickups?: Array<{
    location: string;
    address: string;
    contactName?: string;
    contactPhone?: string;
    scheduledTime?: string;
    instructions?: string;
  }>;
  additionalDeliveries?: Array<{
    location: string;
    address: string;
    contactName?: string;
    contactPhone?: string;
    scheduledTime?: string;
    instructions?: string;
  }>;
}

export async function extractLoadInfo(transcription: string): Promise<ExtractedLoadInfo> {
  try {
    // Import storage here to avoid circular dependency
    const { storage } = await import('./storage');
    
    // Get configurable prompt from settings
    const promptSetting = await storage.getSetting('ai_extraction_prompt');
    const systemPrompt = promptSetting?.value || `Extract load information from this text and return valid JSON with these fields:
customerName, customerPhone, pickupLocation, pickupAddress, pickupContactName, 
pickupContactPhone, deliveryLocation, deliveryAddress, cargoType, weight, truckType, 
pickupTime, deliveryTime, deadline, additionalNotes.

NEW: Also extract additional pickup/delivery locations as arrays:
- additionalPickups: Array of {location, address, contactName, contactPhone, scheduledTime, instructions}  
- additionalDeliveries: Array of {location, address, contactName, contactPhone, scheduledTime, instructions}

Extract actual phone numbers if mentioned. If no phone number is provided, use caller ID if available.
Be precise and concise. Use "Not specified" for missing data. Empty arrays if no additional stops.`;
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    // Optimized for faster processing
    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Extract load info: "${transcription}"`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0, // More deterministic, faster processing
      max_tokens: 500, // Limit response size for faster processing
    });

    const extractedData = JSON.parse(response.choices[0].message.content || "{}");

    // Validate required fields
    // const requiredFields = ['customerName', 'pickupLocation', 'deliveryLocation', 'cargoType', 'weight', 'truckType'];
    // for (const field of requiredFields) {
    //   if (!extractedData[field]) {
    //     throw new Error(`Missing required field: ${field}`);
    //   }
    // }

    return extractedData as ExtractedLoadInfo;
  } catch (error) {
    console.error("Error extracting load info:", error);
    throw new Error("Failed to extract load information: " + (error as Error).message);
  }
}

export async function generateLoadSummary(loadData: ExtractedLoadInfo): Promise<string> {
  try {
    // Optimized for faster processing - use gpt-4o-mini for summary generation
    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini", // Faster, cheaper model for simple summarization
      messages: [
        {
          role: "system",
          content: "Create concise load summary for trucking company owner. Include key details: customer, route, cargo, urgency."
        },
        {
          role: "user",
          content: `Summarize: ${JSON.stringify(loadData)}`
        }
      ],
      temperature: 0,
      max_tokens: 200, // Shorter summary for faster processing
    });

    return response.choices[0].message.content || "Load summary could not be generated.";
  } catch (error) {
    console.error("Error generating load summary:", error);
    throw new Error("Failed to generate load summary: " + (error as Error).message);
  }
}