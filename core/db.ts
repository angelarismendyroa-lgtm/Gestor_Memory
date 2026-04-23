/**
 * Core Memory Database Connection
 * 
 * Gestor_Memory usa PostgreSQL + pgvector + Apache AGE:
 * - PostgreSQL: base de datos principal
 * - pgvector: búsqueda semántica
 * - Apache AGE: grafo de conocimiento (opcional)
 */

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const { Pool } = pg;

// =============================================================
// CONFIGURATION
// =============================================================

interface DBConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

// =============================================================
// CONNECTION POOL
// =============================================================

let pool: pg.Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getPool(config: DBConfig): pg.Pool {
  if (pool) return pool;
  
  pool = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  return pool;
}

export function getDB(config: DBConfig) {
  if (db) return db;
  
  const pool = getPool(config);
  db = drizzle(pool, { schema });
  
  return db;
}

// =============================================================
// INIT SCHEMA
// =============================================================

export async function initSchema(config: DBConfig): Promise<void> {
  const pool = getPool(config);
  
  // Habilitar extensión pgvector
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS vector;
  `);
  
  // Habilitar Apache AGE (si está instalado)
  try {
    await pool.query(`
      LOAD 'age';
      SET search_path = ag_catalog, "$user", public;
    `);
  } catch {
    // Apache AGE no está disponible
    console.log('Apache AGE no está instalado. Solo usando pgvector.');
  }
  
  console.log('✅ Esquema inicializado');
}

// =============================================================
// CLOSE CONNECTION
// =============================================================

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}

// =============================================================
// EXPORTS
// =============================================================

export * from './schema';
export type { DBConfig };