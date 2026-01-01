import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { supabase } from "../../supabaseClient";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import Loader from "../Loader";
import { safeQuery } from "../../utils/supabaseHelpers";

const daysMap = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

const defaultSchedule = {
  monday: { enabled: true, start: "08:00", end: "18:00" },
  tuesday: { enabled: true, start: "08:00", end: "18:00" },
  wednesday: { enabled: true, start: "08:00", end: "18:00" },
  thursday: { enabled: true, start: "08:00", end: "18:00" },
  friday: { enabled: true, start: "08:00", end: "18:00" },
  saturday: { enabled: false, start: "09:00", end: "13:00" },
  sunday: { enabled: false, start: "09:00", end: "13:00" },
};


/** Componente para gestionar la información general de la clínica y horarios */
const ClinicInfo = forwardRef(({ onDirtyChange }, ref) => {
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [initialSchedule, setInitialSchedule] = useState(defaultSchedule);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm();

  useEffect(() => {
    fetchInfo();
  }, []);

  const fetchInfo = async () => {
    try {
      setLoading(true);
      const { data, error } = await safeQuery(
        () => supabase
          .from("clinic_info")
          .select("*")
          .single()
        // Usar valores por defecto: 20s timeout, 1 reintento, 60s máximo total
      );

      if (data) {
        const formData = {};
        Object.keys(data).forEach((key) => {
          if (key !== "business_hours") formData[key] = data[key];
        });
        reset(formData);

        if (data.business_hours) {
          setSchedule((prev) => ({ ...prev, ...data.business_hours }));
          setInitialSchedule((prev) => ({ ...prev, ...data.business_hours }));
        }
      } else if (error && error.code !== "PGRST116") {
        throw error;
      }
    } catch (error) {
      console.error("Error fetching clinic info:", error);

    } finally {
      setLoading(false);
    }
  };

  const handleScheduleChange = (day, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  useEffect(() => {
    const isScheduleChanged =
      JSON.stringify(schedule) !== JSON.stringify(initialSchedule);
    if (onDirtyChange) {
      onDirtyChange(isDirty || isScheduleChanged);
    }
  }, [isDirty, schedule, initialSchedule, onDirtyChange]);

  const onSubmit = async (formData) => {
    try {
      setLoading(true);

      const { id, ...dataToSave } = formData;

      const payload = {
        ...dataToSave,
        business_hours: schedule,
      };

      const { data: existing } = await supabase
        .from("clinic_info")
        .select("id")
        .single();

      if (existing) {
        const { error } = await supabase
          .from("clinic_info")
          .update(payload)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clinic_info").insert([payload]);
        if (error) throw error;
      }

      toast.success("Información actualizada correctamente");
      reset(dataToSave);
      setInitialSchedule(schedule);
    } catch (error) {
      console.error("Error saving clinic info:", error);
      toast.error("Error al guardar la información");
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    submitForm: () => {
      handleSubmit(onSubmit)();
    },
  }));

  if (loading) return <Loader text="Cargando información..." />;

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="px-0 sm:px-2">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-1/2">
              <h3 className="text-base sm:text-[17px] font-semibold text-gray-800 dark:text-[#e5e5e5] pb-4">
                Datos Generales
              </h3>
              <div className="space-y-4 bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626] rounded-lg p-3 sm:p-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#e5e5e5]">
                    Nombre del Centro
                  </label>
                  <input
                    type="text"
                    {...register("name")}
                    className="w-full text-sm px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all border-gray-300 dark:border-[#262626] bg-white dark:bg-[#1a1a1a] dark:text-[#f5f5f5] focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Centro Óptico Visual"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#e5e5e5]">
                    Eslogan / Subtítulo
                  </label>
                  <input
                    type="text"
                    {...register("slogan")}
                    className="w-full text-sm px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all border-gray-300 dark:border-[#262626] bg-white dark:bg-[#1a1a1a] dark:text-[#f5f5f5] focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Tu visión, nuestro compromiso"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#e5e5e5]">
                    Dirección
                  </label>
                  <input
                    type="text"
                    {...register("address")}
                    className="w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all border-gray-300 dark:border-[#262626] bg-white dark:bg-[#1a1a1a] dark:text-[#f5f5f5] focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Dirección completa"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-[#e5e5e5]">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      {...register("phone")}
                      className="w-full px-4 py-2 border text-sm rounded-lg focus:outline-none focus:ring-2 transition-all border-gray-300 dark:border-[#262626] bg-white dark:bg-[#1a1a1a] dark:text-[#f5f5f5] focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+57 300 123 4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-[#e5e5e5]">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      {...register("email")}
                      className="w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all border-gray-300 dark:border-[#262626] bg-white dark:bg-[#1a1a1a] dark:text-[#f5f5f5] focus:ring-blue-500 focus:border-blue-500"
                      placeholder="contacto@optica.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-1/2">
              <div className="space-y-4">
                <h3 className="text-base sm:text-[17px] font-semibold text-gray-800 dark:text-[#e5e5e5]">
                  Horarios de Atención
                </h3>
                <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626] rounded-lg p-3 sm:p-4">
                  <div className="space-y-3">
                    {Object.entries(daysMap).map(([key, label]) => (
                      <div
                        key={key}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 py-2.5 rounded-md border transition-colors ${schedule[key]?.enabled
                          ? "bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#262626]"
                          : "bg-gray-50/50 dark:bg-[#111111] border-gray-100 dark:border-[#1a1a1a]"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={schedule[key]?.enabled}
                            onChange={(e) =>
                              handleScheduleChange(
                                key,
                                "enabled",
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-[#1a1a1a] dark:border-[#262626] cursor-pointer flex-shrink-0"
                          />
                          <span
                            className={`text-sm font-medium ${schedule[key]?.enabled
                              ? "text-gray-800 dark:text-[#e5e5e5]"
                              : "text-gray-500 dark:text-[#a3a3a3]"
                              }`}
                          >
                            {label}
                          </span>
                        </div>

                        {schedule[key]?.enabled ? (
                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <input
                              type="time"
                              value={schedule[key]?.start}
                              onChange={(e) =>
                                handleScheduleChange(
                                  key,
                                  "start",
                                  e.target.value
                                )
                              }
                              className="px-2 py-1.5 text-sm border border-gray-300 dark:border-[#262626] rounded bg-white dark:bg-[#1a1a1a] dark:text-[#f5f5f5] focus:ring-1 focus:ring-blue-500 outline-none w-full sm:w-auto min-w-[100px]"
                            />
                            <span className="text-gray-400 dark:text-[#a3a3a3] text-sm">
                              a
                            </span>
                            <input
                              type="time"
                              value={schedule[key]?.end}
                              onChange={(e) =>
                                handleScheduleChange(key, "end", e.target.value)
                              }
                              className="px-2 py-1.5 text-sm border border-gray-300 dark:border-[#262626] rounded bg-white dark:bg-[#1a1a1a] dark:text-[#f5f5f5] focus:ring-1 focus:ring-blue-500 outline-none w-full sm:w-auto min-w-[100px]"
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-[#a3a3a3] italic">
                            Cerrado
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
});

export default ClinicInfo;
