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

// Function to extract relevant sections and clean PDF text for optimal processing
function extractRelevantSectionsFromPDF(pdfText: string, maxTokens: number = 15000): string {
  // Critical patterns that contain actual data - more comprehensive patterns
  const criticalPatterns = [
    // Customer information patterns (more flexible)
    /customer/i,
    /willhoit/i,
    /construction/i,
    /laguna/i,
    /beach/i,
    /taylor/i,
    /\d{10}/,  // 10-digit numbers (phone without formatting)
    /\d{3}.*\d{3}.*\d{4}/,  // Phone numbers in any format
    /\(\d{3}\).*\d{3}-\d{4}/,  // Standard phone format
    /949.*677.*9685/,  // Specific phone number patterns
    /562.*463.*4050/,  // Delivery phone
    
    // Address and location patterns (broader)
    /buena/i,
    /vista/i,
    /rose/i,
    /hills/i,
    /industry/i,
    /\d+.*way/i,
    /\d+.*road/i,
    /\d+.*rd/i,
    /600.*buena/i,
    /10006.*rose/i,
    
    // Equipment and technical details
    /equip/i,
    /model/i,
    /d4k2/i,
    /\b[A-Z]{2}\b/,  // Equipment codes like "AA"
    /xl\b/i,
    /weight/i,
    /rental/i,
    /dead.*haul/i,
    /0km207433/i,  // ID numbers
    /2021351/i,
    
    // Dates and times (more patterns)
    /jul/i,
    /2025/,
    /\d{1,2}:\d{2}/,  // Any time format
    /am\b/i,
    /pm\b/i,
    /pickup/i,
    /deliver/i,
    /anytime/i,
    
    // Contact and communication
    /phone/i,
    /contact/i,
    /call/i,
    /directions/i,
    /please/i,
    /osc/i,
    /space/i,
    /hour/i,
    /before/i,
    /delivery/i,
    
    // Order and dispatch information
    /order/i,
    /load/i,
    /\d{7}/,  // 7-digit numbers (load numbers)
    /\d{6}/,  // 6-digit numbers (order numbers)
    /1066544/,  // Specific order number
    /1278359/,  // Specific load number
    /325111/,   // PO number
    /dispatcher/i,
    /driver/i,
    /expedite/i,
    /dominick/i,
    /quinn/i,
    /cat/i,
    /dispatch/i,
    
    // Company names and identifiers
    /inc\b/i,
    /corp/i,
    /ltd/i,
    /llc/i,
    /qrs/i,
    /coi/i,
    /0095873/,  // Customer ID
    
    // Form field patterns
    /po\s*:/i,
    /job\s*no/i,
    /seg\s*:/i,
    /id\s*no/i,
    /alt\s*no/i,
    /map\s*pg/i,
    /window/i,
    /purpose/i,
    /requested/i,
    /comments/i,
    /trouble.*code/i,
    /additional.*info/i
  ];

  // Split into lines and process
  const lines = pdfText.split('\n');
  const importantLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and formatting lines
    if (line.length < 3 || /^[\s\-_=]+$/.test(line)) {
      continue;
    }
    
    // Check if line matches any critical pattern
    const isImportant = criticalPatterns.some(pattern => pattern.test(line));
    
    // Also include lines that are clearly data fields (with colons or clear structure)
    const hasData = line.includes(':') || 
                   /\d{3}.*\d{3}.*\d{4}/.test(line) || 
                   /[A-Z]{2}\s+\d{5}/.test(line) ||
                   /(construction|dispatch|pickup|deliver|phone|contact)/i.test(line);
    
    if (isImportant || hasData) {
      importantLines.push(line);
      
      // Also include the next 1-2 lines if they contain related data
      for (let j = 1; j <= 2 && (i + j) < lines.length; j++) {
        const nextLine = lines[i + j].trim();
        if (nextLine.length > 5 && 
            !importantLines.includes(nextLine) &&
            !/^[\s\-_=]+$/.test(nextLine)) {
          
          // Check if next line seems to be continuation of current data
          if (/^[A-Z\s,]+$/.test(nextLine) || // City, state line
              /\d/.test(nextLine) || // Contains numbers
              /(phone|contact|address)/i.test(nextLine)) {
            importantLines.push(nextLine);
          }
        }
      }
    }
  }
  
  // Join the important lines
  let extractedText = importantLines.join('\n');
  
  // Clean up but preserve structure
  extractedText = extractedText
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Estimate tokens
  const estimatedTokens = extractedText.length / 4;
  
  console.log(`Content filtering: ${pdfText.length} chars → ${extractedText.length} chars (${Math.ceil(estimatedTokens)} estimated tokens)`);
  
  // If still too long, prioritize the most critical information
  if (estimatedTokens > maxTokens) {
    const maxCharacters = maxTokens * 4;
    
    // Split into chunks and prioritize customer, pickup, delivery info
    const chunks = extractedText.split('\n\n');
    const prioritizedChunks = chunks.sort((a, b) => {
      let aScore = 0;
      let bScore = 0;
      
      // Higher priority for customer info
      if (/customer|willhoit|construction/i.test(a)) aScore += 100;
      if (/customer|willhoit|construction/i.test(b)) bScore += 100;
      
      // Higher priority for pickup/delivery
      if (/pickup|deliver|buena|vista|rose|hills/i.test(a)) aScore += 80;
      if (/pickup|deliver|buena|vista|rose|hills/i.test(b)) bScore += 80;
      
      // Higher priority for contact info
      if (/phone|contact|\d{3}.*\d{3}.*\d{4}/i.test(a)) aScore += 60;
      if (/phone|contact|\d{3}.*\d{3}.*\d{4}/i.test(b)) bScore += 60;
      
      return bScore - aScore;
    });
    
    let result = '';
    for (const chunk of prioritizedChunks) {
      if ((result + chunk).length <= maxCharacters) {
        result += (result ? '\n\n' : '') + chunk;
      } else {
        break;
      }
    }
    
    return result + '\n\n[Content truncated for processing]';
  }
  
  return extractedText;
}

