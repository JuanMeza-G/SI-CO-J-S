import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FiX, FiSave } from "react-icons/fi";
import Modal from "../Modal";
const patientSchema = z.object({
  document_type: z.enum(["CC", "TI", "CE", "Passport"], {
    errorMap: () => ({ message: "Tipo inválido" }),
  }),
  document_number: z.string().min(5, "Mínimo 5 caracteres"),
  first_name: z.string().min(2, "Mínimo 2 caracteres"),
  last_name: z.string().min(2, "Mínimo 2 caracteres"),
  birth_date: z.string().min(1, "La fecha de nacimiento es requerida"),
  gender: z.string().min(1, "El género es requerido"),
  marital_status: z.string().optional(),
  phone: z.string().min(7, "Mínimo 7 dígitos"),
  email: z.string().email("Email inválido").or(z.literal("")).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  eps: z.string().optional(),
  affiliation_number: z.string().optional(),
  occupation: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  general_notes: z.string().optional(),
});
const PatientModal = ({ isOpen, onClose, onSave, patient = null }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      status: "active",
      document_type: "CC",
    },
  });
  useEffect(() => {
    if (patient) {
      reset(patient);
    } else {
      reset({
        status: "active",
        document_type: "CC",
      });
    }
  }, [patient, reset, isOpen]);
  const onSubmit = async (data) => {
    await onSave(data);
    onClose();
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
      title={patient ? "Editar Paciente" : "Nuevo Paciente"}
      size="6xl"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 max-w-[95vw] md:max-w-6xl mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {}
          <div className="space-y-6">
            <div className="border-b border-gray-100 dark:border-[#262626] pb-2">
              <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                Información Personal
              </h3>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0">
                  Nombres
                </label>
                <input
                  {...register("first_name")}
                  placeholder="Nombres..."
                  className={getInputClass("first_name")}
                />
              </div>
              {errors.first_name && (
                <p className="text-red-500 text-[10px] ml-32">
                  {errors.first_name.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0">
                  Apellidos
                </label>
                <input
                  {...register("last_name")}
                  placeholder="Apellidos..."
                  className={getInputClass("last_name")}
                />
              </div>
              {errors.last_name && (
                <p className="text-red-500 text-[10px] ml-32">
                  {errors.last_name.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0">
                  Tipo Doc.
                </label>
                <select
                  {...register("document_type")}
                  className={getInputClass("document_type")}
                >
                  <option value="CC">Cédula</option>
                  <option value="TI">T.I.</option>
                  <option value="CE">C.E.</option>
                  <option value="Passport">Pasaporte</option>
                </select>
              </div>
              {errors.document_type && (
                <p className="text-red-500 text-[10px] ml-32">
                  {errors.document_type.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0">
                  N° Documento
                </label>
                <input
                  {...register("document_number")}
                  placeholder="Número..."
                  className={getInputClass("document_number")}
                />
              </div>
              {errors.document_number && (
                <p className="text-red-500 text-[10px] ml-32">
                  {errors.document_number.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0">
                  Nacimiento
                </label>
                <input
                  type="date"
                  {...register("birth_date")}
                  className={getInputClass("birth_date")}
                />
              </div>
              {errors.birth_date && (
                <p className="text-red-500 text-[10px] ml-32">
                  {errors.birth_date.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0">
                  Género
                </label>
                <select
                  {...register("gender")}
                  className={getInputClass("gender")}
                >
                  <option value="">Seleccione...</option>
                  <option value="Male">Masculino</option>
                  <option value="Female">Femenino</option>
                  <option value="Other">Otro</option>
                </select>
              </div>
              {errors.gender && (
                <p className="text-red-500 text-[10px] ml-32">
                  {errors.gender.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0">
                  Est. Civil
                </label>
                <input
                  {...register("marital_status")}
                  placeholder="Soltero, Casado..."
                  className={getInputClass("marital_status")}
                />
              </div>
            </div>
          </div>
          {}
          <div className="space-y-6">
            <div className="border-b border-gray-100 dark:border-[#262626] pb-2">
              <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                Contacto y Ubicación
              </h3>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0">
                  Teléfono
                </label>
                <input
                  {...register("phone")}
                  placeholder="300..."
                  className={getInputClass("phone")}
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-[10px] ml-32">
                  {errors.phone.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0">
                  Email
                </label>
                <input
                  {...register("email")}
                  placeholder="correo@..."
                  className={getInputClass("email")}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-[10px] ml-32">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0">
                  Dirección
                </label>
                <input
                  {...register("address")}
                  placeholder="Calle..."
                  className={getInputClass("address")}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0">
                  Ciudad
                </label>
                <input
                  {...register("city")}
                  placeholder="Cali"
                  className={getInputClass("city")}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0">
                  Dpto.
                </label>
                <input
                  {...register("state")}
                  placeholder="Valle..."
                  className={getInputClass("state")}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0">
                  Ocupación
                </label>
                <input
                  {...register("occupation")}
                  placeholder="Trabajo..."
                  className={getInputClass("occupation")}
                />
              </div>
            </div>
          </div>
          {}
          <div className="space-y-6">
            <div className="border-b border-gray-100 dark:border-[#262626] pb-2">
              <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                Administrativo y Emergencia
              </h3>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0">
                  EPS
                </label>
                <input
                  {...register("eps")}
                  placeholder="Nombre..."
                  className={getInputClass("eps")}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0">
                  N° Afiliac.
                </label>
                <input
                  {...register("affiliation_number")}
                  placeholder="N° contrato..."
                  className={getInputClass("affiliation_number")}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0">
                  Emergencia
                </label>
                <input
                  {...register("emergency_contact")}
                  placeholder="Nombre..."
                  className={getInputClass("emergency_contact")}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0">
                  Tef. Emer.
                </label>
                <input
                  {...register("emergency_phone")}
                  placeholder="Tel..."
                  className={getInputClass("emergency_phone")}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase">
                Notas Generales
              </label>
              <textarea
                {...register("general_notes")}
                placeholder="Observaciones..."
                className={`w-full bg-gray-50 dark:bg-[#1a1a1a] px-3 py-2 rounded-lg border outline-none text-sm dark:text-[#f5f5f5] h-24 resize-none transition-colors ${
                  errors.general_notes
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-200 dark:border-[#262626] focus:border-blue-500"
                }`}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
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
            <span>{isSubmitting ? "Guardando..." : "Guardar Paciente"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
export default PatientModal;
