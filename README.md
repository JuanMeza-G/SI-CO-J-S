# SI-CO J&S

Sistema de gestión clínica desarrollado con React y Vite. Una aplicación web completa para la administración de pacientes, citas y registros médicos electrónicos (EHR).

## 📋 Características

- 🔐 **Autenticación segura** - Implementada con Supabase Auth
- 👥 **Gestión de pacientes** - Administración completa de información de pacientes
- 📅 **Sistema de citas** - Gestión y programación de citas médicas
- 📋 **Registros médicos electrónicos (EHR)** - Historial clínico digital
- 🎨 **Tema claro/oscuro** - Soporte para modo oscuro y claro
- ⚙️ **Panel de configuración** - Configuración de clínica, servicios y usuarios
- 📱 **Diseño responsive** - Optimizado para diferentes tamaños de pantalla

## 🚀 Tecnologías Utilizadas

### Frontend
- **React 19** - Biblioteca de JavaScript para interfaces de usuario
- **Vite** - Herramienta de construcción rápida
- **React Router DOM 7** - Enrutamiento para aplicaciones React
- **Tailwind CSS 4** - Framework de CSS utility-first
- **Lucide React** - Iconos modernos y ligeros
- **React Icons** - Librería de iconos adicional

### Backend y Servicios
- **Supabase** - Backend como servicio (BaaS) para autenticación y base de datos

### Formularios y Validación
- **React Hook Form** - Manejo eficiente de formularios
- **Zod** - Validación de esquemas TypeScript-first
- **@hookform/resolvers** - Resolvers para React Hook Form con Zod

### Utilidades
- **Sonner** - Sistema de notificaciones toast

## 📦 Instalación

### Prerrequisitos

- Node.js 18+ 
- npm o yarn

### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/JuanMeza-G/SI-CO-J-S.git
   cd SICO
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
   ```env
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
   ```

4. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

   La aplicación estará disponible en `http://localhost:5173`

## 🛠️ Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run lint` - Ejecuta ESLint para revisar el código

## 📁 Estructura del Proyecto

```
SICO/
├── public/              # Archivos estáticos
│   ├── Logo.png
│   └── Logo-removebg-preview.png
├── src/
│   ├── components/      # Componentes reutilizables
│   │   ├── Settings/    # Componentes de configuración
│   │   ├── AdminForm.jsx
│   │   ├── ConfirmModal.jsx
│   │   ├── EditProfileModal.jsx
│   │   ├── Loader.jsx
│   │   ├── Modal.jsx
│   │   ├── OperativeForm.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── Sidebar.jsx
│   │   └── ThemeToggle.jsx
│   ├── context/         # Contextos de React
│   │   └── AuthContext.jsx
│   ├── hooks/           # Custom hooks
│   │   └── useTheme.js
│   ├── pages/           # Páginas de la aplicación
│   │   ├── Appointments.jsx
│   │   ├── Dashboard.jsx
│   │   ├── EHR.jsx
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Patients.jsx
│   │   └── Settings.jsx
│   ├── routes/          # Configuración de rutas
│   │   └── index.jsx
│   ├── services/        # Servicios API
│   ├── utils/           # Utilidades
│   │   └── schema_update.sql
│   ├── App.jsx          # Componente principal
│   ├── main.jsx         # Punto de entrada
│   ├── index.css        # Estilos globales
│   └── supabaseClient.js # Configuración de Supabase
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🔐 Configuración de Supabase

Este proyecto utiliza Supabase para autenticación y base de datos. Asegúrate de:

1. Crear un proyecto en [Supabase](https://supabase.com)
2. Configurar las políticas de seguridad (RLS)
3. Ejecutar el script SQL en `src/utils/schema_update.sql` si es necesario
4. Configurar las variables de entorno mencionadas anteriormente

## 🎨 Características de UI/UX

- **Tema Oscuro/Claro**: El tema se persiste en localStorage y respeta las preferencias del sistema
- **Notificaciones Toast**: Sistema de notificaciones elegante con Sonner
- **Rutas Protegidas**: Implementación de rutas protegidas para usuarios autenticados
- **Loading States**: Manejo de estados de carga con componentes Loader

## 📝 Licencia

Este proyecto es privado.

## 👥 Autores

J&S

---

**Nota**: Asegúrate de configurar correctamente las variables de entorno antes de iniciar el proyecto. Sin las credenciales de Supabase, la aplicación no funcionará correctamente.
