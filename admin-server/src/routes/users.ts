import express, { Router } from "express";

import { PERMISSION_ACTION, PERMISSION_KEY } from "@mern/core";
import { UsersController } from "../controllers/users/index.js";
import { authenticate, authorize, rateLimit } from "../middleware/index.js";

export const router: Router = express.Router();

router
  .route("/")
  .get(
    rateLimit({ windowMin: 15, limit: 60 }),
    authenticate,
    authorize(PERMISSION_KEY.USER_MANAGEMENT, PERMISSION_ACTION.READ),
    UsersController.list,
  );

router
  .route("/:id")
  .get(
    rateLimit({ windowMin: 15, limit: 60 }),
    authenticate,
    authorize(PERMISSION_KEY.USER_MANAGEMENT, PERMISSION_ACTION.READ),
    UsersController.get,
  );

router
  .route("/:id/role")
  .put(
    rateLimit({ windowMin: 15, limit: 20 }),
    authenticate,
    authorize(PERMISSION_KEY.USER_MANAGEMENT, PERMISSION_ACTION.WRITE),
    UsersController.assignRole,
  );

router
  .route("/:id/status")
  .put(
    rateLimit({ windowMin: 15, limit: 20 }),
    authenticate,
    authorize(PERMISSION_KEY.USER_MANAGEMENT, PERMISSION_ACTION.WRITE),
    UsersController.updateStatus,
  );
