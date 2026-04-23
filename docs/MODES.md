# Modo Destino vs Modo Filtro — Gestor_Memory v2

> Cuándo usar cada modo y cómo funciona.

---

## Resumen Comparativo

| Aspecto | Modo Destino | Modo Filtro |
|:---|:---|:---|
| **DB** | PostgreSQL nueva | DB separada (sincroniza) |
| **Datos** | Solo Gestor_Memory | Copia de DB existente |
| **Latencia** | Más rápido | Más lento (sync) |
| **Costo** | 1 DB | 2+ DBs |
| **Complejidad** | Baja | Alta |

---

## Modo Destino (Recomendado)

```
Proyecto ──▶ Core Memory (PostgreSQL)
```

### Cuándo usar

- Proyectos nuevos
- No tienes DB existente
- Quieres independencia total
- Prefieres simplicidad

### Ventajas

- [ ] Simplicidad operativa
- [ ] Sin sincronización
- [ ] Sin担心 DB externa
- [ ] Más rápido

### Desventajas

- [ ] Requiere DB nueva
- [ ] No hereda datos existentes

---

## Modo Filtro (Para empresas)

```
DB Existente ──▶ Filtro ──▶ Core Memory
     │              │
     └──────────────┘
      (bidireccional opcional)
```

### Cuándo usar

- Empresa con DB Oracle/MySQL/Supabase existente
- No puedes migrar la DB
- Necesitas consultar ambas
- Compliance: no puedes tocar DB de producción

### Arquitectura

```
┌─────────────────┐     ┌─────────────────┐
│  DB Existente   │────│  Gestor_Memory │
│ (Oracle/MySQL)  │    │  Core Memory  │
└─────────────────┘     └─────────────────┘
        │                      │
        ▼                      ▼
   ┌─────────────────────────────────────────┐
   │            Sync Engine                  │
   │   - Extracción periódica               │
   │   - Transformación                 │
   │   - Sincronización bidireccional   │
   └─────────────────────────────────────────┘
```

### Ventajas

- [ ] No toca la DB existente
- [ ] Consulta sin permisos de escritura
- [ ] Mantiene historial

### Desventajas

- [ ] Complejidad (sync)
- [ ] Latencia de datos
- [ ] Costo adicional (2 DBs)
- [ ] Requiere mantenimiento

---

## Configuración

### Modo Destino

```bash
gestor-memory init --mode destino
```

Genera: `docker-compose.yml` con PostgreSQL nuevo.

### Modo Filtro

```bash
gestor-memory init --mode filtro
gestor-memory sync --source oracle
```

1. Conecta a DB externa
2. Extrae datos periódicamente
3. Guarda en Core Memory

---

## Sincronización

### Filtro Unidireccional

```
DB Existente ──▶ Core Memory
```

- Solo lectura → Core Memory
- Periódico (cron)

### Filtro Bidireccional

```
DB Existente ◀──▶ Core Memory
```

- Cambios en Core → DB externa
- Requiere mapping de schemas
- Conflictos: resolución manual

---

## Recomendación

| Escenario | Modo |
|:---|:---|
| Proyecto nuevo | **Modo Destino** |
| Startup sin DB | **Modo Destino** |
| Enterprise (Oracle) | **Modo Filtro** |
| Legacy system | **Modo Filtro** |
| Compliance strict | **Modo Filtro** |