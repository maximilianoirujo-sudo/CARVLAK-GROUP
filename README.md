# 🚗 CARVLAK Group | Hub Operativo Interno (Fase 1: Base Común)

Hub centralizado para coordinar los 3 negocios de la marca:
1. **🚗 Automotora CARVLAK**
2. **✨ Taller de Detailing DetailVlak** (Shangrilá, Canelones)
3. **🔍 Inspección Vehicular** (Patio Edition)

Diseñado mobile-first para ser utilizado desde el celular por el equipo (entre 4 y 8 personas) e instalable como PWA en iPhone (Safari) y Android.

---

## 🌟 Características Implementadas en la Fase 1

### 1. Login y Sistema de Roles Granular
- **Admin (Maximiliano Irujo)**: Acceso total de lectura, edición, auditoría, configuración de comisiones y números de los 3 negocios.
- **Encargado (ej: Jonathan Kaitazoff, Romina)**: Visibilidad operativa total sobre los 3 negocios, **sin acceso** a las comisiones ni márgenes de otros empleados.
- **Detailer**: Operaciones de DetailVlak, sus turnos asignados, clientes y vehículos.
- **Inspector**: Operaciones de Inspección vehicular, peritajes y sus turnos asignados.
- **Vendedor**: Operaciones de Automotora y cartera de clientes.
- *Soporte para múltiples roles por empleado y menú dinámico adaptativo.*

### 2. Gestión de Empleados y Comisiones
- Ficha completa con nombre, teléfono, roles y negocios asignados.
- **Configuración de comisiones protegida**: Porcentaje editable por negocio (Maximiliano preconfigurado con 30% en detailing).
- **Registro de actividad (Auditoría)**: Cada alta, modificación o archivado queda registrado con responsable y fecha.

### 3. Directorio de Clientes Compartido
- Base de datos compartida entre los 3 negocios.
- **Detección automática de duplicados por teléfono en tiempo real**.
- Botón directo de **WhatsApp** con enlace `wa.me` sanitizado.
- Historial cross-business preparado para listar todas las interacciones del cliente en el grupo.

### 4. Vehículos con Ficha Única por Matrícula
- Normalización automática de matrícula uruguaya (ej: `SBX 1234`).
- Propiedad asignable a cliente particular o **"Propio de la automotora"**.
- **Buscador global rápido de matrícula**: accesible desde el header en cualquier pantalla.
- **Línea de tiempo**: historial unificado con todo lo ocurrido al auto en Automotora, Detailing e Inspección.
- Galería de fotos con integración a Supabase Storage (`vehicle-photos`).

### 5. Agenda Unificada
- Vistas de Calendario: **Día** y **Semana**, con código de color cromático:
  - 🚗 Ámbar = Automotora CARVLAK
  - ✨ Violeta = DetailVlak
  - 🔍 Esmeralda = Inspección Vehicular
- Filtro inteligente: **"Solo mis turnos"** vs **"Todo el equipo"**.
- Botón **"Recordatorio WhatsApp"** con mensaje formal pre-redactado listo para enviar al cliente.
- Soporte para montos en **$UYU** con separadores de miles y **USD** para operaciones automotrices.

### 6. Inicio y Tareas en 1 Toque
- Pantalla de inicio personalizada según el rol del usuario con turnos de hoy y tareas pendientes.
- Gestor de tareas con cambio de estado en 1 toque (*Pendiente* ➔ *En curso* ➔ *Hecha*).

### 7. Arquitectura Desacoplada para Fases Futuras
- Secciones **DetailVlak Pro (Fase 2)**, **Inspección & Patio (Fase 3)** y **Automotora Multi-SaaS (Fase 4)** preparadas.
- El módulo Automotora se encuentra aislado en `src/modules/automotora/` para poder convertirse en el futuro en un producto SaaS multi-empresa independiente.

---

## ⚡ Conexión con Supabase (Paso a Paso)

Revisá la guía completa en:
👉 [`supabase/PASO_A_PASO_SUPABASE.md`](supabase/PASO_A_PASO_SUPABASE.md)

1. Creá tu proyecto en [supabase.com](https://supabase.com).
2. Pegá y ejecutá el archivo [`supabase/schema.sql`](supabase/schema.sql) en el **SQL Editor** de Supabase.
3. Copiá la URL y la Anon Key en tu archivo `.env`:
   ```env
   VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
   VITE_SUPABASE_ANON_KEY=TU_CLAVE_ANON_PUBLICA
   ```

> **Nota:** La aplicación incluye un **Modo Demo integrado**. Si aún no configuraste las claves de Supabase, podés probarla al 100% en modo local de inmediato sin perder datos.

---

## 🚀 Despliegue en Vercel

1. Subí este repositorio a tu cuenta de GitHub.
2. Ingresá a [Vercel](https://vercel.com/new) e importá el repositorio `CARVLAK-GROUP`.
3. En **Environment Variables**, agregá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Tocá **Deploy**. ¡Listo en 30 segundos!

---

## 📱 Instalación en iPhone (Safari PWA)

1. Abrí la URL de la app en **Safari** en el iPhone.
2. Tocá el botón **Compartir** (`⬆️`).
3. Elegí **"Agregar a pantalla de inicio"** (Add to Home Screen).
4. La app se abrirá en **pantalla completa**, sin barras de navegador, con soporte offline y respuesta táctil instantánea.
