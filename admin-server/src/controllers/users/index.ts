import { assignRole } from "./assignRole.js";
import { getUser } from "./get.js";
import { listUsers } from "./list.js";
import { updateUserStatus } from "./updateStatus.js";

export class UsersController {
  static list = listUsers;
  static get = getUser;
  static assignRole = assignRole;
  static updateStatus = updateUserStatus;
}
