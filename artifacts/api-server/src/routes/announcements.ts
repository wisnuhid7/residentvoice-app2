import { Router } from "express";
import { db } from "@workspace/db";
import {
  announcementsTable,
  notificationsTable,
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

function formatAnnouncement(a: typeof announcementsTable.$inferSelect, creatorName?: string) {
  return {
    id: a.id,
    buildingId: a.buildingId,
    title: a.title,
    message: a.message,
    category: a.category,
    priority: a.priority,
    publishAt: a.publishAt?.toISOString() ?? null,
    expireAt: a.expireAt?.toISOString() ?? null,
    createdBy: creatorName ?? null,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const user = await getUser((req.session as any).userId);
  if (!user || (user.buildingId !== buildingId && user.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const rows = await db.select({
    a: announcementsTable,
    creator: usersTable,
  }).from(announcementsTable)
    .leftJoin(usersTable, eq(announcementsTable.createdByUserId, usersTable.id))
    .where(eq(announcementsTable.buildingId, buildingId))
    .orderBy(desc(announcementsTable.createdAt));

  res.json(rows.map(({ a, creator }) => formatAnnouncement(a, creator?.fullName)));
});

router.post("/", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const user = await getUser((req.session as any).userId);
  if (!user || (user.buildingId !== buildingId && user.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  if (!["super_admin", "building_admin", "moderator"].includes(user.role)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const [a] = await db.insert(announcementsTable).values({
    buildingId,
    createdByUserId: user.id,
    title: req.body.title,
    message: req.body.message,
    category: req.body.category ?? "general",
    priority: req.body.priority ?? null,
    publishAt: req.body.publishAt ? new Date(req.body.publishAt) : null,
    expireAt: req.body.expireAt ? new Date(req.body.expireAt) : null,
  }).returning();

  res.status(201).json(formatAnnouncement(a, user.fullName));
});

router.delete("/:announcementId", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const announcementId = Number((req.params as any).announcementId);
  const user = await getUser((req.session as any).userId);
  if (!user || (user.buildingId !== buildingId && user.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  if (!["super_admin", "building_admin", "moderator"].includes(user.role)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  await db.delete(announcementsTable)
    .where(and(eq(announcementsTable.id, announcementId), eq(announcementsTable.buildingId, buildingId)));
  res.status(204).send();
});

// ─── Notifications ────────────────────────────────────────────────────────────

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const user = await getUser((req.session as any).userId);
  if (!user || (user.buildingId !== buildingId && user.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const notifications = await db.select().from(notificationsTable)
    .where(and(eq(notificationsTable.userId, user.id), eq(notificationsTable.buildingId, buildingId)))
    .orderBy(desc(notificationsTable.createdAt));

  res.json(notifications.map(n => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  })));
});

router.post("/notifications/read-all", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const user = await getUser((req.session as any).userId);
  if (!user) { res.status(401).json({ error: "Unauthenticated" }); return; }

  await db.update(notificationsTable)
    .set({ readAt: new Date() })
    .where(and(eq(notificationsTable.userId, user.id), eq(notificationsTable.buildingId, buildingId)));

  res.json({ success: true });
});

export default router;
