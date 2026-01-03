import React, { useState, useEffect } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiCalendar,
  FiList,
  FiSearch,
  FiEye,
} from "react-icons/fi";
import Breadcrumbs from "../components/Breadcrumbs";
import AppointmentModal from "../components/Appointments/AppointmentModal";
import AppointmentDetailsModal from "../components/Appointments/AppointmentDetailsModal";
import Modal from "../components/Modal";
import { supabase } from "../supabaseClient";
import { safeQuery } from "../utils/supabaseHelpers";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

const Appointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("calendar"); // 'calendar' or 'list'

  // List View States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  const [allAppointments, setAllAppointments] = useState([]);
  const [selectedDateForModal, setSelectedDateForModal] = useState(null);

  // Modals Data
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const currentMonth = currentDate.toLocaleString("es-ES", { month: "long" });
  const currentYear = currentDate.getFullYear();

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      ).toISOString();
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      ).toISOString();

      const { data, error } = await safeQuery(() =>
        supabase
          .from("appointments_view")
          .select("*")
          .gte("appointment_date", startOfMonth)
          .lte("appointment_date", endOfMonth)
      );

      if (error) {
        console.error("Error fetching appointments:", error);
        toast.error("Error cargando citas");
      } else {
        setAppointments(data || []);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentsList = async () => {
    setLoading(true);
    try {
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      let query = supabase
        .from("appointments_view")
        .select("*", { count: "exact" });

      if (searchTerm) {
        query = query.or(`consultation_reason.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%,patient_first_name.ilike.%${searchTerm}%,patient_last_name.ilike.%${searchTerm}%,patient_document_number.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error, count } = await safeQuery(() =>
        query
          .order("appointment_date", { ascending: false })
          .range(start, end)
      );

      if (error) throw error;
      setAllAppointments(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching appointments list:", error);
      toast.error("Error al cargar la lista de citas");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAppointment = async (appointmentData) => {
    try {
      const { error } = await safeQuery(() =>
        supabase.from("appointments").insert([{ ...appointmentData, status: "pending" }])
      );
      if (error) throw error;
      toast.success("Cita agendada exitosamente");
      if (viewMode === "calendar") fetchAppointments();
      else fetchAppointmentsList();
      return true;
    } catch (error) {
      console.error("Error saving appointment:", error);
      toast.error("Error al agendar la cita");
      return false;
    }
  };

  const handleViewAppointment = (app) => {
    setSelectedAppointment(app);
    setIsDetailsOpen(true);
  };

  const handleRefresh = () => {
    if (viewMode === "calendar") fetchAppointments();
    else fetchAppointmentsList();
  };

  useEffect(() => {
    if (viewMode === "calendar") {
      fetchAppointments();
    } else {
      fetchAppointmentsList();
    }
  }, [currentDate, viewMode, page, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (viewMode === "list") {
        setPage(1);
        fetchAppointmentsList();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const calendarDays = [];
  const prevMonthLastDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    0
  ).getDate();

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({ day: prevMonthLastDay - i, isCurrentMonth: false });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, isCurrentMonth: true });
  }

  const totalDays = 42;
  const remainingDays = totalDays - calendarDays.length;
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({ day: i, isCurrentMonth: false });
  }

  const getAppointmentsForDay = (day, isCurrentMonth) => {
    if (!isCurrentMonth) return [];
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return appointments.filter((app) => app.appointment_date.startsWith(dateStr));
  };

  const handleDayClick = (day, isCurrentMonth) => {
    if (!isCurrentMonth) return;
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDateForModal(dateStr);
    setIsModalOpen(true);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-900/30",
      confirmed: "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/10 dark:text-green-400 dark:border-green-900/30",
      attended: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/20 dark:text-gray-400 dark:border-[#262626]",
      cancelled: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30",
    };
    const labels = {
      pending: "Pendiente",
      confirmed: "Confirmada",
      attended: "Atendida",
      cancelled: "Cancelada",
    };
    return (
      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:px-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 px-3">
        <Breadcrumbs items={[{ label: "Citas" }]} />
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-[#1a1a1a] p-1 rounded-lg border border-gray-200 dark:border-[#262626]">
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === "calendar" ? "bg-white dark:bg-[#111111] text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              title="Vista Calendario"
            >
              <FiCalendar size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === "list" ? "bg-white dark:bg-[#111111] text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              title="Vista Lista"
            >
              <FiList size={18} />
            </button>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 cursor-pointer shadow-sm shadow-blue-500/10"
          >
            <FiPlus size={18} />
            <span>Nueva Cita</span>
          </button>
        </div>
      </div>

      {viewMode === "list" && (
        <div className="bg-white dark:bg-[#111111] p-4 rounded-lg border-2 border-gray-200 dark:border-[#262626] flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full text-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por paciente, motivo o notas..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-[#262626] focus:ring-2 focus:ring-blue-500 outline-none transition dark:bg-[#1a1a1a] dark:text-[#f5f5f5] bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-[#262626] bg-white dark:bg-[#1a1a1a] dark:text-[#e5e5e5] outline-none focus:ring-2 focus:ring-blue-500 font-bold cursor-pointer"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="confirmed">Confirmadas</option>
              <option value="attended">Atendidas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#111111] rounded-lg border-2 border-gray-200 dark:border-[#262626] overflow-hidden">
        {viewMode === "calendar" ? (
          <>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#262626] flex justify-between items-center text-[#111111] dark:text-[#f5f5f5]">
              <h2 className="text-lg font-bold capitalize tracking-wide">
                {currentMonth} {currentYear}
              </h2>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors border border-transparent hover:border-blue-100 cursor-pointer"
                >
                  Hoy
                </button>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() =>
                      setCurrentDate(
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth() - 1,
                          1
                        )
                      )
                    }
                    className="p-2 rounded-lg border border-gray-200 dark:border-[#262626] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer active:scale-90"
                  >
                    <FiChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentDate(
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth() + 1,
                          1
                        )
                      )
                    }
                    className="p-2 rounded-lg border border-gray-200 dark:border-[#262626] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer active:scale-90"
                  >
                    <FiChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-[#262626] bg-gray-100 dark:bg-[#1a1a1a]">
              {days.map((day) => (
                <div
                  key={day}
                  className="py-3 text-center text-[10px] font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-widest"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 min-h-[550px]">
              {loading ? (
                <div className="col-span-7 flex justify-center items-center h-full">
                  <Loader />
                </div>
              ) : (
                calendarDays.map((date, idx) => {
                  const dayAppointments = getAppointmentsForDay(
                    date.day,
                    date.isCurrentMonth
                  );
                  const isToday =
                    date.day === new Date().getDate() &&
                    currentDate.getMonth() === new Date().getMonth() &&
                    currentDate.getFullYear() === new Date().getFullYear() &&
                    date.isCurrentMonth;

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (dayAppointments.length > 0) {
                          setSelectedDayData({
                            date: new Date(currentYear, currentDate.getMonth(), date.day),
                            appointments: dayAppointments
                          });
                        } else {
                          handleDayClick(date.day, date.isCurrentMonth)
                        }
                      }}
                      className={`p-2 border-r border-b border-gray-200 dark:border-[#262626] transition-colors hover:bg-blue-50/20 dark:hover:bg-blue-900/5 cursor-pointer group ${!date.isCurrentMonth ? "opacity-20" : ""
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg transition-all ${isToday
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 dark:text-[#e5e5e5] group-hover:text-blue-600"
                            }`}
                        >
                          {date.day}
                        </span>
                      </div>

                      <div className="space-y-1 overflow-hidden">
                        {dayAppointments.slice(0, 2).map((app) => (
                          <div
                            key={app.id}
                            className={`px-1.5 py-0.5 text-[9px] rounded border-2 truncate font-bold ${app.status === "pending"
                              ? "bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30"
                              : app.status === "confirmed"
                                ? "bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/30"
                                : app.status === "attended"
                                  ? "bg-gray-50 dark:bg-gray-700/40 text-gray-700 dark:text-gray-300 border-gray-200"
                                  : "bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border-red-100 dark:border-blue-900/30"
                              }`}
                          >
                            {new Date(app.appointment_date).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit', hour12: false })} - {app.patient_first_name || app.patient?.first_name}
                          </div>
                        ))}
                        {dayAppointments.length > 2 && (
                          <div className="w-full mt-1 py-1 text-[9px] font-bold text-blue-600 dark:text-blue-400 text-center uppercase tracking-widest">
                            + {dayAppointments.length - 2} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-20 flex justify-center">
                <Loader />
              </div>
            ) : (
              <>
                <table className="w-full text-left">
                  <thead className="bg-gray-100 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#262626]">
                    <tr>
                      <th className="px-6 py-3 text-[11px] font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-wider">Fecha y Hora</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-wider">Paciente</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-wider text-center">Tipo</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-wider text-center">Estado</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-wider text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-[#262626]">
                    {allAppointments.length > 0 ? (
                      allAppointments.map((app) => (
                        <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold dark:text-[#f5f5f5]">
                                {new Date(app.appointment_date).toLocaleDateString("es-ES")}
                              </span>
                              <span className="text-[11px] text-gray-500 dark:text-[#a3a3a3] font-medium">
                                {new Date(app.appointment_date).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold dark:text-[#f5f5f5]">{app.patient_first_name || app.patient?.first_name} {app.patient_last_name || app.patient?.last_name}</span>
                              <span className="text-[11px] text-gray-500 dark:text-[#a3a3a3] font-medium">{app.patient_document_number || app.patient?.document_number}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-sm dark:text-[#e5e5e5] font-medium">
                            {app.service_name || app.service?.name || "Sin servicio"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {getStatusBadge(app.status)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleViewAppointment(app)}
                                className="p-2 hover:bg-blue-50 dark:hover:bg-[#1f1f1f] text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-blue-100 dark:hover:border-[#262626]"
                                title="Ver Detalles"
                              >
                                <FiEye size={16} />
                              </button>
                              <button
                                onClick={() => navigate(`/home/patients/${app.patient_id}`)}
                                className="p-2 hover:bg-blue-50 dark:hover:bg-[#1f1f1f] text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-blue-100 dark:hover:border-[#262626]"
                                title="Ver Paciente"
                              >
                                <FiSearch size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-16 text-center text-gray-400 font-bold uppercase text-sm tracking-widest">
                          No se encontraron citas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <div className="bg-gray-50 dark:bg-[#1a1a1a] px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-[#262626]">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          Página <span className="font-bold text-blue-600">{page}</span> de <span className="font-bold">{totalPages}</span>
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-[#262626] bg-white dark:bg-[#111111] text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                          >
                            <span className="sr-only">Anterior</span>
                            <FiChevronLeft className="h-5 w-5" />
                          </button>
                          {[...Array(totalPages)].map((_, i) => (
                            <button
                              key={i + 1}
                              onClick={() => setPage(i + 1)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-bold transition-all cursor-pointer ${page === i + 1
                                ? 'z-10 bg-blue-600 border-blue-600 text-white'
                                : 'bg-white dark:bg-[#111111] border-gray-300 dark:border-[#262626] text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] dark:text-[#a3a3a3]'
                                }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                          <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-[#262626] bg-white dark:bg-[#111111] text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                          >
                            <span className="sr-only">Siguiente</span>
                            <FiChevronRight className="h-5 w-5" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDateForModal(null);
        }}
        onSave={handleSaveAppointment}
        selectedDate={selectedDateForModal}
      />

      <AppointmentDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onUpdate={handleRefresh}
      />

      {/* Daily Agenda Modal */}
      <Modal
        isOpen={!!selectedDayData}
        onClose={() => setSelectedDayData(null)}
        title="AGENDA DEL DÍA"
        size="2xl"
      >
        {selectedDayData && (
          <div className="space-y-6 max-w-2xl mx-auto">
            {/* Información del Día */}
            <div className="flex flex-col gap-4 border-b border-gray-100 dark:border-[#262626] pb-6">
              <div className="flex items-center gap-4">
                <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0">
                  Fecha
                </label>
                <p className="text-sm font-bold dark:text-[#f5f5f5] capitalize">
                  {selectedDayData.date.toLocaleDateString("es-ES", { dateStyle: 'full' })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-28 shrink-0">
                  Resumen
                </label>
                <p className="text-sm font-bold dark:text-[#f5f5f5]">
                  {selectedDayData.appointments.length} Paciente{selectedDayData.appointments.length !== 1 ? 's' : ''} programados
                </p>
              </div>
            </div>

            {/* Citas Programadas */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase tracking-widest px-1">
                Lista de Pacientes
              </h3>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                {selectedDayData.appointments.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => {
                      handleViewAppointment(app);
                      setSelectedDayData(null);
                    }}
                    className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-all cursor-pointer group rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-[#262626]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                        <span className="text-[11px] font-bold">
                          {new Date(app.appointment_date).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-[#f5f5f5] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase truncate">
                          {app.patient_first_name || app.patient?.first_name} {app.patient_last_name || app.patient?.last_name}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase truncate">
                          {app.service_name || app.service?.name || "Consulta General"}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {getStatusBadge(app.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => {
                  setSelectedDateForModal(selectedDayData.date.toISOString().split('T')[0]);
                  setSelectedDayData(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all active:scale-95 cursor-pointer shadow-lg shadow-blue-500/20"
              >
                <FiPlus />
                Nueva Cita
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Appointments;
