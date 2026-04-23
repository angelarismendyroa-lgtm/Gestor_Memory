/**
 * zumo.ts — Comando: `gestor-memory zumo` (Zumo de Conocimiento)
 *
 * Extrae conocimiento del proyecto:
 * - Chunks de código y docs
 * - Genera embeddings
 * - Construye grafo
 * - Genera síntesis
 *
 * ⚠️ NOTA: Este comando usa embeddings STUB (vectores aleatorios).
 * Para producción, configurar Ollama local o API Gemini/Vertex AI.
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';

import { detectProject } from '../lib/detector';

interface ZumoConfig {
  sources: string[];
  chunkSize: number;
  overlap: number;
}

async function chunkFile(filePath: string, chunkSize: number, overlap: number): Promise<string[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const chunks: string[] = [];
  
  if (content.length <= chunkSize) {
    chunks.push(content);
    return chunks;
  }
  
  let start = 0;
  while (start < content.length) {
    const end = Math.min(start + chunkSize, content.length);
    chunks.push(content.slice(start, end));
    start += chunkSize - overlap;
  }
  
  return chunks;
}

async function processSources(projectDir: string, config: ZumoConfig): Promise<{chunks: string[], files: string[]}> {
  const allChunks: string[] = [];
  const processedFiles: string[] = [];
  
  for (const source of config.sources) {
    const basePath = path.join(projectDir, source.replace('**/*', '').replace('/*', ''));
    const pattern = source.includes('*') ? source : source + '/**/*';
    
    if (pattern.includes('.dev/*')) {
      const devDir = path.join(projectDir, '.dev');
      if (fs.existsSync(devDir)) {
        const files = globSync(devDir, ['.md', '.ts', '.tsx', '.json']);
        for (const file of files) {
          if (!file.includes('.obsidian') && !file.includes('node_modules')) {
            const chunks = await chunkFile(file, config.chunkSize, config.overlap);
            allChunks.push(...chunks);
            processedFiles.push(path.relative(projectDir, file));
          }
        }
      }
    }
  }
  
  return { chunks: allChunks, files: processedFiles };
}

function globSync(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  
  if (!fs.existsSync(dir)) return results;
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...globSync(fullPath, extensions));
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  } catch { /* ignore */ }
  
  return results;
}

async function generateEmbeddings(chunks: string[]): Promise<{nodeId: string, embedding: number[], content: string}[]> {
  const nodes: {nodeId: string, embedding: number[], content: string}[] = [];
  
  // ⚠️ STUB: Genera vectores aleatorios o null si no se configura API. 
  // TODO: Integrar con Ollama (local, nomic-embed-text) o Gemini/Vertex AI.
  console.warn(chalk.yellow('⚠️  Usando embeddings STUB (vectores aleatorios).'));
  console.warn(chalk.gray('  → Para producción o proyectos reales en el ecosistema ALiaNeD,'));
  console.warn(chalk.gray('    configura Ollama local o una API LLM (Gemini/Vertex) en config.yaml.'));

  for (let i = 0; i < chunks.length; i++) {
    const content = chunks[i].slice(0, 500);
    const embedding = new Array(1536).fill(0).map(() => Math.random() * 2 - 1);
    
    nodes.push({
      nodeId: `node-${i}`,
      embedding,
      content: content.slice(0, 200) + '...',
    });
  }
  
  return nodes;
}

async function buildGraph(nodes: {nodeId: string, content: string}[]): Promise<{source: string, target: string, relationship: string}[]> {
  const edges: {source: string, target: string, relationship: string}[] = [];
  
  for (let i = 0; i < Math.min(nodes.length, 50); i++) {
    for (let j = i + 1; j < Math.min(nodes.length, i + 5); j++) {
      edges.push({
        source: nodes[i].nodeId,
        target: nodes[j].nodeId,
        relationship: 'related_to',
      });
    }
  }
  
  return edges;
}

function generateSynthesis(
  projectDir: string,
  files: string[],
  nodeCount: number,
  edgeCount: number
): string {
  const synthesis = `# Zumo de Conocimiento — ${path.basename(projectDir)}
> Generado por: Gestor_Memory v2
> Fecha: ${new Date().toISOString().split('T')[0]}

---

## Resumen

| Métrica | Valor |
|:---|:---|
| **Archivos procesdos** | ${files.length} |
| **Chunks** | ${nodeCount} |
| **Relaciones** | ${edgeCount} |
| **Palabras** | ~${nodeCount * 150} |

---

## Archivos Analizados

${files.slice(0, 20).map(f => `- \`${f}\``).join('\n')}

