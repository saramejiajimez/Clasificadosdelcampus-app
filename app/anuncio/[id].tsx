import React, { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PhotoGallery } from '@/components/PhotoGallery';
import {
  obtenerAnuncioCachePorId,
  type AnuncioLocal,
} from '@/repositories/anuncios.repo';
import {
  esFavoritoLocal,
  toggleFavoritoLocal,
} from '@/repositories/favoritos.repo';
import {
  construirEnlaceWhatsApp,
  formatearPrecioCOP,
} from '@/services/validation.service';
import { dispararHapticFavorito } from '@/sensors/haptics';
import {
  ocultarAnuncioComoAdmin,
  reportarAnuncioRemoto,
} from '@/services/anuncios-sync.service';
import { useAuth } from '@/services/auth-context';

function abrirWhatsAppAnuncio(anuncio: AnuncioLocal): void {
  const url = construirEnlaceWhatsApp(anuncio.whatsapp, anuncio.titulo);
  void Linking.openURL(url).catch(() =>
    Alert.alert('Error', 'No se pudo abrir WhatsApp.')
  );
}

function reportarDesdeDetalle(id: string): void {
  void reportarAnuncioRemoto(id, 'Reportado desde detalle')
    .then(() => Alert.alert('Reporte registrado', 'Será revisado por admin.'))
    .catch((e) =>
      Alert.alert('Aviso', e instanceof Error ? e.message : 'Error')
    );
}

function ocultarDesdeDetalle(id: string, onAfterHide: () => void): void {
  void ocultarAnuncioComoAdmin(id)
    .then(() => {
      Alert.alert('Anuncio oculto', 'Ya no aparece en el feed.');
      onAfterHide();
    })
    .catch((e) =>
      Alert.alert('Error', e instanceof Error ? e.message : 'No autorizado')
    );
}

interface BotonesAccionProps {
  anuncio: AnuncioLocal;
  esAdmin: boolean;
  onAfterHide: () => void;
}

function BotonesAccionDetalle(p: BotonesAccionProps): ReactNode {
  return (
    <View>
      <Pressable
        onPress={() => abrirWhatsAppAnuncio(p.anuncio)}
        accessibilityRole="button"
        accessibilityLabel={`Contactar por WhatsApp al vendedor de ${p.anuncio.titulo}`}
        style={styles.waBtn}
      >
        <Text style={styles.waBtnText}>
          💬 Contactar por WhatsApp (+57 {p.anuncio.whatsapp})
        </Text>
      </Pressable>
      <Pressable
        onPress={() => reportarDesdeDetalle(p.anuncio.id)}
        accessibilityRole="button"
        accessibilityLabel="Reportar este anuncio"
        style={styles.reportBtn}
      >
        <Text style={styles.reportText}>🚩 Reportar anuncio</Text>
      </Pressable>
      {p.esAdmin ? (
        <Pressable
          onPress={() => ocultarDesdeDetalle(p.anuncio.id, p.onAfterHide)}
          accessibilityRole="button"
          accessibilityLabel="Administrador: ocultar anuncio reportado"
          style={styles.adminBtn}
        >
          <Text style={styles.adminBtnText}>
            🛡️ Ocultar anuncio (Admin · {p.anuncio.reportes} reportes)
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function useDetalleAnuncio(id: string | undefined) {
  const [anuncio, setAnuncio] = useState<AnuncioLocal | null>(null);
  const [favorito, setFavorito] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async (): Promise<void> => {
    if (!id) {
      setCargando(false);
      return;
    }
    setCargando(true);
    try {
      setAnuncio(await obtenerAnuncioCachePorId(id));
      setFavorito(await esFavoritoLocal(id));
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const alternarFavorito = async (): Promise<void> => {
    if (!anuncio) return;
    await dispararHapticFavorito();
    setFavorito(await toggleFavoritoLocal(anuncio.id));
  };

  return { anuncio, favorito, cargando, alternarFavorito };
}

function resolverFotosAnuncio(anuncio: AnuncioLocal): string[] {
  if (anuncio.fotos.length > 0) return anuncio.fotos;
  return anuncio.foto_url ? [anuncio.foto_url] : [];
}

export default function DetalleAnuncioScreen(): ReactNode {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { usuario } = useAuth();
  const { anuncio, favorito, cargando, alternarFavorito } =
    useDetalleAnuncio(id);

  if (cargando) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }
  if (!anuncio) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Anuncio no encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <PhotoGallery
        fotos={resolverFotosAnuncio(anuncio)}
        esFavorito={favorito}
        onToggleFavorito={() => void alternarFavorito()}
      />
      <Text style={styles.title}>{anuncio.titulo}</Text>
      <Text style={styles.price}>
        {formatearPrecioCOP(anuncio.precio_centavos)}
      </Text>
      <Text style={styles.meta}>
        Categoría: {anuncio.categoria} · Estado: {anuncio.estado}
      </Text>
      <Text style={styles.description}>{anuncio.descripcion}</Text>
      <BotonesAccionDetalle
        anuncio={anuncio}
        esAdmin={usuario?.rol === 'admin'}
        onAfterHide={() => router.back()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f8fafc' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { color: '#64748b', fontSize: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  price: { fontSize: 20, fontWeight: '700', color: '#0284c7', marginTop: 4 },
  meta: { fontSize: 13, color: '#475569', marginTop: 4, marginBottom: 12 },
  description: {
    fontSize: 15,
    color: '#1e293b',
    lineHeight: 22,
    marginBottom: 20,
  },
  waBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  waBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  reportBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  reportText: { color: '#dc2626', fontWeight: '700' },
  adminBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 24,
  },
  adminBtnText: { color: '#ffffff', fontWeight: '700' },
});
