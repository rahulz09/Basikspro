import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { config } from "dotenv";
config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL not set - using mock database");
  process.env.DATABASE_URL = "postgresql://mock:mock@localhost:5432/mock";
}

let pool: pg.Pool;
try {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
} catch (e) {
  console.error("Database connection failed, using mock");
  pool = new Pool({ connectionString: "postgresql://mock:mock@localhost:5432/mock" });
}

export { pool };
export const db = drizzle(pool, { schema });
