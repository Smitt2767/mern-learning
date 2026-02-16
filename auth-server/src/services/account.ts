import type { AccountProvider } from "@mern/core";
import { and, eq } from "drizzle-orm";

import { accounts, type DbInstance, type NewAccount } from "@mern/database";
import { db } from "../config/db.js";

export class AccountService {
  private constructor() {}

  static async create(data: NewAccount, tx: DbInstance = db) {
    const [account] = await tx.insert(accounts).values(data).returning();
    return account!;
  }

  static async findByUserIdAndProvider(
    userId: string,
    provider: AccountProvider,
    tx: DbInstance = db,
  ) {
    return tx.query.accounts.findFirst({
      where: and(eq(accounts.userId, userId), eq(accounts.provider, provider)),
    });
  }

  static async findByProviderAndAccountId(
    provider: AccountProvider,
    providerAccountId: string,
    tx: DbInstance = db,
  ) {
    return tx.query.accounts.findFirst({
      where: and(
        eq(accounts.provider, provider),
        eq(accounts.providerAccountId, providerAccountId),
      ),
    });
  }
}