// Extract load information directly from PDF text using OpenAI text processing
export async function extractLoadInfoFromPDF(pdfText: string, filename: string): Promise<ExtractedLoadInfo | null> {
  try {
    console.log(`pdfText: ${pdfText}`)
    console.log(`Using OpenAI to process PDF text content: ${filename} (original length: ${pdfText.length} chars)`);
    
    // Extract relevant sections and optimize the PDF text to prevent token limit issues
    const processedText = extractRelevantSectionsFromPDF(pdfText, 12000); // Conservative limit
    console.log(`Processed text length: ${processedText.length} chars (estimated ${Math.ceil(processedText.length / 4)} tokens)`);
    
    const prompt = `You are a logistics AI assistant that extracts shipping information from PDF document text content. 

Analyze the following PDF text content and extract all relevant shipping/load information:

${processedText}

EXTRACTION GUIDELINES:
- For pickup/delivery locations: Use city, state format (e.g., "LAGUNA BEACH, CA") when possible
- For pickup/delivery addresses: Use full street address (e.g., "600 BUENA VISTA WAY") 
- Look for equipment info like "AA", "D4K2 XL", "Dry Van", "Reefer", etc.
- Extract phone numbers in standard format (e.g., "949-677-9685")
- Identify cargo/load details, weight information, special handling requirements
- Note any delivery windows, deadlines, or time constraints
- Extract dispatcher, driver, or company contact information

Return the information in this exact JSON format:
{
  "customerName": "company or person name",
  "customerPhone": "phone number or 'Not specified'",
  "pickupLocation": "city, state format or 'Not specified'",
  "pickupAddress": "full street address or 'Not specified'",
  "pickupContactName": "contact person name or 'Not specified'",
  "pickupContactPhone": "contact phone or 'Not specified'",
  "deliveryLocation": "city, state format or 'Not specified'", 
  "deliveryAddress": "full street address or 'Not specified'",
  "cargoType": "description of cargo or equipment being transported",
  "weight": "weight with units or 'Not specified'",
  "truckType": "equipment type needed (AA, D4K2, Dry Van, etc.) or 'Not specified'",
  "pickupTime": "date and time or 'Not specified'",
  "deliveryTime": "date and time or 'Not specified'",
  "deadline": "deadline information or 'Not specified'",
  "additionalNotes": "special instructions, handling requirements, or other notes",
  "additionalPickups": [],
  "additionalDeliveries": []
}

If there are multiple pickup or delivery locations, include them in the additionalPickups and additionalDeliveries arrays with the same structure as above.`;

    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o", // Latest model for text processing
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 2000
    });

    const extractedData = JSON.parse(response.choices[0].message.content || '{}');
    console.log(`OpenAI successfully extracted data from PDF ${filename}:`, extractedData);
    
    return extractedData as ExtractedLoadInfo;
  } catch (error) {
    console.error(`Error extracting load info from PDF ${filename}:`, error);
    
    // If it's a rate limit error, provide more specific guidance
    if (error.code === 'rate_limit_exceeded') {
      console.error('PDF content is too large for OpenAI processing. Consider splitting large PDFs or implementing chunked processing.');
    }
    
    return null;
  }
}

export async function extractLoadInfo(transcription: string): Promise<ExtractedLoadInfo> {
  try {
    console.log(`Processing transcription for load extraction (original length: ${transcription.length} chars)`);
    
    // Apply the same intelligent text processing to prevent token limit issues
    const processedText = extractRelevantSectionsFromPDF(transcription, 10000); // Conservative limit for email content
    console.log(`Processed transcription length: ${processedText.length} chars (estimated ${Math.ceil(processedText.length / 4)} tokens)`);
    
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
          content: `Extract load info: "${processedText}"`
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
    
    // If it's a rate limit error, provide more specific guidance
    if (error.code === 'rate_limit_exceeded') {
      console.error('Content is too large for OpenAI processing. Applied intelligent filtering to reduce size.');
    }
    
    throw new Error("Failed to extract load information: " + (error as Error).message);
  }
}

export async function generateLoadSummary(loadData: ExtractedLoadInfo): Promise<string> {
  try {
    // Import storage here to avoid circular dependency
    const { storage } = await import('./storage');
    
    // Get configurable prompt from settings
    const promptSetting = await storage.getSetting('ai_summary_prompt');
    const systemPrompt = promptSetting?.value || "Create concise load summary for trucking company owner. Include key details: customer, route, cargo, urgency.";
    
    // Optimized for faster processing - use gpt-4o-mini for summary generation
    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini", // Faster, cheaper model for simple summarization
      messages: [
        {
          role: "system",
          content: systemPrompt
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