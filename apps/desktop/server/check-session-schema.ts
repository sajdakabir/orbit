import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function checkSchema() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'session'
      ORDER BY ordinal_position
    `)
    console.log('📋 Session table schema:')
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`)
    })
  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

checkSchema()
