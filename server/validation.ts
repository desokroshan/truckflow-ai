import { LoadRequest } from '../shared/schema';

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  validationScore: number; // 0-100, percentage of required fields present
  requiredFieldsCount: number;
  completedFieldsCount: number;
}

// Define required fields for a complete load request (only truly essential fields)
const REQUIRED_FIELDS = [
  'pickupAddress', // Combined pickup location/address - only one needed
  'deliveryAddress', // Combined delivery location/address - only one needed  
  'cargoType' // Load/cargo details
];

// Define optional but important fields
const IMPORTANT_FIELDS = [
  'customerName',
  'customerPhone',
  'weight',
  'truckType',
  'pickupTime',
  'deliveryTime',
  'deadline'
];

// Field display names for user-friendly messages
const FIELD_DISPLAY_NAMES: Record<string, string> = {
  pickupAddress: "Pickup Address",
  deliveryAddress: "Delivery Address",
  cargoType: "Cargo Details",
  customerName: "Customer Name",
  customerPhone: "Customer Phone Number", 
  weight: "Weight",
  truckType: "Truck Type",
  pickupTime: "Pickup Time Window",
  deliveryTime: "Delivery Time Window",
  deadline: "Delivery Deadline"
};

export function validateLoadRequest(loadRequest: LoadRequest): ValidationResult {
  const missingFields: string[] = [];
  let completedFieldsCount = 0;

  // Check pickup address (can be either pickupLocation or pickupAddress)
  const hasPickupAddress = 
    (loadRequest.pickupAddress && loadRequest.pickupAddress.trim() !== '' && loadRequest.pickupAddress !== 'null') ||
    (loadRequest.pickupLocation && loadRequest.pickupLocation.trim() !== '' && loadRequest.pickupLocation !== 'null');
  
  if (!hasPickupAddress) {
    console.log('[VAL] Pickup address is missing');
    missingFields.push('pickupAddress');
  } else {
    console.log('[VAL] Pickup address is valid');
    completedFieldsCount++;
  }

  // Check delivery address (can be either deliveryLocation or deliveryAddress)  
  const hasDeliveryAddress = 
    (loadRequest.deliveryAddress && loadRequest.deliveryAddress.trim() !== '' && loadRequest.deliveryAddress !== 'null') ||
    (loadRequest.deliveryLocation && loadRequest.deliveryLocation.trim() !== '' && loadRequest.deliveryLocation !== 'null');
  
  if (!hasDeliveryAddress) {
    console.log('[VAL] Delivery address is missing');
    missingFields.push('deliveryAddress');
  } else {
    console.log('[VAL] Delivery address is valid');
    completedFieldsCount++;
  }

  // Check cargo details
  const hasCargoDetails = loadRequest.cargoType && 
    loadRequest.cargoType.trim() !== '' && 
    loadRequest.cargoType !== 'null' && 
    loadRequest.cargoType !== 'undefined';
  
  if (!hasCargoDetails) {
    console.log('[VAL] Cargo details are missing');
    missingFields.push('cargoType');
  } else {
    console.log('[VAL] Cargo details are valid');
    completedFieldsCount++;
  }

  // Calculate validation score
  const validationScore = Math.round((completedFieldsCount / REQUIRED_FIELDS.length) * 100);
  const isValid = missingFields.length === 0;

  return {
    isValid,
    missingFields,
    validationScore,
    requiredFieldsCount: REQUIRED_FIELDS.length,
    completedFieldsCount
  };
}

export function getValidationSummary(loadRequest: LoadRequest): string {
  const validation = validateLoadRequest(loadRequest);
  
  if (validation.isValid) {
    return "All required information is complete.";
  }

  const missingFieldNames = validation.missingFields.map(field => 
    FIELD_DISPLAY_NAMES[field] || field
  );

  return `Missing ${validation.missingFields.length} required field${validation.missingFields.length > 1 ? 's' : ''}: ${missingFieldNames.join(', ')}`;
}

export function getMissingFieldsDisplayNames(missingFields: string[]): string[] {
  return missingFields.map(field => FIELD_DISPLAY_NAMES[field] || field);
}

export function categorizeLoadRequests(loadRequests: LoadRequest[]): {
  complete: LoadRequest[];
  missingDetails: LoadRequest[];
  needsReview: LoadRequest[];
} {
  const complete: LoadRequest[] = [];
  const missingDetails: LoadRequest[] = [];
  const needsReview: LoadRequest[] = [];

  for (const loadRequest of loadRequests) {
    const validation = validateLoadRequest(loadRequest);
    
    if (loadRequest.flaggedForReview) {
      needsReview.push(loadRequest);
    } else if (!validation.isValid) {
      missingDetails.push(loadRequest);
    } else {
      complete.push(loadRequest);
    }
  }

  return { complete, missingDetails, needsReview };
}

// Automated validation that runs when load requests are created
export function autoValidateLoadRequest(loadRequest: LoadRequest): {
  validationStatus: string;
  missingFields: string[];
  autoFlag: boolean;
} {
  const validation = validateLoadRequest(loadRequest);
  
  // Auto-flag only if any required field is missing (pickup address, delivery address, or cargo details)
  const autoFlag = validation.missingFields.length > 0;
  
  let validationStatus = "complete";
  if (!validation.isValid) {
    validationStatus = "missing_details";
  }

  return {
    validationStatus,
    missingFields: validation.missingFields,
    autoFlag
  };
}