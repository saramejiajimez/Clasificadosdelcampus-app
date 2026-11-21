import { getDatabase } from '@/db/database';
import {
  obtenerAnuncioCachePorId,
  type AnuncioLocal,
} from '@/repositories/anuncios.repo';

export interface FavoritoRow {
  anuncio_id: string;
  remote_id: string | null;
  agregado_en: string;
  updated_at: string;
  deleted: number;
  pending: number;
}

export async function toggleFavoritoLocal(anuncioId: string): Promise<boolean> {
  const db = await getDatabase();
  const existente = await db.getFirstAsync<FavoritoRow>(
    `SELECT * FROM favorito WHERE anuncio_id = ?`,
    [anuncioId]
  );

  const ahora = new Date().toISOString();
  if (!existente || existente.deleted === 1) {
    await db.runAsync(
      `INSERT OR REPLACE INTO favorito (
        anuncio_id, remote_id, agregado_en, updated_at, deleted, pending
      ) VALUES (?, ?, ?, ?, 0, 1)`,
      [anuncioId, anuncioId, ahora, ahora]
    );
    return true;
  }

  await db.runAsync(
    `UPDATE favorito SET deleted = 1, pending = 1, updated_at = ? WHERE anuncio_id = ?`,
    [ahora, anuncioId]
  );
  return false;
}

export async function esFavoritoLocal(anuncioId: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ anuncio_id: string }>(
    `SELECT anuncio_id FROM favorito WHERE anuncio_id = ? AND deleted = 0`,
    [anuncioId]
  );
  return Boolean(row);
}

export async function listarIdsFavoritosActivos(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ anuncio_id: string }>(
    `SELECT anuncio_id FROM favorito WHERE deleted = 0 ORDER BY agregado_en DESC`
  );
  return rows.map((r) => r.anuncio_id);
}

export async function listarAnunciosFavoritosOffline(): Promise<
  AnuncioLocal[]
> {
  const ids = await listarIdsFavoritosActivos();
  const resultados: AnuncioLocal[] = [];
  for (const id of ids) {
    const anuncio = await obtenerAnuncioCachePorId(id);
    if (anuncio) {
      resultados.push(anuncio);
    }
  }
  return resultados;
}

export async function obtenerFavoritosPendientes(): Promise<FavoritoRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<FavoritoRow>(
    `SELECT * FROM favorito WHERE pending = 1`
  );
}

export async function marcarFavoritoSincronizado(
  anuncioId: string,
  serverUpdatedAt: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE favorito SET pending = 0, updated_at = ? WHERE anuncio_id = ?`,
    [serverUpdatedAt, anuncioId]
  );
}

export async function aplicarFavoritoRemoto(item: {
  id: string;
  anuncio_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}): Promise<void> {
  const db = await getDatabase();
  const local = await db.getFirstAsync<FavoritoRow>(
    `SELECT * FROM favorito WHERE anuncio_id = ?`,
    [item.anuncio_id]
  );

  if (local && local.updated_at > item.updated_at) {
    return;
  }

  const deletedFlag = item.deleted_at ? 1 : 0;
  await db.runAsync(
    `INSERT OR REPLACE INTO favorito (
      anuncio_id, remote_id, agregado_en, updated_at, deleted, pending
    ) VALUES (?, ?, ?, ?, ?, 0)`,
    [item.anuncio_id, item.id, item.created_at, item.updated_at, deletedFlag]
  );
}

export async function obtenerUltimoSinceFavoritos(): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ ultimo_since: string }>(
    `SELECT ultimo_since FROM sync_meta WHERE recurso = 'favorito'`
  );
  return row?.ultimo_since ?? null;
}

export async function guardarUltimoSinceFavoritos(
  since: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO sync_meta (recurso, ultimo_since) VALUES ('favorito', ?)`,
    [since]
  );
}
