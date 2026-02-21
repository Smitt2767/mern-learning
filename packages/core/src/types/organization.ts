import type { InvitationStatus } from "../constants/invitation.js";
import type { RoleWithPermissions } from "./role.js";

// ─── Organization ─────────────────────────────────────────────────────────────
// Mirrors the `organizations` DB row exactly.

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// ─── Organization Member ──────────────────────────────────────────────────────
// Mirrors the `organization_members` DB row exactly.
// `roleId` is a FK → roles.id where roles.scope = "organization".

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Organization Invitation ──────────────────────────────────────────────────
// Mirrors the `organization_invitations` DB row exactly.
// `roleId` is a FK → roles.id (the org role the invitee will receive on accept).

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  email: string;
  roleId: string;
  invitedById: string;
  token: string;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Enriched / Joined shapes ─────────────────────────────────────────────────

// Member row with nested user + role name — returned by list members endpoints.
export interface OrganizationMemberWithUser extends OrganizationMember {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage: string | null;
  };
  role: {
    id: string;
    name: string;
  };
}

// Invitation row with nested org + invitedBy + role — for preview and list endpoints.
export interface OrganizationInvitationWithDetails extends OrganizationInvitation {
  organization: Pick<Organization, "id" | "name" | "slug" | "logo">;
  invitedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  role: {
    id: string;
    name: string;
  };
}

// ─── Request Context ──────────────────────────────────────────────────────────
// Attached to `req.organizationMember` by the authorizeOrg() middleware.
// Contains the resolved org + the calling user's membership row + their fully
// resolved org-scoped RoleWithPermissions (for O(1) permission checks).

export interface OrgRequestContext {
  organization: Organization;
  member: OrganizationMember;
  role: RoleWithPermissions;
}
