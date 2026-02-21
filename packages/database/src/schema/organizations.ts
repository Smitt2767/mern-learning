import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers.js";
import { organizationInvitations } from "./organization-invitations.js";
import { organizationMembers } from "./organization-members.js";
import { roles } from "./roles.js";

// Organizations are the top-level multi-tenant container.
// Soft-deleted orgs (deletedAt != null) are invisible to all user-facing queries.
// Hard cleanup is performed by platform admins via the admin-server.

export const organizations = pgTable(
  "organizations",
  {
    id,
    name: varchar({ length: 255 }).notNull(),
    // URL-friendly unique identifier — used in API routes and frontend URLs.
    // Globally unique across all orgs, immutable after creation.
    slug: varchar({ length: 100 }).notNull().unique(),
    logo: text(),
    // Flexible JSON bag for future extensibility (e.g. billing info, feature flags).
    metadata: jsonb().$type<Record<string, unknown>>(),
    createdAt,
    updatedAt,
    // Soft delete — set by the owner via DELETE /organizations/:slug.
    // Org is invisible to all user queries once set.
    deletedAt: timestamp({ withTimezone: true, mode: "date" }),
  },
  (table) => [
    index("idx_organizations_slug").on(table.slug),
    index("idx_organizations_deleted_at").on(table.deletedAt),
  ],
);

export const organizationsRelations = relations(organizations, ({ many }) => ({
  roles: many(roles),
  organizationMembers: many(organizationMembers),
  organizationInvitations: many(organizationInvitations),
}));

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
