/**
 * Retention Manager — Políticas de Retención
 * 
 * Gestiona la retención temporal de nodos y aristas:
 * - Auto-cleanup basado en políticas
 * - Expiración de nodos
 * - Consolidación periódica
 */

import { lt, sql } from 'drizzle-orm';
import { getDB, knowledgeNodes, knowledgeEdges, embeddings, retentionPolicies } from '../db';

interface RetentionPolicy {
  entityType: 'nodes' | 'edges' | 'embeddings';
  retentionDays: number;
  autoCleanup: boolean;
}

// =============================================================
// POLICIES
// =============================================================

const DEFAULT_POLICIES: RetentionPolicy[] = [
  { entityType: 'nodes', retentionDays: 90, autoCleanup: true },
  { entityType: 'edges', retentionDays: 180, autoCleanup: true },
  { entityType: 'embeddings', retentionDays: 90, autoCleanup: true },
];

// =============================================================
// INIT POLICIES
// =============================================================

export async function initPolicies(): Promise<void> {
  const db = getDB({} as any);
  
  for (const policy of DEFAULT_POLICIES) {
    await db.insert(retentionPolicies).values({
      name: `${policy.retentionDays} días ${policy.entityType}`,
      entityType: policy.entityType,
      retentionDays: policy.retentionDays,
      autoCleanup: policy.autoCleanup,
    }).onConflictDoNothing();
  }
  
  console.log('✅ Políticas de retención inicializadas');
}

// =============================================================
// CLEANUP
// =============================================================

export async function cleanupExpired(): Promise<{ deletedNodes: number; deletedEdges: number }> {
  const db = getDB({} as any);
  
  const now = new Date();
  const deletedNodes: string[] = [];
  const deletedEdges: string[] = [];
  
  // 1. Encontrar nodos expirados
  const expiredNodes = await db
    .select({ id: knowledgeNodes.id })
    .from(knowledgeNodes)
    .where(sql`${knowledgeNodes.expiresAt} IS NOT NULL AND ${knowledgeNodes.expiresAt} < ${now}`);
  
  for (const node of expiredNodes) {
    deletedNodes.push(node.id);
  }
  
  // 2. Encontrar aristas relacionadas
  const expiredEdges = await db
    .select()
    .from(knowledgeEdges)
    .where(
      sql`${knowledgeEdges.sourceId} IN ${deletedNodes} OR ${knowledgeEdges.targetId} IN ${deletedNodes}`
    );
  
  for (const edge of expiredEdges) {
    deletedEdges.push(edge.id);
  }
  
  // 3. Eliminar (si autoCleanup está habilitado)
  if (DEFAULT_POLICIES.find(p => p.entityType === 'nodes')?.autoCleanup) {
    if (deletedNodes.length > 0) {
      await db
        .delete(knowledgeNodes)
        .where(sql`${knowledgeNodes.id} IN ${deletedNodes}`);
    }
  }
  
  if (DEFAULT_POLICIES.find(p => p.entityType === 'edges')?.autoCleanup) {
    if (deletedEdges.length > 0) {
      await db
        .delete(knowledgeEdges)
        .where(sql`${knowledgeEdges.id} IN ${deletedEdges}`);
    }
  }
  
  if (deletedNodes.length > 0) {
    await db
      .delete(embeddings)
      .where(sql`${embeddings.nodeId} IN ${deletedNodes}`);
  }
  
  return {
    deletedNodes: deletedNodes.length,
    deletedEdges: deletedEdges.length,
  };
}

// =============================================================
// SET EXPIRATION
// =============================================================

export async function setNodeExpiration(
  nodeId: string,
  retentionDays: number
): Promise<void> {
  const db = getDB({} as any);
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + retentionDays);
  
  await db
    .update(knowledgeNodes)
    .set({ expiresAt })
    .where(sql`${knowledgeNodes.id} = ${nodeId}`);
}

// =============================================================
// SCHEDULE (para cron)
// =============================================================

export async function scheduleRetentionCheck(): Promise<void> {
  // Esta función se llama desde un cron job
  // Ejemplo: cada día a las 3 AM
  
  try {
    const result = await cleanupExpired();
    if (result.deletedNodes > 0) {
      console.log(`🧹 Cleanup: ${result.deletedNodes} nodos, ${result.deletedEdges} aristas eliminados`);
    }
  } catch (err) {
    console.error('Error en cleanup:', err);
  }
}