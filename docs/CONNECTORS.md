# Conectores Externos — Gestor_Memory v2

> Cómo conectar con bases de datos externas (Modo Filtro).

---

## Visión General

| Conector | Estado | Base de Datos |
|:---|:---|:---|
| **PostgreSQL** | ✅ Stable | Postgres, Supabase |
| **MySQL** | 🟡 En desarrollo | MySQL, MariaDB |
| **Oracle** | 🟡 En desarrollo | Oracle DB |
| **Markdown** | ✅ Stable | Archivos MD |

---

## Configuración de Conectores

### Archivo de Configuración

`.gestor-memory/connectors.json`:

```json
{
  "mode": "filtro",
  "sources": [
    {
      "type": "oracle",
      "host": "oracle.empresa.com",
      "port": 1521,
      "service": "PROD",
      "schema": "APP_USER"
    }
  ],
  "target": {
    "type": "postgres",
    "host": "localhost",
    "port": 5432,
    "database": "gestor_memory"
  }
}
```

---

## PostgreSQL / Supabase

### Connect

```bash
gestor-memory sync --source postgres
```

### Configuración

```json
{
  "type": "postgres",
  "host": "localhost",
  "port": 5432,
  "database": "mi-db",
  "user": "admin",
  "password": "${DB_PASSWORD}"
}
```

### Variables de Entorno

```bash
export PG_HOST=localhost
export PG_PORT=5432
export PG_DB=mi-db
export PG_USER=admin
export PG_PASSWORD=secret
```

### sync

```typescript
// lib/connectors/postgres.ts
import pg from 'pg';
const { Pool } = pg;

export async function syncFromPostgres(config: PostgresConfig): Promise<SyncResult> {
  const pool = new Pool(config);
  
  // Extraer tablas
  const tables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  
  // Para cada tabla, extraer datos
  for (const table of tables.rows) {
    const data = await pool.query(`SELECT * FROM ${table.table_name} LIMIT 1000`);
    await saveToCoreMemory(table.table_name, data.rows);
  }
  
  return { tables: tables.rowCount, rows: data.rowCount };
}
```

---

## MySQL / MariaDB

### Connect

```bash
gestor-memory sync --source mysql
```

### Configuración

```json
{
  "type": "mysql",
  "host": "mysql.empresa.com",
  "port": 3306,
  "database": "app_db",
  "user": "app_user",
  "password": "${MYSQL_PASSWORD}"
}
```

### Notas

- Estado: Beta
- Requiere MySQL 8.0+
- Mapping de tipos: verificar

---

## Oracle

### Connect

```bash
gestor-memory sync --source oracle --tns ORACLE_TNS
```

### Configuración

```json
{
  "type": "oracle",
  "connectionString": "oracle.empresa.com:1521/PROD",
  "user": "APP_USER",
  "password": "${ORACLE_PASSWORD}",
  "schema": "APP_SCHEMA"
}
```

### Requisitos

```bash
npm install oracle-db
```

### Notas

- Solo lectura recomendado (Modo Filtro)
- Oracle Instant Client necesario
- SQL queries solo, sin PL/SQL

---

## Supabase (Especial)

Supabase es un caso especial porqueGestor_Memory lo detecta automáticamente.

### Detectado Automáticamente

```
✅ Supabase detectado en: supabase/
→ 12 tablas con RLS
→ 3 Edge Functions
```

### Config extra

```json
{
  "type": "supabase",
  "project": "abc123",
  "url": "https://abc123.supabase.co",
  "anon_key": "${SUPABASE_ANON_KEY}",
  "service_key": "${SUPABASE_SERVICE_KEY}"
}
```

### RLS Policies

Gestor_Memory extrae las políticas RLS como reglas de negocio:

```
## 5. Reglas de Negocio

### Row Level Security

| Tabla | Policy | Expresión |
|:---|:---|:---|
| users | owner_read | auth.uid() = user_id |
| posts | public_read | true |
| posts | owner_write | auth.uid() = user_id |
```

---

## Modo sync

### Unidireccional

```
DB Existente ──▶ Core Memory
```

```bash
gestor-memory sync --source oracle
```

### Bidireccional (Avanzado)

```
DB Existente ◀──▶ Core Memory
```

```bash
gestor-memory sync --source oracle --bidirectional
```

**Advertencia**: Solo para usuarios avanzados. Requiere:

- Mapping de schemas
- Resolución de conflictos
- Transacciones distribuidas

---

## Troubleshooting

### Connection Failed

- Verificar credenciales
- Verificar network/access
- Verificar firewall

### Timeout

- Aumentar timeout en config
- Usar pagination

### Data Type Mismatch

- Revisar tipos mapeados
- Ajustar en config

---

## Mejores Prácticas

| Práctica | Por qué |
|:---|:---|
| **Credenciales en env** | No expues en código |
| **Solo lectura** | Prod DB: nunca write |
| **Pagination** | Datos grandes |
| **Logs** | Debug de sync |
| **Cron** | sync periódico |