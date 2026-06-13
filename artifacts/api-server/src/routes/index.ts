import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import buildingsRouter from "./buildings";
import residentsRouter from "./residents";
import issuesRouter from "./issues";
import resolutionsRouter from "./resolutions";
import announcementsRouter from "./announcements";
import dashboardRouter from "./dashboard";
import superadminRouter from "./superadmin";

const router: IRouter = Router();

router.use(healthRouter);

// Auth routes
router.use("/auth", authRouter);

// Building routes (slug lookup + CRUD)
router.use("/buildings", buildingsRouter);

// Super admin
router.use("/superadmin", superadminRouter);

// Building-scoped routes — all share :buildingId param
const buildingRouter = Router({ mergeParams: true });
buildingRouter.use("/residents", residentsRouter);
buildingRouter.use("/issues", issuesRouter);
buildingRouter.use("/resolutions", resolutionsRouter);
buildingRouter.use("/announcements", announcementsRouter);
buildingRouter.use("/notifications", announcementsRouter);
buildingRouter.use("/dashboard", dashboardRouter);
buildingRouter.use("/categories", issuesRouter);

router.use("/buildings/:buildingId", buildingRouter);

export default router;