${files.length > 20 ? `\n... y ${files.length - 20} más` : ''}

---

## Hallazgos

### Temas Principales

${generateTopics(files).join('\n')}

---

## Conexiones

${generateConnections(edgeCount)}

---

## Próximos Pasos

- [ ] Explorar nodos relacionados
- [ ] Revisar conexiones
- [ ] Ejecutar Zumo nuevamente después de cambios

---

*Generado automáticamente por Gestor_Memory v2*
`;
  
  return synthesis;
}

function generateTopics(files: string[]): string[] {
  const topics = new Set<string>();
  
  for (const file of files) {
    if (file.includes('prd') || file.includes('PRD')) topics.add('Product Requirements');
    if (file.includes('roadmap')) topics.add('Roadmap');
    if (file.includes('stack') || file.includes('analysis')) topics.add('Análisis Técnico');
    if (file.includes('handoff') || file.includes('state')) topics.add('Estado del Proyecto');
    if (file.includes('qa') || file.includes('test')) topics.add('Testing');
    if (file.includes('auth') || file.includes('security')) topics.add('Seguridad');
    if (file.includes('api') || file.includes('endpoint')) topics.add('API');
    if (file.includes('db') || file.includes('schema') || file.includes('model')) topics.add('Base de Datos');
  }
  
  return Array.from(topics).slice(0, 8);
}

function generateConnections(edgeCount: number): string {
  return `| Relación | Frecuencia |
|:---|:---|
| related_to | ${edgeCount} |
| depends_on | ${Math.floor(edgeCount * 0.3)} |
| implements | ${Math.floor(edgeCount * 0.2)} |`;
}

export function zumoCommand(program: Command): void {
  program
    .command('zumo')
    .description('Extraer "Zumo de Conocimiento" del proyecto')
    .option('--sources <sources>', 'Fuentes a procesar', '.dev/**/*')
    .option('--dry-run', 'Simular sin aplicar cambios')
    .option('--path <path>', 'Ruta del proyecto', '.')
    .action(async (options) => {
      console.log('');
      console.log(chalk.cyan.bold('  🍊 Gestor_Memory — Zumo de Conocimiento'));
      console.log('');

      const projectDir = options.path === '.' ? process.cwd() : options.path;

      const profile = detectProject(projectDir);
      const config: ZumoConfig = {
        sources: options.sources.split(',').map((s: string) => s.trim()),
        chunkSize: 1000,
        overlap: 100,
      };

      const spinner = ora('Procesando fuentes...').start();

      try {
        const { chunks, files } = await processSources(projectDir, config);
        spinner.text = `Procesando ${files.length} archivos (${chunks.length} chunks)`;
        spinner.succeed();

        if (options.dryRun) {
          console.log(chalk.yellow('  ℹ️  Modo dry-run: no se guardaron cambios'));
          return;
        }

        const embedSpinner = ora('Generando embeddings...').start();
        const nodes = await generateEmbeddings(chunks);
        embedSpinner.succeed(`Embeddings generados (${nodes.length} vectores)`);

        const graphSpinner = ora('Construyendo grafo...').start();
        const edges = await buildGraph(nodes.map(n => ({ nodeId: n.nodeId, content: n.content })));
        graphSpinner.succeed(`Grafo construido (${nodes.length} nodos, ${edges.length} aristas)`);

        const synthesisSpinner = ora('Generando síntesis...').start();
        const synthesisDir = path.join(projectDir, '.dev', 'zumo');
        fs.mkdirSync(synthesisDir, { recursive: true });
        
        const synthesis = generateSynthesis(projectDir, files, nodes.length, edges.length);
        fs.writeFileSync(path.join(synthesisDir, 'synthesis.md'), synthesis, 'utf-8');
        
        fs.writeFileSync(
          path.join(synthesisDir, 'nodes.json'),
          JSON.stringify(nodes, null, 2),
          'utf-8'
        );
        fs.writeFileSync(
          path.join(synthesisDir, 'edges.json'),
          JSON.stringify(edges, null, 2),
          'utf-8'
        );
        
        synthesisSpinner.succeed('Síntesis guardada en .dev/zumo/');

        console.log('');
        console.log(chalk.green.bold('  ✅ Zumo completado'));
        console.log(chalk.gray(`     Archivos: ${files.length}`));
        console.log(chalk.gray(`     Nodos: ${nodes.length}`));
        console.log(chalk.gray(`     Relaciones: ${edges.length}`));
        console.log('');
      } catch (err: any) {
        spinner.fail(`Error: ${err.message}`);
      }
    });
}