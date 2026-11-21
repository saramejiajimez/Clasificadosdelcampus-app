import React, { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/services/auth-context';
import {
  listarMisAnunciosCache,
  type AnuncioLocal,
} from '@/repositories/anuncios.repo';
import {
  eliminarAnuncioRemotoYLocal,
  marcarVendidoRemotoYLocal,
} from '@/services/anuncios-sync.service';
import { formatearPrecioCOP } from '@/services/validation.service';

interface MiAnuncioRowProps {
  item: AnuncioLocal;
  onOpen: () => void;
  onSold: () => void;
  onDelete: () => void;
}

function MiAnuncioRow(p: MiAnuncioRowProps): ReactNode {
  return (
    <View style={styles.itemCard}>
      <Pressable
        onPress={p.onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Abrir mi anuncio ${p.item.titulo}`}
        style={styles.itemInfo}
      >
        <Text style={styles.itemTitle}>{p.item.titulo}</Text>
        <Text style={styles.itemPrice}>
          {formatearPrecioCOP(p.item.precio_centavos)} ·{' '}
          {p.item.estado.toUpperCase()}
        </Text>
      </Pressable>
      <View style={styles.actions}>
        {p.item.estado === 'activo' ? (
          <Pressable
            onPress={p.onSold}
            accessibilityRole="button"
            accessibilityLabel={`Marcar ${p.item.titulo} como vendido`}
            style={styles.soldBtn}
          >
            <Text style={styles.soldText}>Vendido</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={p.onDelete}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar anuncio ${p.item.titulo}`}
          style={styles.deleteBtn}
        >
          <Text style={styles.deleteText}>Borrar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function useMisAnunciosData(userId: string | undefined) {
  const [misAnuncios, setMisAnuncios] = useState<AnuncioLocal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recargar = useCallback(async (): Promise<void> => {
    setCargando(true);
    setErrorMsg(null);
    try {
      setMisAnuncios(userId ? await listarMisAnunciosCache(userId) : []);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setCargando(false);
    }
  }, [userId]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const ejecutar = async (fn: () => Promise<void>): Promise<void> => {
    try {
      await fn();
      await recargar();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Fallo');
    }
  };

  return { misAnuncios, cargando, errorMsg, recargar, ejecutar };
}

export default function MisAnunciosScreen(): ReactNode {
  const router = useRouter();
  const { usuario } = useAuth();
  const d = useMisAnunciosData(usuario?.id);
  const activos = d.misAnuncios.filter((a) => a.estado === 'activo').length;

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.quotaTitle}>Anuncios activos: {activos} / 5</Text>
        <Text style={styles.quotaSubtitle}>
          Máximo 5 anuncios activos simultáneamente.
        </Text>
      </View>
      {d.errorMsg ? (
        <Pressable
          onPress={() => void d.recargar()}
          accessibilityRole="button"
          accessibilityLabel="Reintentar carga de mis anuncios"
          style={styles.errorBox}
        >
          <Text style={styles.errorText}>{d.errorMsg} · Reintentar</Text>
        </Pressable>
      ) : null}
      {d.cargando ? (
        <ActivityIndicator size="large" color="#0284c7" />
      ) : (
        <FlatList
          data={d.misAnuncios}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MiAnuncioRow
              item={item}
              onOpen={() => router.push(`/anuncio/${item.id}`)}
              onSold={() =>
                void d.ejecutar(() => marcarVendidoRemotoYLocal(item.id))
              }
              onDelete={() =>
                void d.ejecutar(() => eliminarAnuncioRemotoYLocal(item.id))
              }
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No tienes anuncios publicados.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14, backgroundColor: '#f8fafc' },
  headerCard: {
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  quotaTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  quotaSubtitle: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  errorBox: {
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: { color: '#991b1b', fontSize: 12, fontWeight: '600' },
  itemCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  itemPrice: { fontSize: 13, color: '#475569', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8 },
  soldBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  soldText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteText: { color: '#dc2626', fontSize: 12, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 32 },
});
