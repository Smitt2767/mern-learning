import {
  ACTION_LEVEL,
  PERMISSION_SCOPE,
  PERMISSION_SCOPE_MAP,
  type OrgRequestContext,
  type PermissionAction,
  type PermissionKey,
  type RoleWithPermissions,
} from "@mern/core";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error.js";

// ─── Callbacks ────────────────────────────────────────────────────────────────
// authorizeOrg is a factory — each service (auth-server, admin-server) injects
// its own DB lookup implementations, same pattern as createAuthMiddleware.

export interface AuthorizeOrgCallbacks {
  /**
   * Resolve a non-deleted organization by slug.
   * Return null if not found or soft-deleted.
   */
  findOrgBySlug: (
    slug: string,
  ) => Promise<{
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  } | null>;

  /**
   * Find the calling user's membership row for the given org.
   * Return null if the user is not a member.
   */
  findMember: (
    orgId: string,
    userId: string,
  ) => Promise<{
    id: string;
    organizationId: string;
    userId: string;
    roleId: string;
    createdAt: Date;
    updatedAt: Date;
  } | null>;

  /**
   * Resolve a role with its org-scoped permissions.
   * Should filter role_permissions to scope = "organization" only.
   */
  findRoleWithPermissions: (
    roleId: string,
  ) => Promise<RoleWithPermissions | null>;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * createAuthorizeOrg
 *
 * Returns an authorizeOrg() middleware factory bound to the provided callbacks.
 * Call this once at server startup, then use the returned function on routes.
 *
 * Usage in middleware/index.ts:
 *
 *   const authorizeOrg = createAuthorizeOrg({
 *     findOrgBySlug: OrganizationService.findBySlug,
 *     findMember:    OrganizationService.findMember,
 *     findRoleWithPermissions: OrgRoleService.findWithPermissions,
 *   });
 *
 *   export { authorizeOrg };
 *
 * Usage on routes:
 *
 *   router.patch(
 *     "/:slug",
 *     authenticate,
 *     authorizeOrg(PERMISSION_KEY.ORG_MANAGEMENT, PERMISSION_ACTION.WRITE),
 *     OrganizationController.update,
 *   );
 */
export function createAuthorizeOrg(callbacks: AuthorizeOrgCallbacks) {
  /**
   * authorizeOrg
   *
   * Checks the calling user's ORG-SCOPED role has at least `minAction` on
   * `permissionKey` within the organization identified by the
   * `X-Organization-Slug` request header.
   *
   * On success attaches `req.organizationMember: OrgRequestContext`.
   *
   * Guards:
   *   - Only accepts org-scoped permission keys. Passing a global-scoped key
   *     throws immediately — use authorize() for those.
   *   - Throws 400 if X-Organization-Slug header is missing.
   *   - Throws 404 if the org does not exist or is soft-deleted.
   *   - Throws 403 if the user is not a member of the org.
   *   - Throws 403 if the member's role does not satisfy minAction.
   *
   * Must be used after authenticate().
   */
  function authorizeOrg(
    permissionKey: PermissionKey,
    minAction: PermissionAction,
  ) {
    // Fail fast at route registration time if a dev passes a global permission.
    if (PERMISSION_SCOPE_MAP[permissionKey] !== PERMISSION_SCOPE.ORGANIZATION) {
      throw new Error(
        `authorizeOrg() called with global-scoped permission "${permissionKey}". ` +
          `Use authorize() for global permissions.`,
      );
    }

    return async (
      req: Request,
      _res: Response,
      next: NextFunction,
    ): Promise<void> => {
      // ── 1. Read org slug from header ──────────────────────────────────────
      const slug = req.headers["x-organization-slug"];

      if (!slug || typeof slug !== "string") {
        throw AppError.badRequest(
          "Missing required header: X-Organization-Slug",
        );
      }

      // ── 2. Resolve org ────────────────────────────────────────────────────
      const organization = await callbacks.findOrgBySlug(slug);

      if (!organization) {
        throw AppError.notFound("Organization not found");
      }

      // ── 3. Check membership ───────────────────────────────────────────────
      const userId = req.user?.id;
      if (!userId) {
        throw AppError.unauthorized();
      }

      const member = await callbacks.findMember(organization.id, userId);

      if (!member) {
        throw AppError.forbidden("You are not a member of this organization");
      }

      // ── 4. Resolve org role with permissions ──────────────────────────────
      const role = await callbacks.findRoleWithPermissions(member.roleId);

      if (!role) {
        throw AppError.internal("Member role could not be resolved");
      }

      // ── 5. Check permission ───────────────────────────────────────────────
      const memberAction: PermissionAction =
        role.permissions[permissionKey] ?? "none";

      if (ACTION_LEVEL[memberAction] < ACTION_LEVEL[minAction]) {
        throw AppError.forbidden("Insufficient organization permissions");
      }

      // ── 6. Attach org context to request ──────────────────────────────────
      const context: OrgRequestContext = { organization, member, role };
      req.organizationMember = context;

      next();
    };
  }

  return authorizeOrg;
}
