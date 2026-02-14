import { db } from "../db/index.js";
import { accounts, type Account, type NewAccount } from "../db/schema/index.js";

import type { DbInstance } from "../types/index.js";

export class AccountService {
  private constructor() {}

  static async create(data: NewAccount, tx: DbInstance = db): Promise<Account> {
    const [account] = await tx.insert(accounts).values(data).returning();
    return account!;
  }
}
