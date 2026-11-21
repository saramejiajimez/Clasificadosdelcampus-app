import { useEffect, useState } from 'react';
import { Gyroscope } from 'expo-sensors';
import {
  calcularDesplazamientoParallax,
  type ParallaxOffset,
} from '@/sensors/parallax-math';

export function useParallaxMotion(enabled = true): {
  offset: ParallaxOffset;
  disponible: boolean;
} {
  const [offset, setOffset] = useState<ParallaxOffset>({ dx: 0, dy: 0 });
  const [disponible, setDisponible] = useState(false);

  useEffect(() => {
    let sub: { remove: () => void } | null = null;
    let cancelado = false;

    async function iniciarSensor(): Promise<void> {
      if (!enabled) {
        return;
      }
      try {
        const ok = await Gyroscope.isAvailableAsync();
        if (cancelado || !ok) {
          setDisponible(false);
          return;
        }
        setDisponible(true);
        Gyroscope.setUpdateInterval(100);
        sub = Gyroscope.addListener((reading) => {
          setOffset(calcularDesplazamientoParallax(reading, 10));
        });
      } catch {
        setDisponible(false);
      }
    }

    void iniciarSensor();

    return () => {
      cancelado = true;
      if (sub) {
        sub.remove();
      }
    };
  }, [enabled]);

  return { offset, disponible };
}
