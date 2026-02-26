import { deleteOrganization } from "./delete.js";
import { getOrganization } from "./get.js";
import { listOrganizations } from "./list.js";

export class OrganizationsController {
  static list = listOrganizations;
  static get = getOrganization;
  static delete = deleteOrganization;
}
