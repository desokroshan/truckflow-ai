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
  // Enhanced keywords and patterns for better logistics data detection
  const relevantKeywords = [
    'customer', 'pickup', 'delivery', 'shipper', 'consignee', 'origin', 'destination',
    'cargo', 'freight', 'weight', 'equipment', 'truck', 'trailer', 'contact', 'phone',
    'address', 'location', 'date', 'time', 'schedule', 'load', 'shipment', 'order',
    'bill of lading', 'bol', 'po number', 'purchase order', 'dimensions', 'hazmat',
    'special instructions', 'handling', 'temperature', 'refrigerated', 'dry van',
    'dispatch', 'driver', 'deliver', 'construction', 'willhoit', 'laguna', 'beach',
    'city of industry', 'rose hills', 'buena vista', 'directions', 'call', 'osc'
  ];

  // Split into lines and score each line based on relevance
  const lines = pdfText.split('\n');
  const scoredLines = lines.map((line, index) => {
    const lowerLine = line.toLowerCase();
    const trimmedLine = line.trim();
    let score = 0;
    
    // Score based on keyword presence
    relevantKeywords.forEach(keyword => {
      if (lowerLine.includes(keyword)) {
        score += keyword.length * 2; // Higher weight for keywords
      }
    });
    
    // Boost score for critical patterns
    if (/\(\d{3}\)\s*\d{3}-\d{4}/.test(line)) score += 50; // Phone numbers
    if (/\d{3}\d{7}/.test(line.replace(/\D/g, ''))) score += 40; // 10-digit numbers
    if (/\d+\s+[A-Za-z\s]+(St|Ave|Rd|Dr|Blvd|Way|Ln|Ct)/i.test(line)) score += 40; // Addresses
    if (/\b[A-Z]{2}\s+\d{5}/.test(line)) score += 30; // State and ZIP
    if (/\d+\s*(lbs?|pounds?|tons?|kg)/i.test(line)) score += 30; // Weight info
    if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(line)) score += 25; // Dates
    if (/\d{1,2}:\d{2}\s*(AM|PM)/i.test(line)) score += 25; // Times
    
    // Boost for company/customer names
    if (/^[A-Z\s]+[,]?\s+[A-Z]{2}$/i.test(trimmedLine)) score += 35; // City, State format
    if (/construction|inc|corp|ltd|llc/i.test(line)) score += 30; // Company indicators
    
    // Boost for form field patterns
    if (/:\s*[A-Za-z0-9]/.test(line)) score += 20; // Field: value patterns
    if (/^[A-Za-z\s]+:\s*/.test(trimmedLine)) score += 15; // Label: patterns
    
    // Keep lines with substantial content even without keywords
    if (trimmedLine.length > 30 && /[A-Za-z]/.test(trimmedLine)) {
      score += Math.min(trimmedLine.length / 5, 20);
    }
    
    // Penalty for lines that are mostly formatting
    if (/^[\s\-_=]+$/.test(line)) score -= 10;
    if (trimmedLine.length < 5) score -= 5;
    
    return { line: trimmedLine, score, originalIndex: index };
  });

  // Sort by score and keep the most relevant lines
  const relevantLines = scoredLines
    .filter(item => item.score > 5 || item.line.length > 40) // More inclusive filtering
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(200, scoredLines.length)); // Keep more lines for complex documents

  // Sort back by original order to maintain document structure
  relevantLines.sort((a, b) => a.originalIndex - b.originalIndex);

  // Join and clean the extracted content, but preserve structure better
  let extractedText = relevantLines.map(item => item.line).join('\n');
  
  // Less aggressive cleaning to preserve data
  extractedText = extractedText
    .replace(/\n{3,}/g, '\n\n')  // Limit consecutive newlines
    .replace(/\s{5,}/g, '    ')  // Limit excessive spaces but keep some formatting
    .trim();

  // Estimate tokens (roughly 4 characters per token)
  const estimatedTokens = extractedText.length / 4;
  
  console.log(`Content filtering: ${pdfText.length} chars → ${extractedText.length} chars (${Math.ceil(estimatedTokens)} estimated tokens)`);
  
  if (estimatedTokens <= maxTokens) {
    return extractedText;
  }

  // If still too long, truncate smartly but preserve more content
  const maxCharacters = maxTokens * 4;
  const truncatedText = extractedText.substring(0, maxCharacters);
  
  // Try to end at a complete word or line
  const lastNewlineIndex = truncatedText.lastIndexOf('\n');
  const lastSpaceIndex = truncatedText.lastIndexOf(' ');
  
  if (lastNewlineIndex > maxCharacters * 0.85) {
    return truncatedText.substring(0, lastNewlineIndex) + '\n\n[Content truncated for processing]';
  } else if (lastSpaceIndex > maxCharacters * 0.9) {
    return truncatedText.substring(0, lastSpaceIndex) + '\n\n[Content truncated for processing]';
  }
  
  return truncatedText + '\n\n[Content truncated for processing]';
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