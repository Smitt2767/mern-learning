import express, { Router } from "express";
import { UserController } from "../controllers/user/index.js";
import { authenticate, rateLimit } from "../middleware/index.js";

export const router: Router = express.Router();

router
  .route("/profile")
  .get(
    rateLimit({ windowMin: 15, limit: 30 }),
    authenticate,
    UserController.profile,
  );
