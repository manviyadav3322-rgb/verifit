import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import mysql from "mysql2/promise";

const migrationId = "0001_verifit_relational_core";
const connectionString = process.env.DRIZZLE_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DATABASE_URL in the managed project environment before running migrations.");

const sql = await readFile(resolve("src/db/migrations/0001_verifit_relational_core.sql"), "utf8");
const checksum = createHash("sha256").update(sql).digest("hex");
const statements = sql.split(/;\s*(?:\r?\n|$)/).map((statement) => statement.trim()).filter(Boolean);
const connection = await mysql.createConnection(connectionString);

try {
  await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    migration_id VARCHAR(191) NOT NULL PRIMARY KEY,
    checksum CHAR(64) NOT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  const [rows] = await connection.execute("SELECT checksum FROM schema_migrations WHERE migration_id = ? LIMIT 1", [migrationId]);
  const existing = rows[0];
  if (existing) {
    if (existing.checksum !== checksum) throw new Error(`Migration ${migrationId} was already applied with a different checksum.`);
    console.log(`${migrationId} is already applied; no database changes made.`);
  } else {
    for (const statement of statements) await connection.query(statement);
    await connection.execute("INSERT INTO schema_migrations (migration_id, checksum) VALUES (?, ?)", [migrationId, checksum]);
    console.log(`Applied ${migrationId} (${statements.length} SQL statements).`);
  }
} finally {
  await connection.end();
}
