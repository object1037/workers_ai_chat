import { drizzle } from 'drizzle-orm/d1'
import { message } from '~/schema'

export type InsertMessage = typeof message.$inferInsert

export const getMessages = async (db_binding: D1Database) => {
  const db = drizzle(db_binding)
  const result = await db.select().from(message)
  return result
}

export const addMessage = async (
  db_binding: D1Database,
  messages: InsertMessage[]
) => {
  const db = drizzle(db_binding)
  const result = await db.insert(message).values(messages)
  return result
}

export const resetChat = async (db_binding: D1Database) => {
  const db = drizzle(db_binding)
  const result = await db.delete(message)
  return result
}
