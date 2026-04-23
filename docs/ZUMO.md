# Zumo de Conocimiento — Gestor_Memory v2

> El "Zumo" es el proceso de destilación de conocimiento: convertir información dispersa en conocimiento estructurado.

---

## ¿Qué es el Zumo?

```
Información Destructurada
      │
      ▼
┌─────────────────┐
│  Zumo Engine  │ ──▶ Conocimiento Estructurado
│ (extracción)  │
└─────────────────┘
```

El "zumo" (del español:
- **Zumo** = Extracción/Jugo (extract)
- También juega con "Zum" = destilar, purificar

### Analogy

> Del código disperso al conocimiento puro, como el zumo de fruta.

---

## Flujo del Zumo

```
1. Ingesta ──▶ 2. Embedding ──▶ 3. Grafo ──▶ 4. Síntesis
```

| Etapa | Input | Output |
|:---|:---|:---|
| **1. Ingesta** | Docs, código, PRD | Chunks de texto |
| **2. Embedding** | Chunks | Vectores (pgvector) |
| **3. Grafo** | Vectores | Nodos + aristas |
| **4. Síntesis** | Grafo | Resumen/summary |

---

## Componentes

### 1. Ingest (Motor de Ingesta)

```typescript
// lib/engine/ingest.ts
interface IngestConfig {
  sources: string[];      // '.dev/**/*', 'src/**/*.ts'
  chunkSize: number;      // 1000 tokens
  overlap: number;       // 100 tokens
}
```

### 2. Embedding Generator

Genera vectores usando:
- Gemini API (recomendado)
- Vertex AI
- OpenAI (fallback)

```typescript
interface EmbeddingResult {
  nodeId: string;
  embedding: number[];    // vector de 1536 dims
  content: string;
}
```

### 3. Graph Builder

Construye el grafo de conocimiento:

```
     ┌──────────┐
     │  Node A  │
     └────┬────┘
          │ "related_to"
          ▼
     ┌──────────┐      ┌──────────┐
     │  Node B  │─────▶│  Node C  │
     └──────────┘      └──────────┘
```

Usa Apache AGE para queries de grafo.

### 4. Zumo Extractor (Consolidator)

Genera síntesis:

```markdown
## Síntesis: [Tema]

**Hallazgos:**
- [ ] Hallazgo 1
- [ ] Hallazgo 2

**Conexiones:**
- Tema A ↔ Tema B (relación fuerte)
- Tema C ↔ Tema D (correlación)

**Próximos pasos:**
- [ ] Investigar más sobre X
```

---

## Comandos

### Ejecutar Zumo

```bash
gestor-memory zumo
```

O en un proyecto ya configurado:

```bash
gestor-memory zumo --path ./mi-proyecto
```

### Opciones

| Opción | Descripción |
|:---|:---|
| `--sources` | Fuentes a procesar |
| `--dry-run` | Simular sin guardar |
| `--full` | Zumo completo |

---

## Output

Genera en `.dev/zumo/`:

```
.dev/zumo/
├── nodes.json          # Todos los nodos
├── edges.json         # Relaciones
├── synthesis.md     # Resumen generado
└── timeline.md      # Historial de síntesis
```

---

## Integración con Agentes

El Zumo aliment a los agentes IA:

```
1. Agente necesita contexto
2. Consult a: mem-search "qué sabe sobre X?"
3. Zumo retorna nodos relacionados
4. Agente usa el contexto
```

---

## Frecuencia

| Trigger | Cuándo |
|:---|:---|
| **Manual** | `gestor-memory zaw` |
| **Post-commit** | Después de cada commit |
| **Cron** | Daily/Weekly |
| **Por demanda** | Agente lo solicita |

---

## Ejemplo de Uso

```
$ gestor-memory zaw

🔄 Procesando fuentes:
  → .dev/prd.md (45 chunks)
  → .dev/roadmap.md (12 chunks)
  → src/**/*.ts (230 chunks)

📊 Generando embeddings... (287 vectores)

🕸️ Construyendo grafo...
  → 45 nodos
  → 127 aristas

📝 Generando síntesis...

✅ Zumo completado
   → synthesis.md guardado en .dev/zumo/
```