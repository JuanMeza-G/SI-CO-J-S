import React, { useState, useEffect } from "react";
import { FiClock, FiUser, FiArrowRight } from "react-icons/fi";
import Breadcrumbs from "../Breadcrumbs";
import { supabase } from "../../supabaseClient";
import { safeQuery } from "../../utils/supabaseHelpers";
import { toast } from "sonner";
import Loader from "../Loader";
const AppointmentsWaiting = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchQueue = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await safeQuery(() =>
        supabase
          .from("appointments")
          .select(
            `
                        id,
                        start_time,
                        appointment_type,
                        status,
                        patient:patients (
                            id,
                            first_name,
                            last_name
                        )
                    `
          )
          .eq("date", today)
          .eq("status", "Confirmed")
          .order("start_time", { ascending: true })
      );
      if (!error) {
        setQueue(data || []);
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchQueue();
  }, []);
  const handleCall = async (appointmentId) => {
    try {
      const { error } = await safeQuery(() =>
        supabase
          .from("appointments")
          .update({ status: "Attended" })
          .eq("id", appointmentId)
      );
      if (error) throw error;
      toast.success(
        "Paciente llamado. El estado de la cita ahora es 'Atendida'."
      );
      fetchQueue();
    } catch (error) {
      toast.error("Error al actualizar el estado");
    }
  };
  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    return `${hours}:${minutes}`;
  };
  const getAppTypeLabel = (type) => {
    const types = {
      "First Time": "Primera Vez",
      Control: "Control / Seguimiento",
      Urgency: "Urgencia",
      "Contact Lens Fitting": "Adaptación Lentes",
    };
    return types[type] || type;
  };
  return (
    <div className="flex flex-col gap-6 p-4 sm:px-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 px-3">
        <Breadcrumbs
          items={[
            { label: "Citas", path: "/home/appointments" },
            { label: "Lista de Espera" },
          ]}
        />
      </div>
      <div className="grid gap-3">
        {loading ? (
          <div className="text-center py-10">
            <Loader />
          </div>
        ) : queue.length > 0 ? (
          queue.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#111111] px-5 py-4 rounded-lg border-2 border-gray-200 dark:border-[#262626] flex items-center justify-between group hover:border-gray-300 dark:hover:border-[#2a2a2a] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-base border border-blue-100 dark:border-blue-900/30">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="font-bold text-base dark:text-[#f5f5f5]">
                    {item.patient?.first_name} {item.patient?.last_name}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] font-medium text-gray-500 dark:text-[#a3a3a3] uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <FiClock className="text-blue-500/70" />{" "}
                      {formatTime(item.start_time)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#262626]" />
                    <span className="flex items-center gap-1.5">
                      <FiUser className="text-blue-500/70" />{" "}
                      {getAppTypeLabel(item.appointment_type)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => handleCall(item.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2 text-sm font-bold"
                >
                  <span className="hidden sm:inline">Llamar</span>
                  <FiArrowRight />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-gray-50 dark:bg-[#0d0d0d] rounded-lg border-2 border-dashed border-gray-200 dark:border-[#262626]">
            <p className="text-sm font-medium text-gray-400 dark:text-[#a3a3a3]">
              No hay pacientes esperando en este momento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
export default AppointmentsWaiting;
