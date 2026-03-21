import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// postgres.js works with local Postgres AND Neon connection strings.
// For production (Neon on Vercel), just swap DATABASE_URL — no code change needed.
const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client, { schema })
