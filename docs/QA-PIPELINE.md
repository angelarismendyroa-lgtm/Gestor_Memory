# QA Pipeline — Guía de Testing

> Cómo usar el pipeline de calidad de Gestor_Memory.

---

## Visión General

```
gestor-memory qa
    │
    ├── Snyk (seguridad)
    ├── TestSprite (E2E)
    ├── Postman (API)
    └── Reporte unificado
```

---

## Snyk — Seguridad

### ¿Qué hace?

- Scan de vulnerabilidades en dependencias
- Análisis SAST (Static Application Security Testing)
- Secrets exp、赤裸 en código

### Instalación

```bash
npm install -g snyk
snyk auth  # Login gratuito
```

### Uso

```bash
# Solo Snyk
gestor-memory qa --snyk-only

# O directo
snyk test
snyk code test
```

### Output

Guarda en `.dev/qa/`:

```
.dev/qa/
├── snyk-dependencies.json
├── snyk-code.json
└── snyk-baseline.json
```

### Interpretar Resultados

| Severidad | Acción |
|:---|:---|
| **Critical** | Fix inmediatamente |
| **High** | Fix esta semana |
| **Medium** | Fix en sprint |
| **Low** | Planeado |

---

## TestSprite — E2E Automatizado

### ¿Qué hace?

- Genera tests E2E desde el PRD
- Ejecuta Playwright
- Reporta cobertura vs PRD

### Requisitos

- PRD en `.dev/prd.md`
- API key de TestSprite

### Uso

```bash
gestor-memory qa --testsprite-only

# O con MCP (desde IDE)
# "Help me test this project with TestSprite"
```

### Configuración

Genera `.dev/qa/testsprite-config.json`:

```json
{
  "project": {
    "name": "mi-proyecto",
    "prdPath": "../prd.md"
  },
  "testing": {
    "framework": "playwright",
    "types": ["ui", "api"]
  }
}
```

### Output

```
.dev/qa/results/
├── test-results.html
└── test-results.json
```

---

## Postman — API Tests

### ¿Qué hace?

- Genera colección desde PRD
- Ejecuta con Newman CLI

### Uso

```bash
# Generar colección
gestor-memory qa --postman-only

# Ejecutar
newman run .dev/qa/postman-collection.json
```

### Colección

Genera `.dev/qa/postman-collection.json` con:

- Health check
- Auth login
- CRUD endpoints (desde PRD)

### Importar en Postman

1. Abre Postman
2. Import → File
3. Selecciona `postman-collection.json`

---

## Pipeline Completo

### Ejecutar Todo

```bash
gestor-memory qa --full
```

### Output

```
.dev/qa/report-2024-01-15.md
```

Ejemplo de reporte:

```markdown
# QA Report: mi-proyecto
> Generado: 2024-01-15

---

## Resumen

| Herramienta | Estado | Resultado |
|:---|:---|:---|
| **Snyk** | ⚠️ Warning | 3 vulnerabilidades |
| **TestSprite** | ✅ Success | 12 tests passed |
| **Postman** | ✅ Success | 5/5 passed |

---

## Detalles

### Snyk
- **Estado:** ⚠️ Warning
- **Resultado:** 3 vulnerabilidades encontradas
- **Reporte:** .dev/qa/snyk-dependencies.json

...
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: QA Pipeline

on: [push, pull_request]

jobs:
  qa:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Snyk
        run: |
          npm install -g snyk
          snyk test --json > snyk.json
          snyk code test --json > snyk-code.json
      
      - name: Run Postman
        run: |
          npm install -g newman
          newman run .dev/qa/postman-collection.json
```

---

## Recomendaciones

| Fase | Herramienta |
|:---|:---|
| **Desarrollo** | Snyk (local) |
| **CI** | Snyk + Postman |
| **Release** | TestSprite (E2E) |
| **Diario** | Pipeline completo |

---

## Scoring

| Meta | Target |
|:---|:---|
| **Security** | 0 Critical |
| **E2E Coverage** | 80% flujos críticos |
| **API Coverage** | 100% endpoints |
| **Build** | ✅ Green siempre |