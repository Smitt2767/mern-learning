import express, { Router } from "express";
import { AuthController } from "../controllers/auth/index.js";
import { authenticate, rateLimit } from "../middleware/index.js";

export const router: Router = express.Router();

router
  .route("/signup")
  .post(rateLimit({ windowMin: 60, limit: 5 }), AuthController.signUp);

router
  .route("/signin")
  .post(rateLimit({ windowMin: 15, limit: 10 }), AuthController.login);

router
  .route("/signout")
  .post(
    rateLimit({ windowMin: 15, limit: 30 }),
    authenticate,
    AuthController.logout,
  );

router
  .route("/signin/:provider")
  .get(rateLimit({ windowMin: 15, limit: 20 }), AuthController.oauthRedirect);

router
  .route("/callback/:provider")
  .get(rateLimit({ windowMin: 15, limit: 20 }), AuthController.oauthCallback);

router
  .route("/forgot-password")
  .post(rateLimit({ windowMin: 60, limit: 3 }), AuthController.forgotPassword);

router
  .route("/reset-password")
  .post(rateLimit({ windowMin: 15, limit: 10 }), AuthController.resetPassword);

router
  .route("/change-password")
  .post(
    rateLimit({ windowMin: 15, limit: 10 }),
    authenticate,
    AuthController.changePassword,
  );

router
  .route("/verify-email")
  .get(rateLimit({ windowMin: 15, limit: 10 }), AuthController.verifyEmail);

router
  .route("/refresh")
  .post(rateLimit({ windowMin: 15, limit: 20 }), AuthController.refresh);
