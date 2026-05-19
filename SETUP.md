# CleanBnb App — Guía de Configuración y Despliegue

## 1. Supabase — Configuración inicial

### 1.1 Crear proyecto
1. Ve a [app.supabase.com](https://app.supabase.com) y crea una cuenta o inicia sesión
2. Clic en **"New project"**
3. Nombre: `cleanbnb` | Organización: la tuya | Región: la más cercana (US East o EU West)
4. Genera una contraseña segura para la base de datos y guárdala
5. Espera ~2 minutos a que el proyecto se inicialice

### 1.2 Obtener credenciales
En tu proyecto de Supabase ve a **Settings → API** y copia:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon / public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role / secret key` → `SUPABASE_SERVICE_ROLE_KEY`

### 1.3 Ejecutar migraciones
Instala la CLI de Supabase:
```bash
npm install -g supabase
```

Enlaza y ejecuta las migraciones:
```bash
cd cleanbnb-app
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

El `PROJECT_REF` es la parte de tu URL de Supabase: `https://XXXXXXXX.supabase.co` → `XXXXXXXX`

### 1.4 Crear buckets de Storage
En Supabase Dashboard → **Storage → New bucket**, crea los siguientes (todos **privados**):
- `clock-photos`
- `inspection-photos`
- `face-enrollment`

### 1.5 Activar Realtime
En **Database → Replication**, activa las siguientes tablas para realtime:
- `visit_sessions`
- `inspection_reports`
- `inventory_movements`

### 1.6 Descargar modelos de reconocimiento facial
Descarga los modelos tiny de face-api.js y colócalos en `public/models/`:

```bash
cd cleanbnb-app
mkdir -p public/models
# Descargar de: https://github.com/vladmandic/face-api/tree/master/model
# Archivos necesarios (tiny variants):
# - tiny_face_detector_model-weights_manifest.json + shards
# - face_landmark_68_tiny_model-weights_manifest.json + shards  
# - face_recognition_model-weights_manifest.json + shards
```

### 1.7 Configurar variables de entorno locales
```bash
cp .env.local.example .env.local
# Edita .env.local con tus credenciales reales
```

---

## 2. Desarrollo local

```bash
cd cleanbnb-app
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## 3. Crear usuario administrador inicial

Después de configurar Supabase, crea el primer admin:

1. En Supabase Dashboard → **Authentication → Users → Add user**
2. Email: `TU_CELULAR@cleanbnb.internal` (ej: `50212345678@cleanbnb.internal`)
3. Password: `TU_NUMERO_DE_CELULAR` (ej: `50212345678`)
4. Confirmar email: ✅

Luego en **SQL Editor** ejecuta:
```sql
INSERT INTO profiles (id, display_name, phone, role)
VALUES (
  'EL_UUID_DEL_USUARIO_RECIEN_CREADO',
  'Tu Nombre Completo',
  '50212345678',
  'admin'
);
```

---

## 4. Despliegue en Vercel

1. Crea una cuenta en [vercel.com](https://vercel.com)
2. Crea un nuevo repositorio en GitHub llamado `CLEANBNB-APP` (en tu cuenta `kontaxes`)
3. Sube el código:
   ```bash
   cd cleanbnb-app
   git init
   git add .
   git commit -m "Initial CleanBnb app"
   git remote add origin https://github.com/kontaxes/CLEANBNB-APP.git
   git push -u origin main
   ```
4. En Vercel → **New Project → Import** el repo `CLEANBNB-APP`
5. Framework: **Next.js** (se detecta automáticamente)
6. En **Environment Variables** agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` = `https://tu-proyecto.vercel.app`
7. Clic en **Deploy**

---

## 5. Instalar como PWA en celular

### Android (Chrome):
1. Abre la app en Chrome
2. Menú (3 puntos) → **"Agregar a pantalla de inicio"**
3. La app se instala como aplicación nativa

### iOS (Safari):
1. Abre la app en Safari
2. Botón compartir → **"Agregar a pantalla de inicio"**

---

## 6. Flujo de trabajo del empleado

1. **Login** → Nombre + número de celular
2. **Inicio** → Ver asignaciones del día
3. **Iniciar visita** → Captura GPS + foto entrada (cámara trasera) + selfie oculto
4. **Inspección inicial** → Fotos y alertas por sección del apartamento
5. **Insumos** → Contar lo encontrado, lo que se agrega de bodega, lo que quedará
6. **Inspección final** → Fotos de cómo se deja el apartamento
7. **Salida** → GPS + foto de salida + selfie oculto

---

## 7. Roles y accesos

| Acción | Empleado | Supervisor | Admin |
|---|---|---|---|
| Reportar visitas | ✅ | ❌ | ✅ |
| Ver sus reportes | ✅ | ✅ | ✅ |
| Ver todos los reportes | ❌ | ✅ | ✅ |
| Modificar registros | ❌ | ❌ | ✅ |
| Crear apartamentos | ❌ | ❌ | ✅ |
| Crear usuarios | ❌ | ❌ | ✅ |
| Ver dashboard en tiempo real | ❌ | ✅ | ✅ |

---

## 8. Soporte técnico

Para dudas o problemas, contacta al administrador del sistema Stayte Management.
