import { apiFetch } from '@/api/http-client';
import type { FavoritoRow } from '@/repositories/favoritos.repo';

export interface FavoritoRemotoItem {
  id: string;
  anuncio_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface FavoritoSyncAdapter {
  obtenerPendientes: () => Promise<FavoritoRow[]>;
  marcarSincronizado: (
    anuncioId: string,
    serverUpdatedAt: string
  ) => Promise<void>;
  aplicarRemoto: (item: FavoritoRemotoItem) => Promise<void>;
}

export async function sincronizarFavoritosConServidor(
  adapter: FavoritoSyncAdapter,
  sinceIso: string | null
): Promise<string> {
  const pendientes = await adapter.obtenerPendientes();

  for (const item of pendientes) {
    const id = item.remote_id ?? item.anuncio_id;
    if (item.deleted === 1) {
      await apiFetch<{ ok: boolean }>(`/api/favorito/${id}`, {
        method: 'DELETE',
      }).catch(() => ({ ok: true }));
      await adapter.marcarSincronizado(
        item.anuncio_id,
        new Date().toISOString()
      );
    } else {
      const res = await apiFetch<FavoritoRemotoItem>(`/api/favorito/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ anuncio_id: item.anuncio_id }),
      });
      await adapter.marcarSincronizado(item.anuncio_id, res.updated_at);
    }
  }

  const query = sinceIso ? `?since=${encodeURIComponent(sinceIso)}` : '';
  const respuesta = await apiFetch<{
    items: FavoritoRemotoItem[];
    servidor_ahora: string;
  }>(`/api/favorito${query}`);

  for (const remoto of respuesta.items) {
    await adapter.aplicarRemoto(remoto);
  }

  return respuesta.servidor_ahora;
}
