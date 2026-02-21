import express, { Router } from "express";

import { PERMISSION_KEY, PERMISSION_ACTION } from "@mern/core";
import { PermissionsController } from "../controllers/permissions/index.js";
import { authenticate, authorize, rateLimit } from "../middleware/index.js";

export const router: Router = express.Router();

router
  .route("/")
  .get(
    rateLimit({ windowMin: 15, limit: 60 }),
    authenticate,
    authorize(PERMISSION_KEY.USER_MANAGEMENT, PERMISSION_ACTION.READ),
    PermissionsController.list,
  );
