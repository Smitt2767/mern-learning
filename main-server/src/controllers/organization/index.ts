import { createOrganization } from "./create.js";
import { getOrganization } from "./get.js";
import { getMembers } from "./getMembers.js";
import { getOrgRoles } from "./getRoles.js";
import { leaveOrganization } from "./leave.js";
import { listOrganizations } from "./list.js";
import { removeOrganization } from "./remove.js";
import { removeMember } from "./removeMember.js";
import { transferOwnership } from "./transferOwnership.js";
import { updateOrganization } from "./update.js";
import { updateMemberRole } from "./updateMemberRole.js";

export class OrganizationController {
  static create = createOrganization;
  static list = listOrganizations;
  static get = getOrganization;
  static update = updateOrganization;
  static remove = removeOrganization;
  static getMembers = getMembers;
  static updateMemberRole = updateMemberRole;
  static removeMember = removeMember;
  static leave = leaveOrganization;
  static transferOwnership = transferOwnership;
  static getRoles = getOrgRoles;
}
