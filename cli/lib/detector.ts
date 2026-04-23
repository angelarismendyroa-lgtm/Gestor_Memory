/**
 * detector.ts — Detecta si el proyecto es nuevo o existente.
 *
 * Escanea el directorio de trabajo buscando manifiestos (package.json,
 * Cargo.toml, go.mod, etc.), schemas de DB (prisma, drizzle, supabase),
 * archivos de configuración de agentes, y estructura de código fuente.
 *
 * Devuelve un ProjectProfile completo que alimenta al generador de PRD.
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Tipos ────────────────────────────────────────────

export interface DetectedDB {
  type: 'prisma' | 'drizzle' | 'supabase' | 'knex' | 'typeorm' | 'sequelize' | 'raw-sql' | 'unknown';
  schemaPath?: string;
  modelCount?: number;
  models?: string[];
  hasRLS?: boolean;
  hasMigrations?: boolean;
}

export interface DetectedStack {
  runtime: 'node' | 'python' | 'rust' | 'go' | 'dotnet' | 'unknown';
  framework?: string;        // React, Next.js, Vite, Express, FastAPI, etc.
  language: string;           // TypeScript, JavaScript, Python, etc.
  styling?: string;           // TailwindCSS, CSS Modules, Vanilla CSS, etc.
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun';
}

export interface DetectedAgentConfig {
  hasAgentsMd: boolean;
  hasClaudeMd: boolean;
  hasGeminiMd: boolean;
  hasAgentDir: boolean;
  hasHandoffs: boolean;
  ucaVersion?: number;       // 1 = UCA original, 2 = Gestor_Memory
}

export interface DetectedIntegrations {
  hasMCPConfig: boolean;
  hasDocker: boolean;
  hasCI: boolean;             // GitHub Actions, etc.
  hasEnvExample: boolean;
  envVars?: string[];         // Variables de entorno detectadas
  mcpServers?: string[];      // Nombres de servidores MCP
}

export interface ProjectProfile {
  isNew: boolean;             // true = proyecto vacío o casi vacío
  projectName: string;
  projectPath: string;
  stack: DetectedStack;
  databases: DetectedDB[];
  agentConfig: DetectedAgentConfig;
  integrations: DetectedIntegrations;
  sourceFileCount: number;
  hasGit: boolean;
  hasGitignore: boolean;
  existingGitignoreContent?: string;
}

// ── Funciones de detección ───────────────────────────

function fileExists(dir: string, ...segments: string[]): boolean {
  return fs.existsSync(path.join(dir, ...segments));
}

function readFileIfExists(dir: string, ...segments: string[]): string | null {
  const filePath = path.join(dir, ...segments);
  if (fs.existsSync(filePath)) {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch { return null; }
  }
  return null;
}

function countFilesRecursive(dir: string, extensions: string[], maxDepth = 5, currentDepth = 0): number {
  if (currentDepth >= maxDepth || !fs.existsSync(dir)) return 0;

  let count = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
      if (entry.isDirectory()) {
        count += countFilesRecursive(path.join(dir, entry.name), extensions, maxDepth, currentDepth + 1);
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        count++;
      }
    }
  } catch { /* ignore permission errors */ }
  return count;
}

