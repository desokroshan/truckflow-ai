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
  deliveryLocation: string;
  deliveryAddress: string;
  cargoType: string;
  weight: string;
  truckType: string;
  pickupTime?: string;
  deliveryTime?: string;
  deadline?: string;
  additionalNotes?: string;
}

export async function extractLoadInfo(transcription: string): Promise<ExtractedLoadInfo> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    // Optimized for faster processing
    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Extract trucking load info from call transcripts. Return JSON:
          {
            "customerName": "string",
            "customerPhone": "string", 
            "pickupLocation": "city, state",
            "pickupAddress": "full address if given",
            "deliveryLocation": "city, state",
            "deliveryAddress": "full address if given",
            "cargoType": "what's being shipped",
            "weight": "weight with units",
            "truckType": "Box Truck/Dry Van/Flatbed/Reefer/Step Deck/Lowboy",
            "pickupTime": "pickup window if specified",
            "deliveryTime": "delivery window if specified",
            "deadline": "deadline if mentioned",
            "additionalNotes": "special requirements"
          }
          Infer missing info from context. Use (XXX) XXX-XXXX for phone format.`
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