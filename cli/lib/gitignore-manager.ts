/**
 * gitignore-manager.ts — Gestiona .gitignore del proyecto.
 *
 * - Si no existe .gitignore → lo crea con template completo
 * - Si existe → añade las entradas necesarias (.dev/, etc.) sin duplicar
 * - Preserva todo el contenido existente del usuario
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Entradas que Gestor_Memory siempre necesita ──────

const REQUIRED_ENTRIES = [
  '',
  '# ─── Gestor_Memory v2 (Entorno de Desarrollo IA) ───',
  '.dev/',
  '.gestor-memory/',
];

const RECOMMENDED_ENTRIES = [
  '',
  '# ─── Configuración de Agentes IA (reglas internas) ───',
  '.agent/',
  '.claude/',
  '.gemini/',
  '',
  '# ─── Documentación interna y datos sensibles ───',
  'Doc-CEO/',
  'memory-bank/',
  '',
  '# ─── Entornos y claves ───',
  '.env',
  '.env.local',
  '.env.*.local',
  '*.env',
  '*.key',
  '*.pem',
  '',
  '# ─── Dependencias ───',
  'node_modules/',
  '',
  '# ─── Build output ───',
  'dist/',
  'build/',
  '.next/',
  '',
  '# ─── Logs ───',
  '*.log',
  'npm-debug.log*',
  '',
  '# ─── Editor / OS ───',
  '.vscode/',
  '!.vscode/extensions.json',
  '.idea/',
  '.DS_Store',
  'Thumbs.db',
  'desktop.ini',
  '',
  '# ─── Trunk / Linter local ───',
  '.trunk/',
];

// ── Funciones ────────────────────────────────────────

/**
 * Verifica si una entrada ya existe en el contenido del .gitignore.
 * Ignora comentarios y líneas vacías para la comparación.
 */
function entryExists(content: string, entry: string): boolean {
  if (entry.startsWith('#') || entry.trim() === '') return true; // No verificar comentarios ni vacíos
  const lines = content.split('\n').map(l => l.trim());
  return lines.includes(entry.trim());
}

/**
 * Asegura que `.dev/` y `.gestor-memory/` estén en el .gitignore.
 * Si no existe .gitignore, lo crea con un template completo.
 *
 * @returns Lista de entradas que se añadieron (vacía si ya estaban todas)
 */
export function ensureGitignore(projectDir: string): { created: boolean; entriesAdded: string[] } {
  const gitignorePath = path.join(projectDir, '.gitignore');
  const entriesAdded: string[] = [];

  if (!fs.existsSync(gitignorePath)) {
    // No existe → crear completo
    const fullContent = [...REQUIRED_ENTRIES, ...RECOMMENDED_ENTRIES].join('\n');
    fs.writeFileSync(gitignorePath, fullContent.trim() + '\n', 'utf-8');
    return { created: true, entriesAdded: ['.dev/', '.gestor-memory/', '.agent/', '.claude/', '.gemini/'] };
  }

  // Existe → añadir solo lo que falta
  let content = fs.readFileSync(gitignorePath, 'utf-8');
  const linesToAdd: string[] = [];

  for (const entry of REQUIRED_ENTRIES) {
    if (!entryExists(content, entry)) {
      linesToAdd.push(entry);
      if (!entry.startsWith('#') && entry.trim() !== '') {
        entriesAdded.push(entry);
      }
    }
  }

  if (linesToAdd.length > 0) {
    // Asegurar que hay una línea vacía antes de nuestro bloque
    if (!content.endsWith('\n')) content += '\n';
    content += '\n' + linesToAdd.join('\n') + '\n';
    fs.writeFileSync(gitignorePath, content, 'utf-8');
  }

  return { created: false, entriesAdded };
}
