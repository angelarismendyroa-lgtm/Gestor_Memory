/**
 * prd-generator.ts — Genera PRD automático del proyecto.
 *
 * Para proyectos NUEVOS: usa la info del usuario (nombre, descripción, stack)
 * Para proyectos EXISTENTES: escanea código, schemas, y genera PRD desde allí.
 *
 * El PRD generado alimenta:
 * - Claude/Gemini como guía de desarrollo
 * - TestSprite para generar tests E2E automáticos
 * - Snyk para definir el scope de seguridad
 */

import * as fs from 'fs';
import * as path from 'path';
import { ProjectProfile, DetectedDB } from './detector';

// ── Tipos ────────────────────────────────────────────

export interface PRDInput {
  profile: ProjectProfile;
  // Datos adicionales del usuario (para proyectos nuevos)
  description?: string;
  projectType?: 'saas' | 'internal-tool' | 'api' | 'library' | 'cli' | 'mobile';
  targetUsers?: string;
  customStack?: string;
}

// ── Funciones de generación ──────────────────────────

function generateHeader(input: PRDInput): string {
  const now = new Date().toISOString().split('T')[0];
  return `# PRD: ${input.profile.projectName}
> Auto-generado por Gestor_Memory v2 el ${now}
> Última actualización: ${now}
> Tipo de proyecto: ${input.profile.isNew ? 'NUEVO (desde idea)' : 'EXISTENTE (adaptación)'}

---
`;
}

function generateVisionSection(input: PRDInput): string {
  const { profile } = input;
  const stackStr = profile.stack.framework
    ? `${profile.stack.framework} + ${profile.stack.language}`
    : profile.stack.language;

  const dbStr = profile.databases.length > 0
    ? profile.databases.map(d => d.type).join(', ')
    : 'Por definir';

  return `## 1. Visión General

| Campo | Valor |
|:---|:---|
| **Nombre** | ${profile.projectName} |
| **Descripción** | ${input.description || '_Por completar_'} |
| **Tipo** | ${input.projectType || '_Por definir_'} |
| **Stack** | ${input.customStack || stackStr} |
| **Runtime** | ${profile.stack.runtime} |
| **Base de datos** | ${dbStr} |
| **Archivos fuente** | ${profile.sourceFileCount} |
| **Usuarios target** | ${input.targetUsers || '_Por definir_'} |

---
`;
}

function generateArchitectureSection(input: PRDInput): string {
  const { profile } = input;

  let diagram = '```mermaid\ngraph TD\n';

  if (profile.isNew) {
    diagram += `  A[Cliente/Browser] --> B[Frontend]\n`;
    diagram += `  B --> C[API/Backend]\n`;
    diagram += `  C --> D[Base de Datos]\n`;
    if (profile.stack.framework) {
      diagram += `  B -.- E["${profile.stack.framework}"]\n`;
    }
  } else {
    diagram += `  A[Cliente/Browser] --> B[Frontend]\n`;
    if (profile.stack.framework) {
      diagram += `  B -.- B1["${profile.stack.framework}"]\n`;
    }
    diagram += `  B --> C[API/Backend]\n`;
    for (const db of profile.databases) {
      diagram += `  C --> D_${db.type}["${db.type} (${db.modelCount || '?'} modelos)"]\n`;
    }
    if (profile.integrations.mcpServers && profile.integrations.mcpServers.length > 0) {
      diagram += `  C --> MCP[MCP Servers]\n`;
      for (const server of profile.integrations.mcpServers) {
        diagram += `  MCP --> MCP_${server}["${server}"]\n`;
      }
    }
    if (profile.integrations.hasDocker) {
      diagram += `  DOCKER[Docker] -.- C\n`;
    }
  }

  diagram += '```';

  return `## 2. Arquitectura

### Diagrama de Componentes

${diagram}

### Flujo de datos principal
${profile.isNew
    ? '> _Se completará a medida que se defina la arquitectura._'
    : `- Runtime: **${profile.stack.runtime}** (${profile.stack.language})
- Framework: **${profile.stack.framework || 'N/A'}**
- Package Manager: **${profile.stack.packageManager || 'N/A'}**
- Styling: **${profile.stack.styling || 'N/A'}**
- Docker: **${profile.integrations.hasDocker ? 'Sí' : 'No'}**
- CI/CD: **${profile.integrations.hasCI ? 'GitHub Actions' : 'No configurado'}**`}

---
`;
}

