import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiPlus, FiCalendar } from 'react-icons/fi';
import Breadcrumbs from '../components/Breadcrumbs';
import { supabase } from '../supabaseClient';
import { safeQuery } from '../utils/supabaseHelpers';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
const Appointments = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const currentMonth = currentDate.toLocaleString('es-ES', { month: 'long' });
    const currentYear = currentDate.getFullYear();
    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
            const { data, error } = await safeQuery(() =>
                supabase
                    .from('appointments')
                    .select(`
                        *,
                        patient:patients (
                            id,
                            first_name,
                            last_name
                        )
                    `)
                    .gte('date', startOfMonth.split('T')[0])
                    .lte('date', endOfMonth.split('T')[0])
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
    useEffect(() => {
        fetchAppointments();
    }, [currentDate]);
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const calendarDays = [];
    const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
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
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return appointments.filter(app => app.date === dateStr);
    };
    return (
        <div className="flex flex-col gap-6 p-4 sm:px-6 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 px-3">
                <Breadcrumbs items={[{ label: "Citas" }]} />
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="flex items-center gap-2 bg-white dark:bg-[#111111] text-gray-700 dark:text-[#e5e5e5] px-5 py-2 rounded-lg font-bold text-sm border-2 border-gray-200 dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-all cursor-pointer active:scale-95"
                    >
                        <FiCalendar size={16} />
                        <span>Hoy</span>
                    </button>
                    <button
                        onClick={() => window.location.hash = "/home/appointments/new"}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 cursor-pointer"
                    >
                        <FiPlus size={16} />
                        <span>Nueva Cita</span>
                    </button>
                </div>
            </div>
            <div className="bg-white dark:bg-[#111111] rounded-lg border-2 border-gray-200 dark:border-[#262626] overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-[#262626] flex justify-between items-center text-[#111111] dark:text-[#f5f5f5]">
                    <h2 className="text-lg font-bold capitalize tracking-wide">
                        {currentMonth} {currentYear}
                    </h2>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                            className="p-2 rounded-lg border border-gray-200 dark:border-[#262626] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer active:scale-90"
                        >
                            <FiChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                            className="p-2 rounded-lg border border-gray-200 dark:border-[#262626] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer active:scale-90"
                        >
                            <FiChevronRight size={18} />
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-7 border-b border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#1a1a1a]">
                    {days.map(day => (
                        <div key={day} className="py-2.5 text-center text-[10px] font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-widest">
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
                            const dayAppointments = getAppointmentsForDay(date.day, date.isCurrentMonth);
                            const isToday = date.day === new Date().getDate() &&
                                currentDate.getMonth() === new Date().getMonth() &&
                                currentDate.getFullYear() === new Date().getFullYear() &&
                                date.isCurrentMonth;
                            return (
                                <div
                                    key={idx}
                                    className={`p-2 border-r border-b border-gray-200 dark:border-[#262626] transition-colors hover:bg-blue-50/20 dark:hover:bg-blue-900/5 cursor-pointer group ${!date.isCurrentMonth ? 'opacity-20' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg transition-all ${isToday
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-700 dark:text-[#e5e5e5] group-hover:text-blue-600'
                                            }`}>
                                            {date.day}
                                        </span>
                                    </div>
                                    <div className="space-y-1 overflow-y-auto max-h-20 scrollbar-hide">
                                        {dayAppointments.map(app => (
                                            <div
                                                key={app.id}
                                                className={`px-1.5 py-0.5 text-[9px] rounded border truncate font-bold ${app.status === 'Scheduled' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-100' :
                                                    app.status === 'Confirmed' ? 'bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-100' :
                                                        app.status === 'Attended' ? 'bg-gray-50 dark:bg-gray-700/40 text-gray-700 dark:text-gray-300 border-gray-200' :
                                                            'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-100'
                                                    }`}
                                            >
                                                {app.start_time.slice(0, 5)} - {app.patient?.first_name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
export default Appointments;
