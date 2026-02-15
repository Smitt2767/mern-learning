// types/express.d.ts

import type { SessionUser } from "../services/user.ts";

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      sessionId?: string;
    }
  }
}
