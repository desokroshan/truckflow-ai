import { LoadRequest } from '../shared/schema';

export interface AddressValidationResult {
  isValid: boolean;
  formattedAddress?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  issues: string[];
  suggestions?: string[];
}

export interface AddressValidationSummary {
  pickupAddress: AddressValidationResult;
  deliveryAddress: AddressValidationResult;
  overallValid: boolean;
  recommendedActions: string[];
}

// Free USPS API integration (primary method)
export async function validateAddressWithUSPS(address: string): Promise<AddressValidationResult> {
  const uspsUserId = process.env.USPS_USER_ID;
  
  if (!uspsUserId) {
    console.log('USPS API not configured, trying fallback methods');
    return validateAddressWithRadar(address);
  }

  try {
    // Parse address components
    const addressParts = parseAddressString(address);
    
    const xmlRequest = `
      <AddressValidateRequest USERID="${uspsUserId}">
        <Address ID="1">
          <Address1></Address1>
          <Address2>${addressParts.street}</Address2>
          <City>${addressParts.city}</City>
          <State>${addressParts.state}</State>
          <Zip5>${addressParts.zip || ''}</Zip5>
          <Zip4></Zip4>
        </Address>
      </AddressValidateRequest>
    `;

    const response = await fetch('https://secure.shippingapis.com/ShippingAPI.dll?API=Verify&XML=' + encodeURIComponent(xmlRequest));
    
    if (!response.ok) {
      throw new Error(`USPS API error: ${response.status}`);
    }

    const xmlText = await response.text();
    return parseUSPSResponse(xmlText, address);
  } catch (error) {
    console.error('USPS validation failed:', error);
    return validateAddressWithRadar(address);
  }
}

// Radar API integration (free tier: 100K requests/month)
export async function validateAddressWithRadar(address: string): Promise<AddressValidationResult> {
  const radarApiKey = process.env.RADAR_API_KEY;
  
  if (!radarApiKey) {
    console.log('Radar API not configured, using basic validation');
    return validateAddressBasic(address);
  }

  try {
    const response = await fetch('https://api.radar.io/v1/geocode/forward', {
      method: 'GET',
      headers: {
        'Authorization': radarApiKey,
        'Content-Type': 'application/json',
      },
      params: new URLSearchParams({ query: address })
    });

    if (!response.ok) {
      throw new Error(`Radar API error: ${response.status}`);
    }

    const data = await response.json();
    return parseRadarResponse(data, address);
  } catch (error) {
    console.error('Radar validation failed:', error);
    return validateAddressBasic(address);
  }
}

// Basic validation fallback (no API required)
export function validateAddressBasic(address: string): AddressValidationResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Basic checks
  if (!address || address.trim().length < 10) {
    issues.push('Address appears too short or incomplete');
  }
  
  // Check for essential components
  const hasNumber = /\d/.test(address);
  const hasStreet = /\b(st|street|ave|avenue|blvd|boulevard|rd|road|ln|lane|dr|drive|ct|court|pl|place|way)\b/i.test(address);
  const hasCity = address.split(',').length >= 2;
  const hasState = /\b[A-Z]{2}\b/.test(address);
  const hasZip = /\b\d{5}(-\d{4})?\b/.test(address);
  
  if (!hasNumber) {
    issues.push('Address may be missing street number');
  }
  
  if (!hasStreet) {
    issues.push('Address may be missing street type (St, Ave, Rd, etc.)');
  }
  
  if (!hasCity) {
    issues.push('Address may be missing city');
  }
  
  if (!hasState) {
    issues.push('Address may be missing state abbreviation');
  }
  
  if (!hasZip) {
    suggestions.push('Consider adding ZIP code for better accuracy');
  }
  
  const confidence: 'HIGH' | 'MEDIUM' | 'LOW' = issues.length === 0 ? 'HIGH' : issues.length <= 2 ? 'MEDIUM' : 'LOW';
  
  return {
    isValid: issues.length <= 2,
    formattedAddress: address.trim(),
    confidence,
    issues,
    suggestions
  };
}

