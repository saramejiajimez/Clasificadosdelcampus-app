# Auditoría de Seguridad del APK · Sección 8 («De código a APK»)

## 1. Datos del Build en EAS Cloud (`v1.0.0`)
- **Proyecto en Expo:** `@sara.mejia/35-clasificados-del-campus-app` (`06401223-b9fd-4c8d-b56d-d391a86512c5`)
- **Build ID:** `b9a4e700-c70f-4524-84a3-a0b83eab6621`
- **Perfil:** `preview` (`"buildType": "apk"`, `"distribution": "internal"`)
- **Package Android:** `co.edu.campus.clasificados` (`version: "1.0.0"`, `versionCode: 1`)
- **Página oficial del Build (con código QR de instalación):**
  https://expo.dev/accounts/sara.mejia/projects/35-clasificados-del-campus-app/builds/b9a4e700-c70f-4524-84a3-a0b83eab6621
- **Enlace directo de descarga del archivo `.apk`:**
  https://expo.dev/artifacts/eas/23KV1fIHBqMKImb8yejqURAESgRcf0HfNyQHjHawy1c.apk

---

## 2. Resultados del Laboratorio de Auditoría del APK (Sección 8)

Se descargó el archivo `.apk` compilado por EAS (`121,600,512 bytes`), se descomprimió como archivo ZIP y se inspeccionó el bundle compilado de Hermes (`contenido/assets/index.android.bundle`, `3,361,908 bytes`):

1. **Verificación de URL pública de la API en el bundle:**
   - Búsqueda de `https://clasificadosdelcampus-api.vercel.app`: **ENCONTRADA (`true`)** (inyectada desde `eas.json -> build.preview.env.EXPO_PUBLIC_API_URL`).
2. **Búsqueda de credenciales o secretos prohibidos en el bundle:**
   - Patrón evaluado: `BEGIN PRIVATE KEY|private_key|FIREBASE_PRIVATE|FIREBASE_WEB_API_KEY|BLOB_READ_WRITE_TOKEN|AIza|vercel_blob_rw|firebaseConfig`
   - **Coincidencias encontradas:** **`0` (`[]`)**.
3. **Conclusión de la auditoría:**
   - **APROBADO (Cero secretos en el APK).** Todas las llaves privadas de Firebase Admin, la Web API Key de Firebase Auth y el token de escritura de Vercel Blob residen exclusivamente en las variables de entorno del servidor en Vercel.
