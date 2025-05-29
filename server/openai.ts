import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function transcribeAudio(audioFilePath: string): Promise<{ text: string, duration: number }> {
  try {
    const audioReadStream = fs.createReadStream(audioFilePath);

    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
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
}

export async function extractLoadInfo(transcription: string): Promise<ExtractedLoadInfo> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting trucking load information from phone call transcriptions. 
          Extract the following information and respond with JSON in this exact format:
          {
            "customerName": "string",
            "customerPhone": "string", 
            "pickupLocation": "string (city, state)",
            "pickupAddress": "string (full address)",
            "deliveryLocation": "string (city, state)",
            "deliveryAddress": "string (full address)",
            "cargoType": "string (description of what's being shipped)",
            "weight": "string (weight with units)",
            "truckType": "string (type of truck/trailer needed)",
            "pickupTime": "string (optional - pickup time window)",
            "deliveryTime": "string (optional - delivery time window)",
            "deadline": "string (optional - deadline for delivery)"
          }
          
          If any information is not clearly stated, make reasonable inferences based on the cargo type and context.
          For truck type, common options are: Box Truck, Dry Van, Flatbed, Reefer, Step Deck, Lowboy.
          Extract phone numbers in format (XXX) XXX-XXXX.
          For locations, provide city and state even if full address isn't given.`
        },
        {
          role: "user",
          content: `Extract load information from this call transcription: "${transcription}"`
        }
      ],
      response_format: { type: "json_object" },
    });

    const extractedData = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validate required fields
    const requiredFields = ['customerName', 'pickupLocation', 'deliveryLocation', 'cargoType', 'weight', 'truckType'];
    for (const field of requiredFields) {
      if (!extractedData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return extractedData as ExtractedLoadInfo;
  } catch (error) {
    console.error("Error extracting load info:", error);
    throw new Error("Failed to extract load information: " + (error as Error).message);
  }
}

export async function generateLoadSummary(loadData: ExtractedLoadInfo): Promise<string> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Create a concise, professional summary of this load request for email notification to the trucking company owner. Include all key details in a clear, actionable format."
        },
        {
          role: "user",
          content: `Create a summary for this load request: ${JSON.stringify(loadData)}`
        }
      ],
    });

    return response.choices[0].message.content || "Load summary could not be generated.";
  } catch (error) {
    console.error("Error generating load summary:", error);
    throw new Error("Failed to generate load summary: " + (error as Error).message);
  }
}
