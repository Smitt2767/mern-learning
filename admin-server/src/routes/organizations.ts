import express, { Router } from "express";

import { PERMISSION_ACTION, PERMISSION_KEY } from "@mern/core";
import { OrganizationsController } from "../controllers/organizations/index.js";
import { authenticate, authorize, rateLimit } from "../middleware/index.js";

export const router: Router = express.Router();

// ── Platform-wide org list ────────────────────────────────────────────────────
// Returns all non-deleted orgs with member counts.
// Requires USER_MANAGEMENT read — platform admins only.

router
  .route("/")
  .get(
    rateLimit({ windowMin: 15, limit: 60 }),
    authenticate,
    authorize(PERMISSION_KEY.USER_MANAGEMENT, PERMISSION_ACTION.READ),
    OrganizationsController.list,
  );

// ── Single org detail & management ────────────────────────────────────────────

router
  .route("/:id")
  .get(
    rateLimit({ windowMin: 15, limit: 60 }),
    authenticate,
    authorize(PERMISSION_KEY.USER_MANAGEMENT, PERMISSION_ACTION.READ),
    OrganizationsController.get,
  )
  .delete(
    rateLimit({ windowMin: 15, limit: 10 }),
    authenticate,
    authorize(PERMISSION_KEY.USER_MANAGEMENT, PERMISSION_ACTION.DELETE),
    OrganizationsController.delete,
  );
