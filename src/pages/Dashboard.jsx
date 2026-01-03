import React from "react";
import { FiUsers, FiCalendar, FiFileText, FiTrendingUp, FiPlus, FiSearch, FiClock } from "react-icons/fi";
import Breadcrumbs from "../components/Breadcrumbs";
const Dashboard = () => {
  const stats = [
    { label: "Total Pacientes", value: "1,284", icon: FiUsers, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Citas Hoy", value: "12", icon: FiCalendar, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
    { label: "Historias Clínicas", value: "856", icon: FiFileText, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
    { label: "Crecimiento", value: "+12.5%", icon: FiTrendingUp, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
  ];
  const quickActions = [
    { id: "new-patient", label: "Nuevo Paciente", icon: FiPlus, color: "bg-blue-600 hover:bg-blue-700" },
    { id: "new-appointment", label: "Agendar Cita", icon: FiCalendar, color: "bg-orange-600 hover:bg-orange-700" },
    { id: "search-ehr", label: "Buscar Historia", icon: FiSearch, color: "bg-gray-800 hover:bg-gray-900 dark:bg-[#1a1a1a] dark:hover:bg-[#252525]" },
  ];
  return (
    <div className="flex flex-col gap-6 p-4 sm:px-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 px-3">
        <Breadcrumbs items={[{ label: "Dashboard" }]} />
      </div>
      {}
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
        {}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white dark:bg-[#111111] rounded-lg border-2 border-gray-200 dark:border-[#262626] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-[#262626] flex justify-between items-center">
              <h2 className="font-bold text-base sm:text-lg dark:text-[#f5f5f5]">Próximas Citas</h2>
              <button className="text-blue-500 text-sm font-medium hover:underline cursor-pointer">Ver todas</button>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-[#262626]">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                      J
                    </div>
                    <div>
                      <p className="font-bold text-sm dark:text-[#f5f5f5]">Juan Perez Meza</p>
                      <p className="text-xs text-gray-500 dark:text-[#a3a3a3]">Examen de Diagnóstico</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <FiClock size={14} className="text-blue-500/70" />
                    <span className="text-xs font-bold dark:text-[#a3a3a3]">10:30 AM</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        {}
        <div className="space-y-6">
          <section className="bg-white dark:bg-[#111111] p-5 rounded-lg border-2 border-gray-200 dark:border-[#262626]">
            <h2 className="font-bold text-base sm:text-lg dark:text-[#f5f5f5] mb-4">Acciones Rápidas</h2>
            <div className="flex flex-col gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
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
    </div>
  );
};
export default Dashboard;
