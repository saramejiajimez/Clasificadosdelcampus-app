import React, { useState, type ReactNode } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { useAuth } from '@/services/auth-context';
import { listarMisAnunciosCache } from '@/repositories/anuncios.repo';
import {
  validarFormularioAnuncio,
  type Coordenadas,
} from '@/services/validation.service';
import { subirFotoComprimida } from '@/services/image.service';
import { publicarAnuncioRemotoYLocal } from '@/services/anuncios-sync.service';
import { useUserLocation } from '@/sensors/useUserLocation';
import {
  CamposTextoAnuncio,
  SelectorFotos,
} from '@/components/AnuncioFormFields';

const CATEGORIAS_FORM = ['libros', 'calculadoras', 'muebles', 'otros'];

function generarUuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function capturarDesdeCamara(actuales: string[]): Promise<string[]> {
  if (actuales.length >= 4) return actuales;
  const permiso = await Camera.requestCameraPermissionsAsync();
  if (permiso.status !== 'granted') {
    Alert.alert('Permiso denegado', 'Usa la galería como alternativa.');
    return actuales;
  }
  const res = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });
  const uri = res.assets?.[0]?.uri;
  return !res.canceled && uri ? [...actuales, uri].slice(0, 4) : actuales;
}

async function seleccionarDesdeGaleria(actuales: string[]): Promise<string[]> {
  if (actuales.length >= 4) return actuales;
  const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permiso.status !== 'granted') return actuales;
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: 4 - actuales.length,
    quality: 0.8,
  });
  if (res.canceled || !res.assets) return actuales;
  return [...actuales, ...res.assets.map((a) => a.uri)].slice(0, 4);
}

interface DatosEnvioAnuncio {
  userId: string | undefined;
  titulo: string;
  descripcion: string;
  precioTexto: string;
  categoria: string;
  whatsapp: string;
  fotosLocales: string[];
  obtenerCoords: () => Promise<Coordenadas | null>;
}

async function enviarNuevoAnuncio(d: DatosEnvioAnuncio): Promise<string[]> {
  const mis = d.userId ? await listarMisAnunciosCache(d.userId) : [];
  const activosCount = mis.filter((a) => a.estado === 'activo').length;
  const val = validarFormularioAnuncio(
    {
      titulo: d.titulo,
      descripcion: d.descripcion,
      precioPesos: Number(d.precioTexto),
      categoria: d.categoria,
      whatsapp: d.whatsapp,
      fotos: d.fotosLocales,
    },
    activosCount
  );
  if (!val.valido) return val.errores;

  const coords = await d.obtenerCoords();
  const urls: string[] = [];
  for (const uri of d.fotosLocales) urls.push(await subirFotoComprimida(uri));
  await publicarAnuncioRemotoYLocal({
    id: generarUuidV4(),
    titulo: d.titulo.trim(),
    descripcion: d.descripcion.trim(),
    precio_centavos: val.precioCentavos,
    categoria: d.categoria,
    fotos: urls,
    whatsapp: d.whatsapp.trim(),
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
  });
  return [];
}

interface ChipsCategoriaProps {
  categoria: string;
  onSelect: (c: string) => void;
}

function ChipsCategoriaForm(p: ChipsCategoriaProps): ReactNode {
  return (
    <View style={styles.catRow}>
      {CATEGORIAS_FORM.map((c) => (
        <Pressable
          key={c}
          onPress={() => p.onSelect(c)}
          accessibilityRole="button"
          accessibilityLabel={`Seleccionar categoría ${c}`}
          style={[styles.catChip, p.categoria === c && styles.catChipActive]}
        >
          <Text style={styles.catText}>{c}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function useNuevoAnuncioForm() {
  const router = useRouter();
  const { usuario } = useAuth();
  const { ubicacion, solicitarUbicacion } = useUserLocation();
  const [campos, setCampos] = useState({
    titulo: '',
    descripcion: '',
    precioTexto: '',
    categoria: 'libros',
    whatsapp: '',
  });
  const [fotosLocales, setFotosLocales] = useState<string[]>([]);
  const [publicando, setPublicando] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);

  const guardar = async (): Promise<void> => {
    setPublicando(true);
    try {
      const errs = await enviarNuevoAnuncio({
        userId: usuario?.id,
        ...campos,
        fotosLocales,
        obtenerCoords: async () => ubicacion ?? (await solicitarUbicacion()),
      });
      setErrores(errs);
      if (errs.length === 0) router.replace('/(tabs)');
    } catch (err) {
      setErrores([err instanceof Error ? err.message : 'Error al publicar']);
    } finally {
      setPublicando(false);
    }
  };

  return {
    campos,
    setCampos,
    fotosLocales,
    setFotosLocales,
    publicando,
    errores,
    guardar,
  };
}

export default function NuevoAnuncioScreen(): ReactNode {
  const f = useNuevoAnuncioForm();
  const setCampo = (k: keyof typeof f.campos, v: string): void =>
    f.setCampos((p) => ({ ...p, [k]: v }));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {f.errores.map((e, i) => (
        <Text key={i} style={styles.errorText}>{`• ${e}`}</Text>
      ))}
      <CamposTextoAnuncio
        titulo={f.campos.titulo}
        onTitulo={(v) => setCampo('titulo', v)}
        descripcion={f.campos.descripcion}
        onDescripcion={(v) => setCampo('descripcion', v)}
        precioTexto={f.campos.precioTexto}
        onPrecio={(v) => setCampo('precioTexto', v)}
        whatsapp={f.campos.whatsapp}
        onWhatsapp={(v) => setCampo('whatsapp', v)}
      />
      <Text style={styles.label}>Categoría</Text>
      <ChipsCategoriaForm
        categoria={f.campos.categoria}
        onSelect={(v) => setCampo('categoria', v)}
      />
      <SelectorFotos
        fotos={f.fotosLocales}
        onCamara={() =>
          void capturarDesdeCamara(f.fotosLocales).then(f.setFotosLocales)
        }
        onGaleria={() =>
          void seleccionarDesdeGaleria(f.fotosLocales).then(f.setFotosLocales)
        }
      />
      <Pressable
        onPress={() => void f.guardar()}
        disabled={f.publicando}
        accessibilityRole="button"
        accessibilityLabel="Publicar anuncio ahora"
        style={styles.submitBtn}
      >
        <Text style={styles.submitText}>
          {f.publicando ? 'Publicando...' : 'Publicar anuncio'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f8fafc' },
  errorText: { color: '#dc2626', fontWeight: '600', marginBottom: 4 },
  label: { fontWeight: '700', color: '#0f172a', marginTop: 8, marginBottom: 4 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  catChipActive: { backgroundColor: '#bae6fd' },
  catText: { color: '#0f172a', fontWeight: '600' },
  submitBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  submitText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
});
