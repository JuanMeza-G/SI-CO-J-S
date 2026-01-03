import React, { useState, useEffect } from "react";
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiCheckCircle,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "../../supabaseClient";
import { safeQuery } from "../../utils/supabaseHelpers";
import { toast } from "sonner";
import Breadcrumbs from "../Breadcrumbs";
import Loader from "../Loader";
const appointmentSchema = z.object({
  patient_id: z.string().min(1, "Por favor seleccione un paciente"),
  date: z.string().min(1, "La fecha es requerida"),
  start_time: z.string().min(1, "La hora de inicio es requerida"),
  end_time: z.string().min(1, "La hora de fin es requerida"),
  appointment_type: z.enum([
    "Control",
    "First Time",
    "Urgency",
    "Contact Lens Fitting",
  ]),
  consultation_reason: z.string().optional(),
  notes: z.string().optional(),
});
const AppointmentsNew = () => {
  const [patientSearch, setPatientSearch] = useState("");
  const [foundPatients, setFoundPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searching, setSearching] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      appointment_type: "First Time",
    },
  });
  const watchValues = watch();
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (patientSearch.length > 2) {
        setSearching(true);
        try {
          const { data, error } = await safeQuery(() =>
            supabase
              .from("patients")
              .select("id, first_name, last_name, document_number")
              .or(
                `first_name.ilike.%${patientSearch}%,last_name.ilike.%${patientSearch}%,document_number.ilike.%${patientSearch}%`
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
  }, [patientSearch]);
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setValue("patient_id", patient.id);
    setFoundPatients([]);
    setPatientSearch("");
  };
  const onSubmit = async (data) => {
    try {
      const { error } = await safeQuery(() =>
        supabase.from("appointments").insert([data])
      );
      if (error) throw error;
      toast.success("Cita agendada exitosamente");
      window.location.hash = "/home/appointments";
    } catch (error) {
      console.error("Error saving appointment:", error);
      toast.error("Error al agendar la cita");
    }
  };
  return (
    <div className="flex flex-col gap-6 p-4 sm:px-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 px-3">
        <Breadcrumbs
          items={[
            { label: "Citas", path: "/home/appointments" },
            { label: "Nueva Cita" },
          ]}
        />
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="md:col-span-2 space-y-6">
          <section className="bg-white dark:bg-[#111111] p-6 rounded-lg border-2 border-gray-200 dark:border-[#262626] space-y-6">
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-[10px] font-bold text-gray-400 dark:text-[#a3a3a3] uppercase tracking-widest">
                Paciente
              </label>
              {selectedPatient ? (
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      {selectedPatient.first_name[0]}
                      {selectedPatient.last_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold dark:text-[#f5f5f5]">
                        {selectedPatient.first_name} {selectedPatient.last_name}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-[#a3a3a3]">
                        {selectedPatient.document_number}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null);
                      setValue("patient_id", "");
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#1a1a1a] outline-none text-sm dark:text-[#f5f5f5] focus:border-blue-500 transition-colors"
                    placeholder="Buscar paciente por nombre o documento..."
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader size="xs" />
                    </div>
                  )}
                  {foundPatients.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#262626] rounded-lg shadow-xl z-10 overflow-hidden">
                      {foundPatients.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectPatient(p)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#262626] text-sm dark:text-[#e5e5e5] border-b border-gray-100 dark:border-[#262626] last:border-0"
                        >
                          <p className="font-bold">
                            {p.first_name} {p.last_name}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {p.document_number}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {errors.patient_id && (
                <p className="text-red-500 text-[10px]">
                  {errors.patient_id.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 dark:text-[#a3a3a3] uppercase tracking-widest">
                  Fecha
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    {...register("date")}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#1a1a1a] outline-none text-sm dark:text-[#f5f5f5] focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 dark:text-[#a3a3a3] uppercase tracking-widest">
                  Hora Inicio
                </label>
                <div className="relative">
                  <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="time"
                    {...register("start_time")}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#1a1a1a] outline-none text-sm dark:text-[#f5f5f5] focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 dark:text-[#a3a3a3] uppercase tracking-widest">
                  Hora Fin
                </label>
                <div className="relative">
                  <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="time"
                    {...register("end_time")}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#1a1a1a] outline-none text-sm dark:text-[#f5f5f5] focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 dark:text-[#a3a3a3] uppercase tracking-widest">
                Tipo de Servicio
              </label>
              <select
                {...register("appointment_type")}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#1a1a1a] outline-none text-sm dark:text-[#f5f5f5] focus:border-blue-500 transition-colors appearance-none"
              >
                <option value="First Time">Primera Vez</option>
                <option value="Control">Control / Seguimiento</option>
                <option value="Urgency">Urgencia</option>
                <option value="Contact Lens Fitting">
                  Adaptación Lentes de Contacto
                </option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 dark:text-[#a3a3a3] uppercase tracking-widest">
                Motivo de Consulta
              </label>
              <input
                type="text"
                {...register("consultation_reason")}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#1a1a1a] outline-none text-sm dark:text-[#f5f5f5] focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 dark:text-[#a3a3a3] uppercase tracking-widest">
                Notas
              </label>
              <textarea
                {...register("notes")}
                className="w-full p-4 rounded-lg border border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#1a1a1a] outline-none h-24 resize-none text-sm dark:text-[#f5f5f5] focus:border-blue-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600"
                placeholder="Notas adicionales..."
              ></textarea>
            </div>
          </section>
        </div>
        <div className="space-y-6">
          <section className="bg-white dark:bg-[#111111] p-5 rounded-lg border-2 border-gray-200 dark:border-[#262626]">
            <h2 className="font-bold text-sm dark:text-[#f5f5f5] mb-4 uppercase tracking-widest border-b border-gray-100 dark:border-[#262626] pb-3 text-blue-600 dark:text-blue-400">
              Resumen
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-[#a3a3a3]">
                  Paciente:
                </span>
                <span className="font-bold dark:text-[#f5f5f5] truncate max-w-[150px]">
                  {selectedPatient
                    ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
                    : "No seleccionado"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-[#a3a3a3]">
                  Fecha:
                </span>
                <span className="font-bold dark:text-[#f5f5f5]">
                  {watchValues.date || "-- / -- / ----"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-[#a3a3a3]">Hora:</span>
                <span className="font-bold dark:text-[#f5f5f5]">
                  {watchValues.start_time || "--:--"}
                </span>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold text-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <FiCheckCircle />
              <span>{isSubmitting ? "Confirmando..." : "Confirmar Cita"}</span>
            </button>
          </section>
          <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-lg text-orange-700 dark:text-orange-400">
            <p className="text-[11px] font-bold leading-relaxed italic">
              Asegúrese de verificar la disponibilidad en el calendario antes de
              confirmar el horario seleccionado.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
export default AppointmentsNew;
