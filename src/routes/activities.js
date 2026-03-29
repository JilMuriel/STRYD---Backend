import { Router } from "express";
import { getActivitiesSync } from "../controllers/activitiesSyncController.js";

const router = Router();

router.get("/activities/sync", getActivitiesSync);

export default router;
