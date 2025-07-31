import { users, loadRequests, callLogs, drivers, trucks, assignments, documents, settings, type User, type InsertUser, type LoadRequest, type InsertLoadRequest, type CallLog, type InsertCallLog, type Driver, type InsertDriver, type Truck, type InsertTruck, type Assignment, type InsertAssignment, type Document, type InsertDocument, type Settings, type InsertSettings } from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Load requests
  getLoadRequest(id: number): Promise<LoadRequest | undefined>;
  getLoadRequestByLoadId(loadId: string): Promise<LoadRequest | undefined>;
  updateLoadRequest(id: number, loadRequest: Partial<LoadRequest>): Promise<LoadRequest | undefined>;
  getAllLoadRequests(): Promise<LoadRequest[]>;
  createLoadRequest(loadRequest: InsertLoadRequest): Promise<LoadRequest>;
  updateLoadRequestStatus(id: number, status: string, approvedAt?: Date): Promise<LoadRequest | undefined>;

  // Call logs
  getCallLog(id: number): Promise<CallLog | undefined>;
  getAllCallLogs(): Promise<CallLog[]>;
  createCallLog(callLog: InsertCallLog): Promise<CallLog>;
  updateCallLogTranscription(id: number, transcription: string): Promise<CallLog | undefined>;

  // Drivers
  getDriver(id: number): Promise<Driver | undefined>;
  getAllDrivers(): Promise<Driver[]>;
  getAvailableDrivers(): Promise<Driver[]>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriverAvailability(id: number, isAvailable: boolean): Promise<Driver | undefined>;

  // Trucks
  getTruck(id: number): Promise<Truck | undefined>;
  getAllTrucks(): Promise<Truck[]>;
  getAvailableTrucks(): Promise<Truck[]>;
  createTruck(truck: InsertTruck): Promise<Truck>;
  updateTruckAvailability(id: number, isAvailable: boolean): Promise<Truck | undefined>;

  // Assignments
  getAssignment(id: number): Promise<Assignment | undefined>;
  getAssignmentByLoadId(loadRequestId: number): Promise<Assignment | undefined>;
  getAllAssignments(): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignmentStatus(id: number, status: string): Promise<Assignment | undefined>;

  // Documents
  createDocument(document: InsertDocument): Promise<Document>;
  getDocumentsByLoadRequest(loadRequestId: number): Promise<Document[]>;
  getAllDocuments(): Promise<Document[]>;

  // Settings
  getSetting(key: string): Promise<Settings | undefined>;
  getAllSettings(): Promise<Settings[]>;
  setSetting(key: string, value: string, description?: string): Promise<Settings>;

  // Users (additional methods)
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getLoadRequestsByShipper(shipperId: number): Promise<LoadRequest[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private loadRequests: Map<number, LoadRequest>;
  private callLogs: Map<number, CallLog>;
  private drivers: Map<number, Driver>;
  private trucks: Map<number, Truck>;
  private assignments: Map<number, Assignment>;
  private documents = new Map<number, Document>();
  private settings = new Map<string, Settings>();
  private currentUserId: number;
  private currentLoadRequestId: number;
  private currentCallLogId: number;
  private currentDriverId: number;
  private currentTruckId: number;
  private currentAssignmentId: number;
  private currentDocumentId = 1;
  private currentSettingsId = 1;

  constructor() {
    this.users = new Map();
    this.loadRequests = new Map();
    this.callLogs = new Map();
    this.drivers = new Map();
    this.trucks = new Map();
    this.assignments = new Map();
    this.currentUserId = 1;
    this.currentLoadRequestId = 1;
    this.currentCallLogId = 1;
    this.currentDriverId = 1;
    this.currentTruckId = 1;
    this.currentAssignmentId = 1;

    // Initialize with sample data
    this.initializeSampleData();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getLoadRequest(id: number): Promise<LoadRequest | undefined> {
    return this.loadRequests.get(id);
  }

  async getLoadRequestByLoadId(loadId: string): Promise<LoadRequest | undefined> {
    for (const loadRequest of this.loadRequests.values()) {
      if (loadRequest.loadId === loadId) {
        return loadRequest;
      }
    }
    return undefined;
  }

  async updateLoadRequest(id: number, loadRequest: Partial<LoadRequest>): Promise<LoadRequest | undefined> {
    const existing = this.loadRequests.get(id);
    if (!existing) {
      return undefined;
    }
    const updated = { ...existing, ...loadRequest };
    this.loadRequests.set(id, updated);
    return updated;
  }

  async getAllLoadRequests(): Promise<LoadRequest[]> {
    return Array.from(this.loadRequests.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async createLoadRequest(insertLoadRequest: InsertLoadRequest): Promise<LoadRequest> {
    const id = this.currentLoadRequestId++;
    // Generate unique load ID if not provided
    const loadId = insertLoadRequest.loadId || `EXT-${new Date().getFullYear()}-${nanoid(4).toUpperCase()}`;
    const loadRequest: LoadRequest = {
      ...insertLoadRequest,
      id,
      loadId,
      createdAt: new Date(),
      shipperId: insertLoadRequest.shipperId || null,
      customerEmail: insertLoadRequest.customerEmail || null,
      pickupContactName: insertLoadRequest.pickupContactName || null,
      pickupContactPhone: insertLoadRequest.pickupContactPhone || null,
      pickupTime: insertLoadRequest.pickupTime || null,
      deliveryTime: insertLoadRequest.deliveryTime || null,
      deadline: insertLoadRequest.deadline || null,
      additionalNotes: insertLoadRequest.additionalNotes || null,
      transcription: insertLoadRequest.transcription || null,
      extractedData: insertLoadRequest.extractedData || null,
      validationStatus: insertLoadRequest.validationStatus || "pending",
      missingFields: insertLoadRequest.missingFields || null,
      validationNotes: insertLoadRequest.validationNotes || null,
      flaggedForReview: insertLoadRequest.flaggedForReview || false,
      flaggedBy: insertLoadRequest.flaggedBy || null,
      flaggedAt: insertLoadRequest.flaggedAt || null,
      approvedAt: null,
      notificationSent: insertLoadRequest.notificationSent || false,
    };
    this.loadRequests.set(id, loadRequest);
    return loadRequest;
  }

  async updateLoadRequestStatus(id: number, status: string, approvedAt?: Date): Promise<LoadRequest | undefined> {
    const loadRequest = this.loadRequests.get(id);
    if (!loadRequest) return undefined;

    const updated: LoadRequest = {
      ...loadRequest,
      status,
      approvedAt: approvedAt || null,
    };
    this.loadRequests.set(id, updated);
    return updated;
  }

  async flagLoadRequestForReview(
    id: number, 
    missingFields: string[], 
    validationNotes: string, 
    validationStatus: string,
    flaggedBy: number
  ): Promise<LoadRequest | undefined> {
    const loadRequest = this.loadRequests.get(id);
    if (!loadRequest) return undefined;

    const updated: LoadRequest = {
      ...loadRequest,
      validationStatus,
      missingFields: JSON.stringify(missingFields),
      validationNotes,
      flaggedForReview: true,
      flaggedBy,
      flaggedAt: new Date(),
      status: validationStatus === "missing_details" ? "missing_details" : loadRequest.status,
    };
    this.loadRequests.set(id, updated);
    return updated;
  }

  async updateLoadRequestValidation(
    id: number,
    validationStatus: string,
    missingFields?: string[],
    validationNotes?: string
  ): Promise<LoadRequest | undefined> {
    const loadRequest = this.loadRequests.get(id);
    if (!loadRequest) return undefined;

    const updated: LoadRequest = {
      ...loadRequest,
      validationStatus,
      missingFields: missingFields ? JSON.stringify(missingFields) : loadRequest.missingFields,
      validationNotes: validationNotes || loadRequest.validationNotes,
      flaggedForReview: validationStatus !== "complete",
    };
    this.loadRequests.set(id, updated);
    return updated;
  }

  async getLoadRequestsNeedingReview(): Promise<LoadRequest[]> {
    return Array.from(this.loadRequests.values())
      .filter(request => request.flaggedForReview || request.validationStatus === "missing_details")
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async getCallLog(id: number): Promise<CallLog | undefined> {
    return this.callLogs.get(id);
  }

  async getAllCallLogs(): Promise<CallLog[]> {
    return Array.from(this.callLogs.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async createCallLog(insertCallLog: InsertCallLog): Promise<CallLog> {
    const id = this.currentCallLogId++;
    const callLog: CallLog = {
      ...insertCallLog,
      id,
      createdAt: new Date(),
    };
    this.callLogs.set(id, callLog);
    return callLog;
  }

  async updateCallLogTranscription(id: number, transcription: string): Promise<CallLog | undefined> {
    const callLog = this.callLogs.get(id);
    if (!callLog) return undefined;

    const updated: CallLog = {
      ...callLog,
      transcription,
    };
    this.callLogs.set(id, updated);
    return updated;
  }

  // Driver methods
  async getDriver(id: number): Promise<Driver | undefined> {
    return this.drivers.get(id);
  }

  async getAllDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values()).filter(driver => driver.isAvailable);
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const id = this.currentDriverId++;
    const driver: Driver = {
      ...insertDriver,
      id,
      createdAt: new Date(),
    };
    this.drivers.set(id, driver);
    return driver;
  }

  async updateDriverAvailability(id: number, isAvailable: boolean): Promise<Driver | undefined> {
    const driver = this.drivers.get(id);
    if (!driver) return undefined;

    const updated: Driver = {
      ...driver,
      isAvailable,
    };
    this.drivers.set(id, updated);
    return updated;
  }

  // Truck methods
  async getTruck(id: number): Promise<Truck | undefined> {
    return this.trucks.get(id);
  }

  async getAllTrucks(): Promise<Truck[]> {
    return Array.from(this.trucks.values()).sort((a, b) => a.truckNumber.localeCompare(b.truckNumber));
  }

  async getAvailableTrucks(): Promise<Truck[]> {
    return Array.from(this.trucks.values()).filter(truck => truck.isAvailable);
  }

  async createTruck(insertTruck: InsertTruck): Promise<Truck> {
    const id = this.currentTruckId++;
    const truck: Truck = {
      ...insertTruck,
      id,
      createdAt: new Date(),
    };
    this.trucks.set(id, truck);
    return truck;
  }

  async updateTruckAvailability(id: number, isAvailable: boolean): Promise<Truck | undefined> {
    const truck = this.trucks.get(id);
    if (!truck) return undefined;

    const updated: Truck = {
      ...truck,
      isAvailable,
    };
    this.trucks.set(id, updated);
    return updated;
  }

  // Assignment methods
  async getAssignment(id: number): Promise<Assignment | undefined> {
    return this.assignments.get(id);
  }

  async getAssignmentByLoadId(loadRequestId: number): Promise<Assignment | undefined> {
    return Array.from(this.assignments.values()).find(
      assignment => assignment.loadRequestId === loadRequestId
    );
  }

  async getAllAssignments(): Promise<Assignment[]> {
    return Array.from(this.assignments.values()).sort((a, b) => 
      new Date(b.assignedAt || 0).getTime() - new Date(a.assignedAt || 0).getTime()
    );
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const id = this.currentAssignmentId++;
    const assignment: Assignment = {
      ...insertAssignment,
      id,
      assignedAt: new Date(),
    };
    this.assignments.set(id, assignment);
    return assignment;
  }

  async updateAssignmentStatus(id: number, status: string): Promise<Assignment | undefined> {
    const assignment = this.assignments.get(id);
    if (!assignment) return undefined;

    const updated: Assignment = {
      ...assignment,
      status,
    };
    this.assignments.set(id, updated);
    return updated;
  }



  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getLoadRequestsByShipper(shipperId: number): Promise<LoadRequest[]> {
    return Array.from(this.loadRequests.values()).filter(
      load => load.shipperId === shipperId
    );
  }

  // Document methods
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const document: Document = {
      ...insertDocument,
      id,
      uploadedAt: new Date(),
    };
    this.documents.set(id, document);
    return document;
  }

  async getDocumentsByLoadRequest(loadRequestId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      doc => doc.loadRequestId === loadRequestId
    );
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  private async initializeSampleData() {
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Sample users
    this.createUser({
      username: "frank",
      email: "frank@expeditetransport.com",
      password: hashedPassword,
      role: "dispatcher",
      companyName: "Expedite Transport",
      phoneNumber: "+1-555-999-8888",
      isActive: true,
    });

    this.createUser({
      username: "john",
      email: "john@hercrental.com",
      password: hashedPassword,
      role: "shipper",
      companyName: "HercRental",
      phoneNumber: "+1-555-123-4567",
      isActive: true,
    });

    this.createUser({
      username: "shipper2",
      email: "sarah@globalmanufacturing.com",
      password: hashedPassword,
      role: "shipper",
      companyName: "Global Manufacturing",
      phoneNumber: "+1-555-987-6543",
      isActive: true,
    });

    // Updated driver roster with new schema format
    this.createDriver({
      name: "Arturo Magallanes",
      email: "arturo.magallanes23@gmail.com",
      phoneNumber: "(562) 376-7898",
      qualifiedForOversized: true,
      standardBillingRate: "$37/Hr",
      overtimeBillingRate: "$40/Hr",
      isAvailable: true
    });

    this.createDriver({
      name: "Carlos Soto",
      email: "carlossoto1594@gmail.com",
      phoneNumber: "(562) 381-5457",
      qualifiedForOversized: true,
      standardBillingRate: "$45/Hr",
      overtimeBillingRate: "$55/Hr",
      isAvailable: true
    });

    this.createDriver({
      name: "Damon Uribes",
      email: "duribes@me.com",
      phoneNumber: "(626) 676-2402",
      qualifiedForOversized: false,
      standardBillingRate: "$75/Hr",
      overtimeBillingRate: "$75/Hr",
      isAvailable: true
    });

    this.createDriver({
      name: "Frank Mora",
      email: "frank@expedite-transport.com",
      phoneNumber: "(562) 964-8643",
      qualifiedForOversized: true,
      standardBillingRate: "$45/Hr",
      overtimeBillingRate: "$45/Hr",
      isAvailable: true
    });

    this.createDriver({
      name: "Jonathan E McKinsey",
      email: "jstar.transportationllc@gmail.com",
      phoneNumber: "(323) 243-9607",
      qualifiedForOversized: false,
      standardBillingRate: "$85/Hr",
      overtimeBillingRate: "$85/Hr",
      isAvailable: true
    });

    this.createDriver({
      name: "Kyle Summerell",
      email: "explicit6898@gmail.com",
      phoneNumber: "(919) 922-7389",
      qualifiedForOversized: false,
      standardBillingRate: "$40/Hr",
      overtimeBillingRate: "$40/Hr",
      isAvailable: true
    });

    this.createDriver({
      name: "Moises R Martinez",
      email: "ramosmoisese9285@gmail.com",
      phoneNumber: "(323) 420-9211",
      qualifiedForOversized: false,
      standardBillingRate: "$38/Hr",
      overtimeBillingRate: "$40/Hr",
      isAvailable: true
    });

    this.createDriver({
      name: "Noe Manfredy Ayala",
      email: "Noeayala7500@gmail.com",
      phoneNumber: "(323) 422-3505",
      qualifiedForOversized: false,
      standardBillingRate: "$45/Hr",
      overtimeBillingRate: "$45/Hr",
      isAvailable: true
    });

    this.createDriver({
      name: "Rafael Miranda",
      email: "Abmlogisticala@gmail.com",
      phoneNumber: "(323) 907-7470",
      qualifiedForOversized: false,
      standardBillingRate: "$70/Hr",
      overtimeBillingRate: "$80/Hr",
      isAvailable: true
    });

    this.createDriver({
      name: "Ronald Winans",
      email: "rwinans2248@gmail.com",
      phoneNumber: "(562) 332-1326",
      qualifiedForOversized: false,
      standardBillingRate: "$35/Hr",
      overtimeBillingRate: "$40/Hr",
      isAvailable: true
    });

    // Actual fleet inventory - only trucks from the specified list
    this.createTruck({
      truckNumber: "LB001",
      make: "Caterpillar",
      model: "CT660",
      year: 2020,
      truckType: "Lowboy",
      weightCapacity: "150,000 lbs",
      isAvailable: true,
      currentLocation: "Yard"
    });

    this.createTruck({
      truckNumber: "SET001",
      make: "Landoll",
      model: "855",
      year: 2019,
      truckType: "Step Deck",
      weightCapacity: "48,000 lbs",
      isAvailable: true,
      currentLocation: "Yard"
    });

    this.createTruck({
      truckNumber: "SET002",
      make: "Trail King",
      model: "TK110",
      year: 2018,
      truckType: "Step Deck",
      weightCapacity: "48,000 lbs",
      isAvailable: true,
      currentLocation: "Yard"
    });

    this.createTruck({
      truckNumber: "DD001",
      make: "Fontaine",
      model: "Magnitude",
      year: 2020,
      truckType: "Double Drop",
      weightCapacity: "80,000 lbs",
      isAvailable: true,
      currentLocation: "Yard"
    });

    this.createTruck({
      truckNumber: "RB001",
      make: "Freightliner",
      model: "M2 106",
      year: 2019,
      truckType: "Rollback",
      weightCapacity: "26,000 lbs",
      isAvailable: true,
      currentLocation: "Yard"
    });

    this.createTruck({
      truckNumber: "HS001",
      make: "Ford",
      model: "F-450",
      year: 2021,
      truckType: "Hot Shot",
      weightCapacity: "15,000 lbs",
      isAvailable: true,
      currentLocation: "Yard"
    });

    this.createTruck({
      truckNumber: "PO001",
      make: "Freightliner",
      model: "Cascadia",
      year: 2020,
      truckType: "Dry Van",
      weightCapacity: "80,000 lbs",
      isAvailable: true,
      currentLocation: "Yard"
    });

    this.createTruck({
      truckNumber: "PU001",
      make: "Chevrolet",
      model: "Silverado 3500HD",
      year: 2022,
      truckType: "Flatbed",
      weightCapacity: "14,000 lbs",
      isAvailable: true,
      currentLocation: "Yard"
    });

    // Create a sample load request with real phone number
    this.createLoadRequest({
      loadId: "EXT-2025-DEMO",
      customerName: "Roshan",
      customerPhone: "+1-206-555-0123",
      customerEmail: "roshan@example.com",
      pickupLocation: "Seattle, WA",
      pickupAddress: "123 Pine St, Seattle, WA 98101",
      deliveryLocation: "Sammamish, WA",
      deliveryAddress: "456 Issaquah Pine Lake Rd, Sammamish, WA 98027",
      cargoType: "Electronics",
      weight: "500 pounds",
      truckType: "Dry Van",
      pickupTime: "2025-07-28 09:00",
      deliveryTime: "2025-07-28 15:00",
      deadline: "2025-07-28 17:00",
      status: "pending",
      transcription: "Hi this is Roshan calling from Seattle. I need to ship some electronics equipment from our location here in Seattle to our warehouse in Sammamish. The shipment includes five forklifts, two scissor lifts, and a bunch of dollies, weighing about 500 pounds total. Can you help me with this?",
      extractedData: JSON.stringify({
        customerName: "Roshan",
        customerPhone: "+1-206-555-0123",
        pickupLocation: "Seattle, WA",
        deliveryLocation: "Sammamish, WA",
        cargoType: "Electronics",
        weight: "500 pounds"
      }),
      notificationSent: false,
    });

    // Initialize default settings synchronously
    this.initializeDefaultSettings();
  }

  private initializeDefaultSettings() {
    // Initialize settings directly in the map to avoid async issues
    this.settings.set("greeting_message", {
      id: this.currentSettingsId++,
      key: "greeting_message",
      value: "Thank you for calling Expedite Transport. I'm Freya and I'll help you with your shipping request. Please describe your shipping needs including pickup location, delivery location, cargo type, and any special requirements. When finished, press pound or wait 2 seconds. This call is recorded.",
      description: "Default greeting message for phone calls",
      updatedAt: new Date()
    });

    this.settings.set("notification_email", {
      id: this.currentSettingsId++,
      key: "notification_email",
      value: "owner@truckflow.com",
      description: "Email address for load notifications",
      updatedAt: new Date()
    });

    this.settings.set("sms_notifications", {
      id: this.currentSettingsId++,
      key: "sms_notifications",
      value: "true",
      description: "Enable SMS notifications for new loads",
      updatedAt: new Date()
    });
  }

  // Settings methods
  async getSetting(key: string): Promise<Settings | undefined> {
    return this.settings.get(key);
  }

  async getAllSettings(): Promise<Settings[]> {
    return Array.from(this.settings.values());
  }

  async setSetting(key: string, value: string, description?: string): Promise<Settings> {
    const existingSetting = this.settings.get(key);
    if (existingSetting) {
      const updatedSetting: Settings = {
        ...existingSetting,
        value,
        description: description || existingSetting.description,
        updatedAt: new Date()
      };
      this.settings.set(key, updatedSetting);
      return updatedSetting;
    } else {
      const newSetting: Settings = {
        id: this.currentSettingsId++,
        key,
        value,
        description,
        updatedAt: new Date()
      };
      this.settings.set(key, newSetting);
      return newSetting;
    }
  }




}

export const storage = new MemStorage();