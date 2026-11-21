import { useCallback, useState } from 'react';
import * as Location from 'expo-location';
import type { Coordenadas } from '@/services/validation.service';

async function obtenerCoordenadasConPermiso(): Promise<{
  coords: Coordenadas | null;
  aviso: string | null;
}> {
  const serviciosActivos = await Location.hasServicesEnabledAsync();
  if (!serviciosActivos) {
    return {
      coords: null,
      aviso: 'El GPS está desactivado. Ordenando anuncios por fecha.',
    };
  }
  const permiso = await Location.requestForegroundPermissionsAsync();
  if (permiso.status !== 'granted') {
    return {
      coords: null,
      aviso: 'Permiso de ubicación no concedido. Ordenando por fecha.',
    };
  }
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
    aviso: null,
  };
}

export function useUserLocation(): {
  ubicacion: Coordenadas | null;
  cargandoUbicacion: boolean;
  avisoUbicacion: string | null;
  solicitarUbicacion: () => Promise<Coordenadas | null>;
} {
  const [ubicacion, setUbicacion] = useState<Coordenadas | null>(null);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false);
  const [avisoUbicacion, setAvisoUbicacion] = useState<string | null>(null);

  const solicitarUbicacion =
    useCallback(async (): Promise<Coordenadas | null> => {
      setCargandoUbicacion(true);
      setAvisoUbicacion(null);
      try {
        const res = await obtenerCoordenadasConPermiso();
        setAvisoUbicacion(res.aviso);
        if (res.coords) {
          setUbicacion(res.coords);
        }
        return res.coords;
      } catch {
        setAvisoUbicacion('No se pudo obtener ubicación. Ordenando por fecha.');
        return null;
      } finally {
        setCargandoUbicacion(false);
      }
    }, []);

  return { ubicacion, cargandoUbicacion, avisoUbicacion, solicitarUbicacion };
}
