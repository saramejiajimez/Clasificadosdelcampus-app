import { apiFetch, ApiClientError } from '@/api/http-client';
import { sincronizarFavoritosConServidor } from '@/services/sync.service';

const mockGetToken = jest.fn<Promise<string | null>, []>();
const mockGetRefreshToken = jest.fn<Promise<string | null>, []>();
const mockSaveSession = jest.fn<Promise<void>, [string, string]>();
const mockClearSession = jest.fn<Promise<void>, []>();

jest.mock('@/api/token-storage', () => ({
  getAccessToken: () => mockGetToken(),
  getRefreshToken: () => mockGetRefreshToken(),
  saveTokensOnly: (t: string, r: string) => mockSaveSession(t, r),
  clearSessionStorage: () => mockClearSession(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_API_URL = 'https://api.campus.edu';
});

it('reintenta una vez con /api/auth/refresh cuando recibe 401', async () => {
  mockGetToken.mockResolvedValueOnce('expired-token');
  mockGetRefreshToken.mockResolvedValueOnce('valid-refresh');

  const fetchMock = jest.fn();
  globalThis.fetch = fetchMock as unknown as typeof fetch;

  fetchMock
    .mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Token expirado' }),
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        token: 'new-token',
        refreshToken: 'new-refresh',
        expiraEnSeg: 3600,
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [], nextCursor: null }),
    });

  const data = await apiFetch<{ items: unknown[] }>('/api/anuncios');
  expect(data.items).toEqual([]);
  expect(mockSaveSession).toHaveBeenCalledWith('new-token', 'new-refresh');
  expect(fetchMock).toHaveBeenCalledTimes(3);
});

it('limpia sesión y lanza ApiClientError 401 si falla el refresh', async () => {
  mockGetToken.mockResolvedValueOnce('expired-token');
  mockGetRefreshToken.mockResolvedValueOnce('bad-refresh');

  const fetchMock = jest.fn();
  globalThis.fetch = fetchMock as unknown as typeof fetch;

  fetchMock
    .mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Token expirado' }),
    })
    .mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Refresh inválido' }),
    });

  await expect(apiFetch('/api/anuncios')).rejects.toThrow(ApiClientError);
  expect(mockClearSession).toHaveBeenCalledTimes(1);
});

it('propaga errores 409 (sexto anuncio) y 403 (rol no admin) con mensaje del servidor', async () => {
  mockGetToken.mockResolvedValue('valid-token');
  const fetchMock = jest.fn();
  globalThis.fetch = fetchMock as unknown as typeof fetch;

  fetchMock.mockResolvedValueOnce({
    ok: false,
    status: 409,
    json: async () => ({
      error: 'Ya tienes el máximo permitido de 5 anuncios activos',
    }),
  });

  await expect(
    apiFetch('/api/anuncios', { method: 'POST', body: '{}' })
  ).rejects.toMatchObject({
    status: 409,
    message: 'Ya tienes el máximo permitido de 5 anuncios activos',
  });

  fetchMock.mockResolvedValueOnce({
    ok: false,
    status: 403,
    json: async () => ({ error: 'Se requiere rol de administrador' }),
  });

  await expect(
    apiFetch('/api/admin/anuncios/a1', { method: 'PATCH', body: '{}' })
  ).rejects.toMatchObject({
    status: 403,
    message: 'Se requiere rol de administrador',
  });
});

function configurarFetchParaSync(): void {
  const fetchMock = jest.fn();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  fetchMock
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'fav-1',
        anuncio_id: 'fav-1',
        updated_at: '2026-11-14T10:00:00.000Z',
        deleted_at: null,
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            id: 'fav-remoto',
            anuncio_id: 'fav-remoto',
            created_at: '2026-11-14T11:00:00.000Z',
            updated_at: '2026-11-14T11:00:00.000Z',
            deleted_at: null,
          },
        ],
        servidor_ahora: '2026-11-14T12:00:00.000Z',
      }),
    });
}

it('sincroniza favoritos pendientes (PUT/DELETE) y aplica cambios remotos (GET ?since=)', async () => {
  mockGetToken.mockResolvedValue('valid-token');
  configurarFetchParaSync();

  const marcados: string[] = [];
  const aplicados: string[] = [];

  const nuevoSince = await sincronizarFavoritosConServidor(
    {
      obtenerPendientes: async () => [
        {
          anuncio_id: 'fav-1',
          remote_id: 'fav-1',
          agregado_en: '2026-11-14T09:00:00.000Z',
          updated_at: '2026-11-14T09:00:00.000Z',
          deleted: 0,
          pending: 1,
        },
        {
          anuncio_id: 'fav-2',
          remote_id: 'fav-2',
          agregado_en: '2026-11-14T09:00:00.000Z',
          updated_at: '2026-11-14T09:05:00.000Z',
          deleted: 1,
          pending: 1,
        },
      ],
      marcarSincronizado: async (id: string) => {
        marcados.push(id);
      },
      aplicarRemoto: async (item: { id: string }) => {
        aplicados.push(item.id);
      },
    },
    '2026-11-01T00:00:00.000Z'
  );

  expect(marcados).toEqual(['fav-1', 'fav-2']);
  expect(aplicados).toEqual(['fav-remoto']);
  expect(nuevoSince).toBe('2026-11-14T12:00:00.000Z');
});
