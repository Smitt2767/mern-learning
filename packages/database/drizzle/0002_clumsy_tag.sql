CREATE TYPE "public"."job_name" AS ENUM('send-welcome-email', 'send-email-verification', 'send-password-reset-email', 'purge-expired-sessions', 'purge-expired-tokens');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('waiting', 'active', 'completed', 'failed', 'delayed', 'paused');--> statement-breakpoint
CREATE TABLE "job_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bull_job_id" varchar(255) NOT NULL,
	"queue_name" varchar(255) NOT NULL,
	"job_name" "job_name" NOT NULL,
	"status" "job_status" DEFAULT 'waiting' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"data" jsonb NOT NULL,
	"result" jsonb,
	"error" text,
	"error_stack" text,
	"scheduled_for" timestamp with time zone,
	"processed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_job_records_bull_job_id" ON "job_records" USING btree ("bull_job_id");--> statement-breakpoint
CREATE INDEX "idx_job_records_queue_name" ON "job_records" USING btree ("queue_name");--> statement-breakpoint
CREATE INDEX "idx_job_records_job_name" ON "job_records" USING btree ("job_name");--> statement-breakpoint
CREATE INDEX "idx_job_records_status" ON "job_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_job_records_created_at" ON "job_records" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_job_records_job_name_status" ON "job_records" USING btree ("job_name","status");