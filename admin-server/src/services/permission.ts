import { permissions } from "@mern/database";
import { asc } from "drizzle-orm";

import { db } from "../config/db.js";

export class PermissionService {
  private constructor() {}

  static async findAll() {
    return db.select().from(permissions).orderBy(asc(permissions.key));
  }
}
