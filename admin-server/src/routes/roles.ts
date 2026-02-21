import express, { Router } from "express";

import { PERMISSION_ACTION, PERMISSION_KEY } from "@mern/core";
import { RolesController } from "../controllers/roles/index.js";
import { authenticate, authorize, rateLimit } from "../middleware/index.js";

export const router: Router = express.Router();

router
  .route("/")
  .get(
    rateLimit({ windowMin: 15, limit: 60 }),
    authenticate,
    authorize(PERMISSION_KEY.USER_MANAGEMENT, PERMISSION_ACTION.READ),
    RolesController.list,
  )
  .post(
    rateLimit({ windowMin: 15, limit: 20 }),
    authenticate,
    authorize(PERMISSION_KEY.USER_MANAGEMENT, PERMISSION_ACTION.WRITE),
    RolesController.create,
  );

router
  .route("/:id")
  .get(
    rateLimit({ windowMin: 15, limit: 60 }),
    authenticate,
    authorize(PERMISSION_KEY.USER_MANAGEMENT, PERMISSION_ACTION.READ),
    RolesController.get,
  )
  .put(
    rateLimit({ windowMin: 15, limit: 20 }),
    authenticate,
    authorize(PERMISSION_KEY.USER_MANAGEMENT, PERMISSION_ACTION.WRITE),
    RolesController.update,
  )
  .delete(
    rateLimit({ windowMin: 15, limit: 10 }),
    authenticate,
    authorize(PERMISSION_KEY.USER_MANAGEMENT, PERMISSION_ACTION.DELETE),
    RolesController.delete,
  );

router
  .route("/:id/permissions")
  .put(
    rateLimit({ windowMin: 15, limit: 20 }),
    authenticate,
    authorize(PERMISSION_KEY.USER_MANAGEMENT, PERMISSION_ACTION.WRITE),
    RolesController.setPermissions,
  );
