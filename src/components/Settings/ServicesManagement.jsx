import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { supabase } from "../../supabaseClient";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { FaTrash, FaEdit, FaPlus, FaGlasses } from "react-icons/fa";
import { FiClipboard } from "react-icons/fi";
import Modal from "../Modal";
import Loader from "../Loader";
import ConfirmModal from "../ConfirmModal";
import { safeQuery } from "../../utils/supabaseHelpers";
const ServicesManagement = forwardRef((props, ref) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();
  useEffect(() => {
    fetchServices();
  }, []);
  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await safeQuery(
        () => supabase
          .from("services")
          .select("*")
          .order("name")
      );
      if (error) {
        toast.error("No se pudieron cargar los servicios. Por favor, verifica tu conexión.");
        return;
      }
      setServices(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error al intentar cargar los servicios.");
      setServices([]);
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (service) => {
    setCurrentService(service);
    setValue("name", service.name);
    setValue("description", service.description);
    setValue("price", service.price);
    setValue("duration_minutes", service.duration_minutes);
    setIsModalOpen(true);
  };
  const confirmDelete = (service) => {
    setServiceToDelete(service);
    setDeleteModalOpen(true);
  };
  const handleDelete = async () => {
    if (!serviceToDelete) return;
    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", serviceToDelete.id);
      if (error) throw error;
      setServices((prev) => prev.filter((s) => s.id !== serviceToDelete.id));
      toast.success("Servicio eliminado");
    } catch (error) {
      toast.error("Error al eliminar");
      console.error(error);
    } finally {
      setDeleteModalOpen(false);
      setServiceToDelete(null);
    }
  };
  const onSubmit = async (data) => {
    try {
      let error;
      if (currentService) {
        const { error: updateError, data: updatedData } = await supabase
          .from("services")
          .update(data)
          .eq("id", currentService.id)
          .select()
          .single();
        if (updateError) throw updateError;
        setServices((prev) =>
          prev.map((s) => (s.id === currentService.id ? updatedData : s))
        );
      } else {
        const { error: insertError, data: newData } = await supabase
          .from("services")
          .insert([data])
          .select()
          .single();
        if (insertError) throw insertError;
        setServices((prev) =>
          [...prev, newData].sort((a, b) => a.name.localeCompare(b.name))
        );
      }
      toast.success(
        currentService ? "Servicio actualizado" : "Servicio creado"
      );
      setIsModalOpen(false);
      reset();
      setCurrentService(null);
    } catch (error) {
      toast.error("Error al guardar servicio");
      console.error(error);
    }
  };
  const openNewModal = () => {
    setCurrentService(null);
    reset();
    setIsModalOpen(true);
  };
  useImperativeHandle(ref, () => ({
    openNewModal,
  }));
  if (loading) return <Loader text="Cargando servicios..." />;
  return (
    <div className="flex flex-col gap-6">
      <div className="hidden md:block overflow-hidden bg-white dark:bg-[#111111] rounded-lg border-2 border-gray-200 dark:border-[#262626]">
        <table className="w-full text-left text-gray-500 dark:text-[#a3a3a3]">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-[#1a1a1a] dark:text-[#a3a3a3] border-b border-gray-200 dark:border-[#262626]">
            <tr>
              <th scope="col" className="px-6 py-3 font-semibold">
                Nombre
              </th>
              <th scope="col" className="px-6 py-3 font-semibold">
                Descripción
              </th>
              <th scope="col" className="px-6 py-3 font-semibold">
                Precio
              </th>
              <th scope="col" className="px-6 py-3 font-semibold">
                Duración
              </th>
              <th scope="col" className="px-6 py-3 font-semibold text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-[#262626]">
            {services.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-8 text-center text-gray-500 dark:text-[#a3a3a3]"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FaGlasses className="text-4xl text-gray-300 dark:text-[#1a1a1a]" />
                    <p>No hay servicios registrados</p>
                  </div>
                </td>
              </tr>
            ) : (
              services.map((service) => (
                <tr
                  key={service.id}
                  className="bg-white dark:bg-[#111111] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors duration-150"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-[#f5f5f5]">
                    {service.name}
                  </td>
                  <td
                    className="px-6 py-4 max-w-xs truncate text-gray-600 dark:text-[#e5e5e5]"
                    title={service.description}
                  >
                    {service.description || (
                      <span className="text-gray-400 dark:text-[#a3a3a3] italic">
                        Sin descripción
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-green-600 dark:text-green-400 font-medium">
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                    }).format(service.price)}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-[#a3a3a3]">
                    {service.duration_minutes} min
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(service)}
                        className="group relative p-2 rounded-lg transition-all duration-200 cursor-pointer text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                        title="Editar"
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        onClick={() => confirmDelete(service)}
                        className="group relative p-2 rounded-lg transition-all duration-200 cursor-pointer text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        title="Eliminar"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="md:hidden flex flex-col gap-4">
        {services.length === 0 ? (
          <div className="bg-white dark:bg-[#111111] rounded-lg border-2 border-gray-200 dark:border-[#262626] p-8">
            <div className="flex flex-col items-center justify-center gap-2 text-gray-500 dark:text-[#a3a3a3]">
              <FaGlasses className="text-4xl text-gray-300 dark:text-[#1a1a1a]" />
              <p>No hay servicios registrados</p>
            </div>
          </div>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className="bg-white dark:bg-[#111111] rounded-lg border-2 border-gray-200 dark:border-[#262626] p-4"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-[#f5f5f5] text-base">
                      {service.name}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="p-2 rounded-lg transition-all duration-200 cursor-pointer text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                      title="Editar"
                    >
                      <FaEdit size={18} />
                    </button>
                    <button
                      onClick={() => confirmDelete(service)}
                      className="p-2 rounded-lg transition-all duration-200 cursor-pointer text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      title="Eliminar"
                    >
                      <FaTrash size={18} />
                    </button>
                  </div>
                </div>
                {service.description && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-[#e5e5e5]">
                      {service.description}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-200 dark:border-[#262626]">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-[#a3a3a3]">
                      Precio
                    </span>
                    <span className="text-base font-semibold text-green-600 dark:text-green-400">
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency: "COP",
                        minimumFractionDigits: 0,
                      }).format(service.price)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500 dark:text-[#a3a3a3]">
                      Duración
                    </span>
                    <span className="text-base font-medium text-gray-700 dark:text-[#e5e5e5]">
                      {service.duration_minutes} min
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentService ? "Editar Servicio" : "Nuevo Servicio"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-[#e5e5e5]">
              Nombre del Servicio
            </label>
            <input
              {...register("name", { required: "El nombre es obligatorio" })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all appearance-none ${errors.name
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-[#262626] bg-white dark:bg-[#1a1a1a] dark:text-[#f5f5f5] focus:ring-blue-500 focus:border-blue-500"
                }`}
              placeholder="Ej: Consulta de Optometría"
            />
            {errors.name && (
              <span className="text-xs text-red-500">
                {errors.name.message}
              </span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-[#e5e5e5]">
              Descripción
            </label>
            <textarea
              rows="3"
              {...register("description")}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all appearance-none border-gray-300 dark:border-[#262626] bg-white dark:bg-[#1a1a1a] dark:text-[#f5f5f5] focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Examen completo de refracción y salud ocular..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-[#e5e5e5]">
                Precio
              </label>
              <input
                type="number"
                step="0.01"
                {...register("price", {
                  required: "El precio es obligatorio",
                  min: { value: 0, message: "Positivo" },
                })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all appearance-none border-gray-300 dark:border-[#262626] bg-white dark:bg-[#1a1a1a] dark:text-[#f5f5f5] focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-[#e5e5e5]">
                Duración (min)
              </label>
              <input
                type="number"
                {...register("duration_minutes", {
                  required: "Duración obligatoria",
                  min: { value: 1, message: "Mínimo 1" },
                })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all appearance-none border-gray-300 dark:border-[#262626] bg-white dark:bg-[#1a1a1a] dark:text-[#f5f5f5] focus:ring-blue-500 focus:border-blue-500"
                placeholder="30"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold mt-4 transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex justify-center items-center"
          >
            {currentService ? "Actualizar Servicio" : "Crear Servicio"}
          </button>
        </form>
      </Modal>
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Servicio"
        message={
          <>
            <span className="font-bold text-gray-900 dark:text-[#f5f5f5]">
              ¿Eliminar el servicio {serviceToDelete?.name}?
            </span>
            <br />
            <span className="text-sm mt-2 block text-gray-500 dark:text-[#a3a3a3]">
              Esta acción es irreversible.
            </span>
          </>
        }
      />
    </div>
  );
});
export default ServicesManagement;
