import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("shipper"), // dispatcher, shipper, consignee
  companyName: text("company_name"),
  phoneNumber: text("phone_number"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const loadRequests = pgTable("load_requests", {
  id: serial("id").primaryKey(),
  loadId: text("load_id").notNull().unique(),
  shipperId: integer("shipper_id").references(() => users.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  pickupLocation: text("pickup_location").notNull(),
  pickupAddress: text("pickup_address").notNull(),
  deliveryLocation: text("delivery_location").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  cargoType: text("cargo_type").notNull(),
  weight: decimal("weight").notNull(),
  truckType: text("truck_type").notNull(),
  pickupTime: text("pickup_time"),
  deliveryTime: text("delivery_time"),
  deadline: text("deadline"),
  additionalNotes: text("additional_notes"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, missing_details
  transcription: text("transcription"),
  extractedData: text("extracted_data"),
  validationStatus: text("validation_status").default("pending"), // complete, missing_details, requires_review
  missingFields: text("missing_fields"), // JSON array of missing field names
  validationNotes: text("validation_notes"), // Human notes about missing or unclear information
  flaggedForReview: boolean("flagged_for_review").default(false),
  flaggedBy: integer("flagged_by").references(() => users.id),
  flaggedAt: timestamp("flagged_at"),
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  notificationSent: boolean("notification_sent").default(false),
});

export const callLogs = pgTable("call_logs", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  duration: integer("duration"),
  status: text("status").notNull(),
  transcription: text("transcription"),
  audioFileUrl: text("audio_file_url"),
  loadRequestId: integer("load_request_id").references(() => loadRequests.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number").notNull(),
  qualifiedForOversized: boolean("qualified_for_oversized").default(false),
  standardBillingRate: text("standard_billing_rate").notNull(),
  overtimeBillingRate: text("overtime_billing_rate").notNull(),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trucks = pgTable("trucks", {
  id: serial("id").primaryKey(),
  truckNumber: text("truck_number").notNull().unique(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  truckType: text("truck_type").notNull(), // Dry Van, Flatbed, Reefer, etc.
  weightCapacity: text("weight_capacity").notNull(), // max weight capacity
  isAvailable: boolean("is_available").default(true),
  currentLocation: text("current_location"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  loadRequestId: integer("load_request_id").references(() => loadRequests.id).notNull(),
  driverId: integer("driver_id").references(() => drivers.id),
  truckId: integer("truck_id").references(() => trucks.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  status: text("status").notNull().default("assigned"), // assigned, in_transit, completed
  rationale: text("rationale"), // User's rationale for the assignment decision
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  loadRequestId: integer("load_request_id").references(() => loadRequests.id).notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  documentType: text("document_type").notNull(), // BOL, POD, Invoice, etc.
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const signupSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["dispatcher", "shipper", "consignee"]).default("shipper"),
  companyName: z.string().optional(),
  phoneNumber: z.string().optional(),
});

// Load request validation schemas
export const insertLoadRequestSchema = createInsertSchema(loadRequests).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
  flaggedAt: true,
});

// Load validation schema for checking completeness
export const loadValidationSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().min(10, "Valid phone number is required"),
  pickupLocation: z.string().min(1, "Pickup location is required"),
  pickupAddress: z.string().min(1, "Pickup address is required"),
  deliveryLocation: z.string().min(1, "Delivery location is required"),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  cargoType: z.string().min(1, "Cargo type is required"),
  weight: z.string().min(1, "Weight is required"),
  truckType: z.string().min(1, "Truck type is required"),
  pickupTime: z.string().optional(),
  deliveryTime: z.string().optional(),
  deadline: z.string().optional(),
  additionalNotes: z.string().optional(),
});

// Flag load request schema
export const flagLoadRequestSchema = z.object({
  missingFields: z.array(z.string()),
  validationNotes: z.string().min(1, "Please provide notes about missing details"),
  validationStatus: z.enum(["missing_details", "requires_review"]),
});

// Types
export type User = typeof users.$inferSelect;
export type LoadRequest = typeof loadRequests.$inferSelect;
export type CallLog = typeof callLogs.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type Truck = typeof trucks.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Settings = typeof settings.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertLoadRequest = z.infer<typeof insertLoadRequestSchema>;
export type FlagLoadRequest = z.infer<typeof flagLoadRequestSchema>;

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export const insertCallLogSchema = createInsertSchema(callLogs).omit({
  id: true,
  createdAt: true,
});

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
  createdAt: true,
});

export const insertTruckSchema = createInsertSchema(trucks).omit({
  id: true,
  createdAt: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  assignedAt: true,
});

export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type InsertCallLog = z.infer<typeof insertCallLogSchema>;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type InsertTruck = z.infer<typeof insertTruckSchema>;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
