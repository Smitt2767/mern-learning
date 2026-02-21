import { createRole } from "./create.js";
import { deleteRole } from "./delete.js";
import { getRole } from "./get.js";
import { listRoles } from "./list.js";
import { setRolePermissions } from "./setPermissions.js";
import { updateRole } from "./update.js";

export class RolesController {
  static list = listRoles;
  static get = getRole;
  static create = createRole;
  static update = updateRole;
  static setPermissions = setRolePermissions;
  static delete = deleteRole;
}
