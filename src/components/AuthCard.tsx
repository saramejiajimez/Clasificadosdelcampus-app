import React, { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '@/services/auth-context';

async function ejecutarAccionAuth(
  modoRegistro: boolean,
  email: string,
  password: string,
  iniciarSesion: (e: string, p: string) => Promise<void>,
  registrarse: (e: string, p: string) => Promise<void>
): Promise<string | null> {
  if (!email.trim() || password.length < 8) {
    return 'Ingresa un correo válido y contraseña de al menos 8 caracteres.';
  }
  try {
    if (modoRegistro) await registrarse(email.trim(), password);
    else await iniciarSesion(email.trim(), password);
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : 'No se pudo autenticar';
  }
}

interface CredencialesProps {
  email: string;
  onEmail: (v: string) => void;
  password: string;
  onPassword: (v: string) => void;
}

function CamposCredenciales(p: CredencialesProps): ReactNode {
  return (
    <>
      <TextInput
        value={p.email}
        onChangeText={p.onEmail}
        placeholder="Correo universitario"
        autoCapitalize="none"
        keyboardType="email-address"
        accessibilityLabel="Correo electrónico"
        style={styles.input}
      />
      <TextInput
        value={p.password}
        onChangeText={p.onPassword}
        placeholder="Contraseña (mínimo 8 caracteres)"
        secureTextEntry
        accessibilityLabel="Contraseña"
        style={styles.input}
      />
    </>
  );
}

interface BotonesAuthProps {
  modoRegistro: boolean;
  cargando: boolean;
  onSubmit: () => void;
  onToggleModo: () => void;
}

function BotonesAuth(p: BotonesAuthProps): ReactNode {
  return (
    <>
      <Pressable
        onPress={p.onSubmit}
        disabled={p.cargando}
        accessibilityRole="button"
        accessibilityLabel={p.modoRegistro ? 'Registrarse' : 'Entrar'}
        style={styles.submitBtn}
      >
        {p.cargando ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.submitText}>
            {p.modoRegistro ? 'Registrarme' : 'Iniciar sesión'}
          </Text>
        )}
      </Pressable>
      <Pressable
        onPress={p.onToggleModo}
        accessibilityRole="button"
        accessibilityLabel="Cambiar entre inicio de sesión y registro"
        style={styles.switchBtn}
      >
        <Text style={styles.switchText}>
          {p.modoRegistro
            ? '¿Ya tienes cuenta? Inicia sesión'
            : '¿No tienes cuenta? Regístrate aquí'}
        </Text>
      </Pressable>
    </>
  );
}

export function AuthCard(): ReactNode {
  const { iniciarSesion, registrarse } = useAuth();
  const [modoRegistro, setModoRegistro] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onSubmit = async (): Promise<void> => {
    setCargando(true);
    setErrorMsg(
      await ejecutarAccionAuth(
        modoRegistro,
        email,
        password,
        iniciarSesion,
        registrarse
      )
    );
    setCargando(false);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {modoRegistro ? 'Crear cuenta estudiantil' : 'Iniciar sesión'}
      </Text>
      <Text style={styles.subtitle}>
        El feed y el WhatsApp de los vendedores requieren sesión activa.
      </Text>
      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
      <CamposCredenciales
        email={email}
        onEmail={setEmail}
        password={password}
        onPassword={setPassword}
      />
      <BotonesAuth
        modoRegistro={modoRegistro}
        cargando={cargando}
        onSubmit={() => void onSubmit()}
        onToggleModo={() => setModoRegistro((p) => !p)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginVertical: 12,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#475569', marginTop: 4, marginBottom: 12 },
  error: { color: '#dc2626', marginBottom: 10, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
  },
  submitBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitText: { color: '#ffffff', fontWeight: '700' },
  switchBtn: { marginTop: 12, alignItems: 'center' },
  switchText: { color: '#0284c7', fontWeight: '600' },
});
