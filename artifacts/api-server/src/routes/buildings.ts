import { Router } from "express";
import { db } from "@workspace/db";
import {
  buildingsTable,
  buildingSettingsTable,
  usersTable,
} from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { issuesTable } from "@workspace/db";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }
  next();
}

async function getUser(userId: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return user;
}

router.get("/slug/:slug", async (req, res): Promise<void> => {
  const [building] = await db.select().from(buildingsTable)
    .where(eq(buildingsTable.slug, (req.params as any).slug));
  if (!building) {
    res.status(404).json({ error: "Building not found" });
    return;
  }
  res.json(formatBuilding(building));
});

router.get("/:buildingId", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const user = await getUser((req.session as any).userId);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  if (user.role !== "super_admin" && user.buildingId !== buildingId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [building] = await db.select().from(buildingsTable)
    .where(eq(buildingsTable.id, buildingId));
  if (!building) { res.status(404).json({ error: "Not found" }); return; }

  res.json(formatBuilding(building));
});

router.patch("/:buildingId", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const user = await getUser((req.session as any).userId);
  if (!user || !["super_admin", "building_admin"].includes(user.role) || (user.role !== "super_admin" && user.buildingId !== buildingId)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const allowed = ["name", "address", "city", "state", "country", "timezone", "numberOfUnits", "numberOfFloors", "buildingType", "logoUrl", "photoUrl"];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const [updated] = await db.update(buildingsTable).set(updates)
    .where(eq(buildingsTable.id, buildingId)).returning();
  res.json(formatBuilding(updated));
});

router.get("/:buildingId/settings", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const user = await getUser((req.session as any).userId);
  if (!user || user.buildingId !== buildingId && user.role !== "super_admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [settings] = await db.select().from(buildingSettingsTable)
    .where(eq(buildingSettingsTable.buildingId, buildingId));
  if (!settings) { res.status(404).json({ error: "Not found" }); return; }

  res.json({
    ...settings,
  });
});

router.patch("/:buildingId/settings", requireAuth, async (req, res): Promise<void> => {
  const buildingId = Number((req.params as any).buildingId);
  const user = await getUser((req.session as any).userId);
  if (!user || !["super_admin", "building_admin"].includes(user.role) || (user.role !== "super_admin" && user.buildingId !== buildingId)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const allowed = ["verificationMethod", "allowTenantOfficialVotes", "oneVotePerUnit", "passPercentage", "allowAnonymousPosts", "inviteCode"];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const [updated] = await db.update(buildingSettingsTable).set(updates)
    .where(eq(buildingSettingsTable.buildingId, buildingId)).returning();
  res.json(updated);
});

function formatBuilding(b: typeof buildingsTable.$inferSelect) {
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    address: b.address,
    city: b.city,
    state: b.state,
    country: b.country,
    timezone: b.timezone,
    numberOfUnits: b.numberOfUnits,
    numberOfFloors: b.numberOfFloors,
    buildingType: b.buildingType,
    logoUrl: b.logoUrl,
    photoUrl: b.photoUrl,
    status: b.status,
    plan: b.plan,
    createdAt: b.createdAt.toISOString(),
  };
}

export default router;
