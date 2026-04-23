/**
 * Supabase Connector — Conecta con Supabase
 *
 * Para Modo Filtro Temporal con proyectos Supabase existentes.
 * NOTA: Esta funcionalidad está en desarrollo (Fase 7).
 */

import { createClient } from '@supabase/supabase-js';

interface SupabaseConnectorConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
  schema?: string;
}

// =============================================================
// CLIENT
// =============================================================

let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient(config: SupabaseConnectorConfig) {
  if (client) return client;

  client = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return client;
}

// =============================================================
// SYNC TABLES
// =============================================================

export async function getTables(config: SupabaseConnectorConfig): Promise<{
  name: string;
  rowCount: number;
  rlsEnabled: boolean;
}[]> {
  const supabase = getSupabaseClient(config);

  const { data, error } = await supabase.rpc('get_tables' as any);

  if (error) {
    console.error('Error fetching tables:', error);
    return [];
  }

  return (data as any[] || []).map((table: any) => ({
    name: table.tablename,
    rowCount: table.rowcount || 0,
    rlsEnabled: table.rlsenabled || false,
  }));
}

// =============================================================
// SYNC SCHEMA
// =============================================================

export async function syncSchema(config: SupabaseConnectorConfig): Promise<string> {
  const supabase = getSupabaseClient(config);

  const tables = await getTables(config);

  let schema = '# Schema — Supabase\n\n';

  for (const table of tables) {
    schema += `## ${table.name}\n\n`;
    schema += `| Propiedad | Valor |\n|:---|:---|\n`;
    schema += `| **Filas** | ${table.rowCount} |\n`;
    schema += `| **RLS** | ${table.rlsEnabled ? '✅' : '❌'} |\n`;
    schema += '\n';
  }

  return schema;
}

// =============================================================
// EXTRACT RLS POLICIES
// =============================================================

export async function extractRLSPolicies(config: SupabaseConnectorConfig): Promise<string> {
  const supabase = getSupabaseClient(config);

  const { data, error } = await supabase.rpc('get_rls_policies' as any);

  if (error) return '';

  let policies = '## Row Level Security\n\n';
  policies += '| Tabla | Política | Expresión |\n|:---|:---|:---|\n';

  for (const policy of (data as any[] || [])) {
    policies += `| ${policy.tablename} | ${policy.policyname} | \`${policy.policy}\` |\n`;
  }

  return policies;
}

// =============================================================
// EXTRACT EDGE FUNCTIONS
// =============================================================
// NOTA: La API de Supabase no permite listar Edge Functions programáticamente.
// Esta función está stubneada. Para usarla, se requiere acceso directo al proyecto.

export async function extractEdgeFunctions(_config: SupabaseConnectorConfig): Promise<string> {
  console.warn('extractEdgeFunctions: stubbed (requiere acceso directo a Supabase)');
  return '## Edge Functions\n\n*Stub: implementar manualmente*\n';
}
