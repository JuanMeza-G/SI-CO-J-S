import React, { useState, useEffect } from "react";
import { FiClock, FiUser, FiMoreVertical } from "react-icons/fi";
import Breadcrumbs from "../Breadcrumbs";
import { supabase } from "../../supabaseClient";
import { safeQuery } from "../../utils/supabaseHelpers";
import Loader from "../Loader";
const AppointmentsAgenda = () => {
  const [agenda, setAgenda] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchAgenda = async () => {
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
          .order("start_time", { ascending: true })
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
  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
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
  const getStatusInfo = (status) => {
    switch (status) {
      case "Attended":
        return {
          label: "Atendida",
          classes:
            "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
        };
      case "Confirmed":
        return {
          label: "Confirmada",
          classes:
            "bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
        };
      case "Scheduled":
        return {
          label: "Programada",
          classes:
            "bg-gray-50 text-gray-600 border-gray-200 dark:bg-[#1a1a1a] dark:text-[#a3a3a3] dark:border-[#262626]",
        };
      default:
        return {
          label: status,
          classes: "bg-gray-50 text-gray-600 border-gray-200",
        };
    }
  };
  return (
    <div className="flex flex-col gap-6 p-4 sm:px-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 px-3">
        <Breadcrumbs
          items={[
            { label: "Citas", path: "/home/appointments" },
            { label: "Agenda" },
          ]}
        />
      </div>
      <div className="relative border-l-2 border-blue-500 ml-4 space-y-6 py-2">
        {loading ? (
          <div className="pl-8 py-10">
            <Loader size="md" />
          </div>
        ) : agenda.length > 0 ? (
          agenda.map((item) => {
            const statusInfo = getStatusInfo(item.status);
            return (
              <div key={item.id} className="relative pl-8">
                <div className="absolute -left-[11px] top-6 w-5 h-5 rounded-full bg-blue-500 border-4 border-white dark:border-[#0a0a0a] shadow-sm" />
                <div className="bg-white dark:bg-[#111111] p-4 rounded-lg border-2 border-gray-200 dark:border-[#262626] transition-all hover:border-gray-300 dark:hover:border-[#2a2a2a] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-blue-600 border border-gray-200 dark:border-[#262626]">
                      <FiClock size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          {formatTime(item.start_time)}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#262626]" />
                        <span className="text-[11px] font-bold text-gray-400 dark:text-[#a3a3a3] uppercase tracking-widest">
                          {getAppTypeLabel(item.appointment_type)}
                        </span>
                      </div>
                      <h3 className="font-bold text-base dark:text-[#f5f5f5]">
                        {item.patient?.first_name} {item.patient?.last_name}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border ${statusInfo.classes}`}
                    >
                      {statusInfo.label}
                    </span>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-lg transition-colors cursor-pointer dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] border border-transparent hover:border-gray-200 dark:hover:border-[#262626]">
                      <FiMoreVertical />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="pl-8 py-10 text-gray-500 text-sm italic">
            No hay citas programadas para hoy.
          </div>
        )}
      </div>
    </div>
  );
};
export default AppointmentsAgenda;
