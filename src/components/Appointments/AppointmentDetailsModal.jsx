import React from "react";
import {
    FiClock,
    FiUser,
    FiActivity,
    FiFileText,
    FiCalendar,
    FiCheckCircle,
    FiXCircle,
    FiArrowRight,
    FiExternalLink
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Modal from "../Modal";
import { supabase } from "../../supabaseClient";
import { safeQuery } from "../../utils/supabaseHelpers";
import { toast } from "sonner";
import { getStatusLabel, getStatusStyle } from "../../utils/appointmentUtils";

const AppointmentDetailsModal = ({ isOpen, onClose, appointment, onUpdate }) => {
    const navigate = useNavigate();

    if (!appointment) return null;

    const handleUpdateStatus = async (newStatus) => {
        try {
            const { error } = await safeQuery(() =>
                supabase
                    .from("appointments")
                    .update({ status: newStatus })
                    .eq("id", appointment.id)
            );

            if (error) throw error;

            toast.success(`Cita ${getStatusLabel(newStatus).toLowerCase()} exitosamente`);
            if (onUpdate) onUpdate();
            onClose();
        } catch (error) {
            console.error("Error updating appointment status:", error);
            toast.error("Error al actualizar el estado de la cita");
        }
    };

    const getStatusBadge = (status) => {
        return (
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border ${getStatusStyle(status)}`}>
                {getStatusLabel(status)}
            </span>
        );
    };

    const InfoRow = ({ label, value, icon: Icon }) => (
        <div className="flex items-start gap-4 py-3 border-b border-gray-50 dark:border-[#262626] last:border-0 hover:bg-gray-50/50 dark:hover:bg-[#1a1a1a] transition-all px-2 rounded-lg">
            <div className="mt-1">
                <Icon className="text-blue-500/70" size={16} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase tracking-widest mb-0.5">
                    {label}
                </p>
                <p className="text-sm font-bold text-gray-700 dark:text-[#f5f5f5] break-words">
                    {value || "No registrado"}
                </p>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="DETALLES DE LA CITA"
            size="xl"
        >
            <div className="space-y-6 max-w-xl mx-auto">
                {/* Encabezado con Paciente y Estado */}
                <div className="flex justify-between items-start gap-4 bg-gray-50 dark:bg-[#1a1a1a] p-4 rounded-lg border border-gray-100 dark:border-[#262626]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <FiUser size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-800 dark:text-[#f5f5f5] uppercase tracking-tight text-lg leading-tight">
                                {appointment.patient?.first_name || appointment.patient_first_name} {appointment.patient?.last_name || appointment.patient_last_name}
                            </h3>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-[#737373] uppercase tracking-widest mt-1">
                                ID: {appointment.patient?.document_number || appointment.patient_document_number}
                            </p>
                        </div>
                    </div>
                    <div className="shrink-0 pt-1">
                        {getStatusBadge(appointment.status)}
                    </div>
                </div>

                {/* Detalles de la Cita */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    <InfoRow
                        label="Fecha"
                        icon={FiCalendar}
                        value={new Date(appointment.appointment_date).toLocaleDateString("es-ES", { dateStyle: 'long' })}
                    />
                    <InfoRow
                        label="Hora"
                        icon={FiClock}
                        value={new Date(appointment.appointment_date).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
                    />
                    <InfoRow
                        label="Servicio"
                        icon={FiActivity}
                        value={appointment.service?.name || appointment.service_name || "Consulta General"}
                    />
                    <InfoRow
                        label="Motivo"
                        icon={FiFileText}
                        value={appointment.consultation_reason}
                    />
                </div>

                {/* Notas */}
                {appointment.notes && (
                    <div className="mt-4 p-4 bg-blue-50/30 dark:bg-blue-900/5 rounded-lg border border-blue-100/50 dark:border-blue-900/20">
                        <p className="text-[10px] font-extrabold text-blue-400 dark:text-blue-500/50 uppercase tracking-widest mb-2">
                            Notas Internas
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 italic leading-relaxed">
                            "{appointment.notes}"
                        </p>
                    </div>
                )}

                {/* Acciones */}
                <div className="pt-6 border-t border-gray-100 dark:border-[#262626] flex flex-wrap gap-3">
                    {appointment.status === "pending" && (
                        <button
                            onClick={() => handleUpdateStatus("confirmed")}
                            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-black uppercase text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/10 rounded-lg transition-all cursor-pointer border border-green-100 dark:border-green-900/30"
                        >
                            <FiCheckCircle size={18} />
                            Confirmar
                        </button>
                    )}

                    <button
                        onClick={() => handleUpdateStatus("cancelled")}
                        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-black uppercase text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10 rounded-lg transition-all cursor-pointer border border-red-100 dark:border-red-900/30"
                    >
                        <FiXCircle size={18} />
                        Cancelar
                    </button>

                    <div className="w-full flex gap-3 mt-2">
                        <button
                            onClick={() => navigate(`/home/patients/${appointment.patient_id}`)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-[11px] font-black uppercase text-gray-500 hover:text-blue-600 dark:text-[#a3a3a3] dark:hover:text-blue-400 transition-all cursor-pointer bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-gray-100 dark:border-[#262626]"
                        >
                            <FiExternalLink /> Perfil Paciente
                        </button>

                        <button
                            onClick={async () => {
                                try {
                                    const { error } = await safeQuery(() =>
                                        supabase
                                            .from("appointments")
                                            .update({ status: "attended" })
                                            .eq("id", appointment.id)
                                    );
                                    if (error) throw error;
                                } catch (err) {
                                    console.error("Status update failed:", err);
                                    toast.error("Error al actualizar estado");
                                }
                                navigate(`/home/ehr`, { state: { patientId: appointment.patient_id } });
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-[11px] font-black uppercase bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all active:scale-95 cursor-pointer"
                        >
                            <span>Atender Cita</span>
                            <FiArrowRight />
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default AppointmentDetailsModal;
