import type { FastifyInstance } from 'fastify'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export const registerUserRoutes = async (
  fastify: FastifyInstance,
  options: { requireAuth: boolean },
) => {
  const { requireAuth } = options

  // Get user onboarding status
  fastify.get('/user/onboarding', async (request, reply) => {
    try {
      const userSub = (requireAuth && (request as any).user?.sub) || undefined
      if (!userSub) {
        reply.code(401).send({ success: false, error: 'Unauthorized' })
        return
      }

      // Query onboarding status from user table
      const result = await pool.query(
        `SELECT onboarding_completed, onboarding_step FROM "user" WHERE id = $1`,
        [userSub],
      )

      if (result.rows.length === 0) {
        reply.code(404).send({ success: false, error: 'User not found' })
        return
      }

      const user = result.rows[0]
      reply.send({
        success: true,
        onboarding_completed: user.onboarding_completed ?? false,
        onboarding_step: user.onboarding_step ?? 0,
      })
    } catch (error) {
      console.error('Error fetching user onboarding status:', error)
      reply.code(500).send({ success: false, error: 'Internal server error' })
    }
  })

  // Update user onboarding status
  fastify.post('/user/onboarding', async (request, reply) => {
    try {
      const userSub = (requireAuth && (request as any).user?.sub) || undefined
      if (!userSub) {
        reply.code(401).send({ success: false, error: 'Unauthorized' })
        return
      }

      const { onboarding_completed, onboarding_step } = request.body as {
        onboarding_completed?: boolean
        onboarding_step?: number
      }

      // Build the update query dynamically based on provided fields
      const updates: string[] = []
      const values: any[] = []
      let paramIndex = 1

      if (onboarding_completed !== undefined) {
        updates.push(`onboarding_completed = $${paramIndex++}`)
        values.push(onboarding_completed)
      }
      if (onboarding_step !== undefined) {
        updates.push(`onboarding_step = $${paramIndex++}`)
        values.push(onboarding_step)
      }

      if (updates.length === 0) {
        reply.code(400).send({ success: false, error: 'No fields to update' })
        return
      }

      values.push(userSub)
      const query = `UPDATE "user" SET ${updates.join(', ')} WHERE id = $${paramIndex}`
      await pool.query(query, values)

      reply.send({ success: true })
    } catch (error) {
      console.error('Error updating user onboarding status:', error)
      reply.code(500).send({ success: false, error: 'Internal server error' })
    }
  })
}
