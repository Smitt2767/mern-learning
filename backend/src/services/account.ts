import type { AccountProvider } from "@mern/shared";
import { and, eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { accounts, type Account, type NewAccount } from "../db/schema/index.js";
import type { DbInstance } from "../types/index.js";

export class AccountService {
  private constructor() {}

  static async create(data: NewAccount, tx: DbInstance = db): Promise<Account> {
    const [account] = await tx.insert(accounts).values(data).returning();
    return account!;
  }

  static async findByUserIdAndProvider(
    userId: string,
    provider: AccountProvider,
    tx: DbInstance = db,
  ): Promise<Account | undefined> {
    return tx.query.accounts.findFirst({
      where: and(eq(accounts.userId, userId), eq(accounts.provider, provider)),
    });
  }

  static async findByProviderAndAccountId(
    provider: AccountProvider,
    providerAccountId: string,
    tx: DbInstance = db,
  ): Promise<Account | undefined> {
    return tx.query.accounts.findFirst({
      where: and(
        eq(accounts.provider, provider),
        eq(accounts.providerAccountId, providerAccountId),
      ),
    });
  }
}
