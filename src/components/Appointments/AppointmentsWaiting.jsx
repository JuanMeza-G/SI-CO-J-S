import React, { useState, useEffect } from "react";
import {
  FiClock,
  FiUser,
  FiArrowRight,
  FiActivity,
  FiUserCheck,
  FiExternalLink,
  FiBell
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Breadcrumbs from "../Breadcrumbs";
import { supabase } from "../../supabaseClient";
import { safeQuery } from "../../utils/supabaseHelpers";
import { toast } from "sonner";
import { getStatusLabel } from "../../utils/appointmentUtils";
import Loader from "../Loader";

const AppointmentsWaiting = () => {
  const [waitingList, setWaitingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchWaitingList = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await safeQuery(() =>
        supabase
          .from("appointments_view")
          .select("*")
          .eq("status", "confirmed")
          .gte("appointment_date", today)
          .lt("appointment_date", new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0])
          .order("appointment_date", { ascending: true })
      );
      if (!error) {
        setWaitingList(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitingList();
  }, []);

  const handleCall = async (item) => {
    try {
      // Update status to attended - Now supported by DB constraint
      const { error } = await safeQuery(() =>
        supabase
          .from("appointments")
          .update({ status: "attended" })
          .eq("id", item.id)
      );

      if (error) throw error;

      toast.success(`Llamando a ${item.patient_first_name || item.patient?.first_name}. Estado: ${getStatusLabel("attended")}`);

      // Navigate to EHR passing the patient ID
      setTimeout(() => {
        navigate(`/home/ehr`, { state: { patientId: item.patient_id } });
      }, 500);

    } catch (error) {
      console.error("Error al llamar al paciente:", error);
      toast.error("Error al actualizar el estado");
      // Fallback navigation even on error
      navigate(`/home/ehr`, { state: { patientId: item.patient_id } });
    }
  };

  const getAppTypeLabel = (item) => {
    return item.service_name || item.service?.name || "Sin servicio";
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:px-6 max-w-7xl mx-auto w-full">
      {/* Header section with Breadcrumbs and Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 px-3">
        <Breadcrumbs
          items={[
            { label: "Citas", path: "/home/appointments" },
            { label: "Lista de Espera" },
          ]}
        />
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-wider leading-tight mb-1">
              Pacientes Hoy
            </p>
            <div className="flex items-center justify-end gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight">
                  {waitingList.length} en espera
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111111] rounded-lg border-2 border-gray-200 dark:border-[#262626] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-[#262626] flex justify-between items-center text-[#111111] dark:text-[#f5f5f5] bg-white dark:bg-[#111111]">
          <h2 className="font-bold text-base dark:text-[#f5f5f5] flex items-center gap-2">
            <FiUserCheck className="text-blue-500" /> Orden de Atención
          </h2>
          <span className="text-[10px] font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-wider">
            Actualizado: {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-[#262626]">
          {loading ? (
            <div className="p-20 text-center">
              <Loader />
            </div>
          ) : waitingList.length > 0 ? (
            waitingList.map((item, idx) => (
              <div
                key={item.id}
                className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center min-w-[55px] h-[55px] bg-gray-50 dark:bg-[#161616] rounded-lg border border-gray-200 dark:border-[#262626]">
                    <span className="text-[10px] font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-wider mb-0.5">
                      #
                    </span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {idx + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-[#f5f5f5] truncate text-[16px] mb-1">
                      {item.patient_first_name || item.patient?.first_name} {item.patient_last_name || item.patient?.last_name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-[#a3a3a3]">
                        <FiClock size={13} className="text-blue-500/70" />
                        <span className="font-semibold">Cita:</span> {new Date(item.appointment_date).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#262626]" />
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                        <FiActivity size={13} />
                        {getAppTypeLabel(item)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <button
                    onClick={() => navigate(`/home/patients/${item.patient_id}`)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:text-blue-600 dark:text-[#f5f5f5] dark:hover:text-blue-400 transition-colors cursor-pointer bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#262626]"
                  >
                    <FiExternalLink /> Perfil
                  </button>

                  <button
                    onClick={() => handleCall(item)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2 text-xs font-bold"
                  >
                    <span>Llamar</span>
                    <FiBell />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 text-center flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-gray-50 dark:bg-[#161616] rounded-full flex items-center justify-center text-gray-300 dark:text-gray-700 border border-gray-100 dark:border-[#262626]">
                <FiUserCheck size={30} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800 dark:text-[#f5f5f5]">
                  Lista de espera vacía
                </h3>
                <p className="text-sm text-gray-500 dark:text-[#737373] mt-1">
                  No hay pacientes confirmados esperando atención.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentsWaiting;

