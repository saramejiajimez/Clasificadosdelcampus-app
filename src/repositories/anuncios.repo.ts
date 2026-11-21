import { getDatabase } from '@/db/database';

export interface AnuncioLocal {
  id: string;
  remote_id: string | null;
  titulo: string;
  descripcion: string;
  precio_centavos: number;
  categoria: string;
  foto_url: string | null;
  fotos: string[];
  whatsapp: string;
  owner_uid: string;
  reportes: number;
  lat: number | null;
  lng: number | null;
  estado: 'activo' | 'vendido' | 'oculto';
  guardado_en: string;
  updated_at: string;
  deleted: number;
  pending: number;
}

interface AnuncioRow {
  id: string;
  remote_id: string | null;
  titulo: string;
  descripcion: string;
  precio_centavos: number;
  categoria: string;
  foto_url: string | null;
  fotos_json: string;
  whatsapp: string;
  owner_uid: string;
  reportes: number;
  lat: number | null;
  lng: number | null;
  estado: 'activo' | 'vendido' | 'oculto';
  guardado_en: string;
  updated_at: string;
  deleted: number;
  pending: number;
}

function mapRowToAnuncio(row: AnuncioRow): AnuncioLocal {
  let fotos: string[] = [];
  try {
    const parsed = JSON.parse(row.fotos_json) as unknown;
    if (Array.isArray(parsed)) {
      fotos = parsed.filter((item): item is string => typeof item === 'string');
    }
  } catch {
    fotos = row.foto_url ? [row.foto_url] : [];
  }

  return {
    id: row.id,
    remote_id: row.remote_id,
    titulo: row.titulo,
    descripcion: row.descripcion,
    precio_centavos: row.precio_centavos,
    categoria: row.categoria,
    foto_url: row.foto_url,
    fotos,
    whatsapp: row.whatsapp,
    owner_uid: row.owner_uid,
    reportes: row.reportes,
    lat: row.lat,
    lng: row.lng,
    estado: row.estado,
    guardado_en: row.guardado_en,
    updated_at: row.updated_at,
    deleted: row.deleted,
    pending: row.pending,
  };
}

export async function guardarAnunciosEnCache(
  anuncios: Omit<
    AnuncioLocal,
    'remote_id' | 'updated_at' | 'deleted' | 'pending'
  >[]
): Promise<void> {
  const db = await getDatabase();
  const ahora = new Date().toISOString();

  for (const item of anuncios) {
    const fotoPrincipal = item.fotos[0] ?? item.foto_url ?? null;
    await db.runAsync(
      `INSERT OR REPLACE INTO anuncio_cache (
        id, remote_id, titulo, descripcion, precio_centavos, categoria,
        foto_url, fotos_json, whatsapp, owner_uid, reportes, lat, lng,
        estado, guardado_en, updated_at, deleted, pending
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [
        item.id,
        item.id,
        item.titulo,
        item.descripcion,
        item.precio_centavos,
        item.categoria,
        fotoPrincipal,
        JSON.stringify(item.fotos),
        item.whatsapp,
        item.owner_uid,
        item.reportes,
        item.lat,
        item.lng,
        item.estado,
        item.guardado_en,
        ahora,
      ]
    );
  }
}

export async function listarAnunciosCache(
  busqueda?: string,
  categoria?: string
): Promise<AnuncioLocal[]> {
  const db = await getDatabase();
  const q = busqueda?.trim() ? `%${busqueda.trim()}%` : '%';

  if (categoria && categoria.trim() !== '' && categoria !== 'todas') {
    const rows = await db.getAllAsync<AnuncioRow>(
      `SELECT * FROM anuncio_cache
       WHERE deleted = 0 AND estado = 'activo'
         AND categoria = ? AND (titulo LIKE ? OR descripcion LIKE ?)
       ORDER BY guardado_en DESC`,
      [categoria.trim(), q, q]
    );
    return rows.map(mapRowToAnuncio);
  }

  const rows = await db.getAllAsync<AnuncioRow>(
    `SELECT * FROM anuncio_cache
     WHERE deleted = 0 AND estado = 'activo'
       AND (titulo LIKE ? OR descripcion LIKE ?)
     ORDER BY guardado_en DESC`,
    [q, q]
  );
  return rows.map(mapRowToAnuncio);
}

export async function obtenerAnuncioCachePorId(
  id: string
): Promise<AnuncioLocal | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<AnuncioRow>(
    `SELECT * FROM anuncio_cache WHERE id = ? AND deleted = 0`,
    [id]
  );
  return row ? mapRowToAnuncio(row) : null;
}

export async function listarMisAnunciosCache(
  ownerUid: string
): Promise<AnuncioLocal[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<AnuncioRow>(
    `SELECT * FROM anuncio_cache
     WHERE owner_uid = ? AND deleted = 0
     ORDER BY guardado_en DESC`,
    [ownerUid]
  );
  return rows.map(mapRowToAnuncio);
}

export async function actualizarEstadoLocalAnuncio(
  id: string,
  estado: 'activo' | 'vendido' | 'oculto'
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE anuncio_cache SET estado = ?, updated_at = ? WHERE id = ?`,
    [estado, new Date().toISOString(), id]
  );
}

export async function eliminarAnuncioLocal(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM anuncio_cache WHERE id = ?`, [id]);
}
