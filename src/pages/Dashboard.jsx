import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiUsers, FiCalendar, FiFileText, FiTrendingUp, FiPlus, FiSearch, FiClock } from "react-icons/fi";
import Breadcrumbs from "../components/Breadcrumbs";
import { supabase } from "../supabaseClient";
import { safeQuery } from "../utils/supabaseHelpers";
import Loader from "../components/Loader";
import PatientModal from "../components/Patients/PatientModal";
import AppointmentModal from "../components/Appointments/AppointmentModal";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: "Total Pacientes", value: "0", icon: FiUsers, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Citas Hoy", value: "0", icon: FiCalendar, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
    { label: "Historias Clínicas", value: "0", icon: FiFileText, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
    { label: "Crecimiento", value: "0%", icon: FiTrendingUp, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
  ]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

      const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

      const [
        { count: patientCount },
        { count: appointmentsTodayCount },
        { count: consultationsCount },
        { count: currentMonthPatients },
        { count: lastMonthPatients },
        { data: upcomingData }
      ] = await Promise.all([
        safeQuery(() => supabase.from('patients').select('*', { count: 'exact', head: true }).eq('status', 'active')),
        safeQuery(() => supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('appointment_date', todayStart).lte('appointment_date', todayEnd)),
        safeQuery(() => supabase.from('optometric_consultations').select('*', { count: 'exact', head: true })),
        safeQuery(() => supabase.from('patients').select('*', { count: 'exact', head: true }).gte('registration_date', firstDayCurrentMonth)),
        safeQuery(() => supabase.from('patients').select('*', { count: 'exact', head: true }).gte('registration_date', firstDayLastMonth).lt('registration_date', firstDayCurrentMonth)),
        safeQuery(() => supabase.from('appointments_view').select('*').gte('appointment_date', now.toISOString()).order('appointment_date', { ascending: true }).limit(3))
      ]);

      // Calculate growth
      let growthLabel = "0%";
      if (lastMonthPatients > 0) {
        const growth = ((currentMonthPatients - lastMonthPatients) / lastMonthPatients) * 100;
        growthLabel = `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`;
      } else if (currentMonthPatients > 0) {
        growthLabel = `+100%`;
      }

      setStats([
        { label: "Total Pacientes", value: patientCount?.toLocaleString() || "0", icon: FiUsers, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
        { label: "Citas Hoy", value: appointmentsTodayCount?.toLocaleString() || "0", icon: FiCalendar, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
        { label: "Historias Clínicas", value: consultationsCount?.toLocaleString() || "0", icon: FiFileText, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
        { label: "Crecimiento", value: growthLabel, icon: FiTrendingUp, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
      ]);

      setUpcomingAppointments(upcomingData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSavePatient = async (patientData) => {
    try {
      const { error } = await safeQuery(() =>
        supabase.from('patients').insert([patientData])
      );
      if (error) throw error;
      toast.success("Paciente registrado exitosamente");
      fetchDashboardData();
      setIsPatientModalOpen(false);
    } catch (error) {
      console.error("Error saving patient:", error);
      toast.error(error.message || "Error al registrar paciente");
    }
  };

  const handleSaveAppointment = async (appointmentData) => {
    try {
      const { error } = await safeQuery(() =>
        supabase.from("appointments").insert([{ ...appointmentData, status: "pending" }])
      );
      if (error) throw error;
      toast.success("Cita agendada exitosamente");
      fetchDashboardData();
      setIsAppointmentModalOpen(false);
      return true;
    } catch (error) {
      console.error("Error saving appointment:", error);
      toast.error("Error al agendar la cita");
      return false;
    }
  };

  const quickActions = [
    {
      id: "new-patient",
      label: "Nuevo Paciente",
      icon: FiPlus,
      color: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-900/60 dark:hover:bg-blue-900/60 text-white border border-transparent",
      onClick: () => setIsPatientModalOpen(true)
    },
    {
      id: "new-appointment",
      label: "Agendar Cita",
      icon: FiCalendar,
      color: "bg-orange-600 hover:bg-orange-700 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-900/60 dark:hover:bg-orange-900/60 text-white border border-transparent",
      onClick: () => setIsAppointmentModalOpen(true)
    },
    {
      id: "search-ehr",
      label: "Buscar Historia",
      icon: FiSearch,
      color: "bg-green-600 hover:bg-green-700 dark:bg-green-900/40 dark:text-green-400 dark:border-green-900/60 dark:hover:bg-green-900/60 text-white border border-transparent",
      onClick: () => navigate("/home/ehr")
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:px-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 px-3">
        <Breadcrumbs items={[{ label: "Dashboard" }]} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white dark:bg-[#111111] p-4 sm:p-5 rounded-lg border-2 border-gray-200 dark:border-[#262626] flex items-center gap-4 transition-colors hover:border-gray-300 dark:hover:border-[#2a2a2a]">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-lg flex-shrink-0`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-xl sm:text-2xl font-bold dark:text-[#f5f5f5]">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white dark:bg-[#111111] rounded-lg border-2 border-gray-200 dark:border-[#262626] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-[#262626] flex justify-between items-center">
              <h2 className="font-bold text-base sm:text-lg dark:text-[#f5f5f5]">Próximas Citas</h2>
              <button onClick={() => navigate("/home/appointments")} className="text-blue-500 text-sm font-medium hover:underline cursor-pointer">Ver todas</button>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-[#262626]">
              {upcomingAppointments.length > 0 ? upcomingAppointments.map((app) => (
                <div key={app.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                      {(app.patient_first_name || "P")[0]}
                    </div>
                    <div>
                      <p className="font-bold text-sm dark:text-[#f5f5f5]">{app.patient_first_name} {app.patient_last_name}</p>
                      <p className="text-xs text-gray-500 dark:text-[#a3a3a3]">{app.service_name || "Consulta"}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2 text-gray-400">
                      <FiClock size={14} className="text-blue-500/70" />
                      <span className="text-xs font-bold dark:text-[#a3a3a3]">
                        {new Date(app.appointment_date).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 dark:text-[#737373] font-medium">
                      {new Date(app.appointment_date).toLocaleDateString("es-ES", { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="px-5 py-10 text-center text-gray-400 dark:text-[#737373] text-sm">
                  No hay citas próximas programadas.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white dark:bg-[#111111] p-5 rounded-lg border-2 border-gray-200 dark:border-[#262626]">
            <h2 className="font-bold text-base sm:text-lg dark:text-[#f5f5f5] mb-4">Acciones Rápidas</h2>
            <div className="flex flex-col gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-white text-sm font-bold transition-all active:scale-[0.98] cursor-pointer ${action.color}`}
                  >
                    <Icon size={18} />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="bg-gray-50 dark:bg-[#161616] p-5 rounded-lg border-2 border-dashed border-gray-300 dark:border-[#262626]">
            <h3 className="text-xs font-bold dark:text-[#f5f5f5] mb-2 uppercase tracking-widest text-blue-600 dark:text-blue-400">Recordatorio</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-[#a3a3a3] leading-relaxed">
              No olvides registrar la salida de los pacientes atendidos para mantener la lista de espera actualizada.
            </p>
          </section>
        </div>
      </div>

      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSave={handleSavePatient}
      />

      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSave={handleSaveAppointment}
      />
    </div>
  );
};

export default Dashboard;
