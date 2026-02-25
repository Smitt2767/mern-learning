import { PERMISSION_ACTION, PERMISSION_KEY } from "@mern/core";
import express, { Router } from "express";
import { InvitationController } from "../controllers/invitation/index.js";
import { OrganizationController } from "../controllers/organization/index.js";
import { authenticate, authorizeOrg, rateLimit } from "../middleware/index.js";

export const router: Router = express.Router();

// ─── Org CRUD ─────────────────────────────────────────────────────────────────

router
  .route("/")
  .post(
    rateLimit({ windowMin: 60, limit: 10 }),
    authenticate,
    OrganizationController.create,
  )
  .get(
    rateLimit({ windowMin: 15, limit: 60 }),
    authenticate,
    OrganizationController.list,
  );

router
  .route("/:slug")
  .get(
    rateLimit({ windowMin: 15, limit: 60 }),
    authenticate,
    authorizeOrg(PERMISSION_KEY.MEMBER_MANAGEMENT, PERMISSION_ACTION.READ),
    OrganizationController.get,
  )
  .patch(
    rateLimit({ windowMin: 15, limit: 20 }),
    authenticate,
    authorizeOrg(PERMISSION_KEY.ORG_MANAGEMENT, PERMISSION_ACTION.WRITE),
    OrganizationController.update,
  )
  .delete(
    rateLimit({ windowMin: 15, limit: 5 }),
    authenticate,
    authorizeOrg(PERMISSION_KEY.ORG_MANAGEMENT, PERMISSION_ACTION.DELETE),
    OrganizationController.remove,
  );

// ─── Membership actions ───────────────────────────────────────────────────────

router
  .route("/:slug/transfer")
  .post(
    rateLimit({ windowMin: 15, limit: 5 }),
    authenticate,
    authorizeOrg(PERMISSION_KEY.ORG_MANAGEMENT, PERMISSION_ACTION.DELETE),
    OrganizationController.transferOwnership,
  );

router
  .route("/:slug/leave")
  .post(
    rateLimit({ windowMin: 15, limit: 10 }),
    authenticate,
    authorizeOrg(PERMISSION_KEY.MEMBER_MANAGEMENT, PERMISSION_ACTION.READ),
    OrganizationController.leave,
  );

// ─── Members ──────────────────────────────────────────────────────────────────

router
  .route("/:slug/members")
  .get(
    rateLimit({ windowMin: 15, limit: 60 }),
    authenticate,
    authorizeOrg(PERMISSION_KEY.MEMBER_MANAGEMENT, PERMISSION_ACTION.READ),
    OrganizationController.getMembers,
  );

router
  .route("/:slug/members/:userId/role")
  .patch(
    rateLimit({ windowMin: 15, limit: 20 }),
    authenticate,
    authorizeOrg(PERMISSION_KEY.MEMBER_MANAGEMENT, PERMISSION_ACTION.WRITE),
    OrganizationController.updateMemberRole,
  );

router
  .route("/:slug/members/:userId")
  .delete(
    rateLimit({ windowMin: 15, limit: 20 }),
    authenticate,
    authorizeOrg(PERMISSION_KEY.MEMBER_MANAGEMENT, PERMISSION_ACTION.WRITE),
    OrganizationController.removeMember,
  );

// ─── Roles ────────────────────────────────────────────────────────────────────

router
  .route("/:slug/roles")
  .get(
    rateLimit({ windowMin: 15, limit: 60 }),
    authenticate,
    authorizeOrg(PERMISSION_KEY.MEMBER_MANAGEMENT, PERMISSION_ACTION.READ),
    OrganizationController.getRoles,
  );

// ─── Invitations (nested under org slug) ─────────────────────────────────────

router
  .route("/:slug/invitations")
  .post(
    rateLimit({ windowMin: 15, limit: 20 }),
    authenticate,
    authorizeOrg(PERMISSION_KEY.INVITATION_MANAGEMENT, PERMISSION_ACTION.WRITE),
    InvitationController.invite,
  )
  .get(
    rateLimit({ windowMin: 15, limit: 60 }),
    authenticate,
    authorizeOrg(PERMISSION_KEY.INVITATION_MANAGEMENT, PERMISSION_ACTION.READ),
    InvitationController.list,
  );

router
  .route("/:slug/invitations/:id")
  .delete(
    rateLimit({ windowMin: 15, limit: 20 }),
    authenticate,
    authorizeOrg(PERMISSION_KEY.INVITATION_MANAGEMENT, PERMISSION_ACTION.WRITE),
    InvitationController.cancel,
  );
