# Gestor_Memory v2 — Universal Configuration Agentic

> **Evolución directa de UniversalAgentConfig (UCA).** Este proyecto unifica la gestión de conocimiento Y la configuración de desarrollo desde la etapa de **idea** hasta producción. Sirve tanto para proyectos desde cero como para empresas con infraestructura existente.

---

## Visión General: 3 Capas en 1

```
┌─────────────────────────────────────────────────────────────┐
│                    gestor-memory init                        │
│                                                             │
│   ┌──────────┐    ┌──────────────┐    ┌──────────────────┐ │
│   │  CAPA 1   │    │   CAPA 2     │    │     CAPA 3       │ │
│   │ .dev/     │    │ Core Memory  │    │  QA Pipeline     │ │
│   │ (Dev Env) │    │ (PostgreSQL) │    │  (Snyk/TestSpr.) │ │
│   │           │    │              │    │                  │ │
│   │ • PRD     │───▶│ • pgvector   │───▶│ • PRD → Tests    │ │
│   │ • Roadmap │    │ • Apache AGE │    │ • Snyk scan      │ │
│   │ • AGENTS  │    │ • Embeddings │    │ • TestSprite E2E │ │
│   │ • Handoffs│    │ • Zumo       │    │ • Postman colls. │ │
│   └──────────┘    └──────────────┘    └──────────────────┘ │
│                                                             │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  OPCIONAL: Obsidian Sync (para visualización humana) │  │
│   └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## installación Rápida

### Opción A: Paquete npm (global)

```bash
npm install -g gestor-memory
gestor-memory init
```

### Opción B: Híbrido (script setup)

```bash
# Descarga setup.bat de este repo y ejecútalo
setup.bat
```

### Opción C: npx directo

```bash
npx -y @alianed/gestor-memory init
# o
npx -y gestor-memory init
```

---

## Uso

### Inicializar Proyecto (Nuevo)

```bash
gestor-memory init

# No interactivo
gestor-memory init --no-interactive --name "mi-proyecto"
```

### Inicializar Proyecto (Existente)

```bash
cd mi-proyecto-existente
gestor-memory init
# Detecta automáticamente: Prisma, Supabase, Stack, etc.
```

### Pipeline QA

```bash
gestor-memory qa                  # Todas las herramientas
gestor-memory qa --snyk-only       # Solo seguridad
gestor-memory qa --testsprite-only # Solo E2E
gestor-memory qa --full            # Full con Postman
```

### Obsidian

```bash
gestor-memory obsidian
```

### Status

```bash
gestor-memory status
```

---

## Estructura Generada

```
proyecto/
├── .dev/                          # ← gitignored
│   ├── prd.md                     # PRD auto-generado
│   ├── roadmap.md                  # Roadmap detallado
│   ├── stack-analysis.md         # Análisis del stack
│   ├── handoffs/
│   │   └── current-state.md       # Estado para handoff
│   ├── specs/
│   └── qa/
│       └── test-plan.md          # Plan de testing
├── .gitignore                     # ← incluye .dev/
├── AGENTS.md                      # ← se sube
├── CLAUDE.md                      # ← se sube
├── GEMINI.md                      # ← se sube
└── roadmap.md                     # ← se sube (público)
```

---

## Modo Destino vs Modo Filtro

| Modo | Descripción |
|:---|:---|
| **Modo Destino** | PostgreSQL nueva (recomendado) |
| **Modo Filtro** | DB separada que sincroniza con existente |

---

## Docs

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — Arquitectura
- [MODES.md](docs/MODES.md) — Modo Destino vs Filtro
- [ZUMO.md](docs/ZUMO.md) — Zumo de Conocimiento
- [OBSIDIAN.md](docs/OBSIDIAN.md) — Guía Obsidian
- [QA-PIPELINE.md](docs/QA-PIPELINE.md) — Guía de testing
- [CONNECTORS.md](docs/CONNECTORS.md) — Conectar DBs externas

---

## Stack Técnico

| Capa | Tecnología |
|:---|:---|
| CLI | TypeScript + Commander + Inquirer |
| DB | PostgreSQL + pgvector + Apache AGE |
| QA | Snyk + TestSprite + Postman |
| Visualizer | Cytoscape.js + React |
| MCP | Model Context Protocol |

---

## Licencia

MIT