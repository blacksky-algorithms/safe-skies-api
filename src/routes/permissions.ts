import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.middleware";
import {
	promoteModerator,
	demoteModerator,
	listModerators,
	checkFeedRole,
} from "../controllers/permissions.controller";

const router = Router();

router.post("/admin/promote", authenticateJWT, promoteModerator);

router.post("/admin/demote", authenticateJWT, demoteModerator);

router.get("/admin/moderators", authenticateJWT, listModerators);

router.get("/admin/check-role", authenticateJWT, checkFeedRole);

export default router;
