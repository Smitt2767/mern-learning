import type { OrgRequestContext, SessionUser } from "@mern/core";

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      sessionId?: string;
      organizationMember?: OrgRequestContext;
    }
  }
}

export {};
