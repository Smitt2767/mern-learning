import { oauthProviderParamSchema } from "@mern/core";
import type { Request, Response } from "express";
import { getOAuthProvider } from "../../utils/oauth/index.js";

export async function oauthRedirect(
  req: Request,
  res: Response,
): Promise<void> {
  const { provider: providerName } = oauthProviderParamSchema.parse(req.params);
  const provider = getOAuthProvider(providerName);

  const state = await provider.generateState();
  const authUrl = provider.buildAuthorizationUrl(state);

  res.redirect(authUrl);
}
