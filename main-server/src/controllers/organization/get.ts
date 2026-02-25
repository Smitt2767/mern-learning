import type { Request, Response } from "express";

export async function getOrganization(
  req: Request,
  res: Response,
): Promise<void> {
  // org is already resolved and attached by authorizeOrg()
  const { organization } = req.organizationMember!;

  res.status(200).json({ success: true, data: { organization } });
}
