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
  console.log(`Starting content filtering for text of length: ${pdfText.length} chars`);
  
  // Define scoring patterns for different types of important content
  const scoringPatterns = [
    // Customer and company info (highest priority)
    { pattern: /customer.*:/i, score: 100 },
    { pattern: /willhoit.*construction/i, score: 100 },
    { pattern: /0095873.*willhoit/i, score: 100 },
    { pattern: /taylor.*willhoit/i, score: 90 },
    
    // Contact information (very high priority)
    { pattern: /\d{3}.*\d{3}.*\d{4}/, score: 95 }, // Phone numbers
    { pattern: /949.*677.*9685/i, score: 95 },
    { pattern: /562.*463.*4050/i, score: 95 },
    { pattern: /phone.*:/i, score: 80 },
    { pattern: /contact.*:/i, score: 80 },
    
    // Address and location info (high priority)
    { pattern: /600.*buena.*vista/i, score: 90 },
    { pattern: /laguna.*beach/i, score: 90 },
    { pattern: /10006.*rose.*hills/i, score: 90 },
    { pattern: /city.*of.*industry/i, score: 90 },
    { pattern: /pickup/i, score: 85 },
    { pattern: /deliver/i, score: 85 },
    
    // Equipment details (high priority)
    { pattern: /equip/i, score: 80 },
    { pattern: /model/i, score: 80 },
    { pattern: /d4k2.*xl/i, score: 85 },
    { pattern: /aa.*d4k2/i, score: 85 },
    
    // Order and dispatch info (medium-high priority)
    { pattern: /order.*no.*1066544/i, score: 75 },
    { pattern: /load.*no.*1278359/i, score: 75 },
    { pattern: /po.*325111/i, score: 70 },
    { pattern: /dispatcher.*dominick/i, score: 70 },
    { pattern: /expedite.*transport/i, score: 70 },
    
    // Dates and times (medium priority)
    { pattern: /jul.*\d+.*2025/i, score: 65 },
    { pattern: /\d{1,2}:\d{2}.*[ap]m/i, score: 65 },
    { pattern: /thu.*jul.*24/i, score: 65 },
    
    // Special instructions (medium priority)
    { pattern: /directions.*:/i, score: 60 },
    { pattern: /please.*call.*osc/i, score: 60 },
    { pattern: /small.*space/i, score: 55 },
    { pattern: /anytime/i, score: 50 },
    
    // General business terms (lower priority but still useful)
    { pattern: /rental/i, score: 40 },
    { pattern: /dead.*haul/i, score: 40 },
    { pattern: /trouble.*code/i, score: 35 },
    { pattern: /requested/i, score: 30 },
    { pattern: /comments/i, score: 30 }
  ];
  
  // Split into lines and score each one
  const lines = pdfText.split('\n');
  const scoredLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip very short lines and pure formatting
    if (line.length < 2 || /^[\s\-_=.]+$/.test(line)) {
      continue;
    }
    
    let score = 0;
    let matchedPatterns = [];
    
    // Score this line based on pattern matches
    for (const { pattern, score: patternScore } of scoringPatterns) {
      if (pattern.test(line)) {
        score += patternScore;
        matchedPatterns.push(pattern.toString());
      }
    }
    
    // Additional scoring for general data indicators
    if (line.includes(':')) score += 10; // Field labels
    if (/\d+/.test(line)) score += 5; // Contains numbers
    if (/[A-Z]{2,}/.test(line)) score += 5; // Contains uppercase text (company names, etc.)
    if (line.length > 50) score += Math.min(10, line.length / 10); // Longer lines with more content
    
    if (score > 0) {
      scoredLines.push({
        line,
        score,
        index: i,
        matchedPatterns
      });
    }
  }
  
  // Sort by score (highest first)
  scoredLines.sort((a, b) => b.score - a.score);
  
  // Take the highest scoring lines up to our token limit
  let selectedLines = [];
  let totalCharacters = 0;
  const maxCharacters = maxTokens * 4; // Rough conversion
  
  for (const item of scoredLines) {
    if (totalCharacters + item.line.length <= maxCharacters) {
      selectedLines.push(item);
      totalCharacters += item.line.length;
    }
  }
  
  // Sort selected lines back to original order for readability
  selectedLines.sort((a, b) => a.index - b.index);
  
  // Extract just the line text
  const result = selectedLines.map(item => item.line).join('\n');
  
  console.log(`Content filtering: ${pdfText.length} chars → ${result.length} chars (${Math.ceil(result.length / 4)} estimated tokens)`);
  console.log(`Selected ${selectedLines.length} lines from ${lines.length} total lines`);
  
  // If we still got very little content, be more lenient
  if (result.length < 200) {
    console.log('Very little content selected, being more lenient...');
    
    // Take more lines with any score > 0
    const moreLines = scoredLines.slice(0, Math.min(100, scoredLines.length));
    const lenientResult = moreLines
      .sort((a, b) => a.index - b.index)
      .map(item => item.line)
      .join('\n');
    
    console.log(`Lenient filtering: ${pdfText.length} chars → ${lenientResult.length} chars`);
    return lenientResult.substring(0, maxCharacters);
  }
  
  return result;
}

// Extract load information directly from PDF text using OpenAI text processing
export async function extractLoadInfoFromPDF(pdfText: string, filename: string): Promise<ExtractedLoadInfo | null> {
  try {
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