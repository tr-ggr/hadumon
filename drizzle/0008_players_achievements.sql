CREATE TABLE "hadumon_achievements" (
	"user_id" uuid NOT NULL,
	"key" text NOT NULL,
	"run_id" uuid,
	"coins" integer DEFAULT 0 NOT NULL,
	"earned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hadumon_achievements_user_id_key_pk" PRIMARY KEY("user_id","key")
);
--> statement-breakpoint
ALTER TABLE "hadumon_profiles" ADD COLUMN "handle" text;--> statement-breakpoint
ALTER TABLE "hadumon_profiles" ADD COLUMN "runs_public" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "hadumon_runs" ADD COLUMN "matches_played" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "hadumon_runs" ADD COLUMN "best_match" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "hadumon_runs" ADD COLUMN "summary" jsonb;--> statement-breakpoint
ALTER TABLE "hadumon_unlocks" ADD COLUMN "run_id" uuid;--> statement-breakpoint
ALTER TABLE "hadumon_achievements" ADD CONSTRAINT "hadumon_achievements_user_id_hadumon_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."hadumon_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_achievements" ADD CONSTRAINT "hadumon_achievements_run_id_hadumon_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."hadumon_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "achievements_run_idx" ON "hadumon_achievements" USING btree ("run_id");--> statement-breakpoint
ALTER TABLE "hadumon_unlocks" ADD CONSTRAINT "hadumon_unlocks_run_id_hadumon_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."hadumon_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "runs_status_ended_idx" ON "hadumon_runs" USING btree ("status","ended_at");--> statement-breakpoint
CREATE INDEX "unlocks_run_idx" ON "hadumon_unlocks" USING btree ("run_id");--> statement-breakpoint
ALTER TABLE "hadumon_profiles" ADD CONSTRAINT "hadumon_profiles_handle_unique" UNIQUE("handle");--> statement-breakpoint
-- Every account gets a profile row, and every profile a handle: the
-- username for the account that took it first, the username and the start
-- of the id for any later one. A username has no hyphen, so the two kinds
-- never meet.
INSERT INTO "hadumon_profiles" ("user_id") SELECT "id" FROM "hadumon_users" ON CONFLICT DO NOTHING;--> statement-breakpoint
UPDATE "hadumon_profiles" AS p SET "handle" = h."handle" FROM (
	SELECT "id",
		CASE WHEN row_number() OVER (PARTITION BY lower("display_name") ORDER BY "created_at", "id") = 1
			THEN lower("display_name")
			ELSE lower("display_name") || '-' || substr(replace("id"::text, '-', ''), 1, 8)
		END AS "handle"
	FROM "hadumon_users"
) AS h WHERE p."user_id" = h."id" AND p."handle" IS NULL;--> statement-breakpoint
-- Runs already played: how many matches each finished, and its best one.
UPDATE "hadumon_runs" SET
	"matches_played" = CASE WHEN jsonb_typeof("state"->'results') = 'array' THEN jsonb_array_length("state"->'results') ELSE 0 END,
	"best_match" = COALESCE((
		SELECT max(("r"->>'player')::numeric)::integer
		FROM jsonb_array_elements(CASE WHEN jsonb_typeof("state"->'results') = 'array' THEN "state"->'results' ELSE '[]'::jsonb END) AS "r"
	), 0);
