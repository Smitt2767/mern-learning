import { Database } from "@mern/database"

export const database = new Database()
export const db: Database["db"] = database.db
