/**
 * status.ts — Comando: `gestor-memory status`
 *
 * Muestra el estado actual del proyecto:
 * - Perfil detectado (stack, DB, agentes)
 * - Estado de .dev/ (archivos generados)
 * - Estado de QA (último scan)
 * - Estado de Obsidian
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

import { detectProject } from '../lib/detector';
import { detectObsidian } from '../lib/obsidian-manager';
import { detectQATools } from '../lib/qa-pipeline';

export function statusCommand(program: Command): void {
  program
    .command('status')
    .description('Mostrar estado del proyecto y Gestor_Memory')
    .option('--path <path>', 'Ruta del proyecto', '.')
    .action(async (options) => {
      const projectDir = options.path === '.' ? process.cwd() : options.path;

      console.log('');
      console.log(chalk.cyan.bold('  🧠 Gestor_Memory v2 — Estado del Proyecto'));
      console.log('');

      // ── Proyecto ──────────────────────────────
      const profile = detectProject(projectDir);

      console.log(chalk.white.bold('  📦 Proyecto'));
      console.log(chalk.gray(`     Nombre:    ${profile.projectName}`));
      console.log(chalk.gray(`     Tipo:      ${profile.isNew ? 'Nuevo' : 'Existente'}`));
      console.log(chalk.gray(`     Runtime:   ${profile.stack.runtime}`));
      console.log(chalk.gray(`     Lenguaje:  ${profile.stack.language}`));
      console.log(chalk.gray(`     Framework: ${profile.stack.framework || 'N/A'}`));
      console.log(chalk.gray(`     Archivos:  ${profile.sourceFileCount}`));
      console.log(chalk.gray(`     Git:       ${profile.hasGit ? '✅' : '❌'}`));
      console.log('');

      // ── Bases de datos ────────────────────────
      if (profile.databases.length > 0) {
        console.log(chalk.white.bold('  🗄️  Bases de Datos'));
        for (const db of profile.databases) {
          console.log(chalk.gray(`     ${db.type}: ${db.modelCount || '?'} modelos (${db.schemaPath})`));
        }
        console.log('');
      }

      // ── Configuración .dev/ ───────────────────
      console.log(chalk.white.bold('  📂 Estructura .dev/'));
      const devFiles = [
        { path: '.dev/prd.md', label: 'PRD' },
        { path: '.dev/roadmap.md', label: 'Roadmap' },
        { path: '.dev/stack-analysis.md', label: 'Stack Analysis' },
        { path: '.dev/handoffs/current-state.md', label: 'Handoff State' },
        { path: '.dev/qa/snyk-baseline.json', label: 'Snyk Config' },
        { path: '.dev/qa/testsprite-config.json', label: 'TestSprite Config' },
        { path: '.dev/qa/postman-collection.json', label: 'Postman Collection' },
        { path: '.dev/obsidian/sync-config.md', label: 'Obsidian Tutorial' },
      ];

      for (const f of devFiles) {
        const exists = fs.existsSync(path.join(projectDir, f.path));
        const icon = exists ? chalk.green('✅') : chalk.red('❌');
        console.log(`     ${icon} ${f.label} (${f.path})`);
      }
      console.log('');

      // ── Archivos de agentes ───────────────────
      console.log(chalk.white.bold('  🤖 Configuración de Agentes'));
      const agentFiles = [
        { key: 'hasAgentsMd', label: 'AGENTS.md' },
        { key: 'hasClaudeMd', label: 'CLAUDE.md' },
        { key: 'hasGeminiMd', label: 'GEMINI.md' },
      ];

      for (const f of agentFiles) {
        const exists = (profile.agentConfig as any)[f.key];
        const icon = exists ? chalk.green('✅') : chalk.red('❌');
        console.log(`     ${icon} ${f.label}`);
      }

      if (profile.agentConfig.ucaVersion) {
        console.log(chalk.gray(`     → UCA versión: ${profile.agentConfig.ucaVersion}`));
      }
      console.log('');

      // ── QA Tools ──────────────────────────────
      console.log(chalk.white.bold('  🧪 Herramientas de QA'));
      const qaTools = detectQATools();
      for (const tool of qaTools) {
        const icon = tool.isInstalled ? chalk.green('✅') : chalk.red('❌');
        console.log(`     ${icon} ${tool.name} — ${tool.isFree ? 'gratis' : 'requiere cuenta'}`);
      }
      console.log('');

      // ── Obsidian ──────────────────────────────
      console.log(chalk.white.bold('  🔮 Obsidian'));
      const obsidian = detectObsidian();
      if (obsidian.isInstalled) {
        console.log(chalk.green('     ✅ Instalado'));
        if (obsidian.vaults) {
          console.log(chalk.gray(`     → ${obsidian.vaults.length} vault(s) detectado(s)`));
        }
      } else {
        console.log(chalk.yellow('     ⚠️  No detectado'));
      }

      // Verificar vault del proyecto
      const hasProjectVault = fs.existsSync(path.join(projectDir, '.dev', 'obsidian', '.obsidian'));
      console.log(chalk.gray(`     → Vault del proyecto: ${hasProjectVault ? '✅ Creado' : '❌ No creado'}`));
      console.log('');

      // ── Gestor_Memory Config ──────────────────
      const gmConfigPath = path.join(projectDir, '.gestor-memory', 'config.json');
      if (fs.existsSync(gmConfigPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(gmConfigPath, 'utf-8'));
          console.log(chalk.white.bold('  ⚙️  Gestor_Memory'));
          console.log(chalk.gray(`     Versión:  ${config.version}`));
          console.log(chalk.gray(`     Modo DB:  ${config.mode}`));
          console.log(chalk.gray(`     Creado:   ${config.createdAt?.split('T')[0] || 'N/A'}`));
        } catch { /* invalid config */ }
      } else {
        console.log(chalk.yellow('  ⚠️  Gestor_Memory no inicializado'));
        console.log(chalk.gray('     → Ejecuta: gestor-memory init'));
      }

      console.log('');
    });
}
