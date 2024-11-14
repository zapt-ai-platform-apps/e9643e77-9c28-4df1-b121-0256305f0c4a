import { pgTable, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const names = pgTable('names', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  userId: uuid('user_id').notNull(),
});