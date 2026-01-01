/** Módulos del sistema y sus permisos */
export const modules = [
    {
        id: "dashboard",
        name: "Dashboard",
        description: "Panel principal y estadísticas",
        permissions: ["view"],
    },
    {
        id: "patients",
        name: "Pacientes",
        description: "Gestión de pacientes",
        permissions: ["view"],
    },
    {
        id: "appointments",
        name: "Citas",
        description: "Gestión de citas médicas",
        permissions: ["view"],
    },
    {
        id: "ehr",
        name: "Historial Clínico (HCE)",
        description: "Registros médicos electrónicos",
        permissions: ["view"],
    },
    {
        id: "settings",
        name: "Configuración",
        description: "Ajustes del sistema",
        permissions: ["view"],
    },
];

/** Permisos por defecto para cada rol */
export const defaultPermissions = {
    administrador: {
        dashboard: { view: true },
        patients: { view: true },
        appointments: { view: true },
        ehr: { view: true },
        settings: { view: true },
    },
    optometra: {
        dashboard: { view: true },
        patients: { view: true },
        appointments: { view: true },
        ehr: { view: true },
        settings: { view: false },
    },
    secretaria: {
        dashboard: { view: true },
        patients: { view: true },
        appointments: { view: true },
        ehr: { view: true },
        settings: { view: false },
    },
};
