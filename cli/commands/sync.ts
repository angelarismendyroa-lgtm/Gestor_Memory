/**
 * sync.ts — Comando: `gestor-memory sync`
 *
 * Sincroniza con DB externa en Modo Filtro Temporal:
 * - Lee datos de DB origen (Oracle, MySQL, Supabase)
 * - Transforma y guarda en Core Memory
 * - Bidireccional si está configurado
 *
 * ⚠️ ESTADO: Este comando está en desarrollo (Fase 7 del roadmap).
 * Actualmente muestra stub documentado. Ver docs/CONNECTORS.md para el plan completo.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

export function syncCommand(program: Command): void {
  program
    .command('sync')
    .description('Sincronizar con DB externa (Modo Filtro)')
    .option('--source <source>', 'DB origen: oracle, mysql, supabase, postgres')
    .option('--target <target>', 'DB destino (default: Core Memory)')
    .option('--dry-run', 'Simular sin aplicar cambios')
    .option('--bidirectional', 'Sincronización bidireccional')
    .option('--path <path>', 'Ruta del proyecto', '.')
    .action(async (options) => {
      console.log('');
      console.log(chalk.cyan.bold('  🔄 Gestor_Memory — Sincronización'));
      console.log('');

      const projectDir = options.path === '.' ? process.cwd() : options.path;

      if (!options.source) {
        console.log(chalk.yellow('  ⚠️  Debes especificar --source'));
        console.log(chalk.gray(' Uso: gestor-memory sync --source oracle'));
        console.log(chalk.gray(' Fuentes disponibles: oracle, mysql, supabase, postgres'));
        return;
      }

      const spinner = ora('Conectando...').start();

      try {
        // TODO: Implementar sincronización real con conectores
        spinner.warn(`Sincronización ${options.source} → Core Memory: NO implementada aún.`);
        console.log(chalk.gray('  → Los conectores (oracle, mysql, supabase) están en desarrollo.'));
        console.log(chalk.gray('  → Ver docs/CONNECTORS.md para el plan. Fase 7 del Roadmap.'));
        
        if (options.dryRun) {
          console.log(chalk.yellow('  ℹ️  Modo dry-run: no se aplicaron cambios'));
        }
      } catch (err: any) {
        spinner.fail(`Error: ${err.message}`);
      }
    });
}