import type { Request, Response } from "express";

export class AuthController {
  static login(req: Request, res: Response) {
    return res.json({ success: true });
  }
  static signUp(req: Request, res: Response) {}
  static logout(req: Request, res: Response) {}
}
