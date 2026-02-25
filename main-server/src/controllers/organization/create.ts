import { AppError } from "@mern/server";
import type { Request, Response } from "express";
import { z } from "zod";
import { OrganizationService } from "../../services/organization.js";

const schema = z.object({
  name: z.string().min(2).max(255),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
  logo: z.url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function createOrganization(
  req: Request,
  res: Response,
): Promise<void> {
  const input = schema.parse(req.body);

  const taken = await OrganizationService.isSlugTaken(input.slug);
  if (taken) throw AppError.conflict("This slug is already taken");

  const org = await OrganizationService.create(input, req.user!.id);

  res.status(201).json({ success: true, data: { organization: org } });
}
