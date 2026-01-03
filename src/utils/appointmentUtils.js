export const APPOINTMENT_STATUS_LABELS = {
    pending: "Pendiente",
    confirmed: "Confirmada",
    attended: "Atendida",
    cancelled: "Cancelada",
};

export const APPOINTMENT_STATUS_STYLES = {
    pending: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30",
    confirmed: "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30",
    attended: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-800",
    cancelled: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30",
};

export const getStatusLabel = (status) => {
    return APPOINTMENT_STATUS_LABELS[status] || status;
};

export const getStatusStyle = (status) => {
    return APPOINTMENT_STATUS_STYLES[status] || APPOINTMENT_STATUS_STYLES.pending;
};
