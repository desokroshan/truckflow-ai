import { users, loadRequests, callLogs, drivers, trucks, assignments, type User, type InsertUser, type LoadRequest, type InsertLoadRequest, type CallLog, type InsertCallLog, type Driver, type InsertDriver, type Truck, type InsertTruck, type Assignment, type InsertAssignment } from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Load requests
  getLoadRequest(id: number): Promise<LoadRequest | undefined>;
  getLoadRequestByLoadId(loadId: string): Promise<LoadRequest | undefined>;
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private loadRequests: Map<number, LoadRequest>;
  private callLogs: Map<number, CallLog>;
  private drivers: Map<number, Driver>;
  private trucks: Map<number, Truck>;
  private assignments: Map<number, Assignment>;
  private currentUserId: number;
  private currentLoadRequestId: number;
  private currentCallLogId: number;
  private currentDriverId: number;
  private currentTruckId: number;
  private currentAssignmentId: number;

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
    return Array.from(this.loadRequests.values()).find(
      (request) => request.loadId === loadId,
    );
  }

  async getAllLoadRequests(): Promise<LoadRequest[]> {
    return Array.from(this.loadRequests.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async createLoadRequest(insertLoadRequest: InsertLoadRequest): Promise<LoadRequest> {
    const id = this.currentLoadRequestId++;
    // Generate unique load ID
    const loadId = `EXT-${new Date().getFullYear()}-${nanoid(4).toUpperCase()}`;
    const loadRequest: LoadRequest = {
      ...insertLoadRequest,
      id,
      loadId,
      createdAt: new Date(),
      approvedAt: null,
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

  private initializeSampleData() {
    // Sample drivers
    this.createDriver({
      name: "John Smith",
      phoneNumber: "+1234567890",
      licenseNumber: "CDL123456",
      qualification: "CDL Class A",
      isAvailable: true,
      experience: "5 years",
      specializations: "Flatbed, Dry Van"
    });

    this.createDriver({
      name: "Maria Garcia",
      phoneNumber: "+1234567891",
      licenseNumber: "CDL789012",
      qualification: "CDL Class A",
      isAvailable: true,
      experience: "8 years", 
      specializations: "Reefer, Hazmat"
    });

    this.createDriver({
      name: "Robert Johnson",
      phoneNumber: "+1234567892",
      licenseNumber: "CDL345678",
      qualification: "CDL Class B",
      isAvailable: false,
      experience: "3 years",
      specializations: "Box Truck"
    });

    // Sample trucks
    this.createTruck({
      truckNumber: "TRK001",
      make: "Freightliner",
      model: "Cascadia",
      year: 2020,
      truckType: "Dry Van",
      weightCapacity: "80,000 lbs",
      isAvailable: true,
      currentLocation: "New York, NY"
    });

    this.createTruck({
      truckNumber: "TRK002", 
      make: "Peterbilt",
      model: "579",
      year: 2019,
      truckType: "Flatbed",
      weightCapacity: "80,000 lbs",
      isAvailable: true,
      currentLocation: "Chicago, IL"
    });

    this.createTruck({
      truckNumber: "TRK003",
      make: "Volvo",
      model: "VNL860",
      year: 2021,
      truckType: "Reefer",
      weightCapacity: "80,000 lbs",
      isAvailable: false,
      currentLocation: "Los Angeles, CA"
    });
  }
}

export const storage = new MemStorage();