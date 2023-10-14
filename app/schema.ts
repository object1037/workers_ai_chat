import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const message = sqliteTable('message', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  message: text('message').notNull(),
  isUser: integer('isUser', { mode: 'boolean' }).notNull(),
  chatId: integer('chat_id')
    .notNull()
    .references(() => chat.id),
})

export const chat = sqliteTable('chat', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
})
