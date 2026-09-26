CREATE TABLE "sync_applied_operations" (
	"op_id" uuid PRIMARY KEY NOT NULL,
	"device_session_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(40) NOT NULL,
	"status" varchar(10) NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sync_applied_operations_status_valid" CHECK ("sync_applied_operations"."status" IN ('applied', 'rejected'))
);
--> statement-breakpoint
ALTER TABLE "sync_applied_operations" ADD CONSTRAINT "sync_applied_operations_device_session_id_device_sessions_id_fk" FOREIGN KEY ("device_session_id") REFERENCES "public"."device_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_applied_operations" ADD CONSTRAINT "sync_applied_operations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;