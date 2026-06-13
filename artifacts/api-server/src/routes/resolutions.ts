import { Router } from "express";
import { db } from "@workspace/db";
import {
  resolutionsTable,
  resolutionVotesTable,
  usersTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router({ mergeParams: true });

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) { res.status(401).json({ error: "Unauthenticated" }); return; }
  next();
}

async function getUser(userId: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return user;
}

async function getResolutionDetail(resolutionId: number, userId: number) {
  const [row] = await db.select({
    res: resolutionsTable,
    creator: usersTable,
  }).from(resolutionsTable)
    .leftJoin(usersTable, eq(resolutionsTable.createdByUserId, usersTable.id))
    .where(eq(resolutionsTable.id, resolutionId));

  if (!row) return null;
  const { res, creator } = row;

  const votes = await db.select().from(resolutionVotesTable)
    .where(eq(resolutionVotesTable.resolutionId, resolutionId));

  const yesCount = votes.filter(v => v.vote === "yes").length;
  const noCount = votes.filter(v => v.vote === "no").length;
  const abstainCount = votes.filter(v => v.vote === "abstain").length;
  const totalVotes = votes.length;
  const userVoteRow = votes.find(v => v.userId === userId);
  const passed = res.status === "closed" || res.status === "passed" || res.status === "failed"
    ? (yesCount / Math.max(totalVotes, 1)) * 100 >= res.passPercentage
    : null;

  return {
    id: res.id,
    buildingId: res.buildingId,
    title: res.title,
    description: res.description,
    proposedAction: res.proposedAction,
    votingType: res.votingType,
    eligibleVoters: res.eligibleVoters,
    oneVotePerUnit: res.oneVotePerUnit,
    passPercentage: res.passPercentage,
    status: res.status,
    relatedIssueId: res.relatedIssueId,
    votingStartAt: res.votingStartAt?.toISOString() ?? null,
    votingEndAt: res.votingEndAt?.toISOString() ?? null,
    createdBy: creator?.fullName ?? "Resident",
    createdAt: res.createdAt.toISOString(),
    updatedAt: res.updatedAt.toISOString(),
    yesCount,
    noCount,
    abstainCount,
    totalVotes,
    totalEligible: 0,
    passed,
    userVote: userVoteRow?.vote ?? null,
  };
}

router.get("/", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const user = await getUser((req.session as any).userId);
  if (!user || (user.buildingId !== buildingId && user.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  let query = db.select({
    res: resolutionsTable,
    creator: usersTable,
  }).from(resolutionsTable)
    .leftJoin(usersTable, eq(resolutionsTable.createdByUserId, usersTable.id))
    .where(eq(resolutionsTable.buildingId, buildingId))
    .orderBy(desc(resolutionsTable.createdAt));

  const rows = await query;
  const filtered = req.query.status
    ? rows.filter(r => r.res.status === req.query.status)
    : rows;

  res.json(filtered.map(({ res, creator }) => ({
    id: res.id,
    buildingId: res.buildingId,
    title: res.title,
    description: res.description,
    proposedAction: res.proposedAction,
    votingType: res.votingType,
    eligibleVoters: res.eligibleVoters,
    oneVotePerUnit: res.oneVotePerUnit,
    passPercentage: res.passPercentage,
    status: res.status,
    relatedIssueId: res.relatedIssueId,
    votingStartAt: res.votingStartAt?.toISOString() ?? null,
    votingEndAt: res.votingEndAt?.toISOString() ?? null,
    createdBy: creator?.fullName ?? "Resident",
    createdAt: res.createdAt.toISOString(),
    updatedAt: res.updatedAt.toISOString(),
  })));
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

  const [r] = await db.insert(resolutionsTable).values({
    buildingId,
    createdByUserId: user.id,
    relatedIssueId: req.body.relatedIssueId ?? null,
    title: req.body.title,
    description: req.body.description,
    proposedAction: req.body.proposedAction,
    votingType: req.body.votingType ?? "informal",
    eligibleVoters: req.body.eligibleVoters ?? "all_residents",
    oneVotePerUnit: Boolean(req.body.oneVotePerUnit),
    passPercentage: Number(req.body.passPercentage ?? 50),
    status: "draft",
    votingEndAt: req.body.votingEndAt ? new Date(req.body.votingEndAt) : null,
  }).returning();

  const detail = await getResolutionDetail(r.id, user.id);
  res.status(201).json(detail);
});

router.get("/:resolutionId", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const resolutionId = Number((req.params as any).resolutionId);
  const user = await getUser((req.session as any).userId);
  if (!user || (user.buildingId !== buildingId && user.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const detail = await getResolutionDetail(resolutionId, user.id);
  if (!detail) { res.status(404).json({ error: "Not found" }); return; }
  res.json(detail);
});

router.post("/:resolutionId/vote", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const resolutionId = Number((req.params as any).resolutionId);
  const user = await getUser((req.session as any).userId);
  if (!user || (user.buildingId !== buildingId && user.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  if (user.verificationStatus !== "verified" && user.role !== "super_admin") {
    res.status(403).json({ error: "Account not verified" }); return;
  }

  const [res2] = await db.select().from(resolutionsTable).where(eq(resolutionsTable.id, resolutionId));
  if (!res2 || res2.status !== "open") {
    res.status(400).json({ error: "Voting is not open" }); return;
  }

  const existing = await db.select().from(resolutionVotesTable)
    .where(and(eq(resolutionVotesTable.resolutionId, resolutionId), eq(resolutionVotesTable.userId, user.id)));

  if (existing.length > 0) {
    await db.update(resolutionVotesTable).set({ vote: req.body.vote })
      .where(and(eq(resolutionVotesTable.resolutionId, resolutionId), eq(resolutionVotesTable.userId, user.id)));
  } else {
    await db.insert(resolutionVotesTable).values({
      resolutionId,
      userId: user.id,
      apartmentNumber: user.apartmentNumber,
      vote: req.body.vote,
      comment: req.body.comment ?? null,
    });
  }

  const votes = await db.select().from(resolutionVotesTable)
    .where(eq(resolutionVotesTable.resolutionId, resolutionId));
  const count = votes.length;
  const hasVoted = true;
  res.json({ count, hasVoted, voteType: req.body.vote });
});

router.patch("/:resolutionId/status", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const resolutionId = Number((req.params as any).resolutionId);
  const user = await getUser((req.session as any).userId);
  if (!user || (user.buildingId !== buildingId && user.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  if (!["super_admin", "building_admin"].includes(user.role)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const updates: Record<string, any> = { status: req.body.status };
  if (req.body.status === "open") updates.votingStartAt = new Date();

  await db.update(resolutionsTable).set(updates).where(eq(resolutionsTable.id, resolutionId));

  const [updated] = await db.select().from(resolutionsTable).where(eq(resolutionsTable.id, resolutionId));
  const creator = await getUser(updated.createdByUserId);

  res.json({
    id: updated.id,
    buildingId: updated.buildingId,
    title: updated.title,
    description: updated.description,
    proposedAction: updated.proposedAction,
    votingType: updated.votingType,
    eligibleVoters: updated.eligibleVoters,
    oneVotePerUnit: updated.oneVotePerUnit,
    passPercentage: updated.passPercentage,
    status: updated.status,
    relatedIssueId: updated.relatedIssueId,
    votingStartAt: updated.votingStartAt?.toISOString() ?? null,
    votingEndAt: updated.votingEndAt?.toISOString() ?? null,
    createdBy: creator?.fullName ?? "Resident",
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

export default router;
