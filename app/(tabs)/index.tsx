import React, { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/services/auth-context';
import { AuthCard } from '@/components/AuthCard';
import { AnuncioCard } from '@/components/AnuncioCard';
import {
  listarAnunciosCache,
  type AnuncioLocal,
} from '@/repositories/anuncios.repo';
import {
  refrescarFeedYGuardarCache,
  reportarAnuncioRemoto,
} from '@/services/anuncios-sync.service';
import { ordenarAnunciosPorCercania } from '@/services/validation.service';
import { useUserLocation } from '@/sensors/useUserLocation';

const CATEGORIAS = ['todas', 'libros', 'calculadoras', 'muebles', 'otros'];

interface SelectorCatProps {
  categoria: string;
  onSelect: (v: string) => void;
}

function SelectorCategoriasFeed(p: SelectorCatProps): ReactNode {
  return (
    <View style={styles.filterRow}>
      {CATEGORIAS.map((cat) => (
        <Pressable
          key={cat}
          onPress={() => p.onSelect(cat)}
          accessibilityRole="button"
          accessibilityLabel={`Filtrar por categoría ${cat}`}
          style={[styles.chip, p.categoria === cat && styles.chipActive]}
        >
          <Text
            style={[
              styles.chipText,
              p.categoria === cat && styles.chipTextActive,
            ]}
          >
            {cat}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

interface BarraFiltrosProps {
  busqueda: string;
  onChangeBusqueda: (v: string) => void;
  categoria: string;
  onSelectCategoria: (v: string) => void;
  ordenarCercania: boolean;
  onToggleCercania: () => void;
  autenticado: boolean;
  onLogout: () => void;
  onPublicar: () => void;
}

function BarraFiltrosFeed(p: BarraFiltrosProps): ReactNode {
  return (
    <View>
      <View style={styles.topActions}>
        <TextInput
          value={p.busqueda}
          onChangeText={p.onChangeBusqueda}
          placeholder="Buscar libros, calculadoras, muebles..."
          accessibilityLabel="Buscar anuncios por palabra clave"
          style={styles.searchInput}
        />
        <Pressable
          onPress={p.onPublicar}
          accessibilityRole="button"
          accessibilityLabel="Publicar nuevo anuncio"
          style={styles.newBtn}
        >
          <Text style={styles.newBtnText}>+ Publicar</Text>
        </Pressable>
      </View>
      <SelectorCategoriasFeed
        categoria={p.categoria}
        onSelect={p.onSelectCategoria}
      />
      <View style={styles.locationBar}>
        <Pressable
          onPress={p.onToggleCercania}
          accessibilityRole="button"
          accessibilityLabel="Alternar orden por cercanía GPS o por fecha"
          style={[styles.locBtn, p.ordenarCercania && styles.locBtnActive]}
        >
          <Text style={styles.locBtnText}>
            {p.ordenarCercania ? '📍 Cercanía GPS' : '🕒 Por fecha (usar GPS)'}
          </Text>
        </Pressable>
        {p.autenticado ? (
          <Pressable
            onPress={p.onLogout}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            style={styles.logoutBtn}
          >
            <Text style={styles.logoutText}>Salir</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function useFeedAnuncios(
  autenticado: boolean,
  categoria: string,
  busqueda: string
) {
  const [anuncios, setAnuncios] = useState<AnuncioLocal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cargarDatos = useCallback(async (): Promise<void> => {
    setCargando(true);
    setErrorMsg(null);
    try {
      if (autenticado) await refrescarFeedYGuardarCache(categoria);
      setAnuncios(await listarAnunciosCache(busqueda, categoria));
    } catch (err) {
      setAnuncios(
        await listarAnunciosCache(busqueda, categoria).catch(() => [])
      );
      setErrorMsg(
        err instanceof Error
          ? `${err.message} (caché offline)`
          : 'Modo sin conexión activo'
      );
    } finally {
      setCargando(false);
    }
  }, [autenticado, categoria, busqueda]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  return { anuncios, cargando, errorMsg, cargarDatos };
}

function reportarConAlerta(id: string): void {
  void reportarAnuncioRemoto(id, 'Reportado desde el feed del campus')
    .then(() =>
      Alert.alert('Reporte enviado', 'Gracias por ayudar a moderar el campus.')
    )
    .catch((err) =>
      Alert.alert('Aviso', err instanceof Error ? err.message : 'Intenta luego')
    );
}

interface ListaAnunciosFeedProps {
  cargando: boolean;
  lista: (AnuncioLocal & { distanciaKm: number | null })[];
  onOpen: (id: string) => void;
}

function ListaAnunciosFeed(p: ListaAnunciosFeedProps): ReactNode {
  if (p.cargando) {
    return (
      <ActivityIndicator size="large" color="#0284c7" style={styles.loader} />
    );
  }
  return (
    <FlatList
      data={p.lista}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <AnuncioCard
          anuncio={item}
          onPress={() => p.onOpen(item.id)}
          onReportar={reportarConAlerta}
        />
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>No hay anuncios en esta categoría.</Text>
      }
    />
  );
}

export default function FeedScreen(): ReactNode {
  const router = useRouter();
  const { usuario, cerrarSesion } = useAuth();
  const { ubicacion, avisoUbicacion, solicitarUbicacion } = useUserLocation();
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [ordenarCercania, setOrdenarCercania] = useState(false);

  const f = useFeedAnuncios(Boolean(usuario), categoria, busqueda);
  const lista = ordenarAnunciosPorCercania(
    f.anuncios,
    ordenarCercania ? ubicacion : null
  );

  const toggleGps = (): void => {
    if (!ordenarCercania) void solicitarUbicacion();
    setOrdenarCercania((p) => !p);
  };

  return (
    <View style={styles.container}>
      {!usuario ? <AuthCard /> : null}
      <BarraFiltrosFeed
        busqueda={busqueda}
        onChangeBusqueda={setBusqueda}
        categoria={categoria}
        onSelectCategoria={setCategoria}
        ordenarCercania={ordenarCercania}
        onToggleCercania={toggleGps}
        autenticado={Boolean(usuario)}
        onLogout={() => void cerrarSesion()}
        onPublicar={() => router.push('/anuncio/nuevo')}
      />
      {avisoUbicacion ? (
        <Text style={styles.notice}>{avisoUbicacion}</Text>
      ) : null}
      {f.errorMsg ? (
        <Pressable onPress={() => void f.cargarDatos()} style={styles.errorBox}>
          <Text style={styles.errorText}>{f.errorMsg} · Reintentar</Text>
        </Pressable>
      ) : null}
      <ListaAnunciosFeed
        cargando={f.cargando}
        lista={lista}
        onOpen={(id) => router.push(`/anuncio/${id}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14, backgroundColor: '#f8fafc' },
  topActions: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  searchInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  newBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 8,
  },
  newBtnText: { color: '#ffffff', fontWeight: '700' },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#0f172a' },
  chipText: { fontSize: 12, color: '#334155', fontWeight: '600' },
  chipTextActive: { color: '#ffffff' },
  locationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  locBtnActive: { backgroundColor: '#d1fae5' },
  locBtnText: { fontSize: 12, fontWeight: '700', color: '#0f172a' },
  logoutBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  logoutText: { color: '#dc2626', fontWeight: '700' },
  notice: { fontSize: 12, color: '#b45309', marginBottom: 8 },
  errorBox: {
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: { color: '#991b1b', fontSize: 12, fontWeight: '600' },
  loader: { marginTop: 32 },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 32 },
});
