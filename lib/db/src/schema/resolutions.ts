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
import { buildingsTable } from "./buildings";
import { usersTable } from "./users";

export const resolutionsTable = pgTable("resolutions", {
  id: serial("id").primaryKey(),
  buildingId: integer("building_id").notNull().references(() => buildingsTable.id, { onDelete: "cascade" }),
  createdByUserId: integer("created_by_user_id").notNull().references(() => usersTable.id),
  relatedIssueId: integer("related_issue_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  proposedAction: text("proposed_action").notNull(),
  votingType: text("voting_type").notNull().default("informal"),
  eligibleVoters: text("eligible_voters").notNull().default("all_residents"),
  oneVotePerUnit: boolean("one_vote_per_unit").notNull().default(false),
  passPercentage: integer("pass_percentage").notNull().default(50),
  status: text("status").notNull().default("draft"),
  votingStartAt: timestamp("voting_start_at", { withTimezone: true }),
  votingEndAt: timestamp("voting_end_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const resolutionVotesTable = pgTable("resolution_votes", {
  id: serial("id").primaryKey(),
  resolutionId: integer("resolution_id").notNull().references(() => resolutionsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  apartmentNumber: text("apartment_number"),
  vote: text("vote").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertResolutionSchema = createInsertSchema(resolutionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertResolutionVoteSchema = createInsertSchema(resolutionVotesTable).omit({ id: true, createdAt: true });

export type Resolution = typeof resolutionsTable.$inferSelect;
export type ResolutionVote = typeof resolutionVotesTable.$inferSelect;
export type InsertResolution = z.infer<typeof insertResolutionSchema>;
