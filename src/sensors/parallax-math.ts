export interface GyroReading {
  x: number;
  y: number;
  z: number;
}

export interface ParallaxOffset {
  dx: number;
  dy: number;
}

export function calcularDesplazamientoParallax(
  lectura: GyroReading,
  maxOffsetPx = 12
): ParallaxOffset {
  const clamp = (val: number): number =>
    Math.max(-maxOffsetPx, Math.min(maxOffsetPx, val));

  const dx = clamp(-lectura.x * 8);
  const dy = clamp(-lectura.y * 8);
  return { dx, dy };
}
