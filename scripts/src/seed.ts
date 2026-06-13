import { db } from "@workspace/db";
import {
  buildingsTable,
  buildingSettingsTable,
  usersTable,
  issueCategoriesTable,
  issuesTable,
  issueVotesTable,
  issueStatusHistoryTable,
  issueCommentsTable,
  resolutionsTable,
  resolutionVotesTable,
  announcementsTable,
  solutionsTable,
} from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // ─── Super admin ────────────────────────────────────────────────────────────
  const [existingSuper] = await db.select().from(usersTable)
    .where(eq(usersTable.email, "superadmin@example.com"));

  let superAdmin = existingSuper;
  if (!existingSuper) {
    const [sa] = await db.insert(usersTable).values({
      fullName: "Super Admin",
      email: "superadmin@example.com",
      passwordHash: await bcrypt.hash("password123", 12),
      role: "super_admin",
      verificationStatus: "verified",
    }).returning();
    superAdmin = sa;
    console.log("Created super admin");
  } else {
    console.log("Super admin already exists");
  }

  // ─── Ocean Tower building ───────────────────────────────────────────────────
  const [existingBuilding] = await db.select().from(buildingsTable)
    .where(eq(buildingsTable.slug, "ocean-tower"));

  if (existingBuilding) {
    console.log("Demo building already exists, skipping full seed.");
    process.exit(0);
  }

  const [building] = await db.insert(buildingsTable).values({
    name: "Ocean Tower",
    slug: "ocean-tower",
    address: "Av. George Washington 101",
    city: "Santo Domingo",
    state: "Distrito Nacional",
    country: "Dominican Republic",
    timezone: "America/Santo_Domingo",
    numberOfUnits: 120,
    numberOfFloors: 20,
    buildingType: "high_rise",
    status: "active",
    plan: "free",
  }).returning();
  console.log("Created Ocean Tower building");

  // ─── Building settings ───────────────────────────────────────────────────────
  await db.insert(buildingSettingsTable).values({
    buildingId: building.id,
    verificationMethod: "manual_approval",
    allowTenantOfficialVotes: false,
    oneVotePerUnit: false,
    passPercentage: 50,
    allowAnonymousPosts: true,
  });

  // ─── Building admin ──────────────────────────────────────────────────────────
  const [admin] = await db.insert(usersTable).values({
    buildingId: building.id,
    fullName: "Maria Gonzalez",
    email: "admin@oceantower.com",
    passwordHash: await bcrypt.hash("password123", 12),
    role: "building_admin",
    verificationStatus: "verified",
    residentType: "property_manager",
    apartmentNumber: "PH1",
    floor: 20,
  }).returning();
  await db.update(buildingsTable).set({ createdByUserId: admin.id }).where(eq(buildingsTable.id, building.id));
  console.log("Created building admin");

  // ─── Resident owner ──────────────────────────────────────────────────────────
  const [owner] = await db.insert(usersTable).values({
    buildingId: building.id,
    fullName: "Carlos Ramirez",
    email: "owner@example.com",
    passwordHash: await bcrypt.hash("password123", 12),
    role: "resident_owner",
    verificationStatus: "verified",
    apartmentNumber: "12B",
    floor: 12,
    residentType: "owner",
  }).returning();

  // ─── Resident tenant ────────────────────────────────────────────────────────
  const [tenant] = await db.insert(usersTable).values({
    buildingId: building.id,
    fullName: "Ana Perez",
    email: "tenant@example.com",
    passwordHash: await bcrypt.hash("password123", 12),
    role: "resident_tenant",
    verificationStatus: "verified",
    apartmentNumber: "8A",
    floor: 8,
    residentType: "tenant",
  }).returning();

  // ─── Pending resident ────────────────────────────────────────────────────────
  await db.insert(usersTable).values({
    buildingId: building.id,
    fullName: "Luis Torres",
    email: "pending@example.com",
    passwordHash: await bcrypt.hash("password123", 12),
    role: "resident_owner",
    verificationStatus: "pending",
    apartmentNumber: "5C",
    floor: 5,
    residentType: "owner",
  });
  console.log("Created residents");

  // ─── Categories ───────────────────────────────────────────────────────────────
  const categoriesData = [
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
  const categories = await db.insert(issueCategoriesTable)
    .values(categoriesData.map(c => ({ buildingId: building.id, ...c })))
    .returning();
  const catMap = new Map(categories.map(c => [c.name, c.id]));
  console.log("Created categories");

  // ─── Issues ───────────────────────────────────────────────────────────────────
  const issuesData = [
    {
      title: "Main elevator broken for 3 weeks",
      description: "The main elevator (Elevator A) has been out of service since June 1st. Residents on upper floors, especially elderly residents, are severely impacted. The technician came twice but the issue keeps recurring. This is becoming a safety and accessibility emergency.",
      categoryId: catMap.get("Elevator"),
      urgency: "emergency",
      status: "in_progress",
      locationType: "common_area",
      locationText: "Main lobby elevator bank",
      isRecurring: true,
      affectsSafety: true,
      affectsMultipleResidents: "yes",
      anonymousPublic: false,
      createdByUserId: owner.id,
    },
    {
      title: "Water leaking through ceiling in apartment 15A",
      description: "There is a persistent water leak coming through the bedroom ceiling of 15A. It started after heavy rain last week. The water is discoloring the ceiling and there are concerns about mold. Management has been notified but no repair has been scheduled.",
      categoryId: catMap.get("Water / Plumbing"),
      urgency: "high",
      status: "new",
      locationType: "unit",
      locationText: "Apartment 15A, bedroom ceiling",
      isRecurring: false,
      affectsSafety: false,
      affectsMultipleResidents: "yes",
      anonymousPublic: false,
      createdByUserId: tenant.id,
    },
    {
      title: "Lobby security camera offline",
      description: "The main lobby security camera has been offline for at least 2 weeks. Without surveillance, there have been unauthorized visitors found in the building. This creates a serious security risk for all residents and their property.",
      categoryId: catMap.get("Security"),
      urgency: "high",
      status: "in_progress",
      locationType: "common_area",
      locationText: "Main lobby entrance",
      isRecurring: false,
      affectsSafety: true,
      affectsMultipleResidents: "yes",
      anonymousPublic: false,
      createdByUserId: owner.id,
    },
    {
      title: "Trash not collected from floors 10-15",
      description: "Garbage bins on floors 10 through 15 have not been emptied for 4 days. The smell is becoming unbearable and it's a health hazard. We need more frequent trash collection or additional trash chutes.",
      categoryId: catMap.get("Garbage / Trash"),
      urgency: "medium",
      status: "new",
      locationType: "floor",
      locationText: "Floors 10 through 15",
      isRecurring: true,
      affectsSafety: false,
      affectsMultipleResidents: "yes",
      anonymousPublic: true,
      createdByUserId: tenant.id,
    },
    {
      title: "Pool pump broken - pool unusable",
      description: "The pool filtration pump stopped working 5 days ago. The water is turning green and the pool is closed. During summer months this is a major quality-of-life issue. We pay maintenance fees that cover pool upkeep.",
      categoryId: catMap.get("Pool / Gym / Amenities"),
      urgency: "medium",
      status: "pending_parts",
      locationType: "amenity",
      locationText: "Rooftop pool",
      isRecurring: false,
      affectsSafety: false,
      affectsMultipleResidents: "yes",
      anonymousPublic: false,
      createdByUserId: owner.id,
    },
    {
      title: "Parking lot lighting failure - floor B2",
      description: "All lights on parking level B2 are out, making it a safety hazard at night. Several residents have complained about safety walking to their cars after dark. Two lights have been flickering for months before they all went out.",
      categoryId: catMap.get("Electricity"),
      urgency: "high",
      status: "resolved",
      locationType: "parking",
      locationText: "Parking level B2",
      isRecurring: true,
      affectsSafety: true,
      affectsMultipleResidents: "yes",
      anonymousPublic: false,
      createdByUserId: tenant.id,
      adminResponse: "Electrician replaced all B2 light fixtures on June 8th. New LED fixtures installed with 5-year warranty.",
    },
    {
      title: "Excessive noise from apartment 7C late nights",
      description: "Apartment 7C regularly hosts loud gatherings after midnight on weekdays. Multiple residents on the 7th and 8th floors have been unable to sleep. We've tried speaking to the resident directly but the problem continues.",
      categoryId: catMap.get("Noise"),
      urgency: "low",
      status: "new",
      locationType: "unit",
      locationText: "Apartment 7C",
      isRecurring: true,
      affectsSafety: false,
      affectsMultipleResidents: "yes",
      anonymousPublic: true,
      createdByUserId: owner.id,
    },
    {
      title: "Gym AC not working",
      description: "The air conditioning in the gym has been broken for 10 days. Working out in 90+ degree heat is impossible and the equipment may be getting damaged. The gym is on our amenity list and should be maintained year round.",
      categoryId: catMap.get("Pool / Gym / Amenities"),
      urgency: "medium",
      status: "in_progress",
      locationType: "amenity",
      locationText: "Building gym, 2nd floor",
      isRecurring: false,
      affectsSafety: false,
      affectsMultipleResidents: "yes",
      anonymousPublic: false,
      createdByUserId: tenant.id,
    },
  ];

  const createdIssues = await Promise.all(issuesData.map(async (data) => {
    const [issue] = await db.insert(issuesTable).values({
      buildingId: building.id,
      ...data,
    }).returning();
    await db.insert(issueStatusHistoryTable).values({
      issueId: issue.id,
      changedByUserId: data.createdByUserId,
      oldStatus: null,
      newStatus: "new",
      note: "Issue submitted",
    });
    if (data.status !== "new") {
      await db.insert(issueStatusHistoryTable).values({
        issueId: issue.id,
        changedByUserId: admin.id,
        oldStatus: "new",
        newStatus: data.status,
        note: `Status updated to ${data.status}`,
      });
    }
    return issue;
  }));
  console.log("Created issues");

  // ─── Votes ───────────────────────────────────────────────────────────────────
  const voteData: { issueId: number; userId: number; voteType: string }[] = [];
  const elevatorIssue = createdIssues[0];
  const waterIssue = createdIssues[1];
  const securityIssue = createdIssues[2];
  const trashIssue = createdIssues[3];

  [owner.id, admin.id].forEach(uid => voteData.push({ issueId: elevatorIssue.id, userId: uid, voteType: "important" }));
  [owner.id, tenant.id].forEach(uid => voteData.push({ issueId: elevatorIssue.id, userId: uid, voteType: "affected" }));
  [owner.id].forEach(uid => voteData.push({ issueId: waterIssue.id, userId: uid, voteType: "important" }));
  [owner.id].forEach(uid => voteData.push({ issueId: securityIssue.id, userId: uid, voteType: "important" }));
  [tenant.id].forEach(uid => voteData.push({ issueId: trashIssue.id, userId: uid, voteType: "important" }));

  if (voteData.length) {
    await db.insert(issueVotesTable).values(voteData);
  }

  // ─── Comments ────────────────────────────────────────────────────────────────
  await db.insert(issueCommentsTable).values([
    {
      issueId: elevatorIssue.id,
      userId: tenant.id,
      comment: "I have to carry my groceries up 12 flights of stairs every day. This is completely unacceptable.",
      anonymousPublic: false,
      isAdminResponse: false,
    },
    {
      issueId: elevatorIssue.id,
      userId: admin.id,
      comment: "We have contacted the elevator maintenance company for an emergency repair. A technician is scheduled for tomorrow morning. We apologize for the inconvenience.",
      anonymousPublic: false,
      isAdminResponse: true,
    },
  ]);

  // ─── Solutions ──────────────────────────────────────────────────────────────
  await db.insert(solutionsTable).values({
    issueId: elevatorIssue.id,
    createdByUserId: owner.id,
    title: "Contract a dedicated elevator maintenance company",
    description: "Instead of calling for emergency repairs each time, we should have a monthly maintenance contract with a certified elevator company to do preventive inspections and quick response repairs.",
    estimatedCost: "$500-800/month",
    pros: "Preventive maintenance, faster response, warranty on repairs",
    cons: "Monthly recurring cost",
  });

  // ─── Announcements ───────────────────────────────────────────────────────────
  await db.insert(announcementsTable).values([
    {
      buildingId: building.id,
      createdByUserId: admin.id,
      title: "Elevator A Repair Update",
      message: "We have scheduled an emergency repair for Elevator A on June 12th from 8am to 5pm. During this time, please use Elevator B. We apologize for the inconvenience and are working to restore service as quickly as possible.",
      category: "maintenance",
      priority: "high",
    },
    {
      buildingId: building.id,
      createdByUserId: admin.id,
      title: "Building General Assembly - July 15th",
      message: "The quarterly general assembly of residents will be held on July 15th at 7:00 PM in the community room. We will discuss the elevator situation, budget for repairs, and vote on new building rules. All residents are encouraged to attend.",
      category: "meeting",
    },
    {
      buildingId: building.id,
      createdByUserId: admin.id,
      title: "Security Camera System Upgrade",
      message: "We are pleased to announce that we will be upgrading our building security camera system next month. New HD cameras will be installed in all common areas, parking levels, and building entrances. Installation will take 2 days and may cause minor disruptions.",
      category: "security",
    },
    {
      buildingId: building.id,
      createdByUserId: admin.id,
      title: "Emergency: Water Service Interruption",
      message: "Due to emergency maintenance of the main water line, building water service will be interrupted on June 11th from 9am to 2pm. Please store necessary water beforehand. We apologize for the inconvenience.",
      category: "emergency",
      priority: "urgent",
    },
  ]);
  console.log("Created announcements");

  // ─── Resolution ──────────────────────────────────────────────────────────────
  const [resolution] = await db.insert(resolutionsTable).values({
    buildingId: building.id,
    createdByUserId: admin.id,
    title: "Approve Emergency Elevator Repair Contract",
    description: "Vote to approve a 12-month emergency maintenance contract with TechElevator DR for all building elevators. This contract would include monthly preventive maintenance, 24/7 emergency response, and warranty on all parts.",
    proposedAction: "Authorize the building administration to sign a 12-month maintenance contract with TechElevator DR at a cost of $650/month, totaling $7,800 for the year, to be funded from the building maintenance reserve.",
    votingType: "official",
    eligibleVoters: "owners_only",
    oneVotePerUnit: true,
    passPercentage: 51,
    status: "open",
    votingStartAt: new Date(),
    votingEndAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    relatedIssueId: elevatorIssue.id,
  }).returning();

  await db.insert(resolutionVotesTable).values([
    { resolutionId: resolution.id, userId: owner.id, apartmentNumber: owner.apartmentNumber, vote: "yes", comment: "Yes, we need this fixed urgently." },
    { resolutionId: resolution.id, userId: admin.id, apartmentNumber: admin.apartmentNumber, vote: "yes" },
  ]);
  console.log("Created resolutions");

  console.log("\nSeed complete! Demo accounts:");
  console.log("  superadmin@example.com / password123 (Super Admin)");
  console.log("  admin@oceantower.com / password123 (Building Admin)");
  console.log("  owner@example.com / password123 (Resident Owner, apt 12B)");
  console.log("  tenant@example.com / password123 (Resident Tenant, apt 8A)");
  console.log("  pending@example.com / password123 (Pending approval, apt 5C)");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
