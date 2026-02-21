import type { Request, Response } from "express";

import {
  PERMISSION_ACTIONS,
  PERMISSION_KEYS,
  type PermissionAction,
  type PermissionKey,
} from "@mern/core";
import { AppError } from "@mern/server";
import { z } from "zod";
import { RoleService } from "../../services/role.js";

const setPermissionsSchema = z.object({
  permissions: z.record(z.enum(PERMISSION_KEYS), z.enum(PERMISSION_ACTIONS)),
});

export async function setRolePermissions(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params as { id: string };
  const { permissions } = setPermissionsSchema.parse(req.body);

  await RoleService.setPermissions(
    id,
    permissions as Partial<Record<PermissionKey, PermissionAction>>,
  );

  const updated = await RoleService.findById(id);
  if (!updated) throw AppError.notFound("Role not found");

  res.status(200).json({ success: true, data: updated });
}
