import express, { Router } from "express";
import { InvitationController } from "../controllers/invitation/index.js";
import { authenticate, rateLimit } from "../middleware/index.js";

export const router: Router = express.Router();

// Public — no auth required (used for invite preview page)
router
  .route("/:token")
  .get(
    rateLimit({ windowMin: 15, limit: 30 }),
    InvitationController.getByToken,
  );

// Authenticated — user must be logged in to accept or reject
router
  .route("/:token/accept")
  .post(
    rateLimit({ windowMin: 15, limit: 10 }),
    authenticate,
    InvitationController.accept,
  );

router
  .route("/:token/reject")
  .post(
    rateLimit({ windowMin: 15, limit: 10 }),
    authenticate,
    InvitationController.reject,
  );
