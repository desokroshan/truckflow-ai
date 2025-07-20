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

// Google Maps Address Validation API integration
export async function validateAddressWithGoogle(address: string): Promise<AddressValidationResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn('Google Maps API key not configured, skipping address validation');
    return {
      isValid: true, // Don't block if API not configured
      confidence: 'MEDIUM',
      issues: ['Address validation not configured']
    };
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

// Validate both pickup and delivery addresses for a load request
export async function validateLoadAddresses(loadRequest: LoadRequest): Promise<AddressValidationSummary> {
  const pickupAddress = loadRequest.pickupAddress || loadRequest.pickupLocation || '';
  const deliveryAddress = loadRequest.deliveryAddress || loadRequest.deliveryLocation || '';
  
  const [pickupValidation, deliveryValidation] = await Promise.all([
    validateAddressWithGoogle(pickupAddress),
    validateAddressWithGoogle(deliveryAddress)
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