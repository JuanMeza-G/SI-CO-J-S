import React, { useState, useEffect } from "react";
import {
    FiClock,
    FiUser,
    FiMoreVertical,
    FiCheckCircle,
    FiXCircle,
    FiActivity,
    FiArrowRight,
    FiExternalLink
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Breadcrumbs from "../Breadcrumbs";
import { supabase } from "../../supabaseClient";
import { safeQuery } from "../../utils/supabaseHelpers";
import Loader from "../Loader";
import { toast } from "sonner";
import { getStatusLabel } from "../../utils/appointmentUtils";

const AppointmentsAgenda = () => {
    const [agenda, setAgenda] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchAgenda = async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split("T")[0];
            const { data, error } = await safeQuery(() =>
                supabase
                    .from("appointments_view")
                    .select("*")
                    .gte("appointment_date", today)
                    .lt("appointment_date", new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0])
                    .order("appointment_date", { ascending: true })
            );
            if (!error) {
                setAgenda(data || []);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgenda();
    }, []);

    const handleUpdateStatus = async (appointmentId, newStatus) => {
        try {
            const { error } = await safeQuery(() =>
                supabase
                    .from("appointments")
                    .update({ status: newStatus })
                    .eq("id", appointmentId)
            );

            if (error) throw error;

            toast.success(`Cita ${getStatusLabel(newStatus).toLowerCase()} exitosamente`);
            fetchAgenda();
        } catch (error) {
            console.error("Error updating appointment status:", error);
            toast.error("Error al actualizar el estado de la cita");
        }
    };

    const getAppTypeLabel = (item) => {
        return item.service?.name || "Sin servicio";
    };

    return (
        <div className="flex flex-col gap-6 p-4 sm:px-6 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 px-3">
                <Breadcrumbs
                    items={[
                        { label: "Citas", path: "/home/appointments" },
                        { label: "Agenda del Día" },
                    ]}
                />
                <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-wider leading-tight">
                        Hoy
                    </p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-[#f5f5f5]">
                        {new Date().toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                        })}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-[#111111] rounded-lg border-2 border-gray-200 dark:border-[#262626] overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-[#262626] flex justify-between items-center bg-white dark:bg-[#111111]">
                    <h2 className="font-bold text-base dark:text-[#f5f5f5]">
                        Pacientes Programados
                    </h2>
                    <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold px-2.5 py-1 rounded-lg">
                        {agenda.length} {agenda.length === 1 ? 'cita' : 'citas'}
                    </span>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-[#262626]">
                    {loading ? (
                        <div className="p-20 text-center">
                            <Loader />
                        </div>
                    ) : agenda.length > 0 ? (
                        agenda.map((item) => (
                            <div
                                key={item.id}
                                className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors gap-6"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center justify-center min-w-[65px] h-[65px] bg-gray-50 dark:bg-[#161616] rounded-lg border border-gray-200 dark:border-[#262626]">
                                        <span className="text-[10px] font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-wider mb-0.5">
                                            Hora
                                        </span>
                                        <span className="text-base font-bold text-gray-800 dark:text-[#f5f5f5]">
                                            {new Date(item.appointment_date).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-900 dark:text-[#f5f5f5] truncate text-[15px]">
                                                {item.patient_first_name || item.patient?.first_name} {item.patient_last_name || item.patient?.last_name}
                                            </h3>
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${item.status === "confirmed"
                                                    ? "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30"
                                                    : item.status === "pending"
                                                        ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30"
                                                        : item.status === "attended"
                                                            ? "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-800"
                                                            : "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30"
                                                    }`}
                                            >
                                                {getStatusLabel(item.status)}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                            <div className="flex items-center gap-1.5 py-0.5 rounded-lg">
                                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                                    {item.service_name || item.service?.name || "Consulta General"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-[#a3a3a3]">
                                                <FiClock size={13} className="text-gray-400" />
                                                <span className="font-medium">
                                                    Cita: {new Date(item.appointment_date).toLocaleTimeString("es-ES", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-[11px] font-medium text-gray-400 dark:text-[#737373] mt-1">
                                            ID: {item.patient_document_number || item.patient?.document_number}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 self-end md:self-center">
                                    <div className="flex items-center gap-1.5 mr-2 border-r border-gray-200 dark:border-[#262626] pr-4">
                                        {item.status === "pending" && (
                                            <button
                                                onClick={() => handleUpdateStatus(item.id, "confirmed")}
                                                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:text-[#a3a3a3] dark:hover:text-green-400 dark:hover:bg-green-900/20 rounded-lg transition-all cursor-pointer"
                                                title="Confirmar asistencia"
                                            >
                                                <FiCheckCircle size={20} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleUpdateStatus(item.id, "cancelled")}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-[#a3a3a3] dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-all cursor-pointer"
                                            title="Cancelar cita"
                                        >
                                            <FiXCircle size={20} />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => navigate(`/home/patients/${item.patient_id}`)}
                                        className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:text-blue-600 dark:text-[#f5f5f5] dark:hover:text-blue-400 transition-colors cursor-pointer bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#262626]"
                                    >
                                        <FiUser /> Perfil
                                    </button>

                                    <button
                                        onClick={() => navigate(`/home/ehr`, { state: { patientId: item.patient_id } })}
                                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all active:scale-[0.98] cursor-pointer"
                                    >
                                        <span>Atender</span>
                                        <FiArrowRight />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-20 text-center flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-[#161616] rounded-full flex items-center justify-center text-gray-300 dark:text-gray-700 border border-gray-100 dark:border-[#262626]">
                                <FiClock size={30} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-800 dark:text-[#f5f5f5]">
                                    No hay citas para hoy
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-[#737373] mt-1">
                                    Tu agenda está libre por el momento.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppointmentsAgenda;

