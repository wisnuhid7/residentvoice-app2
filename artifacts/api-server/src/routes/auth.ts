import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import {
  usersTable,
  buildingsTable,
  buildingSettingsTable,
  issueCategoriesTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const DEFAULT_CATEGORIES = [
  { name: "Elevator", color: "#6366f1" },
  { name: "Water / Plumbing", color: "#3b82f6" },
  { name: "Electricity", color: "#f59e0b" },
  { name: "Security", color: "#ef4444" },
  { name: "Cleaning", color: "#10b981" },
  { name: "Garbage / Trash", color: "#84cc16" },
  { name: "Parking", color: "#8b5cf6" },
  { name: "Noise", color: "#f97316" },
  { name: "Internet / Building Systems", color: "#06b6d4" },
  { name: "Pool / Gym / Amenities", color: "#14b8a6" },
  { name: "Fire Safety", color: "#dc2626" },
  { name: "Structural Damage", color: "#7c3aed" },
  { name: "Administration / Communication", color: "#64748b" },
  { name: "Financial Transparency", color: "#0ea5e9" },
  { name: "Maintenance", color: "#78716c" },
  { name: "Other", color: "#a1a1aa" },
];

function formatUser(user: typeof usersTable.$inferSelect, building?: typeof buildingsTable.$inferSelect | null) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    verificationStatus: user.verificationStatus,
    apartmentNumber: user.apartmentNumber,
    floor: user.floor,
    residentType: user.residentType,
    buildingId: user.buildingId,
    building: building ? {
      id: building.id,
      name: building.name,
      slug: building.slug,
      address: building.address,
      city: building.city,
      state: building.state,
      country: building.country,
      timezone: building.timezone,
      numberOfUnits: building.numberOfUnits,
      numberOfFloors: building.numberOfFloors,
      buildingType: building.buildingType,
      logoUrl: building.logoUrl,
      photoUrl: building.photoUrl,
      status: building.status,
      plan: building.plan,
      createdAt: building.createdAt.toISOString(),
    } : null,
  };
}

router.get("/me", async (req, res): Promise<void> => {
  const session = req.session as any;
  if (!session.userId) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  if (!user) {
    session.destroy(() => {});
    res.status(401).json({ error: "User not found" });
    return;
  }

  let building = null;
  if (user.buildingId) {
    const [b] = await db.select().from(buildingsTable).where(eq(buildingsTable.id, user.buildingId));
    building = b || null;
  }

  res.json(formatUser(user, building));
});

router.post("/login", async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const session = req.session as any;
    session.userId = user.id;

    let building = null;
    if (user.buildingId) {
      const [b] = await db.select().from(buildingsTable).where(eq(buildingsTable.id, user.buildingId));
      building = b || null;
    }

    const userData = formatUser(user, building);
    req.session.save((err) => {
      if (err) {
        req.log.error(err, "Session save failed");
        res.status(500).json({ error: "Session error" });
        return;
      }
      res.json(userData);
    });
  } catch (err) {
    req.log.error(err, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", (req, res): void => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

router.post("/register-building", async (req, res): Promise<void> => {
  const {
    buildingName, slug, address, city, state, country, numberOfFloors, numberOfUnits,
    buildingType, adminFullName, adminEmail, adminPhone, password, adminRole,
  } = req.body;

  if (!buildingName || !slug || !city || !country || !adminFullName || !adminEmail || !password) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  const existing = await db.select({ id: buildingsTable.id }).from(buildingsTable)
    .where(eq(buildingsTable.slug, cleanSlug));
  if (existing.length > 0) {
    res.status(409).json({ error: "Building slug already taken" });
    return;
  }

  const existingUser = await db.select({ id: usersTable.id }).from(usersTable)
    .where(eq(usersTable.email, adminEmail.toLowerCase()));
  if (existingUser.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [building] = await db.insert(buildingsTable).values({
    name: buildingName,
    slug: cleanSlug,
    address,
    city,
    state,
    country,
    numberOfFloors: numberOfFloors ? Number(numberOfFloors) : null,
    numberOfUnits: numberOfUnits ? Number(numberOfUnits) : null,
    buildingType,
    status: "active",
    plan: "free",
  }).returning();

  const [user] = await db.insert(usersTable).values({
    buildingId: building.id,
    fullName: adminFullName,
    email: adminEmail.toLowerCase(),
    phone: adminPhone,
    passwordHash,
    role: "building_admin",
    verificationStatus: "verified",
    residentType: adminRole || "property_manager",
  }).returning();

  await db.update(buildingsTable).set({ createdByUserId: user.id }).where(eq(buildingsTable.id, building.id));

  await db.insert(buildingSettingsTable).values({ buildingId: building.id });

  await db.insert(issueCategoriesTable).values(
    DEFAULT_CATEGORIES.map(c => ({ buildingId: building.id, ...c }))
  );

  const session = req.session as any;
  session.userId = user.id;

  const userData = formatUser(user, building);
  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Session error" });
      return;
    }
    res.status(201).json(userData);
  });
});

router.post("/register-resident", async (req, res): Promise<void> => {
  const {
    buildingSlug, fullName, email, password, apartmentNumber, floor, residentType, phone, inviteCode,
  } = req.body;

  if (!buildingSlug || !fullName || !email || !password || !apartmentNumber || !residentType) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [building] = await db.select().from(buildingsTable)
    .where(eq(buildingsTable.slug, buildingSlug.toLowerCase()));
  if (!building) {
    res.status(404).json({ error: "Building not found" });
    return;
  }

  const existingUser = await db.select({ id: usersTable.id }).from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()));
  if (existingUser.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const [settings] = await db.select().from(buildingSettingsTable)
    .where(eq(buildingSettingsTable.buildingId, building.id));

  if (settings?.verificationMethod === "invite_code" && inviteCode !== settings.inviteCode) {
    res.status(400).json({ error: "Invalid invite code" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const role = residentType === "owner" ? "resident_owner" : "resident_tenant";
  const verificationStatus = settings?.verificationMethod === "manual_approval" ? "pending" : "verified";

  const [user] = await db.insert(usersTable).values({
    buildingId: building.id,
    fullName,
    email: email.toLowerCase(),
    phone,
    passwordHash,
    role,
    apartmentNumber,
    floor: floor ? Number(floor) : null,
    residentType,
    verificationStatus,
  }).returning();

  const session = req.session as any;
  session.userId = user.id;

  const userData = formatUser(user, building);
  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Session error" });
      return;
    }
    res.status(201).json(userData);
  });
});

export default router;
