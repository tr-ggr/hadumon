CREATE TABLE "hadumon_cards" (
	"user_id" uuid NOT NULL,
	"cat_id" text NOT NULL,
	"copies" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "hadumon_cards_user_id_cat_id_pk" PRIMARY KEY("user_id","cat_id"),
	CONSTRAINT "cards_copies_not_negative" CHECK ("hadumon_cards"."copies" >= 0)
);
--> statement-breakpoint
CREATE TABLE "hadumon_cosmetics" (
	"user_id" uuid NOT NULL,
	"cosmetic_id" text NOT NULL,
	"gained_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hadumon_cosmetics_user_id_cosmetic_id_pk" PRIMARY KEY("user_id","cosmetic_id")
);
--> statement-breakpoint
CREATE TABLE "hadumon_decks" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"cards" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hadumon_pack_opens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"request_id" text NOT NULL,
	"pack_id" text NOT NULL,
	"price" integer NOT NULL,
	"result" jsonb NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hadumon_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"coins" integer DEFAULT 0 NOT NULL,
	"look" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"run_ticket" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_coins_not_negative" CHECK ("hadumon_profiles"."coins" >= 0)
);
--> statement-breakpoint
ALTER TABLE "hadumon_runs" ADD COLUMN "coins" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "hadumon_cards" ADD CONSTRAINT "hadumon_cards_user_id_hadumon_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."hadumon_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_cosmetics" ADD CONSTRAINT "hadumon_cosmetics_user_id_hadumon_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."hadumon_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_decks" ADD CONSTRAINT "hadumon_decks_user_id_hadumon_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."hadumon_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_pack_opens" ADD CONSTRAINT "hadumon_pack_opens_user_id_hadumon_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."hadumon_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadumon_profiles" ADD CONSTRAINT "hadumon_profiles_user_id_hadumon_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."hadumon_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pack_opens_user_request_idx" ON "hadumon_pack_opens" USING btree ("user_id","request_id");--> statement-breakpoint
CREATE INDEX "pack_opens_user_opened_idx" ON "hadumon_pack_opens" USING btree ("user_id","opened_at");