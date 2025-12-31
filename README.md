# SI-CO J&S

Sistema de gestión clínica desarrollado con React y Vite. Una aplicación web completa para la administración de pacientes, citas y registros médicos electrónicos (EHR) para el Centro Óptico J&S.

## 📋 Características

- 🔐 **Autenticación segura** - Implementada con Supabase Auth con control de roles y estado de usuario
- 👥 **Gestión de pacientes** - Administración completa de información de pacientes
- 📅 **Sistema de citas** - Gestión y programación de citas médicas con calendario interactivo
- 📋 **Registros médicos electrónicos (EHR)** - Historial clínico digital completo
- 👤 **Control de acceso basado en roles** - Sistema de permisos para administrador, secretaria y optómetra
- ⚙️ **Panel de administración** - Configuración de clínica, servicios y gestión de usuarios
- 🎨 **Tema claro/oscuro** - Soporte para modo oscuro y claro con persistencia
- 📱 **Diseño responsive** - Optimizado para diferentes tamaños de pantalla
- 🔄 **Gestión de usuarios** - Registro, edición y activación/desactivación de usuarios

## 🚀 Tecnologías Utilizadas

### Frontend
- **React 19** - Biblioteca de JavaScript para interfaces de usuario
- **Vite 7** - Herramienta de construcción rápida y moderna
- **React Router DOM 7** - Enrutamiento para aplicaciones React
- **Tailwind CSS 4** - Framework de CSS utility-first
- **Lucide React** - Iconos modernos y ligeros
- **React Icons** - Librería de iconos adicional

### Backend y Servicios
- **Supabase** - Backend como servicio (BaaS) para autenticación y base de datos PostgreSQL

### Gestión de Estado y Datos
- **@tanstack/react-query** - Gestión de estado del servidor y caché de datos
- **Zustand** - Gestión de estado del cliente
- **Axios** - Cliente HTTP para peticiones API

### Formularios y Validación
- **React Hook Form** - Manejo eficiente de formularios
- **Zod** - Validación de esquemas TypeScript-first
- **@hookform/resolvers** - Resolvers para React Hook Form con Zod

### Componentes UI
- **React Big Calendar** - Componente de calendario para gestión de citas
- **Sonner** - Sistema de notificaciones toast elegante

### Utilidades
- **date-fns** - Librería moderna de manipulación de fechas

## 📦 Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd SICO
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

4. Ejecutar en modo desarrollo:
```bash
npm run dev
```

5. Construir para producción:
```bash
npm run build
```

6. Previsualizar build de producción:
```bash
npm run preview
```

## 🔐 Sistema de Autenticación

El sistema implementa autenticación basada en roles con los siguientes niveles de acceso:

### Roles de Usuario
- **Administrador**: Acceso completo al sistema, incluyendo gestión de usuarios y configuraciones
- **Secretaria**: Acceso a gestión de pacientes, citas y registros
- **Optómetra**: Acceso a pacientes, citas y registros médicos electrónicos

### Características de Seguridad
- Verificación de rol de administrador en tiempo de inicio de sesión
- Control de estado activo/inactivo de usuarios
- Rutas protegidas que requieren autenticación
- Validación de permisos antes de permitir acceso a funciones administrativas
- Cierre de sesión automático para usuarios sin permisos o desactivados

## 📁 Estructura del Proyecto

```
SICO/
├── public/                  # Archivos estáticos
│   ├── Logo.png
│   └── Logo-removebg-preview.png
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── Settings/        # Componentes de configuración
│   │   │   ├── ClinicInfo.jsx
│   │   │   ├── ServicesManagement.jsx
│   │   │   ├── UserManagement.jsx
│   │   │   └── UserRegister.jsx
│   │   ├── AdminForm.jsx    # Formulario de login para administradores
│   │   ├── ConfirmModal.jsx # Modal de confirmación
│   │   ├── EditProfileModal.jsx
│   │   ├── Loader.jsx       # Componente de carga
│   │   ├── Modal.jsx        # Modal genérico
│   │   ├── OperativeForm.jsx # Formulario de login operativo
│   │   ├── ProtectedRoute.jsx # Componente de ruta protegida
│   │   ├── Sidebar.jsx      # Barra lateral de navegación
│   │   └── ThemeToggle.jsx  # Toggle de tema
│   ├── context/             # Contextos de React
│   │   └── AuthContext.jsx  # Contexto de autenticación
│   ├── hooks/               # Custom hooks
│   │   └── useTheme.js      # Hook para gestión de tema
│   ├── pages/               # Páginas de la aplicación
│   │   ├── Appointments.jsx # Página de citas
│   │   ├── Dashboard.jsx    # Dashboard principal
│   │   ├── EHR.jsx          # Registros médicos electrónicos
│   │   ├── Home.jsx         # Página principal con layout
│   │   ├── Login.jsx        # Página de login
│   │   ├── Patients.jsx     # Página de pacientes
│   │   └── Settings.jsx     # Página de configuración
│   ├── routes/              # Configuración de rutas
│   │   └── index.jsx        # Definición de rutas
│   ├── utils/               # Utilidades
│   │   └── schema_update.sql
│   ├── App.jsx              # Componente principal
│   ├── main.jsx             # Punto de entrada
│   ├── index.css            # Estilos globales
│   └── supabaseClient.js    # Configuración de Supabase
├── dist/                    # Build de producción (generado)
├── .gitignore
├── eslint.config.js         # Configuración de ESLint
├── index.html
├── package.json
├── vercel.json              # Configuración de despliegue en Vercel
├── vite.config.js           # Configuración de Vite
└── README.md
```

## 🎨 Características de UI/UX

- **Tema Oscuro/Claro**: El tema se persiste en localStorage y respeta las preferencias del sistema operativo
- **Notificaciones Toast**: Sistema de notificaciones elegante con Sonner, posicionadas en la esquina superior derecha
- **Rutas Protegidas**: Implementación robusta de rutas protegidas para usuarios autenticados con estados de carga
- **Loading States**: Manejo de estados de carga con componentes Loader personalizados
- **Modales Interactivos**: Sistema de modales para confirmaciones y formularios
- **Calendario Interactivo**: Integración de React Big Calendar para gestión visual de citas

## 🚀 Despliegue

El proyecto está configurado para despliegue en **Vercel** con las siguientes configuraciones:

- **Rewrites**: Todas las rutas se redirigen al index.html para soportar React Router
- **Variables de entorno**: Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el panel de Vercel

### Comandos de Desarrollo

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

## 📝 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza el build de producción
- `npm run lint` - Ejecuta ESLint para verificar el código

## 🔧 Configuración Requerida

### Base de Datos Supabase

El proyecto requiere las siguientes tablas en Supabase:

- `users` - Tabla de usuarios con campos: `id`, `email`, `role`, `is_active`
- Tablas adicionales para pacientes, citas, registros médicos, etc.

### Políticas RLS (Row Level Security)

Asegúrate de configurar las políticas RLS apropiadas en Supabase para:
- Control de acceso basado en roles
- Protección de datos sensibles
- Restricciones de lectura/escritura según permisos

## 📝 Licencia

Este proyecto es privado.

## 👥 Autor

**Juan Sebastian Meza Garcia**
