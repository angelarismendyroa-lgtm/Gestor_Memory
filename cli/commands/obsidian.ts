/**
 * obsidian.ts — Comando: `gestor-memory obsidian`
 *
 * Gestiona la vinculación con Obsidian:
 * - Detectar instalación
 * - Crear/vincular vault
 * - Generar tutorial
 * - Configurar sincronización
 */

import { Command } from 'commander';
import chalk from 'chalk';

import {
  detectObsidian,
  generateObsidianConfig,
  getObsidianDownloadUrl,
} from '../lib/obsidian-manager';

export function obsidianCommand(program: Command): void {
  program
    .command('obsidian')
    .description('Configurar vinculación con Obsidian')
    .option('--detect', 'Solo detectar si Obsidian está instalado')
    .option('--create-vault', 'Crear vault vinculado al proyecto')
    .option('--tutorial', 'Generar tutorial de sincronización')
    .option('--path <path>', 'Ruta del proyecto', '.')
    .action(async (options) => {
      const projectDir = options.path === '.' ? process.cwd() : options.path;
      const projectName = require('path').basename(projectDir);

      console.log('');
      console.log(chalk.cyan.bold('  🔮 Gestor_Memory v2 — Obsidian'));
      console.log('');

      const detection = detectObsidian();

      if (options.detect) {
        // Solo mostrar estado
        if (detection.isInstalled) {
          console.log(chalk.green('  ✅ Obsidian detectado'));
          if (detection.installPath) {
            console.log(chalk.gray(`  → Ruta: ${detection.installPath}`));
          }
          if (detection.vaults && detection.vaults.length > 0) {
            console.log(chalk.gray(`  → Vaults: ${detection.vaults.length}`));
            for (const v of detection.vaults) {
              console.log(chalk.gray(`     • ${v}`));
            }
          }
        } else {
          console.log(chalk.yellow('  ⚠️  Obsidian no detectado'));
          console.log(chalk.gray(`  → Descarga: ${getObsidianDownloadUrl()}`));
        }
        console.log('');
        return;
      }

      if (options.createVault) {
        generateObsidianConfig(projectDir, projectName, 'create-vault');
        console.log(chalk.green('  ✅ Vault creado en .dev/obsidian/'));
        console.log(chalk.gray('  → Abre Obsidian → "Open folder as vault"'));
        console.log(chalk.gray(`  → Selecciona: ${projectDir}\\.dev\\obsidian\\`));
        console.log('');
        return;
      }

      if (options.tutorial) {
        generateObsidianConfig(projectDir, projectName, 'web-only');
        console.log(chalk.green('  ✅ Tutorial guardado en .dev/obsidian/sync-config.md'));
        console.log('');
        return;
      }

      // Default: mostrar info y opciones
      if (detection.isInstalled) {
        console.log(chalk.green('  ✅ Obsidian detectado'));
        console.log(chalk.gray('  Usa --create-vault para crear un vault vinculado'));
      } else {
        console.log(chalk.yellow('  ⚠️  Obsidian no detectado'));
        console.log(chalk.gray(`  Descarga: ${getObsidianDownloadUrl()}`));
        console.log(chalk.gray('  O usa --tutorial para generar guía de configuración'));
      }
      console.log('');
    });
}