// Google Maps fallback (if user has API key)
export async function validateAddressWithGoogle(address: string): Promise<AddressValidationResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.log('Google Maps API not configured, using free alternatives');
    return validateAddressWithUSPS(address);
  }

  try {
    const url = 'https://addressvalidation.googleapis.com/v1:validateAddress';
    
    const requestBody = {
      address: {
        addressLines: [address]
      },
      enableUspsStandardization: true,
      sessionToken: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    };

    const response = await fetch(`${url}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.status}`);
    }

    const data = await response.json();
    
    return parseGoogleValidationResponse(data, address);
  } catch (error) {
    console.error('Address validation error:', error);
    return {
      isValid: false,
      confidence: 'LOW',
      issues: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

function parseGoogleValidationResponse(data: any, originalAddress: string): AddressValidationResult {
  const result = data.result || {};
  const verdict = result.verdict || {};
  const address = result.address || {};
  
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check for address completeness
  if (verdict.addressComplete === false) {
    issues.push('Address appears incomplete');
  }
  
  // Check for geocoding quality
  if (verdict.geocodeGranularity) {
    const granularity = verdict.geocodeGranularity;
    if (granularity === 'PREMISE_PROXIMITY' || granularity === 'SUB_PREMISE') {
      // Good precision
    } else if (granularity === 'ROUTE' || granularity === 'INTERSECTION') {
      issues.push('Address may need more specific details (building number, suite, etc.)');
    } else {
      issues.push('Address location is not precise enough for delivery');
    }
  }
  
  // Check for commercial vs residential (important for trucking)
  const uspsData = result.uspsData || {};
  if (uspsData.dpvFootnote && uspsData.dpvFootnote.includes('N1')) {
    suggestions.push('This appears to be a residential address - confirm commercial delivery is possible');
  }
  
  // Extract coordinates
  const geocode = result.geocode || {};
  const location = geocode.location || {};
  
  // Determine confidence level
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  if (verdict.addressComplete && verdict.hasReplacedComponents === false && issues.length === 0) {
    confidence = 'HIGH';
  } else if (issues.length > 2) {
    confidence = 'LOW';
  }
  
  // Format standardized address
  const formattedComponents = address.formattedAddress || originalAddress;
  
  return {
    isValid: verdict.addressComplete !== false && issues.length < 3,
    formattedAddress: formattedComponents,
    coordinates: location.latitude && location.longitude ? {
      lat: location.latitude,
      lng: location.longitude
    } : undefined,
    confidence,
    issues,
    suggestions
  };
}

// Helper function to parse address string into components
function parseAddressString(address: string): { street: string; city: string; state: string; zip?: string } {
  const parts = address.split(',').map(p => p.trim());
  
  if (parts.length >= 3) {
    const street = parts[0];
    const city = parts[1];
    const stateZip = parts[2];
    const stateZipMatch = stateZip.match(/^([A-Z]{2})\s*(\d{5}(-\d{4})?)?$/);
    
    return {
      street,
      city,
      state: stateZipMatch ? stateZipMatch[1] : stateZip.slice(0, 2).toUpperCase(),
      zip: stateZipMatch ? stateZipMatch[2] : undefined
    };
  }
  
  // Fallback parsing
  const zipMatch = address.match(/\b(\d{5}(-\d{4})?)\b/);
  const stateMatch = address.match(/\b([A-Z]{2})\b/);
  
  return {
    street: address.split(',')[0] || address,
    city: parts[1] || 'Unknown',
    state: stateMatch ? stateMatch[1] : 'XX',
    zip: zipMatch ? zipMatch[1] : undefined
  };
}

// Parse USPS XML response
function parseUSPSResponse(xmlText: string, originalAddress: string): AddressValidationResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  try {
    // Simple XML parsing for address validation
    if (xmlText.includes('<Error>')) {
      issues.push('USPS could not validate this address');
      return {
        isValid: false,
        formattedAddress: originalAddress,
        confidence: 'LOW',
        issues,
        suggestions: ['Please verify address details with customer']
      };
    }
    
    // Extract validated address components
    const addressMatch = xmlText.match(/<Address2>(.*?)<\/Address2>/);
    const cityMatch = xmlText.match(/<City>(.*?)<\/City>/);
    const stateMatch = xmlText.match(/<State>(.*?)<\/State>/);
    const zipMatch = xmlText.match(/<Zip5>(.*?)<\/Zip5>/);
    const zip4Match = xmlText.match(/<Zip4>(.*?)<\/Zip4>/);
    
    const validatedAddress = [
      addressMatch?.[1],
      cityMatch?.[1],
      stateMatch?.[1],
      zipMatch?.[1] + (zip4Match?.[1] ? `-${zip4Match[1]}` : '')
    ].filter(Boolean).join(', ');
    
    return {
      isValid: true,
      formattedAddress: validatedAddress || originalAddress,
      confidence: 'HIGH',
      issues: [],
      suggestions: []
    };
  } catch (error) {
    return {
      isValid: false,
      formattedAddress: originalAddress,
      confidence: 'LOW',
      issues: ['Failed to parse USPS response'],
      suggestions: []
    };
  }
}

// Parse Radar API response
function parseRadarResponse(data: any, originalAddress: string): AddressValidationResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  try {
    if (!data.addresses || data.addresses.length === 0) {
      issues.push('Address not found in Radar database');
      return {
        isValid: false,
        formattedAddress: originalAddress,
        confidence: 'LOW',
        issues,
        suggestions: ['Please verify address accuracy']
      };
    }
    
    const firstResult = data.addresses[0];
    const confidence = firstResult.confidence >= 0.8 ? 'HIGH' : firstResult.confidence >= 0.5 ? 'MEDIUM' : 'LOW';
    
    if (firstResult.confidence < 0.5) {
      issues.push('Address confidence is low');
    }
    
    return {
      isValid: firstResult.confidence >= 0.5,
      formattedAddress: firstResult.formattedAddress || originalAddress,
      coordinates: firstResult.geometry ? {
        lat: firstResult.geometry.coordinates[1],
        lng: firstResult.geometry.coordinates[0]
      } : undefined,
      confidence,
      issues,
      suggestions: confidence === 'LOW' ? ['Consider using more specific address details'] : []
    };
  } catch (error) {
    return {
      isValid: false,
      formattedAddress: originalAddress,
      confidence: 'LOW',
      issues: ['Failed to parse Radar response'],
      suggestions: []
    };
  }
}

