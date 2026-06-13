import { Router } from "express";
import { db } from "@workspace/db";
import {
  issuesTable,
  issueCategoriesTable,
  issueVotesTable,
  issueCommentsTable,
  resolutionsTable,
  announcementsTable,
  usersTable,
} from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";

const router = Router({ mergeParams: true });

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) { res.status(401).json({ error: "Unauthenticated" }); return; }
  next();
}

async function getUser(userId: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return user;
}

router.get("/", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const user = await getUser((req.session as any).userId);
  if (!user || (user.buildingId !== buildingId && user.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const isAdmin = ["super_admin", "building_admin", "moderator"].includes(user.role);

  const allIssues = await db.select({
    issue: issuesTable,
    category: issueCategoriesTable,
    creator: usersTable,
  }).from(issuesTable)
    .leftJoin(issueCategoriesTable, eq(issuesTable.categoryId, issueCategoriesTable.id))
    .leftJoin(usersTable, eq(issuesTable.createdByUserId, usersTable.id))
    .where(eq(issuesTable.buildingId, buildingId));

  const openIssueCount = allIssues.filter(r => !["resolved", "rejected"].includes(r.issue.status)).length;
  const resolvedIssueCount = allIssues.filter(r => r.issue.status === "resolved").length;

  const issueWithVotes = await Promise.all(allIssues.map(async ({ issue, category, creator }) => {
    const votes = await db.select().from(issueVotesTable).where(eq(issueVotesTable.issueId, issue.id));
    const [commentRow] = await db.select({ c: count() }).from(issueCommentsTable).where(eq(issueCommentsTable.issueId, issue.id));
    return {
      issue,
      category,
      creator,
      voteCount: votes.filter(v => v.voteType === "important").length,
      affectedCount: votes.filter(v => v.voteType === "affected").length,
      commentCount: Number(commentRow?.c ?? 0),
      hasVoted: votes.some(v => v.userId === user.id && v.voteType === "important"),
      isAffected: votes.some(v => v.userId === user.id && v.voteType === "affected"),
    };
  }));

  const formatIssueSummary = (r: any) => ({
    id: r.issue.id,
    buildingId: r.issue.buildingId,
    title: r.issue.title,
    urgency: r.issue.urgency,
    status: r.issue.status,
    categoryName: r.category?.name ?? null,
    categoryColor: r.category?.color ?? null,
    voteCount: r.voteCount,
    commentCount: r.commentCount,
    affectedCount: r.affectedCount,
    createdAt: r.issue.createdAt.toISOString(),
    submittedBy: (r.issue.anonymousPublic && !isAdmin)
      ? `Verified Resident, Floor ${r.creator?.floor ?? "?"}`
      : (r.creator?.fullName ?? "Resident"),
    hasVoted: r.hasVoted,
    isAffected: r.isAffected,
  });

  const urgencyOrder: Record<string, number> = { emergency: 0, high: 1, medium: 2, low: 3 };
  const topIssues = [...issueWithVotes]
    .filter(r => !["resolved", "rejected"].includes(r.issue.status))
    .sort((a, b) => (b.voteCount * 3 + b.affectedCount * 2) - (a.voteCount * 3 + a.affectedCount * 2))
    .slice(0, 10)
    .map(formatIssueSummary);

  const recentIssues = [...issueWithVotes]
    .sort((a, b) => b.issue.createdAt.getTime() - a.issue.createdAt.getTime())
    .slice(0, 5)
    .map(formatIssueSummary);

  const [residentCountRow] = await db.select({ c: count() }).from(usersTable)
    .where(and(eq(usersTable.buildingId, buildingId), eq(usersTable.verificationStatus, "verified")));
  const residentCount = Number(residentCountRow?.c ?? 0);

  const [activeResCount] = await db.select({ c: count() }).from(resolutionsTable)
    .where(and(eq(resolutionsTable.buildingId, buildingId), eq(resolutionsTable.status, "open")));
  const activeResolutionCount = Number(activeResCount?.c ?? 0);

  const recentAnnouncementsRaw = await db.select({
    a: announcementsTable,
    creator: usersTable,
  }).from(announcementsTable)
    .leftJoin(usersTable, eq(announcementsTable.createdByUserId, usersTable.id))
    .where(eq(announcementsTable.buildingId, buildingId))
    .orderBy(desc(announcementsTable.createdAt))
    .limit(3);

  const recentAnnouncements = recentAnnouncementsRaw.map(({ a, creator }) => ({
    id: a.id,
    buildingId: a.buildingId,
    title: a.title,
    message: a.message,
    category: a.category,
    priority: a.priority,
    publishAt: a.publishAt?.toISOString() ?? null,
    expireAt: a.expireAt?.toISOString() ?? null,
    createdBy: creator?.fullName ?? null,
    createdAt: a.createdAt.toISOString(),
  }));

  // Aggregate by category
  const categoryMap = new Map<string, number>();
  issueWithVotes.forEach(r => {
    const cat = r.category?.name ?? "Other";
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1);
  });
  const issuesByCategory = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const statusMap = new Map<string, number>();
  issueWithVotes.forEach(r => {
    statusMap.set(r.issue.status, (statusMap.get(r.issue.status) ?? 0) + 1);
  });
  const issuesByStatus = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }));

  res.json({
    topIssues,
    recentIssues,
    openIssueCount,
    resolvedIssueCount,
    residentCount,
    activeResolutionCount,
    recentAnnouncements,
    issuesByCategory,
    issuesByStatus,
  });
});

export default router;
