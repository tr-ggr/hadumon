CREATE TYPE "public"."hadumon_creature_status" AS ENUM('idle', 'expedition', 'listed', 'trading');--> statement-breakpoint
CREATE TYPE "public"."hadumon_element" AS ENUM('flame', 'mist', 'volt', 'thorn', 'shade');--> statement-breakpoint
CREATE TYPE "public"."hadumon_rarity" AS ENUM('common', 'uncommon', 'rare', 'epic', 'legendary');--> statement-breakpoint
CREATE TYPE "public"."hadumon_expedition_status" AS ENUM('active', 'completed', 'retreated');--> statement-breakpoint
CREATE TYPE "public"."hadumon_battle_winner" AS ENUM('attacker', 'defender');--> statement-breakpoint
CREATE TYPE "public"."hadumon_listing_status" AS ENUM('active', 'sold', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."hadumon_trade_offer_status" AS ENUM('pending', 'accepted', 'declined', 'cancelled');--> statement-breakpoint
CREATE TABLE "hadumon_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hadumon_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"gold" integer DEFAULT 500 NOT NULL,
	"gems" integer DEFAULT 1000 NOT NULL,
	"rating" integer DEFAULT 1000 NOT NULL,
	"is_bot" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hadumon_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "hadumon_creatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"species_id" text NOT NULL,
	"nickname" text,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"upgrade_tier" integer DEFAULT 0 NOT NULL,
	"status" "hadumon_creature_status" DEFAULT 'idle' NOT NULL,
	"obtained_at" timestamp with time zone DEFAULT now() NOT NULL,
	"obtained_via" text DEFAULT 'starter' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hadumon_materials" (
	"user_id" uuid NOT NULL,
	"element" "hadumon_element" NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "hadumon_materials_user_id_element_pk" PRIMARY KEY("user_id","element")
);
--> statement-breakpoint
CREATE TABLE "hadumon_pity_counters" (
	"user_id" uuid NOT NULL,
	"banner_id" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hadumon_pity_counters_user_id_banner_id_pk" PRIMARY KEY("user_id","banner_id")
);
--> statement-breakpoint
CREATE TABLE "hadumon_pulls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seq" bigserial NOT NULL,
	"user_id" uuid NOT NULL,
	"banner_id" text NOT NULL,
	"species_id" text NOT NULL,
	"rarity" "hadumon_rarity" NOT NULL,
	"was_pity" boolean DEFAULT false NOT NULL,
	"creature_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hadumon_expedition_members" (
	"expedition_id" uuid NOT NULL,
	"creature_id" uuid NOT NULL,
	"slot" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "hadumon_expedition_members_expedition_id_creature_id_pk" PRIMARY KEY("expedition_id","creature_id")
);
--> statement-breakpoint
CREATE TABLE "hadumon_expeditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"zone_id" text NOT NULL,
	"status" "hadumon_expedition_status" DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"win_count" integer DEFAULT 0 NOT NULL,
	"loss_count" integer DEFAULT 0 NOT NULL,
	"last_battle_log" jsonb,
	"total_gold" integer DEFAULT 0 NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hadumon_zone_progress" (
	"user_id" uuid NOT NULL,
	"zone_id" text NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "hadumon_zone_progress_user_id_zone_id_pk" PRIMARY KEY("user_id","zone_id")
);
--> statement-breakpoint
CREATE TABLE "hadumon_attack_quota" (
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "hadumon_attack_quota_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE TABLE "hadumon_battles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attacker_id" uuid NOT NULL,
	"defender_id" uuid NOT NULL,
	"winner" "hadumon_battle_winner" NOT NULL,
	"attacker_rating_before" integer NOT NULL,
	"attacker_rating_after" integer NOT NULL,
	"defender_rating_before" integer NOT NULL,
	"defender_rating_after" integer NOT NULL,
	"seed" text NOT NULL,
	"log" jsonb NOT NULL,
	"attacker_team" jsonb NOT NULL,
	"defender_team" jsonb NOT NULL,
	"gold_reward" integer DEFAULT 0 NOT NULL,
	"gem_reward" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hadumon_defense_teams" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"creature_ids" uuid[] NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hadumon_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"creature_id" uuid NOT NULL,
	"price" integer NOT NULL,
	"status" "hadumon_listing_status" DEFAULT 'active' NOT NULL,
	"buyer_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "hadumon_trade_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposer_id" uuid NOT NULL,
	"receiver_id" uuid NOT NULL,
	"proposer_creature_id" uuid NOT NULL,
	"receiver_creature_id" uuid NOT NULL,
	"message" text,
	"status" "hadumon_trade_offer_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "hadumon_sessions" ADD CONSTRAINT "hadumon_sessions_user_id_hadumon_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."hadumon_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_creatures" ADD CONSTRAINT "hadumon_creatures_owner_id_hadumon_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."hadumon_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_materials" ADD CONSTRAINT "hadumon_materials_user_id_hadumon_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."hadumon_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_pity_counters" ADD CONSTRAINT "hadumon_pity_counters_user_id_hadumon_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."hadumon_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_pulls" ADD CONSTRAINT "hadumon_pulls_user_id_hadumon_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."hadumon_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_pulls" ADD CONSTRAINT "hadumon_pulls_creature_id_hadumon_creatures_id_fk" FOREIGN KEY ("creature_id") REFERENCES "public"."hadumon_creatures"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_expedition_members" ADD CONSTRAINT "hadumon_expedition_members_expedition_id_hadumon_expeditions_id_fk" FOREIGN KEY ("expedition_id") REFERENCES "public"."hadumon_expeditions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_expedition_members" ADD CONSTRAINT "hadumon_expedition_members_creature_id_hadumon_creatures_id_fk" FOREIGN KEY ("creature_id") REFERENCES "public"."hadumon_creatures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_expeditions" ADD CONSTRAINT "hadumon_expeditions_user_id_hadumon_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."hadumon_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_zone_progress" ADD CONSTRAINT "hadumon_zone_progress_user_id_hadumon_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."hadumon_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_attack_quota" ADD CONSTRAINT "hadumon_attack_quota_user_id_hadumon_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."hadumon_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_battles" ADD CONSTRAINT "hadumon_battles_attacker_id_hadumon_users_id_fk" FOREIGN KEY ("attacker_id") REFERENCES "public"."hadumon_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_battles" ADD CONSTRAINT "hadumon_battles_defender_id_hadumon_users_id_fk" FOREIGN KEY ("defender_id") REFERENCES "public"."hadumon_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_defense_teams" ADD CONSTRAINT "hadumon_defense_teams_user_id_hadumon_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."hadumon_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_listings" ADD CONSTRAINT "hadumon_listings_seller_id_hadumon_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."hadumon_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_listings" ADD CONSTRAINT "hadumon_listings_creature_id_hadumon_creatures_id_fk" FOREIGN KEY ("creature_id") REFERENCES "public"."hadumon_creatures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_listings" ADD CONSTRAINT "hadumon_listings_buyer_id_hadumon_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."hadumon_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_trade_offers" ADD CONSTRAINT "hadumon_trade_offers_proposer_id_hadumon_users_id_fk" FOREIGN KEY ("proposer_id") REFERENCES "public"."hadumon_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_trade_offers" ADD CONSTRAINT "hadumon_trade_offers_receiver_id_hadumon_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."hadumon_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_trade_offers" ADD CONSTRAINT "hadumon_trade_offers_proposer_creature_id_hadumon_creatures_id_fk" FOREIGN KEY ("proposer_creature_id") REFERENCES "public"."hadumon_creatures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_trade_offers" ADD CONSTRAINT "hadumon_trade_offers_receiver_creature_id_hadumon_creatures_id_fk" FOREIGN KEY ("receiver_creature_id") REFERENCES "public"."hadumon_creatures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "hadumon_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_rating_idx" ON "hadumon_users" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "creatures_owner_id_idx" ON "hadumon_creatures" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "creatures_owner_status_idx" ON "hadumon_creatures" USING btree ("owner_id","status");--> statement-breakpoint
CREATE INDEX "pulls_user_seq_idx" ON "hadumon_pulls" USING btree ("user_id","seq");--> statement-breakpoint
CREATE INDEX "pulls_user_banner_idx" ON "hadumon_pulls" USING btree ("user_id","banner_id");--> statement-breakpoint
CREATE INDEX "expedition_members_creature_idx" ON "hadumon_expedition_members" USING btree ("creature_id");--> statement-breakpoint
CREATE INDEX "expeditions_user_id_idx" ON "hadumon_expeditions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "expeditions_user_status_idx" ON "hadumon_expeditions" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "expeditions_one_active_per_user" ON "hadumon_expeditions" USING btree ("user_id") WHERE "hadumon_expeditions"."status" = 'active';--> statement-breakpoint
CREATE INDEX "battles_attacker_idx" ON "hadumon_battles" USING btree ("attacker_id","created_at");--> statement-breakpoint
CREATE INDEX "battles_defender_idx" ON "hadumon_battles" USING btree ("defender_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "listings_active_creature_uq" ON "hadumon_listings" USING btree ("creature_id") WHERE "hadumon_listings"."status" = 'active';--> statement-breakpoint
CREATE INDEX "listings_status_created_idx" ON "hadumon_listings" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "listings_status_price_idx" ON "hadumon_listings" USING btree ("status","price");--> statement-breakpoint
CREATE INDEX "listings_seller_idx" ON "hadumon_listings" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "listings_buyer_idx" ON "hadumon_listings" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "trade_offers_receiver_status_idx" ON "hadumon_trade_offers" USING btree ("receiver_id","status");--> statement-breakpoint
CREATE INDEX "trade_offers_proposer_status_idx" ON "hadumon_trade_offers" USING btree ("proposer_id","status");--> statement-breakpoint
CREATE INDEX "trade_offers_created_idx" ON "hadumon_trade_offers" USING btree ("created_at");