// Main validation function - tries free services first
export async function validateAddress(address: string): Promise<AddressValidationResult> {
  // Try USPS first (free)
  const uspsResult = await validateAddressWithUSPS(address);
  if (uspsResult.isValid && uspsResult.confidence === 'HIGH') {
    return uspsResult;
  }
  
  // If USPS fails or gives low confidence, try basic validation
  const basicResult = validateAddressBasic(address);
  
  // Return the better result
  return uspsResult.confidence === 'LOW' && basicResult.confidence !== 'LOW' ? basicResult : uspsResult;
}

// Validate both pickup and delivery addresses for a load request
export async function validateLoadAddresses(loadRequest: LoadRequest): Promise<AddressValidationSummary> {
  const pickupAddress = loadRequest.pickupAddress || loadRequest.pickupLocation || '';
  const deliveryAddress = loadRequest.deliveryAddress || loadRequest.deliveryLocation || '';
  
  const [pickupValidation, deliveryValidation] = await Promise.all([
    validateAddress(pickupAddress),
    validateAddress(deliveryAddress)
  ]);
  
  const overallValid = pickupValidation.isValid && deliveryValidation.isValid;
  const recommendedActions: string[] = [];
  
  // Generate recommendations based on validation results
  if (!pickupValidation.isValid) {
    recommendedActions.push('Verify pickup address with customer');
    if (pickupValidation.suggestions.length > 0) {
      recommendedActions.push(...pickupValidation.suggestions.map(s => `Pickup: ${s}`));
    }
  }
  
  if (!deliveryValidation.isValid) {
    recommendedActions.push('Verify delivery address with customer');
    if (deliveryValidation.suggestions.length > 0) {
      recommendedActions.push(...deliveryValidation.suggestions.map(s => `Delivery: ${s}`));
    }
  }
  
  // Add trucking-specific recommendations
  if (pickupValidation.confidence === 'LOW' || deliveryValidation.confidence === 'LOW') {
    recommendedActions.push('Confirm truck accessibility and loading dock availability');
  }
  
  return {
    pickupAddress: pickupValidation,
    deliveryAddress: deliveryValidation,
    overallValid,
    recommendedActions
  };
}

// Enhanced validation that combines field validation with address validation
export async function validateLoadRequestWithAddresses(loadRequest: LoadRequest): Promise<{
  fieldValidation: any;
  addressValidation: AddressValidationSummary;
  overallValid: boolean;
  criticalIssues: string[];
  recommendations: string[];
}> {
  // Import field validation (avoiding circular imports)
  const { validateLoadRequest } = await import('./validation');
  
  const fieldValidation = validateLoadRequest(loadRequest);
  const addressValidation = await validateLoadAddresses(loadRequest);
  
  const criticalIssues: string[] = [];
  const recommendations: string[] = [];
  
  // Combine field and address validation issues
  if (!fieldValidation.isValid) {
    criticalIssues.push(`Missing required fields: ${fieldValidation.missingFields.join(', ')}`);
  }
  
  if (!addressValidation.overallValid) {
    criticalIssues.push('Address validation failed');
    recommendations.push(...addressValidation.recommendedActions);
  }
  
  // Add address-specific issues to recommendations
  if (addressValidation.pickupAddress.issues.length > 0) {
    recommendations.push(`Pickup address issues: ${addressValidation.pickupAddress.issues.join(', ')}`);
  }
  
  if (addressValidation.deliveryAddress.issues.length > 0) {
    recommendations.push(`Delivery address issues: ${addressValidation.deliveryAddress.issues.join(', ')}`);
  }
  
  const overallValid = fieldValidation.isValid && addressValidation.overallValid;
  
  return {
    fieldValidation,
    addressValidation,
    overallValid,
    criticalIssues,
    recommendations
  };
}