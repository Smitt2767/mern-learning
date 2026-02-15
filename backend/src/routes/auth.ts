import express, { Router } from "express";
import { AuthController } from "../controllers/auth/index.js";
import { RateLimit } from "../middleware/rate-limit.js";

export const router: Router = express.Router();

router
  .route("/signup")
  .post(RateLimit({ windowMin: 60, max: 5 }), AuthController.signUp);

router
  .route("/login")
  .post(RateLimit({ windowMin: 15, max: 10 }), AuthController.login);

router.route("/logout").post(AuthController.logout);
