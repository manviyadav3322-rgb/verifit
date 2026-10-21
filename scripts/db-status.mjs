import mysql from "mysql2/promise";

const connectionString = process.env.DRIZZLE_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("The managed database connection is not available in this environment.");
const connection = await mysql.createConnection(connectionString);
try {
  const [versionRows] = await connection.query("SELECT VERSION() AS version");
  const [tableRows] = await connection.query("SHOW TABLES");
  console.log(`MySQL-compatible server: ${versionRows[0]?.version ?? "unknown"}`);
  console.log("Tables:");
  if (!tableRows.length) console.log("(none)");
  for (const row of tableRows) console.log(Object.values(row)[0]);
} finally {
  await connection.end();
}
