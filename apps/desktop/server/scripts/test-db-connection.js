import pkg from 'pg'
const { Pool } = pkg
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function testConnection() {
  try {
    console.log('Testing database connection...')
    console.log(
      'DATABASE_URL:',
      process.env.DATABASE_URL?.substring(0, 30) + '...',
    )

    const result = await pool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('user', 'account', 'session', 'verification') ORDER BY tablename",
    )

    console.log('✅ Connected successfully!')
    console.log(
      'Better Auth tables found:',
      result.rows.map(r => r.tablename).join(', '),
    )

    // Check table structure
    const userColumns = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='user' ORDER BY ordinal_position",
    )
    console.log(
      '\nUser table columns:',
      userColumns.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '),
    )
  } catch (err) {
    console.error('❌ Error:', err.message)
    console.error(err)
  } finally {
    await pool.end()
  }
}

testConnection()
