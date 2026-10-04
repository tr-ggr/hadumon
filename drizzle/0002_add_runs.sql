CREATE TYPE "public"."hadumon_run_status" AS ENUM('active', 'won', 'lost', 'abandoned');--> statement-breakpoint
CREATE TABLE "hadumon_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "hadumon_run_status" DEFAULT 'active' NOT NULL,
	"clan_id" text NOT NULL,
	"seed" text NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"state" jsonb NOT NULL,
	"matches_won" integer DEFAULT 0 NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "hadumon_unlocks" (
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"key" text NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hadumon_unlocks_user_id_kind_key_pk" PRIMARY KEY("user_id","kind","key")
);
--> statement-breakpoint
ALTER TABLE "hadumon_runs" ADD CONSTRAINT "hadumon_runs_user_id_hadumon_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."hadumon_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_unlocks" ADD CONSTRAINT "hadumon_unlocks_user_id_hadumon_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."hadumon_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "runs_user_started_idx" ON "hadumon_runs" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "runs_one_active_per_user" ON "hadumon_runs" USING btree ("user_id") WHERE "hadumon_runs"."status" = 'active';