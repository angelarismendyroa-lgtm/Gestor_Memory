/**
 * obsidian-manager.ts — Detecta y configura Obsidian opcionalmente.
 *
 * - Detecta si Obsidian está instalado en el sistema (Windows/Mac/Linux)
 * - Ofrece crear vault vinculado al proyecto
 * - Genera tutorial de sincronización en .dev/obsidian/
 * - Soporta modo "solo-export" para usuarios de Logseq/Siguen/otras
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ── Tipos ────────────────────────────────────────────

export interface ObsidianDetection {
  isInstalled: boolean;
  installPath?: string;
  version?: string;
  vaults?: string[];
}

export type ObsidianChoice = 'create-vault' | 'link-vault' | 'download' | 'web-only' | 'export-only';

// ── Detección ────────────────────────────────────────

/**
 * Detecta si Obsidian está instalado en el sistema.
 * Busca en las rutas típicas según el SO.
 */
export function detectObsidian(): ObsidianDetection {
  const platform = os.platform();
  const homeDir = os.homedir();

  let possiblePaths: string[] = [];
  let configDir = '';

  switch (platform) {
    case 'win32':
      possiblePaths = [
        path.join(homeDir, 'AppData', 'Local', 'Obsidian'),
        path.join(homeDir, 'AppData', 'Local', 'Programs', 'Obsidian'),
        'C:\\Program Files\\Obsidian',
        'C:\\Program Files (x86)\\Obsidian',
      ];
      configDir = path.join(homeDir, 'AppData', 'Roaming', 'obsidian');
      break;

    case 'darwin':
      possiblePaths = [
        '/Applications/Obsidian.app',
        path.join(homeDir, 'Applications', 'Obsidian.app'),
      ];
      configDir = path.join(homeDir, 'Library', 'Application Support', 'obsidian');
      break;

    case 'linux':
      possiblePaths = [
        '/usr/bin/obsidian',
        '/usr/local/bin/obsidian',
        path.join(homeDir, '.local', 'bin', 'obsidian'),
        `/snap/obsidian/current`,
      ];
      configDir = path.join(homeDir, '.config', 'obsidian');
      break;
  }

  // Buscar instalación
  let installPath: string | undefined;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      installPath = p;
      break;
    }
  }

  // Buscar vaults conocidos
  let vaults: string[] = [];
  const obsidianJson = path.join(configDir, 'obsidian.json');
  if (fs.existsSync(obsidianJson)) {
    try {
      const config = JSON.parse(fs.readFileSync(obsidianJson, 'utf-8'));
      if (config.vaults) {
        vaults = Object.values(config.vaults)
          .map((v: any) => v.path)
          .filter((p: string) => p && fs.existsSync(p));
      }
    } catch { /* corrupt config, ignore */ }
  }

  return {
    isInstalled: !!installPath || vaults.length > 0,
    installPath,
    vaults: vaults.length > 0 ? vaults : undefined,
  };
}

// ── Generación de archivos ───────────────────────────

/**
 * Genera la estructura de vault/tutorial en .dev/obsidian/
 */
