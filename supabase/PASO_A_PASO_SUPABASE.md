# 🚀 Guía Paso a Paso: Conectar Supabase a CARVLAK Group

Esta guía te explica cómo tener tu base de datos en la nube gratuita con **Supabase** y conectar las claves a tu app en menos de 3 minutos.

---

## Paso 1: Crear tu Proyecto en Supabase (Gratis)
1. Entrá a [https://supabase.com](https://supabase.com) y hacé clic en **"Sign In"** (podés usar tu cuenta de Google o GitHub).
2. Hacé clic en el botón verde **"New Project"**.
3. Completá:
   - **Name**: `CARVLAK Group`
   - **Database Password**: (Elegí una contraseña segura y anotala).
   - **Region**: Elegí **São Paulo (Brazil)** o **East US** (para mínima latencia desde Uruguay).
   - **Pricing Plan**: Free (100% Gratis).
4. Tocá **"Create new project"** y esperá 1 minuto a que termine de inicializarse.

---

## Paso 2: Ejecutar el Script de la Base de Datos (1 Clic)
1. En el menú de la izquierda de Supabase, hacé clic en el ícono **"SQL Editor"** (parece un `>_`).
2. Hacé clic en **"New Query"**.
3. Abrí el archivo [`supabase/schema.sql`](file:///C:/Users/maxim/.gemini/antigravity/scratch/carvlak-group/supabase/schema.sql), copiá todo su contenido y pegalo en el editor.
4. Hacé clic en el botón verde **"Run"** (o presioná `Ctrl + Enter`).
5. ¡Listo! Verás el mensaje *"Success: No rows returned"*. Ya tenés creadas todas las tablas (`profiles`, `clients`, `vehicles`, `appointments`, `tasks`, etc.), el bucket de fotos y las políticas de seguridad (RLS).
6. *(Opcional)* Podés hacer lo mismo con [`supabase/seed.sql`](file:///C:/Users/maxim/.gemini/antigravity/scratch/carvlak-group/supabase/seed.sql) para cargar datos de prueba reales si querés.

---

## Paso 3: Obtener tus Claves de Conexión
1. En el menú de la izquierda, tocá la ruedita de configuración **"Project Settings"** (abajo a la izquierda).
2. Hacé clic en **"API"**.
3. Vas a ver dos valores:
   - **Project URL**: Algo como `https://xyzcompany.supabase.co`
   - **Project API keys -> `anon` / `public`**: Una clave larga que empieza con `eyJ...`

---

## Paso 4: Conectar las Claves a tu Aplicación
Creá un archivo `.env` en la raíz de `carvlak-group` con este contenido:

```env
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_ANON_PUBLICA
```

*(Cuando despliegues en Vercel, simplemente agregás estas dos mismas variables en **Settings -> Environment Variables**).*

---

## Paso 5: Crear el Primer Usuario Administrador (Maximiliano)
1. En Supabase, andá a **Authentication -> Users**.
2. Hacé clic en **"Add User"** -> **"Create User"**.
3. Ingresá tu email (ej: `maxi@carvlak.com`) y una contraseña.
4. Luego andá a **Table Editor -> `profiles`**, y agregá una fila con:
   - `id`: El ID del usuario que acabás de crear en Authentication.
   - `full_name`: `Maximiliano Irujo`
   - `roles`: `{"admin", "encargado", "detailer", "inspector", "vendedor"}`
   - `businesses`: `{"automotora", "detailing", "inspeccion"}`
   - `commissions`: `{"automotora": 0, "detailing": 30, "inspeccion": 0}`

> **Nota:** La aplicación cuenta con un **Modo Demo integrado**, por lo que podrás probarla completa de inmediato aun antes de pegar tus claves.