function generateDataModelSection(input: PRDInput): string {
  const { profile } = input;

  if (profile.databases.length === 0) {
    return `## 3. Modelos de Datos

> _No se detectaron schemas de base de datos. Se completará al definir la arquitectura._

### Entidades principales
- [ ] _Por definir_

---
`;
  }

  let content = `## 3. Modelos de Datos\n\n`;

  for (const db of profile.databases) {
    content += `### ${db.type.toUpperCase()} (${db.schemaPath || 'detectado'})\n\n`;
    content += `| Propiedad | Valor |\n|:---|:---|\n`;
    content += `| **Tipo** | ${db.type} |\n`;
    content += `| **Modelos** | ${db.modelCount || 'N/A'} |\n`;
    content += `| **Migraciones** | ${db.hasMigrations ? 'Sí' : 'No'} |\n`;
    content += `| **RLS** | ${db.hasRLS ? 'Sí' : 'No detectado'} |\n`;

    if (db.models && db.models.length > 0) {
      content += `\n#### Entidades detectadas\n\n`;
      content += `| # | Modelo |\n|:--|:---|\n`;
      db.models.forEach((model, i) => {
        content += `| ${i + 1} | \`${model}\` |\n`;
      });
    }
    content += '\n';
  }

  content += '---\n';
  return content;
}

function generateAPISection(input: PRDInput): string {
  if (input.profile.isNew) {
    return `## 4. Endpoints / API Surface

> _Se completará al implementar el backend._

### Endpoints planificados
- [ ] \`GET /api/health\` — Health check
- [ ] \`POST /api/auth/login\` — Autenticación
- [ ] _Agregar según necesidades del proyecto_

---
`;
  }

  return `## 4. Endpoints / API Surface

> _Los endpoints se documentarán a medida que se descubran en el código._
> Ejecuta \`gestor-memory scan --routes\` para detectar rutas automáticamente.

### Integraciones Detectadas

| Integración | Estado |
|:---|:---|
| **MCP Config** | ${input.profile.integrations.hasMCPConfig ? 'Configurado' : 'No'} |
| **Docker** | ${input.profile.integrations.hasDocker ? 'Configurado' : 'No'} |
| **CI/CD** | ${input.profile.integrations.hasCI ? 'Configurado' : 'No'} |
| **Variables de entorno** | ${input.profile.integrations.envVars?.length || 0} detectadas |

${input.profile.integrations.mcpServers && input.profile.integrations.mcpServers.length > 0
    ? `### MCP Servers\n${input.profile.integrations.mcpServers.map(s => `- \`${s}\``).join('\n')}`
    : ''}

---
`;
}

function generateBusinessRulesSection(input: PRDInput): string {
  return `## 5. Reglas de Negocio

${input.profile.isNew
    ? `> _Definir las reglas de negocio del proyecto._

### Validaciones críticas
- [ ] _Por definir_

### Flujos de usuario principales
- [ ] _Por definir_

### Edge cases conocidos
- [ ] _Por definir_`
    : `> _Extraídas del análisis del código existente._

### Restricciones detectadas
${input.profile.agentConfig.ucaVersion
      ? `- ✅ Universal Agent Config v${input.profile.agentConfig.ucaVersion} implementado`
      : '- ⚠️ No se detectó configuración de agentes'}
${input.profile.databases.some(d => d.hasRLS)
      ? '- ✅ Row Level Security (RLS) habilitado'
      : '- ⚠️ RLS no detectado'}
${input.profile.integrations.hasCI
      ? '- ✅ CI/CD configurado'
      : '- ⚠️ CI/CD no configurado'}`}

---
`;
}

function generateSecuritySection(input: PRDInput): string {
  return `## 6. Requisitos de Seguridad

> ⚠️ **Este bloque alimenta el scan de Snyk.**
> Ejecuta \`gestor-memory qa --snyk\` para análisis de seguridad.

### Autenticación
- Método: ${input.profile.databases.some(d => d.type === 'supabase') ? 'Supabase Auth' : '_Por definir_'}

### Autorización
- RLS: ${input.profile.databases.some(d => d.hasRLS) ? 'Habilitado' : 'No configurado'}
- Roles: _Por documentar_

### Datos sensibles identificados
${input.profile.integrations.envVars && input.profile.integrations.envVars.length > 0
    ? input.profile.integrations.envVars
      .filter(v => v.includes('KEY') || v.includes('SECRET') || v.includes('TOKEN') || v.includes('PASSWORD'))
      .map(v => `- \`${v}\` ⚠️`)
      .join('\n') || '- _Ninguno detectado_'
    : '- _Sin variables de entorno para analizar_'}

