import { users, loadRequests, callLogs, type User, type InsertUser, type LoadRequest, type InsertLoadRequest, type CallLog, type InsertCallLog } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private loadRequests: Map<number, LoadRequest>;
  private callLogs: Map<number, CallLog>;
  private currentUserId: number;
  private currentLoadRequestId: number;
  private currentCallLogId: number;

  constructor() {
    this.users = new Map();
    this.loadRequests = new Map();
    this.callLogs = new Map();
    this.currentUserId = 1;
    this.currentLoadRequestId = 1;
    this.currentCallLogId = 1;
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
}

export const storage = new MemStorage();