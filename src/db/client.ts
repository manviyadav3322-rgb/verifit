import "server-only";

import mysql, { type Pool } from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "@/db/schema";

const globalForDatabase = globalThis as typeof globalThis & { verifitSqlPool?: Pool };
const databaseUrl = process.env.DRIZZLE_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("The managed database connection is not configured.");
}

export const sqlPool = globalForDatabase.verifitSqlPool ?? mysql.createPool(databaseUrl);
if (process.env.NODE_ENV !== "production") globalForDatabase.verifitSqlPool = sqlPool;

export const db = drizzle(sqlPool, { schema, mode: "default" });
