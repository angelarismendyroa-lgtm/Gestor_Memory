/**
 * Gestor_Memory Core — Esquemas de Base de Datos (Drizzle ORM)
 */

import { pgTable, uuid, text, timestamp, jsonb, real, integer, boolean, customType } from 'drizzle-orm/pg-core';

// Vector type for pgvector
const vector = customType<{ data: number[] }>({
  dataType() {
    return 'vector(1536)';
  },
});

export const knowledgeNodes = pgTable('knowledge_nodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  content: text('content').notNull(),
  source: text('source').notNull(),
  sourceType: text('source_type').notNull(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
});

export const knowledgeEdges = pgTable('knowledge_edges', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourceId: uuid('source_id').references(() => knowledgeNodes.id),
  targetId: uuid('target_id').references(() => knowledgeNodes.id),
  relationship: text('relationship').notNull(),
  weight: real('weight').default(1),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
});

export const embeddings = pgTable('embeddings', {
  id: uuid('id').defaultRandom().primaryKey(),
  nodeId: uuid('node_id').references(() => knowledgeNodes.id),
  embedding: vector('embedding'),
  model: text('model').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const retentionPolicies = pgTable('retention_policies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  entityType: text('entity_type').notNull(),
  retentionDays: integer('retention_days').notNull(),
  autoCleanup: boolean('auto_cleanup').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Type inference
export type KnowledgeNode = typeof knowledgeNodes.$inferSelect;
export type KnowledgeEdge = typeof knowledgeEdges.$inferSelect;
export type Embedding = typeof embeddings.$inferSelect;
export type RetentionPolicy = typeof retentionPolicies.$inferSelect;