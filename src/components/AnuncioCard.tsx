import React, { type ReactNode } from 'react';
import {
  Alert,
  Image,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  construirEnlaceWhatsApp,
  formatearPrecioCOP,
} from '@/services/validation.service';

export interface AnuncioCardItem {
  id: string;
  titulo: string;
  precio_centavos: number;
  categoria: string;
  foto_url: string | null;
  whatsapp: string;
  estado: 'activo' | 'vendido' | 'oculto';
  distanciaKm?: number | null;
}

export interface AnuncioCardProps {
  anuncio: AnuncioCardItem;
  onPress: () => void;
  onReportar: (id: string) => void;
}

function mostrarDialogoAnuncio(
  anuncio: AnuncioCardItem,
  onReportar: (id: string) => void
): void {
  const enlace = construirEnlaceWhatsApp(anuncio.whatsapp, anuncio.titulo);
  Alert.alert(anuncio.titulo, 'Selecciona una acción para este anuncio:', [
    {
      text: 'Compartir anuncio',
      onPress: () => {
        void Share.share({
          message: `${anuncio.titulo} (${formatearPrecioCOP(anuncio.precio_centavos)}) - ${enlace}`,
        }).catch(() => undefined);
      },
    },
    {
      text: 'Reportar anuncio',
      style: 'destructive',
      onPress: () => onReportar(anuncio.id),
    },
    { text: 'Cancelar', style: 'cancel' },
  ]);
}

function ContenidoTarjeta({
  anuncio,
}: {
  anuncio: AnuncioCardItem;
}): ReactNode {
  return (
    <>
      {anuncio.foto_url ? (
        <Image source={{ uri: anuncio.foto_url }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Text style={styles.thumbPlaceholderText}>📷</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {anuncio.titulo}
        </Text>
        <Text style={styles.price}>
          {formatearPrecioCOP(anuncio.precio_centavos)}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.badge}>{anuncio.categoria}</Text>
          {typeof anuncio.distanciaKm === 'number' ? (
            <Text style={styles.distance}>
              📍 {anuncio.distanciaKm.toFixed(1)} km
            </Text>
          ) : null}
        </View>
      </View>
    </>
  );
}

export function AnuncioCard({
  anuncio,
  onPress,
  onReportar,
}: AnuncioCardProps): ReactNode {
  const abrirMenu = (): void => mostrarDialogoAnuncio(anuncio, onReportar);
  const gestoLongPress = Gesture.LongPress()
    .minDuration(450)
    .onStart(abrirMenu);

  return (
    <GestureDetector gesture={gestoLongPress}>
      <View style={styles.card}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`Ver detalle de ${anuncio.titulo}`}
          style={styles.mainArea}
        >
          <ContenidoTarjeta anuncio={anuncio} />
        </Pressable>

        <Pressable
          onPress={abrirMenu}
          accessibilityRole="button"
          accessibilityLabel={`Opciones para ${anuncio.titulo}: reportar o compartir`}
          style={styles.menuBtn}
        >
          <Text style={styles.menuBtnText}>⋮</Text>
        </Pressable>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mainArea: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  thumbPlaceholderText: { fontSize: 22 },
  info: { flex: 1, marginLeft: 12 },
  title: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  price: { fontSize: 15, fontWeight: '700', color: '#0284c7', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  badge: {
    fontSize: 12,
    color: '#334155',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  distance: { fontSize: 12, color: '#059669', fontWeight: '600' },
  menuBtn: { paddingHorizontal: 10, paddingVertical: 8 },
  menuBtnText: { fontSize: 20, fontWeight: '700', color: '#475569' },
});
