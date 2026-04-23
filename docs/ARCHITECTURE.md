# Arquitectura — Gestor_Memory v2

> Visión técnica de las 3 capas del sistema.

---

## 3 Capas en 1

```
┌─────────────────────────────────────────────────────────────┐
│                    CLI Layer                          │
│            gestor-memory init | qa | status            │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┬──┴──────────────┬───────────┐
        ▼            ▼                  ▼
   ┌─────────┐ ┌───────────┐ ┌──────────┐
   │  .dev/  │ │Core Memory│ │QA Pipeline│
   │  (Files)│ │(PostgreSQL│ │(Snyk/etc)│
   └─────────┘ └───────────┘ └──────────┘
        │            │               │
        ▼            ▼               ▼
   └─────────┴──────┴──────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  MCP Server     │
              │ (herramientas) │
              └─────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Visualizer    │
              │ (Frontend Web)│
              └─────────────────┘
```

---

## Capa 1: CLI + .dev/

| Componente | Tecnología |
|:---|:---|
| **CLI** | Commander + Inquirer |
| **Detección** | fs + path + regex |
| **Generación PRD** | Handlebars templates |
| **Gestión Gitignore** | fs manipulativo |

### Flujo

```
1. gestor-memory init
2. detector.ts → ProjectProfile
3. prd-generator.ts → .dev/prd.md
4. gitignore-manager.ts → .gitignore
5. templates → AGENTS.md, CLAUDE.md, GEMINI.md
```

---

## Capa 2: Core Memory

| Componente | Tecnología |
|:---|:---|
| **Almacenamiento** | PostgreSQL + pgvector |
| **Grafo** | Apache AGE |
| **Embeddings** | Gemini/Vertex AI API |
| **Motor** | node-postgres + drizzle |

### Esquemas

```sql
-- knowledge-nodes
CREATE TABLE knowledge_nodes (
  id UUID PRIMARY KEY,
  content TEXT,
  embedding vector(1536),
  metadata JSONB,
  created_at timestamptz
);

-- knowledge-edges  
CREATE TABLE knowledge_edges (
  id UUID PRIMARY KEY,
  source_id UUID REFERENCES nodes,
  target_id UUID REFERENCES nodes,
  relationship TEXT,
  weight float
);
```

### Modos de Operación

| Modo | Descripción |
|:---|:---|
| **Modo Destino** | PostgreSQL nueva para el proyecto |
| **Modo Filtro** | DB separada que sincroniza con existente |

---

## Capa 3: QA Pipeline

| Herramienta | Propósito |
|:---|:---|
| **Snyk** | Seguridad (dependencias + SAST) |
| **TestSprite** | E2E automatizado desde PRD |
| **Postman** | Colecciones API |

### PRD → Testing

```
.dev/prd.md
    │
    ├── Sección 4 (Endpoints) → Postman
    ├── Sección 6 (Security) → Snyk
    └── Sección 7 (Testing Plan) → TestSprite
```

---

## MCP Server

Herramientas disponibles:

| Tool | Función |
|:---|:---|
| `mem-save` | Guardar nodo en memoria |
| `mem-search` | Búsqueda semántica + grafo |
| `mem-zumo` | Solicitar síntesis |
| `mem-relate` | Crear relaciones |
| `mem-retain` | Configurar retención |

---

## Visualizer

Frontend web con:

- **BrainView**: Vista cerebro (Cytoscape.js)
- **TimelineView**: Vista temporal
- **SearchBar**: Búsqueda semántica

---

## Integración con Agentes

```
1. Agente lee AGENTS.md
2. Lee .dev/prd.md, .dev/roadmap.md
3. Lee last handoff: .dev/handoffs/current-state.md
4. Ejecuta tarea
5. Actualiza estado en handoff
6. Commit: git add -A && git commit -m "wip: ..."
```

---

## Dependencias

```json
{
  "commander": "^11.1.0",
  "chalk": "^4.1.2",
  "inquirer": "^8.2.6",
  "ora": "^5.4.1",
  "handlebars": "^4.7.8"
}
```

**Producción (Core Memory):**
- `pg`: driver PostgreSQL
- `drizzle-orm`: ORM
- `apache-age`: grafo