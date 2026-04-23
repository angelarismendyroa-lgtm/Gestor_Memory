/**
 * Query Engine — Motor de Consulta
 * 
 * Búsqueda semántica + traversal de grafo
 * - Búsqueda por similitud vectorial
 * - Búsqueda por grafo (relaciones)
 * - Búsqueda híbrida
 */

import { eq, desc, sql, and, or } from 'drizzle-orm';
import { getDB, knowledgeNodes, knowledgeEdges, embeddings, type KnowledgeNode, type KnowledgeEdge } from '../db';

interface SearchOptions {
  limit?: number;
  threshold?: number;
  includeEdges?: boolean;
}

// =============================================================
// SEMANTIC SEARCH
// =============================================================

export async function semanticSearch(
  query: string,
  embedding: number[],
  options: SearchOptions = {}
): Promise<KnowledgeNode[]> {
  const db = getDB({} as any); // Config se usa del pool existente
  
  const limit = options.limit || 10;
  const threshold = options.threshold || 0.7;
  
  // Búsqueda vectorial con pgvector
  const results = await db
    .select({
      node: knowledgeNodes,
      similarity: sql`cosine_distance(${embeddings.embedding}, ${embedding})`.as('similarity'),
    })
    .from(embeddings)
    .innerJoin(knowledgeNodes, eq(embeddings.nodeId, knowledgeNodes.id))
    .where(sql`cosine_distance(${embeddings.embedding}, ${embedding}) < ${1 - threshold}`)
    .orderBy(sql`cosine_distance(${embeddings.embedding}, ${embedding})`)
    .limit(limit);
  
  return results.map(r => r.node);
}

// =============================================================
// GRAPH TRAVERSAL
// =============================================================

export async function getRelatedNodes(
  nodeId: string,
  depth: number = 1
): Promise<{nodes: KnowledgeNode[], edges: KnowledgeEdge[]}> {
  const db = getDB({} as any);
  
  // Obtener nodos relacionados directamente
  const edges = await db
    .select()
    .from(knowledgeEdges)
    .where(
      or(
        eq(knowledgeEdges.sourceId, nodeId),
        eq(knowledgeEdges.targetId, nodeId)
      )
    );
  
  // Recolectar IDs de nodos relacionados
  const relatedIds = new Set<string>();
  for (const edge of edges) {
    if (edge.sourceId !== nodeId && edge.sourceId) relatedIds.add(edge.sourceId);
    if (edge.targetId !== nodeId && edge.targetId) relatedIds.add(edge.targetId);
  }
  
  // Obtener nodos relacionados
  const nodes = await db
    .select()
    .from(knowledgeNodes)
    .where(sql`${knowledgeNodes.id} IN ${Array.from(relatedIds)}`);
  
  return { nodes, edges };
}

export async function traverseGraph(
  startNodeId: string,
  maxDepth: number = 3
): Promise<KnowledgeNode[]> {
  const visited = new Set<string>();
  const queue: { id: string; depth: number }[] = [{ id: startNodeId, depth: 0 }];
  const results: KnowledgeNode[] = [];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id) || current.depth > maxDepth) continue;
    
    visited.add(current.id);
    
    const { nodes } = await getRelatedNodes(current.id);
    results.push(...nodes);
    
    for (const node of nodes) {
      queue.push({ id: node.id, depth: current.depth + 1 });
    }
  }
  
  return results;
}

// =============================================================
// KEYWORD SEARCH
// =============================================================

export async function keywordSearch(
  query: string,
  options: SearchOptions = {}
): Promise<KnowledgeNode[]> {
  const db = getDB({} as any);
  
  const limit = options.limit || 10;
  const searchTerm = `%${query}%`;
  
  const results = await db
    .select()
    .from(knowledgeNodes)
    .where(
      or(
        sql`${knowledgeNodes.content} ILIKE ${searchTerm}`,
        sql`${knowledgeNodes.source} ILIKE ${searchTerm}`
      )
    )
    .orderBy(desc(knowledgeNodes.createdAt))
    .limit(limit);
  
  return results;
}

// =============================================================
// HYBRID SEARCH
// =============================================================

export async function hybridSearch(
  query: string,
  embedding: number[],
  options: SearchOptions = {}
): Promise<KnowledgeNode[]> {
  // Combinar búsqueda semántica y por keywords
  const [semanticResults, keywordResults] = await Promise.all([
    semanticSearch(query, embedding, { ...options, limit: options.limit || 5 }),
    keywordSearch(query, { ...options, limit: options.limit || 5 }),
  ]);
  
  // Deduplicar y mezclar resultados
  const seen = new Set<string>();
  const merged: KnowledgeNode[] = [];
  
  for (const node of [...semanticResults, ...keywordResults]) {
    if (!seen.has(node.id)) {
      seen.add(node.id);
      merged.push(node);
    }
  }
  
  return merged.slice(0, options.limit || 10);
}

// =============================================================
// AGGREGATIONS
// =============================================================

export async function getNodeStats(): Promise<{
  totalNodes: number;
  totalEdges: number;
  sources: { source: string; count: number }[];
}> {
  const db = getDB({} as any);
  
  const [nodeCount] = await db
    .select({ count: sql`count(*)`.as('count') })
    .from(knowledgeNodes);
  
  const [edgeCount] = await db
    .select({ count: sql`count(*)`.as('count') })
    .from(knowledgeEdges);
  
  const sources = await db
    .select({
      source: knowledgeNodes.source,
      count: sql`count(*)`.as('count'),
    })
    .from(knowledgeNodes)
    .groupBy(knowledgeNodes.source);
  
  return {
    totalNodes: Number(nodeCount.count),
    totalEdges: Number(edgeCount.count),
    sources: sources.map(s => ({ source: s.source || 'unknown', count: Number(s.count) })),
  };
}