import React, { type ReactNode } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export interface SelectorFotosProps {
  fotos: string[];
  onCamara: () => void;
  onGaleria: () => void;
}

export function SelectorFotos(p: SelectorFotosProps): ReactNode {
  return (
    <View>
      <Text style={styles.label}>Fotos ({p.fotos.length} / 4)</Text>
      <View style={styles.photoBtns}>
        <Pressable
          onPress={p.onCamara}
          accessibilityRole="button"
          accessibilityLabel="Tomar foto con la cámara"
          style={styles.photoBtn}
        >
          <Text style={styles.photoBtnText}>📷 Cámara</Text>
        </Pressable>
        <Pressable
          onPress={p.onGaleria}
          accessibilityRole="button"
          accessibilityLabel="Seleccionar fotos desde la galería"
          style={styles.photoBtn}
        >
          <Text style={styles.photoBtnText}>🖼️ Galería</Text>
        </Pressable>
      </View>
      <View style={styles.previewRow}>
        {p.fotos.map((uri, i) => (
          <Image key={i} source={{ uri }} style={styles.previewThumb} />
        ))}
      </View>
    </View>
  );
}

export interface CamposTextoProps {
  titulo: string;
  onTitulo: (v: string) => void;
  descripcion: string;
  onDescripcion: (v: string) => void;
  precioTexto: string;
  onPrecio: (v: string) => void;
  whatsapp: string;
  onWhatsapp: (v: string) => void;
}

export function CamposTextoAnuncio(p: CamposTextoProps): ReactNode {
  return (
    <>
      <Text style={styles.label}>Título (5 a 80 caracteres)</Text>
      <TextInput
        value={p.titulo}
        onChangeText={p.onTitulo}
        placeholder="Ej. Calculadora científica Casio FX-991"
        accessibilityLabel="Título del anuncio"
        style={styles.input}
      />
      <Text style={styles.label}>Descripción</Text>
      <TextInput
        value={p.descripcion}
        onChangeText={p.onDescripcion}
        placeholder="Estado, edición, lugar de entrega..."
        multiline
        accessibilityLabel="Descripción del anuncio"
        style={[styles.input, styles.textArea]}
      />
      <Text style={styles.label}>Precio en pesos (COP)</Text>
      <TextInput
        value={p.precioTexto}
        onChangeText={p.onPrecio}
        placeholder="Ej. 45000"
        keyboardType="numeric"
        accessibilityLabel="Precio en pesos colombianos"
        style={styles.input}
      />
      <Text style={styles.label}>WhatsApp (10 dígitos, inicia en 3)</Text>
      <TextInput
        value={p.whatsapp}
        onChangeText={p.onWhatsapp}
        placeholder="3001234567"
        keyboardType="phone-pad"
        maxLength={10}
        accessibilityLabel="Número de WhatsApp de 10 dígitos"
        style={styles.input}
      />
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '700', color: '#0f172a', marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: { minHeight: 75, textAlignVertical: 'top' },
  photoBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  photoBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  photoBtnText: { color: '#ffffff', fontWeight: '600' },
  previewRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  previewThumb: { width: 64, height: 64, borderRadius: 8 },
});
