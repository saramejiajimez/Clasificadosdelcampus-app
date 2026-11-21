import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS anuncio_cache (
  id TEXT PRIMARY KEY,
  remote_id TEXT,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  precio_centavos INTEGER NOT NULL,
  categoria TEXT NOT NULL,
  foto_url TEXT,
  fotos_json TEXT NOT NULL DEFAULT '[]',
  whatsapp TEXT NOT NULL DEFAULT '',
  owner_uid TEXT NOT NULL DEFAULT '',
  reportes INTEGER NOT NULL DEFAULT 0,
  lat REAL,
  lng REAL,
  estado TEXT NOT NULL,
  guardado_en TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted INTEGER NOT NULL DEFAULT 0,
  pending INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS favorito (
  anuncio_id TEXT PRIMARY KEY,
  remote_id TEXT,
  agregado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted INTEGER NOT NULL DEFAULT 0,
  pending INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sync_meta (
  recurso TEXT PRIMARY KEY,
  ultimo_since TEXT NOT NULL
);
`;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }
  const db = await SQLite.openDatabaseAsync('clasificados_campus.db');
  await db.execAsync(MIGRATION_SQL);
  dbInstance = db;
  return db;
}
