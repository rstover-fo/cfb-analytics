/**
 * PostgreSQL Schema (Drizzle ORM)
 * Application data: users, saved views, refresh logs
 */

import { pgTable, serial, text, timestamp, jsonb, varchar, integer } from 'drizzle-orm/pg-core';

export const dataRefreshLog = pgTable('data_refresh_log', {
  id: serial('id').primaryKey(),
  dataType: varchar('data_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  recordsUpdated: integer('records_updated').default(0),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const savedViews = pgTable('saved_views', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  queryConfig: jsonb('query_config').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const appSettings = pgTable('app_settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 50 }).notNull().unique(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports
export type DataRefreshLog = typeof dataRefreshLog.$inferSelect;
export type NewDataRefreshLog = typeof dataRefreshLog.$inferInsert;

export type SavedView = typeof savedViews.$inferSelect;
export type NewSavedView = typeof savedViews.$inferInsert;

export type AppSetting = typeof appSettings.$inferSelect;
export type NewAppSetting = typeof appSettings.$inferInsert;
