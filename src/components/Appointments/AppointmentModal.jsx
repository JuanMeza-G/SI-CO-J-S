import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "../../supabaseClient";
import { safeQuery } from "../../utils/supabaseHelpers";
import { toast } from "sonner";
import Modal from "../Modal";
import Loader from "../Loader";

const appointmentSchema = z.object({
  patient_id: z.string().min(1, "Por favor seleccione un paciente"),
  date: z
    .string()
    .min(1, "La fecha es requerida")
    .refine((val) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(val + "T00:00:00");
      return selected >= today;
    }, "No se pueden agendar citas en fechas pasadas"),
  start_time: z.string().min(1, "La hora de inicio es requerida"),
  service_id: z.string().min(1, "El tipo de servicio es requerido"),
  consultation_reason: z.string().optional(),
  notes: z.string().optional(),
});

// serviceTypeMap and getInvertedMap are no longer strictly needed but kept for potential legacy uses if any

const AppointmentModal = ({
  isOpen,
  onClose,
  onSave,
  initialPatient = null,
  selectedDate = null,
}) => {
  const [patientSearch, setPatientSearch] = useState("");
  const [foundPatients, setFoundPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searching, setSearching] = useState(false);
  const [services, setServices] = useState([]);
  const [clinicSchedule, setClinicSchedule] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: "",
      date: new Date().toISOString().split("T")[0],
      service_id: "",
      notes: "",
    },
  });

  const watchValues = watch();

  useEffect(() => {
    if (isOpen) {
      if (initialPatient) {
        setSelectedPatient(initialPatient);
        setValue("patient_id", initialPatient.id);
      } else {
        setSelectedPatient(null);
        setPatientSearch("");
      }

      const defaultDate = selectedDate || new Date().toISOString().split("T")[0];

      reset({
        patient_id: initialPatient ? initialPatient.id : "",
        date: defaultDate,
        service_id: watchValues.service_id || "",
        notes: "",
      });
    }
  }, [isOpen, initialPatient, selectedDate, setValue, reset]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoadingConfig(true);
        const [servicesRes, clinicRes] = await Promise.all([
          safeQuery(() => supabase.from("services").select("*").order("name")),
          safeQuery(() =>
            supabase.from("clinic_info").select("business_hours").single()
          ),
        ]);

        if (servicesRes.data) {
          setServices(servicesRes.data);
          if (servicesRes.data.length > 0 && !watchValues.service_id) {
            setValue("service_id", String(servicesRes.data[0].id));
          }
        }
        if (clinicRes.data) {
          setClinicSchedule(clinicRes.data.business_hours);
        }
      } catch (error) {
        console.error("Error loading config:", error);
      } finally {
        setLoadingConfig(false);
      }
    };

    if (isOpen) fetchConfig();
  }, [isOpen, setValue]);

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
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setValue("patient_id", patient.id);
    setFoundPatients([]);
    setPatientSearch("");
  };

  const isWithinSchedule = () => {
    if (!clinicSchedule || !watchValues.date || !watchValues.start_time)
      return true;
    const date = new Date(watchValues.date + "T00:00:00");
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayName = days[date.getDay()];
    const dayConfig = clinicSchedule[dayName];
    if (!dayConfig || !dayConfig.enabled) return false;
    const start = watchValues.start_time;
    return start >= dayConfig.start && start <= dayConfig.end;
  };

  const scheduleStatus = isWithinSchedule();

  const onSubmit = async (data) => {
    if (!scheduleStatus) {
      toast.error("No se puede agendar fuera de los horarios de atención");
      return;
    }

    const localDate = new Date(`${data.date}T${data.start_time}:00`);
    const appointment_date = localDate.toISOString();
    const { date, start_time, ...otherData } = data;

    const result = await onSave({
      ...otherData,
      appointment_date,
    });
    if (result) onClose();
  };

  const getInputClass = (fieldName) => {
    const baseClass =
      "flex-1 bg-gray-50 dark:bg-[#1a1a1a] px-3 py-1.5 rounded-lg border outline-none text-sm dark:text-[#f5f5f5] transition-colors";
    const stateClass = errors[fieldName]
      ? "border-red-500 ring-1 ring-red-500/20 focus:border-red-500"
      : "border-gray-200 dark:border-[#262626] focus:border-blue-500";
    return `${baseClass} ${stateClass}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AGENDAR NUEVA CITA"
      size="2xl"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 max-w-2xl mx-auto"
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0">
                Paciente
              </label>
              <div className="flex-1 relative">
                {selectedPatient ? (
                  <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold dark:text-[#f5f5f5] truncate">
                        {selectedPatient.first_name} {selectedPatient.last_name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                        ID: {selectedPatient.document_number}
                      </p>
                    </div>
                    {!initialPatient && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatient(null);
                          setValue("patient_id", "");
                        }}
                        className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest cursor-pointer ml-2"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className={getInputClass("patient_id")}
                      placeholder="Buscar..."
                    />
                    {searching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader size="xs" />
                      </div>
                    )}
                    {patientSearch.length > 2 &&
                      !searching &&
                      foundPatients.length === 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#262626] rounded-lg shadow-xl z-50 p-2 text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">
                            Sin resultados
                          </p>
                        </div>
                      )}
                    {foundPatients.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#262626] rounded-lg shadow-2xl z-50 overflow-hidden divide-y divide-gray-100 dark:divide-[#262626]">
                        {foundPatients.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectPatient(p)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#212121] transition-colors cursor-pointer"
                          >
                            <p className="font-bold text-xs uppercase dark:text-[#f5f5f5]">
                              {p.first_name} {p.last_name}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold">
                              {p.document_number}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            {errors.patient_id && (
              <p className="text-red-500 text-[10px] ml-32">
                {errors.patient_id.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0">
                Tipo Servicio
              </label>
              <select
                {...register("service_id")}
                className={getInputClass("service_id")}
              >
                <option value="">Seleccione...</option>
                {services.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0">
                Fecha
              </label>
              <input
                type="date"
                {...register("date")}
                className={getInputClass("date")}
              />
            </div>
            {errors.date && (
              <p className="text-red-500 text-[10px] ml-32">
                {errors.date.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0">
                Hora Inicio
              </label>
              <input
                type="time"
                {...register("start_time")}
                className={getInputClass("start_time")}
              />
            </div>
            {errors.start_time && (
              <p className="text-red-500 text-[10px] ml-32">
                {errors.start_time.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-4">
              <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0 mt-2">
                Notas
              </label>
              <textarea
                {...register("notes")}
                placeholder="Observaciones internas..."
                className={`flex-1 bg-gray-50 dark:bg-[#1a1a1a] px-3 py-2 rounded-lg border outline-none text-sm dark:text-[#f5f5f5] h-24 resize-none transition-colors ${errors.notes
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-200 dark:border-[#262626] focus:border-blue-500"
                  }`}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <span>{isSubmitting ? "Agendando..." : "Confirmar Cita"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AppointmentModal;