function detectStack(projectDir: string): DetectedStack {
  // Node.js / JavaScript / TypeScript
  const pkgJsonContent = readFileIfExists(projectDir, 'package.json');
  if (pkgJsonContent) {
    try {
      const pkg = JSON.parse(pkgJsonContent);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const hasTS = fileExists(projectDir, 'tsconfig.json') || !!deps['typescript'];

      let framework: string | undefined;
      let styling: string | undefined;

      // Detectar framework
      if (deps['next']) framework = 'Next.js';
      else if (deps['vite'] || deps['@vitejs/plugin-react']) framework = 'Vite + React';
      else if (deps['react'] && !deps['next']) framework = 'React';
      else if (deps['express']) framework = 'Express';
      else if (deps['fastify']) framework = 'Fastify';
      else if (deps['hono']) framework = 'Hono';
      else if (deps['vue']) framework = 'Vue';
      else if (deps['svelte'] || deps['@sveltejs/kit']) framework = 'SvelteKit';

      // Detectar styling
      if (deps['tailwindcss']) styling = 'TailwindCSS';
      else if (fileExists(projectDir, 'src', 'index.css') || fileExists(projectDir, 'styles')) styling = 'Vanilla CSS';

      // Detectar package manager
      let packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' = 'npm';
      if (fileExists(projectDir, 'yarn.lock')) packageManager = 'yarn';
      else if (fileExists(projectDir, 'pnpm-lock.yaml')) packageManager = 'pnpm';
      else if (fileExists(projectDir, 'bun.lockb')) packageManager = 'bun';

      return {
        runtime: 'node',
        framework,
        language: hasTS ? 'TypeScript' : 'JavaScript',
        styling,
        packageManager,
      };
    } catch { /* invalid JSON */ }
  }

  // Python
  if (fileExists(projectDir, 'requirements.txt') || fileExists(projectDir, 'pyproject.toml') || fileExists(projectDir, 'setup.py')) {
    const pyproject = readFileIfExists(projectDir, 'pyproject.toml') || '';
    let framework: string | undefined;
    if (pyproject.includes('fastapi')) framework = 'FastAPI';
    else if (pyproject.includes('django')) framework = 'Django';
    else if (pyproject.includes('flask')) framework = 'Flask';
    return { runtime: 'python', framework, language: 'Python' };
  }

  // Rust
  if (fileExists(projectDir, 'Cargo.toml')) {
    return { runtime: 'rust', language: 'Rust' };
  }

  // Go
  if (fileExists(projectDir, 'go.mod')) {
    return { runtime: 'go', language: 'Go' };
  }

  // .NET
  if (fs.readdirSync(projectDir).some(f => f.endsWith('.csproj') || f.endsWith('.sln'))) {
    return { runtime: 'dotnet', language: 'C#' };
  }

  return { runtime: 'unknown', language: 'Unknown' };
}

