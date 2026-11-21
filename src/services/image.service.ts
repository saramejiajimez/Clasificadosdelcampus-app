import * as ImageManipulator from 'expo-image-manipulator';
import { getAccessToken } from '@/api/token-storage';
import { ApiClientError, getApiBaseUrl } from '@/api/http-client';

const TABLA_B64 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function valorB64(cadena: string, indice: number): number {
  const char = cadena[indice];
  if (!char) return 0;
  const pos = TABLA_B64.indexOf(char);
  return pos >= 0 ? pos : 0;
}

export function base64AUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const limpio = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = limpio.length;
  const bytesLen = Math.floor((len * 3) / 4);
  const salida = new Uint8Array(new ArrayBuffer(bytesLen));
  let p = 0;

  for (let i = 0; i < len; i += 4) {
    const triple =
      (valorB64(limpio, i) << 18) |
      (valorB64(limpio, i + 1) << 12) |
      (valorB64(limpio, i + 2) << 6) |
      valorB64(limpio, i + 3);

    if (p < bytesLen) salida[p++] = (triple >> 16) & 0xff;
    if (p < bytesLen) salida[p++] = (triple >> 8) & 0xff;
    if (p < bytesLen) salida[p++] = triple & 0xff;
  }
  return salida;
}

export async function comprimirImagenAntesDeSubir(
  uriLocal: string
): Promise<{ uri: string; bytes: Uint8Array<ArrayBuffer> }> {
  const resultado = await ImageManipulator.manipulateAsync(
    uriLocal,
    [{ resize: { width: 1280 } }],
    {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );
  if (!resultado.base64) {
    throw new Error('No se pudo procesar la imagen seleccionada');
  }
  return {
    uri: resultado.uri,
    bytes: base64AUint8Array(resultado.base64),
  };
}

export async function subirFotoComprimida(uriLocal: string): Promise<string> {
  const { bytes } = await comprimirImagenAntesDeSubir(uriLocal);
  const token = await getAccessToken();
  const res = await fetch(`${getApiBaseUrl()}/api/imagenes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'image/jpeg',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: bytes,
  });

  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
  };

  if (!res.ok || !data.url) {
    throw new ApiClientError(
      res.status,
      data.error ?? 'No se pudo subir la imagen'
    );
  }

  return data.url;
}
