import { Router } from "express";
import { db } from "@workspace/db";
import {
  issuesTable,
  issueCategoriesTable,
  issueCommentsTable,
  issueVotesTable,
  issueStatusHistoryTable,
  solutionsTable,
  solutionVotesTable,
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

// ─── Categories ─────────────────────────────────────────────────────────────
// Mounted at both /buildings/:buildingId/categories AND /buildings/:buildingId/issues/categories

router.get("/categories", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const cats = await db.select().from(issueCategoriesTable)
    .where(eq(issueCategoriesTable.buildingId, buildingId))
    .orderBy(issueCategoriesTable.name);
  res.json(cats.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })));
});

router.post("/categories", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const user = await getUser((req.session as any).userId);
  if (!user || (user.buildingId !== buildingId && user.role !== "super_admin")
    || !["building_admin", "moderator", "super_admin"].includes(user.role)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const [cat] = await db.insert(issueCategoriesTable).values({
    buildingId,
    name: req.body.name,
    description: req.body.description,
    color: req.body.color,
  }).returning();
  res.status(201).json({ ...cat, createdAt: cat.createdAt.toISOString() });
});

// ─── Issues ─────────────────────────────────────────────────────────────────

async function getVoteCounts(issueId: number, userId?: number) {
  const votes = await db.select().from(issueVotesTable).where(eq(issueVotesTable.issueId, issueId));
  return {
    voteCount: votes.filter(v => v.voteType === "important").length,
    affectedCount: votes.filter(v => v.voteType === "affected").length,
    hasVoted: userId ? votes.some(v => v.userId === userId && v.voteType === "important") : false,
    isAffected: userId ? votes.some(v => v.userId === userId && v.voteType === "affected") : false,
  };
}

async function getCommentCount(issueId: number) {
  const [row] = await db.select({ c: count() }).from(issueCommentsTable)
    .where(eq(issueCommentsTable.issueId, issueId));
  return Number(row?.c ?? 0);
}

