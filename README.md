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

## 🎨 Características de UI/UX

- **Tema Oscuro/Claro**: El tema se persiste en localStorage y respeta las preferencias del sistema
- **Notificaciones Toast**: Sistema de notificaciones elegante con Sonner
- **Rutas Protegidas**: Implementación de rutas protegidas para usuarios autenticados
- **Loading States**: Manejo de estados de carga con componentes Loader

## 📝 Licencia

Este proyecto es privado.

## 👥 Autores

Juan Sebastian Meza Garcia