import { LoadRequest } from '../shared/schema';

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  validationScore: number; // 0-100, percentage of required fields present
  requiredFieldsCount: number;
  completedFieldsCount: number;
}

// Define required fields for a complete load request
const REQUIRED_FIELDS = [
  'customerName',
  'customerPhone', 
  'pickupLocation',
  'pickupAddress',
  'deliveryLocation',
  'deliveryAddress',
  'cargoType',
  'weight',
  'truckType'
];

// Define optional but important fields
const IMPORTANT_FIELDS = [
  'pickupTime',
  'deliveryTime',
  'deadline'
];

// Field display names for user-friendly messages
const FIELD_DISPLAY_NAMES: Record<string, string> = {
  customerName: "Customer Name",
  customerPhone: "Customer Phone Number",
  pickupLocation: "Pickup Location",
  pickupAddress: "Pickup Address",
  deliveryLocation: "Delivery Location", 
  deliveryAddress: "Delivery Address",
  cargoType: "Cargo Type",
  weight: "Weight",
  truckType: "Truck Type",
  pickupTime: "Pickup Time Window",
  deliveryTime: "Delivery Time Window",
  deadline: "Delivery Deadline"
};

export function validateLoadRequest(loadRequest: LoadRequest): ValidationResult {
  const missingFields: string[] = [];
  let completedFieldsCount = 0;

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    const value = (loadRequest as any)[field];
    if (!value || value.toString().trim() === '' || value === 'null' || value === 'undefined') {
      missingFields.push(field);
    } else {
      completedFieldsCount++;
    }
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
  
  // Auto-flag if missing more than 2 required fields or validation score is below 70%
  const autoFlag = validation.missingFields.length > 2 || validation.validationScore < 70;
  
  let validationStatus = "complete";
  if (!validation.isValid) {
    validationStatus = autoFlag ? "missing_details" : "requires_review";
  }

  return {
    validationStatus,
    missingFields: validation.missingFields,
    autoFlag
  };
}