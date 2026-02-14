import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export class Password {
  private constructor() {}

  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  static async compare(
    plain: string,
    hashed: string,
  ): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
