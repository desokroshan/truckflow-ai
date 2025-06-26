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
  status: text("status").notNull().default("pending"),
  transcription: text("transcription"),
  extractedData: text("extracted_data"),
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

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertLoadRequestSchema = createInsertSchema(loadRequests).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type LoadRequest = typeof loadRequests.$inferSelect;
export type InsertLoadRequest = z.infer<typeof insertLoadRequestSchema>;
export type CallLog = typeof callLogs.$inferSelect;
export type InsertCallLog = z.infer<typeof insertCallLogSchema>;
export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Truck = typeof trucks.$inferSelect;
export type InsertTruck = z.infer<typeof insertTruckSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