### Dependencias
- Total paquetes: _Ejecutar \`snyk test\` para análisis_
- Vulnerabilidades conocidas: _Pendiente scan_

---
`;
}

function generateTestingSection(input: PRDInput): string {
  return `## 7. Plan de Testing

> ⚠️ **Este bloque alimenta TestSprite y Postman.**
> Ejecuta \`gestor-memory qa\` para ejecutar el pipeline completo.

### Casos de uso principales → TestSprite
- [ ] ${input.profile.isNew ? 'Se generarán al implementar features' : 'Flujos de usuario principales (detectar desde rutas)'}
- [ ] ${input.profile.databases.length > 0 ? 'CRUD de entidades: ' + input.profile.databases.map(d => d.models?.slice(0, 3).join(', ')).join('; ') : 'Operaciones CRUD básicas'}

### Endpoints críticos → Postman
- [ ] Health check
- [ ] Autenticación
- [ ] Operaciones principales

### Vulnerabilidades → Snyk
- [ ] Dependencias desactualizadas
- [ ] Secrets expuestos en código
- [ ] Configuraciones inseguras

### Cobertura objetivo
- Unit tests: 80%
- Integration tests: 60%
- E2E tests: Flujos críticos (login, CRUD principal)

---

*PRD generado automáticamente por Gestor_Memory v2.*
*Edita este archivo según las necesidades del proyecto.*
`;
}

// ── Generador principal ──────────────────────────────

/**
 * Genera el PRD completo y lo guarda en .dev/prd.md
 */
export function generatePRD(input: PRDInput, outputDir: string): string {
  const prd = [
    generateHeader(input),
    generateVisionSection(input),
    generateArchitectureSection(input),
    generateDataModelSection(input),
    generateAPISection(input),
    generateBusinessRulesSection(input),
    generateSecuritySection(input),
    generateTestingSection(input),
  ].join('\n');

  // Guardar en .dev/prd.md
  const prdPath = path.join(outputDir, 'prd.md');
  fs.mkdirSync(path.dirname(prdPath), { recursive: true });
  fs.writeFileSync(prdPath, prd, 'utf-8');

  return prdPath;
}

/**
 * Genera el roadmap inicial del proyecto basado en el PRD.
 */
export function generateRoadmap(input: PRDInput, outputDir: string): string {
  const now = new Date().toISOString().split('T')[0];
  const { profile } = input;

  const roadmap = `# Roadmap: ${profile.projectName}
> Generado por: Gestor_Memory v2
> Fecha: ${now}
> Estado: ${profile.isNew ? 'INCEPTION' : 'EN PROGRESO'}

---

## 📍 Estado Actual (${now})

${profile.isNew
    ? `**Fase:** Idea / Diseño inicial
**Completado:** 0%
**Próximo paso:** Definir arquitectura y stack`
    : `**Fase:** Desarrollo activo
**Stack:** ${profile.stack.framework || profile.stack.language}
**Archivos fuente:** ${profile.sourceFileCount}
**Modelos DB:** ${profile.databases.map(d => `${d.modelCount || '?'} (${d.type})`).join(', ') || 'N/A'}
**Agentes IA:** ${profile.agentConfig.hasAgentsMd ? 'UCA v' + (profile.agentConfig.ucaVersion || '1') : 'No configurado'}
**Próximo paso:** Revisar PRD generado y ajustar`}

---

## Fase 1: Fundación 🏗️
${profile.isNew
    ? `- [ ] Definir stack tecnológico
- [ ] Inicializar proyecto (package.json, tsconfig, etc.)
- [ ] Configurar base de datos
- [ ] Implementar autenticación
- [ ] Configurar CI/CD`
    : `- [x] Stack definido: ${profile.stack.framework || profile.stack.language}
- [x] Proyecto inicializado (${profile.sourceFileCount} archivos)
- [${profile.databases.length > 0 ? 'x' : ' '}] Base de datos configurada
- [${profile.integrations.hasCI ? 'x' : ' '}] CI/CD configurado`}

## Fase 2: Core Features ⚡
- [ ] Feature principal 1 — _Definir en PRD_
- [ ] Feature principal 2 — _Definir en PRD_
- [ ] Feature principal 3 — _Definir en PRD_

## Fase 3: Testing & QA 🧪
- [ ] Ejecutar Snyk scan (seguridad)
- [ ] Configurar TestSprite (E2E automático)
- [ ] Crear colección Postman (API)
- [ ] Alcanzar cobertura objetivo (80% unit)

## Fase 4: Deployment 🚀
- [ ] Configurar ambiente de staging
- [ ] Configurar ambiente de producción
- [ ] Definir estrategia de rollback

---

## 📊 Métricas

| Fase | Completado | En Progreso | Pendiente |
|:---|:---|:---|:---|
| **1** Fundación | ${profile.isNew ? '0%' : '~70%'} | ${profile.isNew ? '0%' : '~20%'} | ${profile.isNew ? '100%' : '~10%'} |
| **2** Core | 0% | 0% | 100% |
| **3** Testing | 0% | 0% | 100% |
| **4** Deploy | 0% | 0% | 100% |

---

*Actualiza este roadmap con cada milestone completado.*
`;

  const roadmapPath = path.join(outputDir, 'roadmap.md');
  fs.writeFileSync(roadmapPath, roadmap, 'utf-8');

  return roadmapPath;
}

