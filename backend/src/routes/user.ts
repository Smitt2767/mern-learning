import express, { Router } from "express";
import { UserController } from "../controllers/user/index.js";
import { authenticate } from "../middleware/auth.js";
import { RateLimit } from "../middleware/rate-limit.js";

export const router: Router = express.Router();

router
  .route("/profile")
  .get(RateLimit({ windowMin: 15, max: 30 }), authenticate, UserController.profile);