router.get("/", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const user = await getUser((req.session as any).userId);
  if (!user || (user.buildingId !== buildingId && user.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const isAdmin = ["super_admin", "building_admin", "moderator"].includes(user.role);

  let rows = await db.select({
    issue: issuesTable,
    category: issueCategoriesTable,
    creator: usersTable,
  }).from(issuesTable)
    .leftJoin(issueCategoriesTable, eq(issuesTable.categoryId, issueCategoriesTable.id))
    .leftJoin(usersTable, eq(issuesTable.createdByUserId, usersTable.id))
    .where(eq(issuesTable.buildingId, buildingId))
    .orderBy(desc(issuesTable.createdAt));

  if (req.query.status) rows = rows.filter(r => r.issue.status === req.query.status);
  if (req.query.urgency) rows = rows.filter(r => r.issue.urgency === req.query.urgency);
  if (req.query.categoryId) rows = rows.filter(r => r.issue.categoryId === Number(req.query.categoryId));

  const result = await Promise.all(rows.map(async ({ issue, category, creator }) => {
    const { voteCount, affectedCount, hasVoted, isAffected } = await getVoteCounts(issue.id, user.id);
    const commentCount = await getCommentCount(issue.id);
    return {
      id: issue.id,
      buildingId: issue.buildingId,
      title: issue.title,
      urgency: issue.urgency,
      status: issue.status,
      categoryName: category?.name ?? null,
      categoryColor: category?.color ?? null,
      voteCount,
      commentCount,
      affectedCount,
      createdAt: issue.createdAt.toISOString(),
      submittedBy: (issue.anonymousPublic && !isAdmin)
        ? `Verified Resident, Floor ${creator?.floor ?? "?"}`
        : (creator?.fullName ?? "Resident"),
      hasVoted,
      isAffected,
    };
  }));

  const urgencyOrder: Record<string, number> = { emergency: 0, high: 1, medium: 2, low: 3 };
  if (req.query.sort === "most_voted") result.sort((a, b) => b.voteCount - a.voteCount);
  else if (req.query.sort === "most_commented") result.sort((a, b) => b.commentCount - a.commentCount);
  else if (req.query.sort === "urgent") result.sort((a, b) => (urgencyOrder[a.urgency] ?? 4) - (urgencyOrder[b.urgency] ?? 4));

  res.json(result);
});

router.post("/", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const user = await getUser((req.session as any).userId);
  if (!user || (user.buildingId !== buildingId && user.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  if (user.verificationStatus !== "verified" && user.role !== "super_admin") {
    res.status(403).json({ error: "Account not verified" }); return;
  }

  const [issue] = await db.insert(issuesTable).values({
    buildingId,
    createdByUserId: user.id,
    categoryId: req.body.categoryId ?? null,
    title: req.body.title,
    description: req.body.description,
    locationType: req.body.locationType,
    locationText: req.body.locationText ?? null,
    urgency: req.body.urgency ?? "medium",
    status: "new",
    isRecurring: Boolean(req.body.isRecurring),
    startedAt: req.body.startedAt ?? null,
    affectsSafety: Boolean(req.body.affectsSafety),
    affectsMultipleResidents: req.body.affectsMultipleResidents ?? null,
    suggestedSolution: req.body.suggestedSolution ?? null,
    anonymousPublic: Boolean(req.body.anonymousPublic),
  }).returning();

  await db.insert(issueStatusHistoryTable).values({
    issueId: issue.id,
    changedByUserId: user.id,
    oldStatus: null,
    newStatus: "new",
    note: "Issue submitted",
  });

  const detail = await getIssueDetail(issue.id, user);
  res.status(201).json(detail);
});

router.get("/:issueId", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const issueId = Number((req.params as any).issueId);
  if (isNaN(issueId)) { res.status(404).json({ error: "Not found" }); return; }
  const user = await getUser((req.session as any).userId);
  if (!user || (user.buildingId !== buildingId && user.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const issue = await getIssueDetail(issueId, user);
  if (!issue) { res.status(404).json({ error: "Not found" }); return; }
  res.json(issue);
});

async function getIssueDetail(issueId: number, user: typeof usersTable.$inferSelect) {
  const [row] = await db.select({
    issue: issuesTable,
    category: issueCategoriesTable,
    creator: usersTable,
  }).from(issuesTable)
    .leftJoin(issueCategoriesTable, eq(issuesTable.categoryId, issueCategoriesTable.id))
    .leftJoin(usersTable, eq(issuesTable.createdByUserId, usersTable.id))
    .where(eq(issuesTable.id, issueId));
  if (!row) return null;
  const { issue, category, creator } = row;
  const { voteCount, affectedCount, hasVoted, isAffected } = await getVoteCounts(issue.id, user.id);
  const commentCount = await getCommentCount(issue.id);
  const isAdmin = ["super_admin", "building_admin", "moderator"].includes(user.role);
  return {
    id: issue.id,
    buildingId: issue.buildingId,
    title: issue.title,
    description: issue.description,
    status: issue.status,
    urgency: issue.urgency,
    locationType: issue.locationType,
    locationText: issue.locationText,
    categoryId: issue.categoryId,
    categoryName: category?.name ?? null,
    categoryColor: category?.color ?? null,
    isRecurring: issue.isRecurring,
    startedAt: issue.startedAt ?? null,
    affectsSafety: issue.affectsSafety,
    affectsMultipleResidents: issue.affectsMultipleResidents,
    suggestedSolution: issue.suggestedSolution,
    anonymousPublic: issue.anonymousPublic,
    voteCount,
    commentCount,
    affectedCount,
    hasVoted,
    isAffected,
    submittedBy: (issue.anonymousPublic && !isAdmin)
      ? `Verified Resident, Floor ${creator?.floor ?? "?"}`
      : (creator?.fullName ?? "Resident"),
    submittedByFloor: creator?.floor ?? null,
    adminResponse: issue.adminResponse,
    estimatedCompletionDate: issue.estimatedCompletionDate ?? null,
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
  };
}

router.patch("/:issueId", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const issueId = Number((req.params as any).issueId);
  const user = await getUser((req.session as any).userId);
  if (!user || (user.buildingId !== buildingId && user.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  if (!["super_admin", "building_admin", "moderator"].includes(user.role)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const [current] = await db.select().from(issuesTable)
    .where(and(eq(issuesTable.id, issueId), eq(issuesTable.buildingId, buildingId)));
  if (!current) { res.status(404).json({ error: "Not found" }); return; }

  const updates: Record<string, any> = {};
  for (const k of ["status", "urgency", "adminResponse", "estimatedCompletionDate"]) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }
  await db.update(issuesTable).set(updates).where(eq(issuesTable.id, issueId));

  if (req.body.status && req.body.status !== current.status) {
    await db.insert(issueStatusHistoryTable).values({
      issueId,
      changedByUserId: user.id,
      oldStatus: current.status,
      newStatus: req.body.status,
      note: req.body.note ?? null,
    });
  }
  res.json(await getIssueDetail(issueId, user));
});

router.post("/:issueId/vote", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const issueId = Number((req.params as any).issueId);
  const user = await getUser((req.session as any).userId);
  if (!user || (user.buildingId !== buildingId && user.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const voteType = req.body.voteType;
  const existing = await db.select().from(issueVotesTable)
    .where(and(eq(issueVotesTable.issueId, issueId), eq(issueVotesTable.userId, user.id), eq(issueVotesTable.voteType, voteType)));

  if (existing.length > 0) {
    await db.delete(issueVotesTable)
      .where(and(eq(issueVotesTable.issueId, issueId), eq(issueVotesTable.userId, user.id), eq(issueVotesTable.voteType, voteType)));
  } else {
    await db.insert(issueVotesTable).values({ issueId, userId: user.id, voteType });
  }
  const counts = await getVoteCounts(issueId, user.id);
  const c = voteType === "important" ? counts.voteCount : counts.affectedCount;
  const hasVoted = voteType === "important" ? counts.hasVoted : counts.isAffected;
  res.json({ count: c, hasVoted, voteType });
});

router.get("/:issueId/comments", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const issueId = Number((req.params as any).issueId);
  const user = await getUser((req.session as any).userId);
  if (!user || (user.buildingId !== buildingId && user.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const isAdmin = ["super_admin", "building_admin", "moderator"].includes(user.role);
  const comments = await db.select({ comment: issueCommentsTable, author: usersTable })
    .from(issueCommentsTable)
    .leftJoin(usersTable, eq(issueCommentsTable.userId, usersTable.id))
    .where(eq(issueCommentsTable.issueId, issueId))
    .orderBy(issueCommentsTable.createdAt);
  res.json(comments.map(({ comment, author }) => ({
    id: comment.id,
    issueId: comment.issueId,
    comment: comment.comment,
    anonymousPublic: comment.anonymousPublic,
    authorName: (comment.anonymousPublic && !isAdmin)
      ? (comment.isAdminResponse ? "Building Administration" : "Verified Resident")
      : (author?.fullName ?? "Resident"),
    authorRole: comment.isAdminResponse ? "admin" : (author?.role ?? "resident"),
    isAdminResponse: comment.isAdminResponse,
    createdAt: comment.createdAt.toISOString(),
  })));
});

router.post("/:issueId/comments", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const issueId = Number((req.params as any).issueId);
  const user = await getUser((req.session as any).userId);
  if (!user || (user.buildingId !== buildingId && user.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const isAdmin = ["super_admin", "building_admin", "moderator"].includes(user.role);
  const [comment] = await db.insert(issueCommentsTable).values({
    issueId,
    userId: user.id,
    comment: req.body.comment,
    anonymousPublic: Boolean(req.body.anonymousPublic),
    isAdminResponse: isAdmin,
  }).returning();
  res.status(201).json({
    id: comment.id,
    issueId: comment.issueId,
    comment: comment.comment,
    anonymousPublic: comment.anonymousPublic,
    authorName: isAdmin ? "Building Administration" : user.fullName,
    authorRole: user.role,
    isAdminResponse: comment.isAdminResponse,
    createdAt: comment.createdAt.toISOString(),
  });
});

router.get("/:issueId/status-history", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const issueId = Number((req.params as any).issueId);
  const user = await getUser((req.session as any).userId);
  if (!user || (user.buildingId !== buildingId && user.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const history = await db.select({ h: issueStatusHistoryTable, changer: usersTable })
    .from(issueStatusHistoryTable)
    .leftJoin(usersTable, eq(issueStatusHistoryTable.changedByUserId, usersTable.id))
    .where(eq(issueStatusHistoryTable.issueId, issueId))
    .orderBy(issueStatusHistoryTable.createdAt);
  res.json(history.map(({ h, changer }) => ({
    id: h.id,
    issueId: h.issueId,
    oldStatus: h.oldStatus,
    newStatus: h.newStatus,
    note: h.note,
    changedBy: changer?.fullName ?? "System",
    changedByRole: changer?.role ?? "system",
    createdAt: h.createdAt.toISOString(),
  })));
});

// ─── Solutions ───────────────────────────────────────────────────────────────

router.get("/:issueId/solutions", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const issueId = Number((req.params as any).issueId);
  const user = await getUser((req.session as any).userId);
  if (!user || (user.buildingId !== buildingId && user.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const solutions = await db.select({ s: solutionsTable, creator: usersTable })
    .from(solutionsTable)
    .leftJoin(usersTable, eq(solutionsTable.createdByUserId, usersTable.id))
    .where(eq(solutionsTable.issueId, issueId))
    .orderBy(desc(solutionsTable.createdAt));
  const result = await Promise.all(solutions.map(async ({ s, creator }) => {
    const votes = await db.select().from(solutionVotesTable).where(eq(solutionVotesTable.solutionId, s.id));
    return {
      id: s.id,
      issueId: s.issueId,
      title: s.title,
      description: s.description,
      estimatedCost: s.estimatedCost,
      pros: s.pros,
      cons: s.cons,
      voteCount: votes.length,
      hasVoted: votes.some(v => v.userId === user.id),
      createdBy: creator?.fullName ?? "Resident",
      createdAt: s.createdAt.toISOString(),
    };
  }));
  res.json(result);
});

router.post("/:issueId/solutions", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const issueId = Number((req.params as any).issueId);
  const user = await getUser((req.session as any).userId);
  if (!user || (user.buildingId !== buildingId && user.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const [s] = await db.insert(solutionsTable).values({
    issueId,
    createdByUserId: user.id,
    title: req.body.title,
    description: req.body.description,
    estimatedCost: req.body.estimatedCost ?? null,
    pros: req.body.pros ?? null,
    cons: req.body.cons ?? null,
  }).returning();
  res.status(201).json({
    id: s.id, issueId: s.issueId, title: s.title, description: s.description,
    estimatedCost: s.estimatedCost, pros: s.pros, cons: s.cons,
    voteCount: 0, hasVoted: false, createdBy: user.fullName,
    createdAt: s.createdAt.toISOString(),
  });
});

router.post("/:issueId/solutions/:solutionId/vote", requireAuth, async (req, res): Promise<void> => {
  const user = await getUser((req.session as any).userId);
  if (!user) { res.status(401).json({ error: "Unauthenticated" }); return; }
  const solutionId = Number((req.params as any).solutionId);
  const existing = await db.select().from(solutionVotesTable)
    .where(and(eq(solutionVotesTable.solutionId, solutionId), eq(solutionVotesTable.userId, user.id)));
  if (existing.length > 0) {
    await db.delete(solutionVotesTable)
      .where(and(eq(solutionVotesTable.solutionId, solutionId), eq(solutionVotesTable.userId, user.id)));
    const votes = await db.select().from(solutionVotesTable).where(eq(solutionVotesTable.solutionId, solutionId));
    res.json({ count: votes.length, hasVoted: false, voteType: null });
    return;
  }
  await db.insert(solutionVotesTable).values({ solutionId, userId: user.id });
  const votes = await db.select().from(solutionVotesTable).where(eq(solutionVotesTable.solutionId, solutionId));
  res.json({ count: votes.length, hasVoted: true, voteType: null });
});

export default router;
