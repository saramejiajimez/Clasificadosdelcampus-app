# 35 · Clasificados del Campus — App Móvil (Expo + React Native + SQLite Offline-First)

Aplicación móvil estudiantil de compra y venta construida con **Expo SDK 58**, **React Native**, **TypeScript estricto**, **Expo Router**, **SQLite (`expo-sqlite`)**, **almacenamiento seguro (`expo-secure-store`)**, **gestos (`react-native-gesture-handler`)** y **sensores del dispositivo**.

## 1. Enlaces de Despliegue y Descarga del APK (Hito 4 · EAS Build)

- **API Backend en Producción (Vercel):** https://clasificadosdelcampus-api.vercel.app (`GET /api/health`)
- **Página del Build en Expo (`expo.dev` con código QR):** https://expo.dev/accounts/sara.mejia/projects/35-clasificados-del-campus-app/builds/b9a4e700-c70f-4524-84a3-a0b83eab6621
- **Descarga Directa del APK Instalable (`v1.0.0`, `co.edu.campus.clasificados`):** https://expo.dev/artifacts/eas/23KV1fIHBqMKImb8yejqURAESgRcf0HfNyQHjHawy1c.apk

## 2. Regla de Oro de Seguridad y Auditoría del APK

- **Cero secretos en la app y en el APK:** Esta aplicación **NO** incluye `firebaseConfig`, claves privadas de Firebase ni tokens de Vercel Blob (auditado sobre `assets/index.android.bundle` con **0 coincidencias**; ver `ia/auditoria-apk.md`).
- **Almacenamiento seguro:** El `token` (ID token) y `refreshToken` de sesión se guardan exclusivamente en `expo-secure-store` (nunca en `AsyncStorage`).
- **Única variable pública:** `EXPO_PUBLIC_API_URL` apuntando al dominio HTTPS de la API en Vercel (`https://clasificadosdelcampus-api.vercel.app`).

## 3. Pantallas y Rutas (`app/`)

- `app/(tabs)/index.tsx` — Feed público paginado con búsqueda, filtro por categoría y orden por cercanía GPS o fecha (**RF-02**, **CA-4**).
- `app/(tabs)/mis-anuncios.tsx` — Mis anuncios activos (`máx. 5`, **CA-1**), marcar como vendido (**RF-04**) y eliminar.
- `app/(tabs)/favoritos.tsx` — Anuncios guardados en SQLite disponibles sin conexión (**RF-03**, **CA-3**) y sincronización bidireccional (`PUT`/`DELETE` + `GET ?since=`).
- `app/anuncio/nuevo.tsx` — Publicar anuncio con 1–4 fotos desde cámara o galería reducidas con `expo-image-manipulator` (`≤ 1280 px`, JPEG `0.7`) antes de subir (**RF-01**).
- `app/anuncio/[id].tsx` — Galería interactiva con parallax, detalle, contacto por WhatsApp (`https://wa.me/57<número>?text=...`, **RF-05**), reporte (**RF-06**) y botón de moderación para administradores (**CA-2**).

## 4. Gestos y Accesibilidad

Cada gesto implementado con `react-native-gesture-handler` cuenta con su **alternativa por botón con `accessibilityLabel`**:

1. **Deslizar horizontal (`Gesture.Pan`)** en galería + botones `"Foto anterior"` / `"Siguiente foto"`.
2. **Pellizco (`Gesture.Pinch`)** para ampliar foto + botón `"Alternar zoom de la foto"`.
3. **Doble toque (`Gesture.Tap`)** para marcar favorito + botón `"Alternar favorito"`.
4. **Mantener presionado (`Gesture.LongPress`)** sobre tarjeta de anuncio + botón `"Opciones para <título>: reportar o compartir"`.

## 5. Sensores y Capacidades (con Fallback)

1. **Cámara y Galería (`expo-camera` / `expo-image-picker` + `expo-image-manipulator`)**: Toma o selecciona hasta 4 fotos y las comprime antes de subirlas.
2. **Ubicación (`expo-location`)**: Calcula distancia Haversine a cada anuncio; si se niega el permiso o el GPS está apagado, ordena por fecha.
3. **Giroscopio (`Gyroscope` de `expo-sensors`)**: Verifica `Gyroscope.isAvailableAsync()`, aplica efecto parallax en la foto principal y limpia con `subscription.remove()` al salir.
4. **Respuesta háptica (`expo-haptics`)**: Al marcar un anuncio como favorito.

## 6. Comandos

```bash
npm run check                                       # tsc --noEmit + eslint + prettier + jest --coverage
npx expo start                                      # Inicia el servidor de desarrollo de Expo
npx eas-cli build -p android --profile preview      # Compila el APK instalable en EAS Build
```
