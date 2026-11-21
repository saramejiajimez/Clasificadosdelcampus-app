import {
  construirEnlaceWhatsApp,
  formatearPrecioCOP,
  ordenarAnunciosPorCercania,
  validarFormularioAnuncio,
  validarTelefonoColombiano,
  calcularDistanciaKm,
} from '@/services/validation.service';
import { calcularDesplazamientoParallax } from '@/sensors/parallax-math';

it('valida teléfono colombiano de 10 dígitos que empieza por 3', () => {
  expect(validarTelefonoColombiano('3001234567')).toBe(true);
  expect(validarTelefonoColombiano('3159876543')).toBe(true);
  expect(validarTelefonoColombiano('2001234567')).toBe(false);
  expect(validarTelefonoColombiano('300123456')).toBe(false);
  expect(validarTelefonoColombiano('30012345678')).toBe(false);
  expect(validarTelefonoColombiano('300123456a')).toBe(false);
});

it('RF-05: construye enlace oficial de WhatsApp con prefijo 57 y texto codificado', () => {
  const link = construirEnlaceWhatsApp(
    '3001234567',
    'Calculadora Casio FX-991'
  );
  expect(link).toBe(
    'https://wa.me/573001234567?text=Hola%2C%20me%20interesa%20tu%20anuncio%20en%20Clasificados%20del%20Campus%3A%20%22Calculadora%20Casio%20FX-991%22'
  );
});

it('valida formulario de anuncio (título 5-80, precio >= 0, 1-4 fotos, activos < 5)', () => {
  const errTitulo = validarFormularioAnuncio(
    {
      titulo: 'abc',
      descripcion: 'Desc',
      precioPesos: 15000,
      categoria: 'libros',
      whatsapp: '3001234567',
      fotos: ['file://foto1.jpg'],
    },
    0
  );
  expect(errTitulo.valido).toBe(false);

  const errSexto = validarFormularioAnuncio(
    {
      titulo: 'Libro de Álgebra Lineal',
      descripcion: 'Buen estado',
      precioPesos: 25000,
      categoria: 'libros',
      whatsapp: '3001234567',
      fotos: ['file://foto1.jpg'],
    },
    5
  );
  expect(errSexto.valido).toBe(false);
  expect(errSexto.errores[0]).toMatch(/5 anuncios activos/i);

  const ok = validarFormularioAnuncio(
    {
      titulo: 'Libro de Álgebra Lineal',
      descripcion: 'Buen estado',
      precioPesos: 25000,
      categoria: 'libros',
      whatsapp: '3001234567',
      fotos: ['file://foto1.jpg'],
    },
    2
  );
  expect(ok.valido).toBe(true);
  expect(ok.precioCentavos).toBe(2500000);
});

it('valida casos adicionales de formulario (descripción, precio negativo, fotos y teléfono)', () => {
  const res = validarFormularioAnuncio(
    {
      titulo: 'Título válido',
      descripcion: '',
      precioPesos: -5,
      categoria: '',
      whatsapp: '123',
      fotos: [],
    },
    1
  );
  expect(res.valido).toBe(false);
  expect(res.errores.length).toBeGreaterThanOrEqual(4);
});

it('CA-4: calcula distancia Haversine y ordena anuncios más cercanos primero', () => {
  const miPos = { lat: 6.267, lng: -75.568 };
  expect(calcularDistanciaKm(6.267, -75.568, 6.267, -75.568)).toBeCloseTo(0, 3);

  const lista = [
    {
      id: 'lejos',
      titulo: 'Mueble lejos',
      precio_centavos: 5000000,
      categoria: 'muebles',
      foto_url: null,
      lat: 6.35,
      lng: -75.5,
      estado: 'activo' as const,
      guardado_en: '2026-11-10T00:00:00.000Z',
    },
    {
      id: 'cerca',
      titulo: 'Libro cerca',
      precio_centavos: 2000000,
      categoria: 'libros',
      foto_url: null,
      lat: 6.268,
      lng: -75.569,
      estado: 'activo' as const,
      guardado_en: '2026-11-09T00:00:00.000Z',
    },
    {
      id: 'sin-coords',
      titulo: 'Calculadora sin GPS',
      precio_centavos: 3000000,
      categoria: 'calculadoras',
      foto_url: null,
      lat: null,
      lng: null,
      estado: 'activo' as const,
      guardado_en: '2026-11-11T00:00:00.000Z',
    },
  ];

  const ordenados = ordenarAnunciosPorCercania(lista, miPos);
  expect(ordenados[0]?.id).toBe('cerca');
  expect(ordenados[1]?.id).toBe('lejos');
  expect(ordenados[2]?.id).toBe('sin-coords');

  const sinUbicacion = ordenarAnunciosPorCercania(lista, null);
  expect(sinUbicacion[0]?.id).toBe('sin-coords');
});

it('formatea precio en centavos a pesos colombianos y calcula parallax puro', () => {
  expect(formatearPrecioCOP(4500000)).toContain('45');
  expect(formatearPrecioCOP(0)).toBe('Gratis');

  const offset = calcularDesplazamientoParallax({ x: 1.5, y: -1.5, z: 0 }, 12);
  expect(offset.dx).toBeLessThan(0);
  expect(offset.dy).toBeGreaterThan(0);
  expect(Math.abs(offset.dx)).toBeLessThanOrEqual(12);
  expect(Math.abs(offset.dy)).toBeLessThanOrEqual(12);
});
