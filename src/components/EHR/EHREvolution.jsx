import React, { useState, useEffect } from "react";
import { FiCalendar, FiExternalLink, FiSearch, FiChevronDown, FiChevronUp, FiActivity, FiEye, FiArrowRight, FiClock, FiFileText, FiDownload } from "react-icons/fi";
import Breadcrumbs from "../Breadcrumbs";
import { supabase } from "../../supabaseClient";
import { safeQuery } from "../../utils/supabaseHelpers";
import Loader from "../Loader";
import { generateEHR_PDF } from "../../utils/pdfGenerator";

const EHREvolution = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [foundPatients, setFoundPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searching, setSearching] = useState(false);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

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
                        *,
                        prescriptions (*),
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

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:px-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 px-3">
        <Breadcrumbs
          items={[
            { label: "Historia Clínica", path: "/home/ehr" },
            { label: "Evolución Histórica" },
          ]}
        />
      </div>

      {/* Selection Header */}
      <div className={`bg-white dark:bg-[#111111] p-4 rounded-lg border-2 ${selectedPatient ? 'border-blue-900 dark:border-blue-800' : 'border-gray-200 dark:border-[#262626]'}`}>
        {selectedPatient ? (
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold border-2 border-blue-100 dark:border-blue-900/40">
                {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
              </div>
              <div>
                <h2 className="font-black text-base dark:text-[#f5f5f5] uppercase tracking-tight">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </h2>
                <p className="text-[10px] font-black text-gray-400 dark:text-[#737373] uppercase tracking-widest">
                  CC: {selectedPatient.document_number}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedPatient(null)}
              className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest hover:underline cursor-pointer flex items-center gap-2 outline-none"
            >
              <FiSearch /> Cambiar Paciente
            </button>
          </div>
        ) : (
          <div className="relative w-full text-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre, documento o teléfono..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-[#262626] focus:ring-2 focus:ring-blue-500 outline-none transition dark:bg-[#1a1a1a] dark:text-[#f5f5f5] bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 mt-[1px]">
                <Loader size="xs" />
              </div>
            )}
            {foundPatients.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-[#262626] rounded-lg z-50 overflow-hidden divide-y divide-gray-100 dark:divide-[#262626]">
                {foundPatients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-blue-900/10 transition-colors flex items-center justify-between group/item outline-none"
                  >
                    <div>
                      <p className="font-black text-sm dark:text-[#f5f5f5] uppercase tracking-tight group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        CC: {p.document_number}
                      </p>
                    </div>
                    <FiArrowRight className="text-gray-300 group-hover/item:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader />
          </div>
        ) : selectedPatient ? (
          consultations.length > 0 ? (
            consultations.map((item) => (
              <div
                key={item.id}
                className={`bg-white dark:bg-[#111111] rounded-lg border-2 overflow-hidden transition-all duration-300 shadow-none ${expandedId === item.id ? 'border-gray-500 dark:border-[#404040]' : 'border-gray-200 dark:border-[#262626] hover:border-gray-300'}`}
              >
                <div
                  className={`px-6 py-4 border-b border-gray-200 dark:border-[#262626] flex justify-between items-center cursor-pointer transition-colors ${expandedId === item.id ? 'bg-gray-50 dark:bg-[#161616]' : 'bg-gray-50 dark:bg-[#1a1a1a]'}`}
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg border transition-colors ${expandedId === item.id ? 'bg-gray-800 text-white border-gray-800' : 'bg-white dark:bg-[#0a0a0a] text-blue-600 dark:text-blue-400 border-gray-200 dark:border-[#262626]'}`}>
                      <FiCalendar size={18} />
                    </div>
                    <div>
                      <span className="font-black text-xs text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                        {new Date(item.consultation_date).toLocaleDateString(
                          "es-ES",
                          { day: "2-digit", month: "long", year: "numeric" }
                        )}
                      </span>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mt-0.5">Consulta Optométrica</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        generateEHR_PDF(selectedPatient, item);
                      }}
                      className="p-2 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-[#262626] transition-all active:scale-90 cursor-pointer"
                      title="Descargar PDF"
                    >
                      <FiDownload size={18} />
                    </button>
                    <span className="text-[9px] font-black px-2 py-1 bg-gray-100 dark:bg-[#262626] text-gray-500 rounded uppercase tracking-widest border border-gray-200 dark:border-[#333333]">
                      CIE-10: {item.cie10_code || "N/A"}
                    </span>
                    <FiChevronDown
                      className={`transition-transform duration-500 ${expandedId === item.id ? 'rotate-180 text-blue-500' : 'text-gray-300'}`}
                      size={20}
                    />
                  </div>
                </div>

                <div className={`grid transition-all duration-500 ease-in-out ${expandedId === item.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                          <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                            <FiFileText className="text-blue-500" /> Motivo de Consulta
                          </h3>
                          <p className="font-black text-sm dark:text-[#f5f5f5] leading-tight uppercase tracking-tight line-clamp-2">
                            {item.notes || "Sin motivo registrado"}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-[10px] font-black text-blue-600/60 dark:text-blue-400/60 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                            <FiActivity className="text-blue-500" /> Diagnóstico Principal
                          </h3>
                          <p className="font-black text-base dark:text-[#f5f5f5] leading-tight uppercase tracking-tight">
                            {item.primary_diagnosis || "Sin diagnóstico registrado"}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3">
                            Plan de Manejo
                          </h3>
                          <p className="text-gray-600 dark:text-[#a3a3a3] text-sm leading-relaxed italic border-l-4 border-blue-100 dark:border-blue-900/30 pl-4 font-medium">
                            {item.plan || "No se registraron observaciones específicas."}
                          </p>
                        </div>
                      </div>

                      <div className="mt-8 pt-8 border-t border-gray-200 dark:border-[#262626]">
                        <div className="grid grid-cols-1 grid-rows-1 lg:grid-cols-2 gap-10">
                          {/* Clinical Findings */}
                          <div className="space-y-6">
                            <h4 className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                              Hallazgos Clínicos
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <DetailItem label="AV OD" value={item.visual_acuity_od} />
                              <DetailItem label="AV OI" value={item.visual_acuity_os} />
                              <DetailItem label="RX OD" value={item.refraction_od} />
                              <DetailItem label="RX OI" value={item.refraction_os} />
                              <div className="col-span-2">
                                <DetailItem label="Presión Intraocular" value={item.intraocular_pressure} />
                              </div>
                              <div className="col-span-2">
                                <DetailItem label="Estado de Fondo de Ojo" value={item.fundus_exam} />
                              </div>
                            </div>
                          </div>

                          {/* Prescriptions */}
                          <div className="space-y-6">
                            <h4 className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                              Prescripción Óptica
                            </h4>
                            {item.prescriptions && item.prescriptions.length > 0 ? (
                              <div className="bg-blue-50/20 dark:bg-blue-900/5 p-5 rounded-lg border border-blue-100 dark:border-blue-900/20 shadow-none">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-gray-400 uppercase font-black text-[9px] text-center tracking-widest">
                                      <th className="pb-3 text-left">Ojo</th>
                                      <th className="pb-3 text-center">Esf</th>
                                      <th className="pb-3 text-center">Cil</th>
                                      <th className="pb-3 text-center">Eje</th>
                                      <th className="pb-3 text-center">Add</th>
                                    </tr>
                                  </thead>
                                  <tbody className="font-black dark:text-[#f5f5f5]">
                                    <tr className="border-b border-blue-50 dark:border-blue-900/20">
                                      <td className="py-2 text-blue-600 dark:text-blue-500 font-black">OD</td>
                                      <td className="text-center">{item.prescriptions[0].sphere_od}</td>
                                      <td className="text-center">{item.prescriptions[0].cylinder_od}</td>
                                      <td className="text-center">{item.prescriptions[0].axis_od}</td>
                                      <td className="text-center">{item.prescriptions[0].addition_od}</td>
                                    </tr>
                                    <tr>
                                      <td className="py-2 text-blue-600 dark:text-blue-500 font-black">OI</td>
                                      <td className="text-center">{item.prescriptions[0].sphere_os}</td>
                                      <td className="text-center">{item.prescriptions[0].cylinder_os}</td>
                                      <td className="text-center">{item.prescriptions[0].axis_os}</td>
                                      <td className="text-center">{item.prescriptions[0].addition_os}</td>
                                    </tr>
                                  </tbody>
                                </table>
                                <div className="mt-4 pt-4 border-t border-blue-50 dark:border-blue-900/20 grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-1">Tipo de Lente</p>
                                    <p className="text-[11px] font-black dark:text-[#f5f5f5] uppercase">{item.prescriptions[0].lens_type || "N/A"}</p>
                                  </div>
                                  <div>
                                    <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-1">Uso Sugerido</p>
                                    <p className="text-[11px] font-black dark:text-[#f5f5f5] uppercase">{item.prescriptions[0].recommended_use || "N/A"}</p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center p-8 bg-gray-50/50 dark:bg-[#161616] rounded-lg border-2 border-dashed border-gray-200 dark:border-[#262626]">
                                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">No se registró fórmula óptica en esta sesión.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-[#111111] border-2 border-dashed border-gray-200 dark:border-[#262626] rounded-lg p-12 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-none">
              <h3 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em]">Sin Consultas Registradas</h3>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-2 font-bold uppercase tracking-widest leading-relaxed max-w-xs">
                Este paciente aún no registra evolución clínica o consultas previas
              </p>
            </div>
          )
        ) : (
          <div className="bg-white dark:bg-[#111111] border-2 border-gray-200 dark:border-[#262626] rounded-lg p-16 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-none">
            <div className="max-w-md">
              <h3 className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.4em] mb-2">Historial Clínico</h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-[0.2em] leading-relaxed">
                Busque un paciente para visualizar su evolución histórica, diagnósticos y consultas pasadas
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DetailItem = ({ label, value }) => (
  <div className="flex flex-col gap-1 pb-2 border-b-2 border-gray-100 dark:border-[#1a1a1a]">
    <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</span>
    <span className="text-xs font-bold dark:text-[#f5f5f5] uppercase">{value || "---"}</span>
  </div>
);

export default EHREvolution;
