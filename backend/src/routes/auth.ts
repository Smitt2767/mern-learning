import express, { Router } from "express";
import { AuthController } from "../controllers/auth/index.js";
import { authenticate } from "../middleware/auth.js";
import { RateLimit } from "../middleware/rate-limit.js";

export const router: Router = express.Router();

router
  .route("/signup")
  .post(RateLimit({ windowMin: 60, limit: 5 }), AuthController.signUp);

router
  .route("/signin")
  .post(RateLimit({ windowMin: 15, limit: 10 }), AuthController.login);

router
  .route("/signout")
  .post(
    RateLimit({ windowMin: 15, limit: 30 }),
    authenticate,
    AuthController.logout,
  );

router
  .route("/signin/:provider")
  .get(RateLimit({ windowMin: 15, limit: 20 }), AuthController.oauthRedirect);

router
  .route("/callback/:provider")
  .get(RateLimit({ windowMin: 15, limit: 20 }), AuthController.oauthCallback);

router
  .route("/forgot-password")
  .post(RateLimit({ windowMin: 60, limit: 3 }), AuthController.forgotPassword);

router
  .route("/reset-password")
  .post(RateLimit({ windowMin: 15, limit: 10 }), AuthController.resetPassword);

router
  .route("/change-password")
  .post(
    RateLimit({ windowMin: 15, limit: 10 }),
    authenticate,
    AuthController.changePassword,
  );
