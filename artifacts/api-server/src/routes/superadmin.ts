import { Router } from "express";
import { db } from "@workspace/db";
import {
  buildingsTable,
  usersTable,
  issuesTable,
  resolutionsTable,
} from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) { res.status(401).json({ error: "Unauthenticated" }); return; }
  next();
}

function requireSuperAdmin(req: any, res: any, next: any) {
  requireAuth(req, res, async () => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, (req.session as any).userId));
    if (!user || user.role !== "super_admin") {
      res.status(403).json({ error: "Super admin only" }); return;
    }
    (req as any).superAdmin = user;
    next();
  });
}

router.get("/buildings", requireSuperAdmin, async (req, res): Promise<void> => {
  const buildings = await db.select().from(buildingsTable).orderBy(buildingsTable.createdAt);

  const result = await Promise.all(buildings.map(async (b) => {
    const [resRow] = await db.select({ c: count() }).from(usersTable)
      .where(eq(usersTable.buildingId, b.id));
    const [issueRow] = await db.select({ c: count() }).from(issuesTable)
      .where(eq(issuesTable.buildingId, b.id));
    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      city: b.city,
      country: b.country,
      status: b.status,
      plan: b.plan,
      residentCount: Number(resRow?.c ?? 0),
      issueCount: Number(issueRow?.c ?? 0),
      createdAt: b.createdAt.toISOString(),
    };
  }));

  res.json(result);
});

router.patch("/buildings/:buildingId/status", requireSuperAdmin, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const { status } = req.body;

  const [updated] = await db.update(buildingsTable)
    .set({ status })
    .where(eq(buildingsTable.id, buildingId))
    .returning();

  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  res.json({
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    address: updated.address,
    city: updated.city,
    state: updated.state,
    country: updated.country,
    timezone: updated.timezone,
    numberOfUnits: updated.numberOfUnits,
    numberOfFloors: updated.numberOfFloors,
    buildingType: updated.buildingType,
    logoUrl: updated.logoUrl,
    photoUrl: updated.photoUrl,
    status: updated.status,
    plan: updated.plan,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.get("/stats", requireSuperAdmin, async (req, res): Promise<void> => {
  const [buildingRow] = await db.select({ c: count() }).from(buildingsTable);
  const [activeRow] = await db.select({ c: count() }).from(buildingsTable).where(eq(buildingsTable.status, "active"));
  const [residentRow] = await db.select({ c: count() }).from(usersTable);
  const [issueRow] = await db.select({ c: count() }).from(issuesTable);
  const [resolutionRow] = await db.select({ c: count() }).from(resolutionsTable);

  const buildings = await db.select({ plan: buildingsTable.plan }).from(buildingsTable);
  const planMap = new Map<string, number>();
  buildings.forEach(b => planMap.set(b.plan, (planMap.get(b.plan) ?? 0) + 1));
  const buildingsByPlan = Array.from(planMap.entries())
    .map(([category, count]) => ({ category, count }));

  res.json({
    totalBuildings: Number(buildingRow?.c ?? 0),
    activeBuildings: Number(activeRow?.c ?? 0),
    totalResidents: Number(residentRow?.c ?? 0),
    totalIssues: Number(issueRow?.c ?? 0),
    totalResolutions: Number(resolutionRow?.c ?? 0),
    buildingsByPlan,
  });
});

export default router;
