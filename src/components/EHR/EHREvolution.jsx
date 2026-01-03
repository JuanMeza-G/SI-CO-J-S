import React, { useState, useEffect } from "react";
import { FiCalendar, FiExternalLink, FiSearch } from "react-icons/fi";
import Breadcrumbs from "../Breadcrumbs";
import { supabase } from "../../supabaseClient";
import { safeQuery } from "../../utils/supabaseHelpers";
import Loader from "../Loader";
const EHREvolution = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [foundPatients, setFoundPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searching, setSearching] = useState(false);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.length > 2) {
        setSearching(true);
        try {
          const { data, error } = await safeQuery(() =>
            supabase
              .from("patients")
              .select("id, first_name, last_name, document_number")
              .or(
                `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,document_number.ilike.%${searchTerm}%`
              )
              .limit(5)
          );
          if (!error) setFoundPatients(data || []);
        } finally {
          setSearching(false);
        }
      } else {
        setFoundPatients([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setFoundPatients([]);
    setSearchTerm("");
    setLoading(true);
    try {
      const { data, error } = await safeQuery(() =>
        supabase
          .from("optometric_consultations")
          .select(
            `
                        id,
                        consultation_date,
                        primary_diagnosis,
                        plan,
                        medical_histories!inner (
                            patient_id
                        )
                    `
          )
          .eq("medical_histories.patient_id", patient.id)
          .order("consultation_date", { ascending: false })
      );
      if (!error) {
        setConsultations(data || []);
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col gap-6 p-4 sm:px-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 px-3">
        <Breadcrumbs
          items={[
            { label: "Historia Clínica", path: "/home/ehr" },
            { label: "Evolución" },
          ]}
        />
      </div>
      {}
      <div className="bg-white dark:bg-[#111111] p-4 rounded-lg border-2 border-gray-200 dark:border-[#262626] relative">
        {selectedPatient ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-bold dark:text-[#f5f5f5] text-sm uppercase tracking-wider">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                  {selectedPatient.document_number}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedPatient(null)}
              className="text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest hover:underline cursor-pointer"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar paciente para ver evolución..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#262626] dark:bg-[#1a1a1a] dark:text-[#f5f5f5] outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader size="xs" />
              </div>
            )}
            {foundPatients.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#262626] rounded-lg z-20">
                {foundPatients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-[#202020] border-b dark:border-[#262626] last:border-0"
                  >
                    <p className="font-bold text-sm dark:text-[#f5f5f5]">
                      {p.first_name} {p.last_name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {p.document_number}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader />
          </div>
        ) : consultations.length > 0 ? (
          consultations.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#111111] rounded-lg border-2 border-gray-200 dark:border-[#262626] overflow-hidden transition-all hover:border-gray-300 dark:hover:border-[#2a2a2a]"
            >
              <div className="px-5 py-3 bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-[#262626] flex justify-between items-center">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                  <span className="uppercase tracking-wider">
                    {new Date(item.consultation_date).toLocaleDateString(
                      "es-ES",
                      { day: "2-digit", month: "short", year: "numeric" }
                    )}
                  </span>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1.5">
                    Diagnóstico
                  </h3>
                  <p className="font-bold text-base dark:text-[#f5f5f5]">
                    {item.primary_diagnosis || "Sin diagnóstico"}
                  </p>
                </div>
                <div>
                  <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1.5">
                    Plan / Recomendaciones
                  </h3>
                  <p className="text-gray-600 dark:text-[#a3a3a3] text-sm leading-relaxed border-l-2 border-gray-100 dark:border-[#262626] pl-4">
                    {item.plan || "Sin observaciones."}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : selectedPatient ? (
          <div className="text-center py-16 bg-gray-50 dark:bg-[#111111] rounded-lg border-2 border-dashed border-gray-200 dark:border-[#262626]">
            <p className="text-sm font-medium text-gray-400 dark:text-[#a3a3a3]">
              Este paciente no tiene consultas registradas todavía.
            </p>
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 dark:bg-[#111111] rounded-lg border-2 border-dashed border-gray-200 dark:border-[#262626]">
            <p className="text-sm font-medium text-gray-400 dark:text-[#a3a3a3]">
              Seleccione un paciente para ver su historial de consultas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
export default EHREvolution;
