import { Router } from "express";
import {
  redirectToStrava,
  stravaCallback,
} from "../controllers/stravaAuthController.js";

const router = Router();

router.get("/auth/strava", redirectToStrava);
router.get("/auth/strava/callback", stravaCallback);

export default router;
