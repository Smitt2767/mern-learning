import express, { Router } from "express";
import { AuthController } from "../controllers/auth/index.js";
import { RateLimit } from "../middleware/rate-limit.js";

export const router: Router = express.Router();

router
  .route("/login")
  .post(RateLimit({ windowMin: 1, max: 5 }), AuthController.login);
router.route("/signup").post(AuthController.signUp);
router.route("/logout").post(AuthController.logout);
