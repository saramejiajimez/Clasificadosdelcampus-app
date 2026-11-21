import React, { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AnuncioCard } from '@/components/AnuncioCard';
import {
  listarAnunciosFavoritosOffline,
  toggleFavoritoLocal,
} from '@/repositories/favoritos.repo';
import type { AnuncioLocal } from '@/repositories/anuncios.repo';
import {
  ejecutarSincronizacionFavoritos,
  reportarAnuncioRemoto,
} from '@/services/anuncios-sync.service';

function useFavoritosOffline() {
  const [favoritos, setFavoritos] = useState<AnuncioLocal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [avisoSync, setAvisoSync] = useState<string | null>(null);

  const cargarLocales = useCallback(async (): Promise<void> => {
    setCargando(true);
    try {
      setFavoritos(await listarAnunciosFavoritosOffline());
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarLocales();
  }, [cargarLocales]);

  const sincronizar = async (): Promise<void> => {
    setSincronizando(true);
    setAvisoSync(null);
    try {
      await ejecutarSincronizacionFavoritos();
      await cargarLocales();
      setAvisoSync('Favoritos sincronizados con el servidor.');
    } catch {
      setAvisoSync('Sin conexión: viendo favoritos guardados en SQLite.');
    } finally {
      setSincronizando(false);
    }
  };

  return {
    favoritos,
    cargando,
    sincronizando,
    avisoSync,
    cargarLocales,
    sincronizar,
  };
}

interface ItemFavoritoProps {
  item: AnuncioLocal;
  onOpen: () => void;
  onQuitar: () => void;
}

function ItemFavorito(p: ItemFavoritoProps): ReactNode {
  return (
    <View>
      <AnuncioCard
        anuncio={p.item}
        onPress={p.onOpen}
        onReportar={(id) =>
          void reportarAnuncioRemoto(id, 'Reporte desde favoritos')
        }
      />
      <Pressable
        onPress={p.onQuitar}
        accessibilityRole="button"
        accessibilityLabel={`Quitar ${p.item.titulo} de favoritos`}
        style={styles.removeBtn}
      >
        <Text style={styles.removeText}>Quitar de favoritos</Text>
      </Pressable>
    </View>
  );
}

export default function FavoritosScreen(): ReactNode {
  const router = useRouter();
  const s = useFavoritosOffline();

  const quitarFavorito = async (id: string): Promise<void> => {
    await toggleFavoritoLocal(id);
    await s.cargarLocales();
  };

  return (
    <View style={styles.container}>
      <View style={styles.syncRow}>
        <Text style={styles.offlineBadge}>📦 SQLite Offline</Text>
        <Pressable
          onPress={() => void s.sincronizar()}
          disabled={s.sincronizando}
          accessibilityRole="button"
          accessibilityLabel="Sincronizar favoritos con la nube"
          style={styles.syncBtn}
        >
          <Text style={styles.syncBtnText}>
            {s.sincronizando ? 'Sincronizando...' : '🔄 Sincronizar'}
          </Text>
        </Pressable>
      </View>
      {s.avisoSync ? <Text style={styles.notice}>{s.avisoSync}</Text> : null}
      {s.cargando ? (
        <ActivityIndicator size="large" color="#0284c7" />
      ) : (
        <FlatList
          data={s.favoritos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemFavorito
              item={item}
              onOpen={() => router.push(`/anuncio/${item.id}`)}
              onQuitar={() => void quitarFavorito(item.id)}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No tienes favoritos todavía.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14, backgroundColor: '#f8fafc' },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  offlineBadge: { fontSize: 12, fontWeight: '700', color: '#0f172a' },
  syncBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  syncBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  notice: { fontSize: 12, color: '#0369a1', marginBottom: 8 },
  removeBtn: {
    alignSelf: 'flex-end',
    marginTop: -6,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  removeText: { fontSize: 12, color: '#dc2626', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 32 },
});
