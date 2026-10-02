import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationFiles = (await fs.readdir(path.join(__dirname, '..', 'sql')))
  .filter((file) => file.endsWith('.sql'))
  .sort();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  for (const file of migrationFiles) {
    const sql = await fs.readFile(path.join(__dirname, '..', 'sql', file), 'utf8');
    await pool.query(sql);
    console.log(`Applied ${file}`);
  }
  console.log(`Database migration complete (${migrationFiles.length} files)`);
} finally {
  await pool.end();
}
