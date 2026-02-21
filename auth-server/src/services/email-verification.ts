import { emailVerifications, type DbInstance } from "@mern/database";
import { and, eq, gt } from "drizzle-orm";
import crypto from "node:crypto";
import { appConfig } from "../config/app.js";
import { db } from "../config/db.js";

export class EmailVerificationService {
  private constructor() {}

  static async findByToken(token: string) {
    return db.query.emailVerifications.findFirst({
      where: and(
        eq(emailVerifications.token, token),
        gt(emailVerifications.expiresAt, new Date()),
      ),
    });
  }

  static async createToken(userId: string, tx: DbInstance = db) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = appConfig.auth.emailVerificationToken.getExpiresAt();

    await tx.insert(emailVerifications).values({
      userId,
      token,
      expiresAt,
    });

    return { token, expiresAt };
  }

  static async deleteByUserId(userId: string, tx: DbInstance = db) {
    await tx
      .delete(emailVerifications)
      .where(eq(emailVerifications.userId, userId));
  }
}