/**
 * Genera el stack-analysis.md con el desglose técnico.
 */
export function generateStackAnalysis(profile: ProjectProfile, outputDir: string): string {
  const now = new Date().toISOString().split('T')[0];

  const analysis = `# Stack Analysis: ${profile.projectName}
> Generado por: Gestor_Memory v2
> Fecha: ${now}
> Modo: ${profile.isNew ? 'Proyecto nuevo' : 'Proyecto existente'}

---

## Runtime & Language

| Propiedad | Valor |
|:---|:---|
| **Runtime** | ${profile.stack.runtime} |
| **Language** | ${profile.stack.language} |
| **Framework** | ${profile.stack.framework || 'N/A'} |
| **Styling** | ${profile.stack.styling || 'N/A'} |
| **Package Manager** | ${profile.stack.packageManager || 'N/A'} |

## Base de Datos

${profile.databases.length > 0
    ? profile.databases.map(db => `### ${db.type}
- Schema: \`${db.schemaPath || 'N/A'}\`
- Modelos: ${db.modelCount || 'N/A'}
- Migraciones: ${db.hasMigrations ? 'Sí' : 'No'}
- RLS: ${db.hasRLS ? 'Sí' : 'No'}
${db.models ? '\nModelos: ' + db.models.map(m => `\`${m}\``).join(', ') : ''}`).join('\n\n')
    : '_No se detectaron bases de datos._'}

## Configuración de Agentes

| Archivo | Estado |
|:---|:---|
| \`AGENTS.md\` | ${profile.agentConfig.hasAgentsMd ? '✅ Existe' : '❌ No existe'} |
| \`CLAUDE.md\` | ${profile.agentConfig.hasClaudeMd ? '✅ Existe' : '❌ No existe'} |
| \`GEMINI.md\` | ${profile.agentConfig.hasGeminiMd ? '✅ Existe' : '❌ No existe'} |
| \`.agent/\` | ${profile.agentConfig.hasAgentDir ? '✅ Existe' : '❌ No existe'} |
| \`.agent/handoffs/\` | ${profile.agentConfig.hasHandoffs ? '✅ Existe' : '❌ No existe'} |

## Integraciones

| Integración | Estado |
|:---|:---|
| **MCP Config** | ${profile.integrations.hasMCPConfig ? '✅' : '❌'} |
| **Docker** | ${profile.integrations.hasDocker ? '✅' : '❌'} |
| **CI/CD** | ${profile.integrations.hasCI ? '✅' : '❌'} |
| **Git** | ${profile.hasGit ? '✅' : '❌'} |
| **Variables .env** | ${profile.integrations.envVars?.length || 0} detectadas |

${profile.integrations.mcpServers && profile.integrations.mcpServers.length > 0
    ? `### MCP Servers Activos\n${profile.integrations.mcpServers.map(s => `- \`${s}\``).join('\n')}`
    : ''}

## Métricas del Proyecto

| Métrica | Valor |
|:---|:---|
| **Archivos fuente** | ${profile.sourceFileCount} |
| **Tiene Git** | ${profile.hasGit ? 'Sí' : 'No'} |
| **Tiene .gitignore** | ${profile.hasGitignore ? 'Sí' : 'No'} |

---

*Este análisis se regenera cada vez que se ejecuta \`gestor-memory init\`.*
`;

  const analysisPath = path.join(outputDir, 'stack-analysis.md');
  fs.writeFileSync(analysisPath, analysis, 'utf-8');

  return analysisPath;
}
