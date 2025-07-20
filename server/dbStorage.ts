import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc } from "drizzle-orm";
import { 
  users, loadRequests, callLogs, drivers, trucks, assignments, documents, settings,
  type User, type InsertUser, type LoadRequest, type InsertLoadRequest, 
  type CallLog, type InsertCallLog, type Driver, type InsertDriver,
  type Truck, type InsertTruck, type Assignment, type InsertAssignment,
  type Document, type InsertDocument, type Settings, type InsertSettings
} from "@shared/schema";
import { IStorage } from "./storage";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

export class PostgreSQLStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...user,
      createdAt: new Date(),
      role: user.role || 'driver',
      isActive: user.isActive ?? true
    }).returning();
    return result[0];
  }

  // Load Requests
  async getLoadRequest(id: number): Promise<LoadRequest | undefined> {
    const result = await db.select().from(loadRequests).where(eq(loadRequests.id, id)).limit(1);
    return result[0];
  }

  async getLoadRequestByLoadId(loadId: string): Promise<LoadRequest | undefined> {
    const result = await db.select().from(loadRequests).where(eq(loadRequests.loadId, loadId)).limit(1);
    return result[0];
  }

  async getAllLoadRequests(): Promise<LoadRequest[]> {
    return await db.select().from(loadRequests).orderBy(desc(loadRequests.createdAt));
  }

  async createLoadRequest(loadRequest: InsertLoadRequest): Promise<LoadRequest> {
    const result = await db.insert(loadRequests).values({
      ...loadRequest,
      createdAt: new Date(),
      approvedAt: null,
      status: loadRequest.status || 'pending',
      shipperId: loadRequest.shipperId || null,
      flaggedAt: null,
      flaggedForReview: loadRequest.flaggedForReview ?? false,
      notificationSent: loadRequest.notificationSent ?? false
    }).returning();
    return result[0];
  }

  async updateLoadRequestStatus(id: number, status: string, approvedAt?: Date): Promise<LoadRequest | undefined> {
    const result = await db.update(loadRequests)
      .set({ 
        status, 
        approvedAt: approvedAt || null 
      })
      .where(eq(loadRequests.id, id))
      .returning();
    return result[0];
  }

  // Call Logs
  async getCallLog(id: number): Promise<CallLog | undefined> {
    const result = await db.select().from(callLogs).where(eq(callLogs.id, id)).limit(1);
    return result[0];
  }

  async getAllCallLogs(): Promise<CallLog[]> {
    return await db.select().from(callLogs).orderBy(desc(callLogs.createdAt));
  }

  async createCallLog(callLog: InsertCallLog): Promise<CallLog> {
    const result = await db.insert(callLogs).values({
      ...callLog,
      createdAt: new Date(),
      transcription: callLog.transcription || null,
      duration: callLog.duration || null,
      audioFileUrl: callLog.audioFileUrl || null,
      loadRequestId: callLog.loadRequestId || null
    }).returning();
    return result[0];
  }

  async updateCallLogTranscription(id: number, transcription: string): Promise<CallLog | undefined> {
    const result = await db.update(callLogs)
      .set({ transcription })
      .where(eq(callLogs.id, id))
      .returning();
    return result[0];
  }

  // Drivers
  async getDriver(id: number): Promise<Driver | undefined> {
    const result = await db.select().from(drivers).where(eq(drivers.id, id)).limit(1);
    return result[0];
  }

  async getAllDrivers(): Promise<Driver[]> {
    return await db.select().from(drivers).orderBy(desc(drivers.createdAt));
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    return await db.select().from(drivers).where(eq(drivers.isAvailable, true));
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const result = await db.insert(drivers).values({
      ...driver,
      createdAt: new Date(),
      qualifiedForOversized: driver.qualifiedForOversized ?? false,
      isAvailable: driver.isAvailable ?? true
    }).returning();
    return result[0];
  }

  async updateDriverAvailability(id: number, isAvailable: boolean): Promise<Driver | undefined> {
    const result = await db.update(drivers)
      .set({ isAvailable })
      .where(eq(drivers.id, id))
      .returning();
    return result[0];
  }

  // Trucks
  async getTruck(id: number): Promise<Truck | undefined> {
    const result = await db.select().from(trucks).where(eq(trucks.id, id)).limit(1);
    return result[0];
  }

  async getAllTrucks(): Promise<Truck[]> {
    return await db.select().from(trucks).orderBy(desc(trucks.createdAt));
  }

  async getAvailableTrucks(): Promise<Truck[]> {
    return await db.select().from(trucks).where(eq(trucks.isAvailable, true));
  }

  async createTruck(truck: InsertTruck): Promise<Truck> {
    const result = await db.insert(trucks).values({
      ...truck,
      createdAt: new Date(),
      isAvailable: truck.isAvailable ?? true,
      currentLocation: truck.currentLocation || null
    }).returning();
    return result[0];
  }

  async updateTruckAvailability(id: number, isAvailable: boolean): Promise<Truck | undefined> {
    const result = await db.update(trucks)
      .set({ isAvailable })
      .where(eq(trucks.id, id))
      .returning();
    return result[0];
  }

  // Assignments
  async getAssignment(id: number): Promise<Assignment | undefined> {
    const result = await db.select().from(assignments).where(eq(assignments.id, id)).limit(1);
    return result[0];
  }

  async getAssignmentByLoadId(loadRequestId: number): Promise<Assignment | undefined> {
    const result = await db.select().from(assignments).where(eq(assignments.loadRequestId, loadRequestId)).limit(1);
    return result[0];
  }

  async getAllAssignments(): Promise<Assignment[]> {
    return await db.select().from(assignments).orderBy(desc(assignments.assignedAt));
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const result = await db.insert(assignments).values({
      ...assignment,
      assignedAt: new Date(),
      status: assignment.status || 'assigned',
      driverId: assignment.driverId || null,
      truckId: assignment.truckId || null,
      rationale: assignment.rationale || null
    }).returning();
    return result[0];
  }

  async updateAssignmentStatus(id: number, status: string): Promise<Assignment | undefined> {
    const result = await db.update(assignments)
      .set({ status })
      .where(eq(assignments.id, id))
      .returning();
    return result[0];
  }

  // Documents
  async createDocument(document: InsertDocument): Promise<Document> {
    const result = await db.insert(documents).values({
      ...document,
      uploadedAt: new Date(),
      fileSize: document.fileSize || null
    }).returning();
    return result[0];
  }

  async getDocumentsByLoadRequest(loadRequestId: number): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.loadRequestId, loadRequestId));
  }

  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.uploadedAt));
  }

  // Settings
  async getSetting(key: string): Promise<Settings | undefined> {
    const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    return result[0];
  }

  async getAllSettings(): Promise<Settings[]> {
    return await db.select().from(settings);
  }

  async setSetting(key: string, value: string, description?: string): Promise<Settings> {
    const existing = await this.getSetting(key);
    
    if (existing) {
      const result = await db.update(settings)
        .set({ 
          value, 
          description: description || existing.description,
          updatedAt: new Date() 
        })
        .where(eq(settings.key, key))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(settings).values({
        key,
        value,
        description: description || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return result[0];
    }
  }
}

export const dbStorage = new PostgreSQLStorage();