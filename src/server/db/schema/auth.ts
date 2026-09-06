import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { createTable } from "./_table";

/**
 * Trainers. `username` is always stored lowercase (it is the unique login key);
 * `displayName` keeps whatever casing the player typed at signup.
 */
export const users = createTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: text("username").notNull().unique(),
    displayName: text("display_name").notNull(),
    passwordHash: text("password_hash").notNull(),
    gold: integer("gold").notNull().default(500),
    gems: integer("gems").notNull().default(1000),
    rating: integer("rating").notNull().default(1000),
    isBot: boolean("is_bot").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("users_rating_idx").on(t.rating)],
);

/** Opaque session tokens (32 random bytes, hex) stored server-side. */
export const sessions = createTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
