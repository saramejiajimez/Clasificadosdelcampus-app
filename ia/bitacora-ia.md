# Bitácora de Uso de IA y Evidencias de Configuración · App Móvil

## 1. Configuración de IA (Sección 14)
Las reglas de IA del repositorio de la app móvil están definidas en `reglasapp.md` y establecen:
- **Cero Secretos:** Prohibición absoluta de incluir `firebaseConfig`, claves privadas o tokens de Blob en el código de la app, así como de leer o modificar archivos `.env*`, `*.keystore` o `*.jks`.
- **Aislamiento de Capas:** Separación estricta entre `app/` (Expo Router), `src/db/` (SQLite), `src/repositories/` (consultas parametrizadas), `src/services/` (lógica de negocio pura y sincronización), `src/api/` (cliente HTTP con refresh en `expo-secure-store`), `src/sensors/` (lectura de sensores separada de la matemática pura) y `src/components/` (gestos con alternativa accesible).
- **Calidad Automática (`npm run check`):** TypeScript estricto (`strict`, `noUncheckedIndexedAccess`), ESLint (`max-warnings 0`, sin `any`, sin `console.*`, funciones ≤ 50 líneas, archivos ≤ 300 líneas), Prettier y Jest con cobertura ≥ 80 %.

## 2. Registro de Interacciones (Bitácora)

### Entrada 1 · Modelo SQLite, Sincronización Offline-First y Cliente HTTP
- **Propósito:** Implementar la base de datos local (`anuncio_cache` y `favorito`), el cliente HTTP con renovación automática de token en `401` usando `expo-secure-store` y el servicio de sincronización idempotente.
- **Evidencia:** Archivos en `src/db/database.ts`, `src/repositories/*.ts`, `src/api/*.ts`, `src/services/*.ts` y pruebas en `src/__tests__/sync-http.test.ts`.
- **Validación:** Ejecución de `npm run check` verificando cobertura > 80 % y manejo de errores 401/403/409.
- **Decisión:** Se separó el adaptador de persistencia en `sync.service.ts` para probar el protocolo de sincronización (`pending = 1` → `PUT`/`DELETE` → `GET ?since=`) de forma determinista con mocks.

### Entrada 2 · Gestos Accesibles, Sensores con Fallback y Pantallas Expo Router
- **Propósito:** Construir los 4 gestos (`Pan`, `Pinch`, doble `Tap`, `LongPress`) con botones accesibles equivalentes, los hooks de sensores (`expo-location`, `Gyroscope`, `expo-camera`, `expo-haptics`) con verificación `isAvailableAsync()` y limpieza `subscription.remove()`, y las 5 pantallas de Expo Router.
- **Evidencia:** Componentes en `src/components/*.tsx`, sensores en `src/sensors/*.ts`, rutas en `app/**` y pruebas en `src/__tests__/validation.test.ts`.
- **Validación:** Verificación estática con `tsc --noEmit`, `eslint . --max-warnings 0`, `prettier --check .` y `jest --coverage`.
- **Decisión:** Se extrajo el cálculo matemático de parallax (`src/sensors/parallax-math.ts`) y la distancia Haversine (`src/services/validation.service.ts`) en funciones puras para garantizar pruebas unitarias rápidas y sin dependencia del hardware físico.

### Entrada 3 · Configuración de EAS Build, Generación de APK y Auditoría de Seguridad (Hito 4)
- **Propósito:** Configurar `app.json` (`android.package: "co.edu.campus.clasificados"`, `versionCode: 1`, íconos 1024×1024 RGB sin transparencia, permisos mínimos justificados) y `eas.json` (`buildType: "apk"` en perfil `preview` con `EXPO_PUBLIC_API_URL: "https://clasificadosdelcampus-api.vercel.app"`, `appVersionSource: "remote"`), además de corregir la subida binaria de imágenes en Expo SDK 58 (`base64AUint8Array` en `src/services/image.service.ts`).
- **Evidencia:** `app.json`, `eas.json`, `assets/images/icon.png`, `assets/images/adaptive-icon.png`, `src/services/image.service.ts` y etiqueta Git `v1.0.0`.
- **Validación:** Auditoría previa de secretos sobre `app/` y `src/` verificando ausencia de `PRIVATE_KEY`, `WEB_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `firebaseConfig` o `AIza`, más ejecución exitosa de `npm run check`.
- **Decisión:** Se definió `EXPO_PUBLIC_API_URL` dentro del bloque `env` del perfil `preview` en `eas.json` porque EAS sube el código respetando `.gitignore` (sin `.env`), y la URL pública de la API en Vercel no es un secreto.

## 3. Tres Aprendizajes de Compilación a APK (Sección 1 y 11 del Manual «De código a APK»)
1. **Diferencia entre Expo Go y un APK compilado con EAS Build:** Expo Go es un contenedor genérico para desarrollo rápido por red local, mientras que el APK generado con `"buildType": "apk"` en `eas.json` empaqueta el motor Hermes, nuestro propio `android.package` (`co.edu.campus.clasificados`), ícono, permisos nativos mínimos y firma digital (Keystore administrado por EAS).
2. **Por qué `EXPO_PUBLIC_*` es público y los secretos solo viven en Vercel:** Cualquier persona puede descomprimir un `.apk` (que es un archivo ZIP) y ejecutar `strings` sobre `assets/index.android.bundle`; por ello la app móvil jamás incluye `firebaseConfig`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_WEB_API_KEY` ni `BLOB_READ_WRITE_TOKEN`, sino únicamente `EXPO_PUBLIC_API_URL` apuntando por HTTPS a Vercel.
3. **Gestión de subida de imágenes y binarios en Expo SDK 58:** En el runtime nativo de Expo SDK 58 (`expo/fetch`), leer un URI local `file://` mediante `fetch()` falla en Android; extraer el JPEG reducido directamente como `base64` desde `expo-image-manipulator` y convertirlo en memoria a `Uint8Array` garantiza que Vercel Blob reciba siempre los bytes JPEG reales y comprimidos (≤ 1280 px, calidad 0.7).
