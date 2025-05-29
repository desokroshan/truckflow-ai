import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const loadRequests = pgTable("load_requests", {
  id: serial("id").primaryKey(),
  loadId: text("load_id").notNull().unique(),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoadRequest = typeof loadRequests.$inferSelect;
export type InsertLoadRequest = z.infer<typeof insertLoadRequestSchema>;
export type CallLog = typeof callLogs.$inferSelect;
export type InsertCallLog = z.infer<typeof insertCallLogSchema>;
