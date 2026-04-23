# Obsidian — Guía de Integración

> Visualiza el conocimiento de tu proyecto como un grafo interconectado.

---

## ¿Por qué Obsidian?

Obsidian permite ver relaciones entre notas como un **grafo visual**, ideal para proyectos Gestor_Memory.

| Característica | Beneficio |
|:---|:---|
| **Graph View** | Visualiza conexiones entre nodos |
| **Backlinks** | Ve quién ссылается a qué |
| **Dataview** | Queries sobre notas |
| **Local** | Tus datos stays locally |

---

## Instalación

### Windows

1. Descarga: https://obsidian.md/download
2. Instala el ejecutable
3. Ejecuta Obsidian

### Mac

```bash
brew install --cask obsidian
```

### Linux

```bash
sudo apt install obsidian  # o usa AppImage
```

---

## Configuración con Gestor_Memory

### Opción 1: Durante init

```bash
gestor-memory init

? ¿Deseas usar Obsidian?
  ○ Sí, ya lo tengo instalado
  → [vincula vault automáticamente]
  ○ Sí, quiero instalarlo
  → [abre link + tutorial]
  ○ No
```

### Manual

```bash
gestor-memory obsidian
```

---

## Vinculación de Vault

### Estructura Generada

```
.dev/obsidian/
├── .obsidian/
│   └── app.json         # Configuración
├── knowledge/          # Nodos de conocimiento
├── decisions/          # ADRs
├── sessions/           # Logs de sesiones
└── sync-config.md    # Tutorial
```

### Abrir como Vault

1. Abre Obsidian
2. Click **"Open folder as vault"**
3. Selecciona: `.dev/obsidian/`

---

## Plugins Recomendados

### 1. Dataview (Essential)

```
Settings → Community Plugins → Browse → "Dataview" → Install → Enable
```

Permite:
- Query notas con JS
- Listas dinámicas
- Metadata en YAML frontmatter

### 2. ExcaliBrain (Visual)

```
Settings → Community Plugins → Browse → "ExcaliBrain" → Install → Enable
```

Permite:
- Vista cerebro
- Navegación visual
- Anotaciones en grafo

### 3. Obsidian Git (Sincronización)

```
Settings → Community Plugins → Browse → "Obsidian Git" → Install → Enable
```

Permite:
- Commit de notas
- Push a remoto
- Sincronización team

---

## Uso Básico

### Crear Nota de Conocimiento

```markdown
---
title: Autenticación
type: concept
related:
  - JWT
  - OAuth
  - RBAC
---

# Autenticación

Sistema de authentication del proyecto.

## Reglas
- [ ] JWT expires en 24h
- [ ] Refresh token rotate
- [ ] OAuth providers: Google, GitHub
```

### Ver Grafo

Presiona `Ctrl+G` (o `Cmd+G`)

### Buscar

Presiona `Ctrl+O` → Quick Switcher

---

## Queries Dataview

### Listar Conceptos

```dataview
LIST
FROM "knowledge"
WHERE type = "concept"
SORT file.name
```

### Listar Decisiones

```dataview
TABLE decision, date, status
FROM "decisions"
WHERE status = "accepted"
```

### Nodos Relacionados

```dataview
LIST
FROM "knowledge"
WHERE contains(related, "JWT")
```

---

## Sincronización

### Config Git

En `.dev/obsidian/.obsidian/community-plugins.json`:

```json
["dataview", "obsidian-excalibrain", "obsidian-git"]
```

### Workflow

```
1. Crea/modifica nota
2. Obsidian Git hace commit automáticamente
3. Push a remote (opcional)
```

**Nota**: `.dev/` está en .gitignore, pero puedes hacer excepciones en `.gitignore`:

```gitignore
#例外: Obsidian vault
!.dev/obsidian
```

---

## Troubleshooting

### No veo el grafo

- Instala **ExcaliBrain** plugin
- Presiona `Ctrl+G`

### Dataview no funciona

- Asegúrate de tener YAML frontmatter en cada nota
- Reinicia Obsidian

### Vault no carga

- Verifica que la carpeta exista: `.dev/obsidian/`
- Selecciona "Open folder as vault"

---

## Alternativas

| Herramienta | Notas |
|:---|:---|
| **Logseq** | Similar, open source |
| **Foam** | VS Code extension |
| **RemNote** |spaced repetition |
| **Notion** | Cloud, less private |

---

## Recursos

- Docs: https://help.obsidian.md
- Dataview: https://black-merge.github.io/dataview/
- ExcaliBrain: https://zsviczian.github.io/ExcaliBrain/