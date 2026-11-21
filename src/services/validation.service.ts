export interface Coordenadas {
  lat: number;
  lng: number;
}

export interface AnuncioComparable {
  id: string;
  titulo: string;
  precio_centavos: number;
  categoria: string;
  foto_url: string | null;
  lat: number | null;
  lng: number | null;
  estado: 'activo' | 'vendido' | 'oculto';
  guardado_en: string;
}

export interface FormularioAnuncioInput {
  titulo: string;
  descripcion: string;
  precioPesos: number;
  categoria: string;
  whatsapp: string;
  fotos: string[];
}

export interface ResultadoValidacionAnuncio {
  valido: boolean;
  errores: string[];
  precioCentavos: number;
}

const TELEFONO_COL_REGEX = /^3\d{9}$/;

export function validarTelefonoColombiano(telefono: string): boolean {
  return TELEFONO_COL_REGEX.test(telefono.trim());
}

export function construirEnlaceWhatsApp(
  telefono: string,
  tituloAnuncio: string
): string {
  const limpio = telefono.replace(/\D/g, '');
  const mensaje = `Hola, me interesa tu anuncio en Clasificados del Campus: "${tituloAnuncio.trim()}"`;
  return `https://wa.me/57${limpio}?text=${encodeURIComponent(mensaje)}`;
}

function validarCamposTextoYPrecio(input: FormularioAnuncioInput): string[] {
  const errs: string[] = [];
  const titulo = input.titulo.trim();
  if (titulo.length < 5 || titulo.length > 80) {
    errs.push('El título debe tener entre 5 y 80 caracteres.');
  }
  if (input.descripcion.trim().length < 1) {
    errs.push('La descripción es obligatoria.');
  }
  if (!Number.isFinite(input.precioPesos) || input.precioPesos < 0) {
    errs.push('El precio debe ser un número entero mayor o igual a 0.');
  }
  if (input.categoria.trim().length === 0) {
    errs.push('Selecciona una categoría.');
  }
  return errs;
}

export function validarFormularioAnuncio(
  input: FormularioAnuncioInput,
  anunciosActivosActuales: number
): ResultadoValidacionAnuncio {
  const errores: string[] = [];

  if (anunciosActivosActuales >= 5) {
    errores.push('Ya tienes el máximo permitido de 5 anuncios activos.');
  }
  errores.push(...validarCamposTextoYPrecio(input));

  if (!validarTelefonoColombiano(input.whatsapp)) {
    errores.push(
      'El WhatsApp debe ser un celular colombiano de 10 dígitos que empiece por 3.'
    );
  }
  if (input.fotos.length < 1 || input.fotos.length > 4) {
    errores.push('Debes adjuntar entre 1 y 4 fotos.');
  }

  const precioCentavos = Math.round(Math.max(0, input.precioPesos) * 100);
  return {
    valido: errores.length === 0,
    errores,
    precioCentavos,
  };
}

export function calcularDistanciaKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const radioTierraKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radioTierraKm * c;
}

export function ordenarAnunciosPorCercania<T extends AnuncioComparable>(
  anuncios: T[],
  posicionUsuario: Coordenadas | null
): (T & { distanciaKm: number | null })[] {
  const enriquecidos = anuncios.map((item) => {
    const tieneCoords =
      posicionUsuario &&
      typeof item.lat === 'number' &&
      typeof item.lng === 'number';
    return {
      ...item,
      distanciaKm: tieneCoords
        ? calcularDistanciaKm(
            posicionUsuario.lat,
            posicionUsuario.lng,
            item.lat as number,
            item.lng as number
          )
        : null,
    };
  });

  if (!posicionUsuario) {
    return enriquecidos.sort((a, b) =>
      b.guardado_en.localeCompare(a.guardado_en)
    );
  }

  return enriquecidos.sort((a, b) => {
    if (a.distanciaKm !== null && b.distanciaKm !== null) {
      return a.distanciaKm - b.distanciaKm;
    }
    if (a.distanciaKm !== null) return -1;
    if (b.distanciaKm !== null) return 1;
    return b.guardado_en.localeCompare(a.guardado_en);
  });
}

export function formatearPrecioCOP(precioCentavos: number): string {
  if (precioCentavos <= 0) {
    return 'Gratis';
  }
  const pesos = Math.round(precioCentavos / 100);
  return `$${pesos.toLocaleString('es-CO')} COP`;
}
