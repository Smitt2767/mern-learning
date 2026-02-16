import { passwordResetTokens, type DbInstance } from "@mern/database";
import { and, eq, gt, isNull } from "drizzle-orm";
import crypto from "node:crypto";
import { appConfig } from "../config/app.js";
import { db } from "../config/db.js";

export class PasswordResetService {
  private constructor() {}

  static async findByToken(token: string) {
    return db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.token, token),
        gt(passwordResetTokens.expiresAt, new Date()),
        isNull(passwordResetTokens.usedAt),
      ),
    });
  }

  static async createToken(userId: string, tx: DbInstance = db) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = appConfig.auth.passwordResetToken.getExpiresAt();

    await tx.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
    });

    return token;
  }

  static async markAsUsed(id: string, tx: DbInstance = db) {
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, id));
  }

  static async deleteByUserId(userId: string, tx: DbInstance = db) {
    await tx
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, userId));
  }
}
