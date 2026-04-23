#!/usr/bin/env node
/**
 * Gestor_Memory v2 — Universal Configuration Agentic v2
 * CLI principal: punto de entrada para todos los comandos.
 *
 * Uso:
 *   gestor-memory init          → Inicializar proyecto (nuevo o existente)
 *   gestor-memory qa            → Pipeline de calidad (Snyk/TestSprite/Postman)
 *   gestor-memory obsidian      → Gestionar vinculación con Obsidian
 *   gestor-memory status        → Estado del sistema de conocimiento
 *   gestor-memory sync          → Sincronizar con DB externa (Modo Filtro)
 *   gestor-memory zumo          → Extraer "Zumo de Conocimiento"
 */

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { qaCommand } from './commands/qa';
import { obsidianCommand } from './commands/obsidian';
import { statusCommand } from './commands/status';
import { syncCommand } from './commands/sync';
import { zumoCommand } from './commands/zumo';

const program = new Command();

program
  .name('gestor-memory')
  .description('🧠 Gestor_Memory v2 — Universal Configuration Agentic')
  .version('2.0.0');

// Registrar comandos
initCommand(program);
qaCommand(program);
obsidianCommand(program);
statusCommand(program);
syncCommand(program);
zumoCommand(program);

program.parse(process.argv);

// Si no se pasa ningún comando, mostrar ayuda
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
