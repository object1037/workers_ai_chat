import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const chat = sqliteTable('chat', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  message: text('message').notNull(),
  isUser: integer('isUser', { mode: 'boolean' }).notNull(),
})
