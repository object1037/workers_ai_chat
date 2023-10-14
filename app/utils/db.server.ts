import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { message, chat } from '~/schema'

export type InsertMessage = typeof message.$inferInsert

export const getMessages = async (db_binding: D1Database, chatId: number) => {
  const db = drizzle(db_binding)
  const chatResult = await db.select().from(chat).where(eq(chat.id, chatId))
  if (chatResult.length === 0) {
    return { error: true }
  }
  const result = await db
    .select()
    .from(message)
    .where(eq(message.chatId, chatId))
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

export const deleteChat = async (db_binding: D1Database, chatId: number) => {
  const db = drizzle(db_binding)
  const messageResult = await db
    .delete(message)
    .where(eq(message.chatId, chatId))
  if (!messageResult.success) {
    return messageResult
  }
  const result = await db.delete(chat).where(eq(chat.id, chatId))
  return result
}

export const addChat = async (db_binding: D1Database, name: string) => {
  const db = drizzle(db_binding)
  const result = await db
    .insert(chat)
    .values({ name })
    .returning({ insertedId: chat.id })
  return result
}

export const getChats = async (db_binding: D1Database) => {
  const db = drizzle(db_binding)
  const result = await db.select().from(chat)
  return result
}
