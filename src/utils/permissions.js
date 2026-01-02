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
        permissions: ["view", "search"],
    },
    {
        id: "appointments",
        name: "Citas",
        description: "Gestión de citas médicas",
        permissions: ["view", "agenda", "waiting"],
    },
    {
        id: "ehr",
        name: "Historia Clínica (HCE)",
        description: "Registros médicos electrónicos",
        permissions: ["view", "evolution", "documents"],
    },
    {
        id: "settings",
        name: "Configuración",
        description: "Ajustes del sistema y usuarios",
        permissions: ["view"],
    },
];

export const defaultPermissions = {
    administrador: {
        dashboard: { view: true },
        patients: { view: true, search: true },
        appointments: { view: true, agenda: true, waiting: true },
        ehr: { view: true, evolution: true, documents: true },
        settings: { view: true },
    },
    optometra: {
        dashboard: { view: true },
        patients: { view: true, search: true },
        appointments: { view: true, agenda: true, waiting: true },
        ehr: { view: true, evolution: true, documents: true },
        settings: { view: false },
    },
    secretaria: {
        dashboard: { view: true },
        patients: { view: true, search: true },
        appointments: { view: true, agenda: true, waiting: true },
        ehr: { view: true, evolution: false, documents: true },
        settings: { view: false },
    },
};
