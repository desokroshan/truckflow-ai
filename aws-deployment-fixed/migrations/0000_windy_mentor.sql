CREATE TABLE "assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"load_request_id" integer NOT NULL,
	"driver_id" integer,
	"truck_id" integer,
	"assigned_at" timestamp DEFAULT now(),
	"status" text DEFAULT 'assigned' NOT NULL,
	"rationale" text
);
--> statement-breakpoint
CREATE TABLE "call_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone_number" text NOT NULL,
	"duration" integer,
	"status" text NOT NULL,
	"transcription" text,
	"audio_file_url" text,
	"load_request_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"load_request_id" integer NOT NULL,
	"uploaded_by" integer NOT NULL,
	"document_type" text NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone_number" text NOT NULL,
	"qualified_for_oversized" boolean DEFAULT false,
	"standard_billing_rate" text NOT NULL,
	"overtime_billing_rate" text NOT NULL,
	"is_available" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "load_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"load_id" text NOT NULL,
	"shipper_id" integer,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"pickup_location" text NOT NULL,
	"pickup_address" text NOT NULL,
	"delivery_location" text NOT NULL,
	"delivery_address" text NOT NULL,
	"cargo_type" text NOT NULL,
	"weight" numeric NOT NULL,
	"truck_type" text NOT NULL,
	"pickup_time" text,
	"delivery_time" text,
	"deadline" text,
	"additional_notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"transcription" text,
	"extracted_data" text,
	"validation_status" text DEFAULT 'pending',
	"missing_fields" text,
	"validation_notes" text,
	"flagged_for_review" boolean DEFAULT false,
	"flagged_by" integer,
	"flagged_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"approved_at" timestamp,
	"notification_sent" boolean DEFAULT false,
	CONSTRAINT "load_requests_load_id_unique" UNIQUE("load_id")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "trucks" (
	"id" serial PRIMARY KEY NOT NULL,
	"truck_number" text NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"truck_type" text NOT NULL,
	"weight_capacity" text NOT NULL,
	"is_available" boolean DEFAULT true,
	"current_location" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "trucks_truck_number_unique" UNIQUE("truck_number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'shipper' NOT NULL,
	"company_name" text,
	"phone_number" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_load_request_id_load_requests_id_fk" FOREIGN KEY ("load_request_id") REFERENCES "public"."load_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_truck_id_trucks_id_fk" FOREIGN KEY ("truck_id") REFERENCES "public"."trucks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_load_request_id_load_requests_id_fk" FOREIGN KEY ("load_request_id") REFERENCES "public"."load_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_load_request_id_load_requests_id_fk" FOREIGN KEY ("load_request_id") REFERENCES "public"."load_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "load_requests" ADD CONSTRAINT "load_requests_shipper_id_users_id_fk" FOREIGN KEY ("shipper_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "load_requests" ADD CONSTRAINT "load_requests_flagged_by_users_id_fk" FOREIGN KEY ("flagged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;