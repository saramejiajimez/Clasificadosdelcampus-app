import { apiFetch } from '@/api/http-client';
import {
  actualizarEstadoLocalAnuncio,
  eliminarAnuncioLocal,
  guardarAnunciosEnCache,
  listarAnunciosCache,
  type AnuncioLocal,
} from '@/repositories/anuncios.repo';
import {
  aplicarFavoritoRemoto,
  guardarUltimoSinceFavoritos,
  marcarFavoritoSincronizado,
  obtenerFavoritosPendientes,
  obtenerUltimoSinceFavoritos,
} from '@/repositories/favoritos.repo';
import { sincronizarFavoritosConServidor } from '@/services/sync.service';

interface AnuncioApiItem {
  id: string;
  owner_uid: string;
  titulo: string;
  descripcion: string;
  precio_centavos: number;
  categoria: string;
  fotos: string[];
  whatsapp: string;
  lat: number | null;
  lng: number | null;
  estado: 'activo' | 'vendido' | 'oculto';
  reportes: number;
  creado_en: string;
}

export async function refrescarFeedYGuardarCache(
  categoria?: string
): Promise<AnuncioLocal[]> {
  const filtro =
    categoria && categoria !== 'todas'
      ? `?categoria=${encodeURIComponent(categoria)}`
      : '';
  const data = await apiFetch<{ items: AnuncioApiItem[] }>(
    `/api/anuncios${filtro}`
  );

  const mapeados = data.items.map((item) => ({
    id: item.id,
    titulo: item.titulo,
    descripcion: item.descripcion,
    precio_centavos: item.precio_centavos,
    categoria: item.categoria,
    foto_url: item.fotos[0] ?? null,
    fotos: item.fotos,
    whatsapp: item.whatsapp,
    owner_uid: item.owner_uid,
    reportes: item.reportes,
    lat: item.lat,
    lng: item.lng,
    estado: item.estado,
    guardado_en: item.creado_en,
  }));

  await guardarAnunciosEnCache(mapeados);
  return listarAnunciosCache('', categoria);
}

export async function publicarAnuncioRemotoYLocal(payload: {
  id: string;
  titulo: string;
  descripcion: string;
  precio_centavos: number;
  categoria: string;
  fotos: string[];
  whatsapp: string;
  lat: number | null;
  lng: number | null;
}): Promise<AnuncioApiItem> {
  const creado = await apiFetch<AnuncioApiItem>('/api/anuncios', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  await guardarAnunciosEnCache([
    {
      id: creado.id,
      titulo: creado.titulo,
      descripcion: creado.descripcion,
      precio_centavos: creado.precio_centavos,
      categoria: creado.categoria,
      foto_url: creado.fotos[0] ?? null,
      fotos: creado.fotos,
      whatsapp: creado.whatsapp,
      owner_uid: creado.owner_uid,
      reportes: creado.reportes,
      lat: creado.lat,
      lng: creado.lng,
      estado: creado.estado,
      guardado_en: creado.creado_en,
    },
  ]);

  return creado;
}

export async function marcarVendidoRemotoYLocal(id: string): Promise<void> {
  await apiFetch(`/api/anuncios/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ estado: 'vendido' }),
  });
  await actualizarEstadoLocalAnuncio(id, 'vendido');
}

export async function eliminarAnuncioRemotoYLocal(id: string): Promise<void> {
  await apiFetch(`/api/anuncios/${id}`, { method: 'DELETE' });
  await eliminarAnuncioLocal(id);
}

export async function reportarAnuncioRemoto(
  id: string,
  motivo: string
): Promise<void> {
  await apiFetch(`/api/anuncios/${id}/reportar`, {
    method: 'POST',
    body: JSON.stringify({ motivo }),
  });
}

export async function ocultarAnuncioComoAdmin(id: string): Promise<void> {
  await apiFetch(`/api/admin/anuncios/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ estado: 'oculto' }),
  });
  await actualizarEstadoLocalAnuncio(id, 'oculto');
}

export async function ejecutarSincronizacionFavoritos(): Promise<void> {
  const ultimoSince = await obtenerUltimoSinceFavoritos();
  const nuevoSince = await sincronizarFavoritosConServidor(
    {
      obtenerPendientes: obtenerFavoritosPendientes,
      marcarSincronizado: marcarFavoritoSincronizado,
      aplicarRemoto: aplicarFavoritoRemoto,
    },
    ultimoSince
  );
  await guardarUltimoSinceFavoritos(nuevoSince);
}
