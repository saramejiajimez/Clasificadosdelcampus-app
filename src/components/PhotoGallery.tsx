import React, { useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useParallaxMotion } from '@/sensors/useParallaxMotion';

export interface PhotoGalleryProps {
  fotos: string[];
  esFavorito: boolean;
  onToggleFavorito: () => void;
}

function crearGestosGaleria(
  irSiguiente: () => void,
  irAnterior: () => void,
  setZoomActivo: (v: boolean) => void,
  onToggleFavorito: () => void
) {
  const pan = Gesture.Pan().onEnd((e) => {
    if (e.translationX < -40) irSiguiente();
    else if (e.translationX > 40) irAnterior();
  });
  const pinch = Gesture.Pinch().onEnd((e) => setZoomActivo(e.scale > 1.15));
  const tap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => onToggleFavorito());
  return Gesture.Simultaneous(pan, pinch, tap);
}

function BarraNavegacionFotos({
  indice,
  total,
  onAnterior,
  onSiguiente,
}: {
  indice: number;
  total: number;
  onAnterior: () => void;
  onSiguiente: () => void;
}): ReactNode {
  return (
    <View style={styles.controlsRow}>
      <Pressable
        onPress={onAnterior}
        disabled={indice === 0}
        accessibilityRole="button"
        accessibilityLabel="Foto anterior"
        style={[styles.btn, indice === 0 && styles.btnDisabled]}
      >
        <Text style={styles.btnText}>◀ Anterior</Text>
      </Pressable>
      <Text style={styles.counterText}>
        {indice + 1} / {total}
      </Text>
      <Pressable
        onPress={onSiguiente}
        disabled={indice >= total - 1}
        accessibilityRole="button"
        accessibilityLabel="Siguiente foto"
        style={[styles.btn, indice >= total - 1 && styles.btnDisabled]}
      >
        <Text style={styles.btnText}>Siguiente ▶</Text>
      </Pressable>
    </View>
  );
}

function AccionesAccesibilidadGaleria({
  zoomActivo,
  esFavorito,
  onToggleZoom,
  onToggleFavorito,
}: {
  zoomActivo: boolean;
  esFavorito: boolean;
  onToggleZoom: () => void;
  onToggleFavorito: () => void;
}): ReactNode {
  return (
    <View style={styles.accessibilityActions}>
      <Pressable
        onPress={onToggleZoom}
        accessibilityRole="button"
        accessibilityLabel="Alternar zoom de la foto"
        style={styles.actionChip}
      >
        <Text style={styles.actionChipText}>
          {zoomActivo ? '🔍 Reducir zoom' : '🔍 Ampliar foto'}
        </Text>
      </Pressable>
      <Pressable
        onPress={onToggleFavorito}
        accessibilityRole="button"
        accessibilityLabel="Alternar favorito"
        style={[styles.actionChip, esFavorito && styles.favChipActive]}
      >
        <Text style={styles.actionChipText}>
          {esFavorito ? '❤️ En favoritos' : '🤍 Favorito'}
        </Text>
      </Pressable>
    </View>
  );
}

function VisorImagenParallax({
  url,
  zoomActivo,
  dx,
  dy,
}: {
  url: string;
  zoomActivo: boolean;
  dx: number;
  dy: number;
}): ReactNode {
  if (!url) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Sin imagen</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri: url }}
      style={[
        styles.image,
        {
          transform: [
            { scale: zoomActivo ? 1.5 : 1 },
            { translateX: dx },
            { translateY: dy },
          ],
        },
      ]}
      resizeMode="cover"
    />
  );
}

export function PhotoGallery({
  fotos,
  esFavorito,
  onToggleFavorito,
}: PhotoGalleryProps): ReactNode {
  const listaFotos = fotos.length > 0 ? fotos : [''];
  const [indice, setIndice] = useState(0);
  const [zoomActivo, setZoomActivo] = useState(false);
  const { offset } = useParallaxMotion(indice === 0 && !zoomActivo);

  const irAnterior = (): void => setIndice((p) => (p > 0 ? p - 1 : p));
  const irSiguiente = (): void =>
    setIndice((p) => (p < listaFotos.length - 1 ? p + 1 : p));

  const gestos = crearGestosGaleria(
    irSiguiente,
    irAnterior,
    setZoomActivo,
    onToggleFavorito
  );

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gestos}>
        <View style={styles.imageWrapper}>
          <VisorImagenParallax
            url={listaFotos[indice] ?? ''}
            zoomActivo={zoomActivo}
            dx={offset.dx}
            dy={offset.dy}
          />
        </View>
      </GestureDetector>
      <BarraNavegacionFotos
        indice={indice}
        total={listaFotos.length}
        onAnterior={irAnterior}
        onSiguiente={irSiguiente}
      />
      <AccionesAccesibilidadGaleria
        zoomActivo={zoomActivo}
        esFavorito={esFavorito}
        onToggleZoom={() => setZoomActivo((p) => !p)}
        onToggleFavorito={onToggleFavorito}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  imageWrapper: {
    height: 260,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#64748b' },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  counterText: { fontWeight: '700', color: '#334155' },
  accessibilityActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  actionChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  favChipActive: { backgroundColor: '#fee2e2', borderColor: '#f87171' },
  actionChipText: { fontWeight: '600', color: '#0f172a', fontSize: 13 },
});
