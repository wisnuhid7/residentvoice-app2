import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { buildingsTable } from "./buildings";
import { usersTable } from "./users";

export const issueCategoriesTable = pgTable("issue_categories", {
  id: serial("id").primaryKey(),
  buildingId: integer("building_id").notNull().references(() => buildingsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const issuesTable = pgTable("issues", {
  id: serial("id").primaryKey(),
  buildingId: integer("building_id").notNull().references(() => buildingsTable.id, { onDelete: "cascade" }),
  createdByUserId: integer("created_by_user_id").notNull().references(() => usersTable.id),
  categoryId: integer("category_id").references(() => issueCategoriesTable.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  locationType: text("location_type").notNull(),
  locationText: text("location_text"),
  urgency: text("urgency").notNull().default("medium"),
  status: text("status").notNull().default("new"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  startedAt: date("started_at", { mode: "string" }),
  affectsSafety: boolean("affects_safety").notNull().default(false),
  affectsMultipleResidents: text("affects_multiple_residents"),
  suggestedSolution: text("suggested_solution"),
  anonymousPublic: boolean("anonymous_public").notNull().default(false),
  duplicateOfIssueId: integer("duplicate_of_issue_id"),
  adminResponse: text("admin_response"),
  estimatedCompletionDate: date("estimated_completion_date", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const issueCommentsTable = pgTable("issue_comments", {
  id: serial("id").primaryKey(),
  issueId: integer("issue_id").notNull().references(() => issuesTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  comment: text("comment").notNull(),
  anonymousPublic: boolean("anonymous_public").notNull().default(false),
  isAdminResponse: boolean("is_admin_response").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const issueVotesTable = pgTable("issue_votes", {
  id: serial("id").primaryKey(),
  issueId: integer("issue_id").notNull().references(() => issuesTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  voteType: text("vote_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const issueStatusHistoryTable = pgTable("issue_status_history", {
  id: serial("id").primaryKey(),
  issueId: integer("issue_id").notNull().references(() => issuesTable.id, { onDelete: "cascade" }),
  changedByUserId: integer("changed_by_user_id").references(() => usersTable.id),
  oldStatus: text("old_status"),
  newStatus: text("new_status").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const solutionsTable = pgTable("solutions", {
  id: serial("id").primaryKey(),
  issueId: integer("issue_id").notNull().references(() => issuesTable.id, { onDelete: "cascade" }),
  createdByUserId: integer("created_by_user_id").notNull().references(() => usersTable.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  estimatedCost: text("estimated_cost"),
  pros: text("pros"),
  cons: text("cons"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const solutionVotesTable = pgTable("solution_votes", {
  id: serial("id").primaryKey(),
  solutionId: integer("solution_id").notNull().references(() => solutionsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertIssueCategorySchema = createInsertSchema(issueCategoriesTable).omit({ id: true, createdAt: true });
export const insertIssueSchema = createInsertSchema(issuesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertIssueCommentSchema = createInsertSchema(issueCommentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertIssueVoteSchema = createInsertSchema(issueVotesTable).omit({ id: true, createdAt: true });
export const insertIssueStatusHistorySchema = createInsertSchema(issueStatusHistoryTable).omit({ id: true, createdAt: true });
export const insertSolutionSchema = createInsertSchema(solutionsTable).omit({ id: true, createdAt: true });
export const insertSolutionVoteSchema = createInsertSchema(solutionVotesTable).omit({ id: true, createdAt: true });

export type IssueCategory = typeof issueCategoriesTable.$inferSelect;
export type Issue = typeof issuesTable.$inferSelect;
export type IssueComment = typeof issueCommentsTable.$inferSelect;
export type IssueVote = typeof issueVotesTable.$inferSelect;
export type IssueStatusHistory = typeof issueStatusHistoryTable.$inferSelect;
export type Solution = typeof solutionsTable.$inferSelect;
export type SolutionVote = typeof solutionVotesTable.$inferSelect;
export type InsertIssue = z.infer<typeof insertIssueSchema>;