function detectDatabases(projectDir: string): DetectedDB[] {
  const dbs: DetectedDB[] = [];

  // Prisma
  const prismaSchema = readFileIfExists(projectDir, 'prisma', 'schema.prisma');
  if (prismaSchema) {
    const modelMatches = prismaSchema.match(/^model\s+(\w+)\s*\{/gm);
    dbs.push({
      type: 'prisma',
      schemaPath: 'prisma/schema.prisma',
      modelCount: modelMatches?.length || 0,
      models: modelMatches?.map(m => m.replace(/^model\s+/, '').replace(/\s*\{$/, '')) || [],
      hasMigrations: fileExists(projectDir, 'prisma', 'migrations'),
    });
  }

  // Drizzle
  if (fileExists(projectDir, 'drizzle.config.ts') || fileExists(projectDir, 'drizzle.config.js')) {
    dbs.push({
      type: 'drizzle',
      schemaPath: 'drizzle.config.ts',
      hasMigrations: fileExists(projectDir, 'drizzle'),
    });
  }

  // Supabase
  if (fileExists(projectDir, 'supabase')) {
    const migrationDir = path.join(projectDir, 'supabase', 'migrations');
    let migrationCount = 0;
    if (fs.existsSync(migrationDir)) {
      try { migrationCount = fs.readdirSync(migrationDir).length; } catch { /* ignore */ }
    }
    dbs.push({
      type: 'supabase',
      schemaPath: 'supabase/',
      hasMigrations: migrationCount > 0,
      hasRLS: true, // Supabase siempre tiene RLS
    });
  }

  // Knex
  if (fileExists(projectDir, 'knexfile.js') || fileExists(projectDir, 'knexfile.ts')) {
    dbs.push({ type: 'knex', schemaPath: 'knexfile' });
  }

  // TypeORM
  if (fileExists(projectDir, 'ormconfig.json') || fileExists(projectDir, 'ormconfig.ts')) {
    dbs.push({ type: 'typeorm', schemaPath: 'ormconfig' });
  }

  return dbs;
}

function detectAgentConfig(projectDir: string): DetectedAgentConfig {
  const hasAgentsMd = fileExists(projectDir, 'AGENTS.md');
  const hasClaudeMd = fileExists(projectDir, 'CLAUDE.md');
  const hasGeminiMd = fileExists(projectDir, 'GEMINI.md');
  const hasAgentDir = fileExists(projectDir, '.agent');
  const hasHandoffs = fileExists(projectDir, '.agent', 'handoffs');

  // Detectar versión de UCA
  let ucaVersion: number | undefined;
  if (hasAgentsMd) {
    const content = readFileIfExists(projectDir, 'AGENTS.md') || '';
    if (content.includes('Gestor_Memory') || content.includes('v2')) ucaVersion = 2;
    else if (content.includes('Universal Agent Configuration')) ucaVersion = 1;
  }

  return { hasAgentsMd, hasClaudeMd, hasGeminiMd, hasAgentDir, hasHandoffs, ucaVersion };
}

function detectIntegrations(projectDir: string): DetectedIntegrations {
  const hasMCPConfig = fileExists(projectDir, 'mcp_config.json') || fileExists(projectDir, '.mcp.json');
  const hasDocker = fileExists(projectDir, 'Dockerfile') || fileExists(projectDir, 'docker-compose.yml');
  const hasCI = fileExists(projectDir, '.github', 'workflows');
  const hasEnvExample = fileExists(projectDir, '.env.example') || fileExists(projectDir, '.env.sample');

  // Leer variables de entorno de .env.example
  let envVars: string[] = [];
  const envContent = readFileIfExists(projectDir, '.env.example') || readFileIfExists(projectDir, '.env.sample');
  if (envContent) {
    envVars = envContent
      .split('\n')
      .filter(l => l.includes('=') && !l.startsWith('#'))
      .map(l => l.split('=')[0].trim());
  }

  // Leer servidores MCP
  let mcpServers: string[] = [];
  const mcpContent = readFileIfExists(projectDir, 'mcp_config.json') || readFileIfExists(projectDir, '.mcp.json');
  if (mcpContent) {
    try {
      const mcp = JSON.parse(mcpContent);
      mcpServers = Object.keys(mcp.mcpServers || mcp.servers || {});
    } catch { /* invalid JSON */ }
  }

  return { hasMCPConfig, hasDocker, hasCI, hasEnvExample, envVars, mcpServers };
}

// ── Función principal ────────────────────────────────

export function detectProject(projectDir: string): ProjectProfile {
  const absoluteDir = path.resolve(projectDir);

  const stack = detectStack(absoluteDir);
  const databases = detectDatabases(absoluteDir);
  const agentConfig = detectAgentConfig(absoluteDir);
  const integrations = detectIntegrations(absoluteDir);

  // Contar archivos fuente
  const sourceExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.rs', '.go', '.cs', '.vue', '.svelte'];
  const sourceFileCount = countFilesRecursive(absoluteDir, sourceExts);

  // Detectar Git
  const hasGit = fileExists(absoluteDir, '.git');
  const hasGitignore = fileExists(absoluteDir, '.gitignore');
  const existingGitignoreContent = hasGitignore
    ? readFileIfExists(absoluteDir, '.gitignore') || undefined
    : undefined;

  // Determinar si es nuevo
  const isNew = stack.runtime === 'unknown' && databases.length === 0 && sourceFileCount < 5;

  // Nombre del proyecto
  let projectName = path.basename(absoluteDir);
  const pkgContent = readFileIfExists(absoluteDir, 'package.json');
  if (pkgContent) {
    try {
      const pkg = JSON.parse(pkgContent);
      if (pkg.name) projectName = pkg.name;
    } catch { /* ignore */ }
  }

  return {
    isNew,
    projectName,
    projectPath: absoluteDir,
    stack,
    databases,
    agentConfig,
    integrations,
    sourceFileCount,
    hasGit,
    hasGitignore,
    existingGitignoreContent,
  };
}
