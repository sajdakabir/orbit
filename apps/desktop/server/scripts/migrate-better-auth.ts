import { Pool } from 'pg'
import { readFileSync } from 'fs'
import { join } from 'path'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function migrate() {
  try {
    console.log('Creating Better Auth tables...')

    const sql = readFileSync(
      join(import.meta.dir, 'create-better-auth-tables.sql'),
      'utf-8',
    )

    await pool.query(sql)

    console.log('✅ Better Auth tables created successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate()
