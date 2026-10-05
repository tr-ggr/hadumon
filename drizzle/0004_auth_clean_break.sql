-- Clean break: accounts move to email sign-in, and the old username-only
-- accounts have no email to carry over. Deleting every user cascades to
-- their sessions, runs and unlocks; 0005 relies on this table being empty.
DELETE FROM "hadumon_users";--> statement-breakpoint
ALTER TABLE "hadumon_sessions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "hadumon_sessions" CASCADE;--> statement-breakpoint
ALTER TABLE "hadumon_users" DROP CONSTRAINT "hadumon_users_username_unique";--> statement-breakpoint
ALTER TABLE "hadumon_users" DROP COLUMN "username";--> statement-breakpoint
ALTER TABLE "hadumon_users" DROP COLUMN "password_hash";