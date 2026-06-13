import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const buildingsTable = pgTable("buildings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  address: text("address"),
  city: text("city").notNull(),
  state: text("state"),
  country: text("country").notNull(),
  timezone: text("timezone"),
  numberOfUnits: integer("number_of_units"),
  numberOfFloors: integer("number_of_floors"),
  buildingType: text("building_type"),
  logoUrl: text("logo_url"),
  photoUrl: text("photo_url"),
  status: text("status").notNull().default("active"),
  plan: text("plan").notNull().default("free"),
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const buildingSettingsTable = pgTable("building_settings", {
  id: serial("id").primaryKey(),
  buildingId: integer("building_id").notNull().references(() => buildingsTable.id, { onDelete: "cascade" }),
  verificationMethod: text("verification_method").notNull().default("manual_approval"),
  allowTenantOfficialVotes: boolean("allow_tenant_official_votes").notNull().default(false),
  oneVotePerUnit: boolean("one_vote_per_unit").notNull().default(false),
  passPercentage: integer("pass_percentage").notNull().default(50),
  allowAnonymousPosts: boolean("allow_anonymous_posts").notNull().default(true),
  inviteCode: text("invite_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBuildingSchema = createInsertSchema(buildingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBuildingSettingsSchema = createInsertSchema(buildingSettingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Building = typeof buildingsTable.$inferSelect;
export type InsertBuilding = z.infer<typeof insertBuildingSchema>;
export type BuildingSettings = typeof buildingSettingsTable.$inferSelect;
export type InsertBuildingSettings = z.infer<typeof insertBuildingSettingsSchema>;
