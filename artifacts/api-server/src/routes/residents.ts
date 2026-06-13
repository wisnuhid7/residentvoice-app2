import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router({ mergeParams: true });

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) { res.status(401).json({ error: "Unauthenticated" }); return; }
  next();
}

async function getUser(userId: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return user;
}

function formatResident(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
    role: u.role,
    verificationStatus: u.verificationStatus,
    apartmentNumber: u.apartmentNumber,
    floor: u.floor,
    residentType: u.residentType,
    createdAt: u.createdAt.toISOString(),
  };
}

router.get("/", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const user = await getUser((req.session as any).userId);
  if (!user || (user.buildingId !== buildingId && user.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  if (!["super_admin", "building_admin", "moderator"].includes(user.role)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const conditions: any[] = [eq(usersTable.buildingId, buildingId)];
  if (req.query.status) {
    conditions.push(eq(usersTable.verificationStatus, req.query.status as string));
  }

  const residents = await db.select().from(usersTable)
    .where(and(...conditions))
    .orderBy(usersTable.createdAt);

  res.json(residents.map(formatResident));
});

router.patch("/:userId/status", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const userId = Number((req.params as any).userId);
  const { status, reason } = req.body;

  const actor = await getUser((req.session as any).userId);
  if (!actor || (actor.buildingId !== buildingId && actor.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  if (!["super_admin", "building_admin"].includes(actor.role)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const [updated] = await db.update(usersTable)
    .set({ verificationStatus: status })
    .where(and(eq(usersTable.id, userId), eq(usersTable.buildingId, buildingId)))
    .returning();

  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  res.json(formatResident(updated));
});

export default router;