export function generateObsidianConfig(projectDir: string, projectName: string, choice: ObsidianChoice): void {
  const obsidianDir = path.join(projectDir, '.dev', 'obsidian');
  fs.mkdirSync(obsidianDir, { recursive: true });

  // Tutorial de sincronización (siempre se genera)
  const tutorial = generateSyncTutorial(projectName, choice);
  fs.writeFileSync(path.join(obsidianDir, 'sync-config.md'), tutorial, 'utf-8');

  // Si el usuario quiere un vault, crear la estructura mínima
  if (choice === 'create-vault') {
    const vaultDir = path.join(obsidianDir, '.obsidian');
    fs.mkdirSync(vaultDir, { recursive: true });

    // Configuración mínima de Obsidian
    const appConfig = {
      "accentColor": "#7c3aed",
      "theme": "obsidian",
      "translucency": false,
      "nativeMenus": true,
    };
    fs.writeFileSync(path.join(vaultDir, 'app.json'), JSON.stringify(appConfig, null, 2), 'utf-8');

    // Plugins recomendados
    const communityPlugins = [
      "dataview",
      "obsidian-excalibrain",
      "obsidian-git",
    ];
    fs.writeFileSync(
      path.join(vaultDir, 'community-plugins.json'),
      JSON.stringify(communityPlugins, null, 2),
      'utf-8'
    );

    // Nota de bienvenida
    const welcome = `# 🧠 ${projectName} — Grafo de Conocimiento

> Este vault está vinculado al proyecto **${projectName}**.
> Los nodos de conocimiento se sincronizan automáticamente desde Gestor_Memory.

## Cómo usar este vault

1. **Navega** el grafo con \`Ctrl+G\` (Graph View)
2. **Busca** con \`Ctrl+O\` (Quick Switcher)
3. **Instala plugins** recomendados: Dataview, ExcaliBrain, Git

## Plugins recomendados

| Plugin | ¿Para qué? |
|:---|:---|
| **Dataview** | Queries sobre las notas del proyecto |
| **ExcaliBrain** | Vista tipo "cerebro" del grafo |
| **Git** | Sincronizar notas con el repositorio |

## Estructura

- \`/knowledge/\` — Nodos de conocimiento generados
- \`/decisions/\` — Decisiones arquitectónicas (ADR)
- \`/sessions/\` — Logs de sesiones de agentes IA
- \`/zumo/\` — Síntesis de conocimiento destilado
`;
    fs.writeFileSync(path.join(obsidianDir, 'README.md'), welcome, 'utf-8');

    // Crear subdirectorios del vault
    for (const subdir of ['knowledge', 'decisions', 'sessions', 'zumo']) {
      fs.mkdirSync(path.join(obsidianDir, subdir), { recursive: true });
      fs.writeFileSync(
        path.join(obsidianDir, subdir, '.gitkeep'),
        '',
        'utf-8'
      );
    }
  }
}

function generateSyncTutorial(projectName: string, choice: ObsidianChoice): string {
  const downloadSection = choice === 'download' ? `
## 📥 Paso 0: Instalar Obsidian

1. Abre tu navegador y ve a: **https://obsidian.md/download**
2. Descarga la versión para tu sistema operativo (Windows/Mac/Linux)
3. Instala siguiendo las instrucciones del instalador
4. Obsidian es **gratuito** para uso personal

---
` : '';

  return `# 🔮 Obsidian — Tutorial de Sincronización
> Proyecto: **${projectName}**
> Generado por: Gestor_Memory v2

---
${downloadSection}
## 📖 Configuración Rápida

### 1. Abrir como Vault

1. Abre Obsidian
2. Click en **"Open folder as vault"**
3. Selecciona esta carpeta: \`.dev/obsidian/\`
4. Obsidian creará automáticamente la configuración

### 2. Instalar Plugins Recomendados

Los plugins mejoran la experiencia de visualización del grafo de conocimiento:

| # | Plugin | Instalación |
|:--|:---|:---|
| 1 | **Dataview** | Settings → Community Plugins → Browse → buscar "Dataview" → Install → Enable |
| 2 | **ExcaliBrain** | Settings → Community Plugins → Browse → buscar "ExcaliBrain" → Install → Enable |
| 3 | **Git** | Settings → Community Plugins → Browse → buscar "Obsidian Git" → Install → Enable |

> **Nota:** La primera vez debes activar Community Plugins:
> Settings → Community Plugins → "Turn on community plugins"

### 3. Ver el Grafo

- **Graph View:** Presiona \`Ctrl+G\` (o \`Cmd+G\` en Mac)
- **ExcaliBrain:** Si instalaste el plugin, usa la vista desde la barra lateral

### 4. Sincronización

Los archivos de \`.dev/obsidian/\` están en \`.gitignore\`.
Tu vault es **local y privado** — no se sube al repositorio.

Si deseas compartir notas con tu equipo:
- Usa el plugin **Obsidian Git** para sincronizar selectivamente
- O usa **Obsidian Sync** (servicio de pago de Obsidian)

---

## 🔄 Alternativas a Obsidian

Si prefieres otra herramienta:

| Herramienta | Compatibilidad |
|:---|:---|
| **Logseq** | Lee archivos Markdown directamente |
| **Siguen** | Importa desde la carpeta \`.dev/exports/\` |
| **Notion** | Importa archivos Markdown |
| **VS Code** | Usa la extensión "Foam" para grafos |

Los datos del grafo siempre estarán disponibles como:
- Markdown estándar (en \`.dev/obsidian/\`)
- JSON (en \`.dev/exports/knowledge.json\`)
- CSV (en \`.dev/exports/knowledge.csv\`)

---

*Generado automáticamente por Gestor_Memory v2*
`;
}

/**
 * Devuelve la URL de descarga de Obsidian.
 */
export function getObsidianDownloadUrl(): string {
  return 'https://obsidian.md/download';
}
