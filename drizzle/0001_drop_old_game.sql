ALTER TABLE "hadumon_creatures" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hadumon_materials" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hadumon_pity_counters" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hadumon_pulls" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hadumon_expedition_members" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hadumon_expeditions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hadumon_zone_progress" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hadumon_attack_quota" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hadumon_battles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hadumon_defense_teams" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hadumon_listings" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hadumon_trade_offers" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "hadumon_creatures" CASCADE;--> statement-breakpoint
DROP TABLE "hadumon_materials" CASCADE;--> statement-breakpoint
DROP TABLE "hadumon_pity_counters" CASCADE;--> statement-breakpoint
DROP TABLE "hadumon_pulls" CASCADE;--> statement-breakpoint
DROP TABLE "hadumon_expedition_members" CASCADE;--> statement-breakpoint
DROP TABLE "hadumon_expeditions" CASCADE;--> statement-breakpoint
DROP TABLE "hadumon_zone_progress" CASCADE;--> statement-breakpoint
DROP TABLE "hadumon_attack_quota" CASCADE;--> statement-breakpoint
DROP TABLE "hadumon_battles" CASCADE;--> statement-breakpoint
DROP TABLE "hadumon_defense_teams" CASCADE;--> statement-breakpoint
DROP TABLE "hadumon_listings" CASCADE;--> statement-breakpoint
DROP TABLE "hadumon_trade_offers" CASCADE;--> statement-breakpoint
DROP INDEX "users_rating_idx";--> statement-breakpoint
ALTER TABLE "hadumon_users" DROP COLUMN "gold";--> statement-breakpoint
ALTER TABLE "hadumon_users" DROP COLUMN "gems";--> statement-breakpoint
ALTER TABLE "hadumon_users" DROP COLUMN "rating";--> statement-breakpoint
ALTER TABLE "hadumon_users" DROP COLUMN "is_bot";--> statement-breakpoint
DROP TYPE "public"."hadumon_creature_status";--> statement-breakpoint
DROP TYPE "public"."hadumon_element";--> statement-breakpoint
DROP TYPE "public"."hadumon_rarity";--> statement-breakpoint
DROP TYPE "public"."hadumon_expedition_status";--> statement-breakpoint
DROP TYPE "public"."hadumon_battle_winner";--> statement-breakpoint
DROP TYPE "public"."hadumon_listing_status";--> statement-breakpoint
DROP TYPE "public"."hadumon_trade_offer_status";