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

##  Sistema de Autenticación

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

## 🎨 Características de UI/UX

- **Tema Oscuro/Claro**: El tema se persiste en localStorage y respeta las preferencias del sistema operativo
- **Notificaciones Toast**: Sistema de notificaciones elegante con Sonner, posicionadas en la esquina superior derecha
- **Rutas Protegidas**: Implementación robusta de rutas protegidas para usuarios autenticados con estados de carga
- **Loading States**: Manejo de estados de carga con componentes Loader personalizados
- **Modales Interactivos**: Sistema de modales para confirmaciones y formularios
- **Calendario Interactivo**: Integración de React Big Calendar para gestión visual de citas

## 📝 Licencia

Este proyecto es privado.

## 👥 Autor

**Juan Sebastian Meza Garcia**
