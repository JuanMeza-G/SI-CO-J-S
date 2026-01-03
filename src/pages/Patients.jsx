import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiEdit2, FiEye, FiUserX, FiUserCheck } from 'react-icons/fi';
import Breadcrumbs from '../components/Breadcrumbs';
import { supabase } from '../supabaseClient';
import { safeQuery } from '../utils/supabaseHelpers';
import { toast } from 'sonner';
import PatientModal from '../components/Patients/PatientModal';
import Loader from '../components/Loader';
const Patients = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [statusFilter, setStatusFilter] = useState("Todos");
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [pageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState({ column: 'first_name', direction: 'asc' });
    const navigate = useNavigate();
    const fetchPatients = async () => {
        setLoading(true);
        try {
            const start = (page - 1) * pageSize;
            const end = start + pageSize - 1;
            let query = supabase
                .from('patients')
                .select('*', { count: 'exact' });
            if (searchTerm) {
                query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,document_number.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
            }
            if (statusFilter !== "Todos") {
                query = query.eq('status', statusFilter === "Activos" ? "active" : "inactive");
            }
            const { data, error, count } = await safeQuery(() =>
                query
                    .order(sortConfig.column, { ascending: sortConfig.direction === 'asc' })
                    .range(start, end)
            );
            if (error) {
                console.error("Error fetching patients:", error);
                toast.error("Error cargando pacientes");
            } else {
                setPatients(data || []);
                setTotalCount(count || 0);
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchPatients();
    }, [page, statusFilter, sortConfig]);
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);
    const handleSavePatient = async (patientData) => {
        try {
            if (selectedPatient) {
                const { error } = await safeQuery(() =>
                    supabase
                        .from('patients')
                        .update(patientData)
                        .eq('id', selectedPatient.id)
                );
                if (error) throw error;
                toast.success("Paciente actualizado exitosamente");
            } else {
                const { error } = await safeQuery(() =>
                    supabase
                        .from('patients')
                        .insert([patientData])
                );
                if (error) throw error;
                toast.success("Paciente registrado exitosamente");
            }
            fetchPatients();
        } catch (error) {
            console.error("Error saving patient:", error);
            const errorMessage = error?.message || "Error al guardar el paciente";
            const errorDetails = error?.details || "";
            toast.error(`${errorMessage} ${errorDetails}`);
        }
    };
    const handleEdit = (patient) => {
        setSelectedPatient(patient);
        setIsModalOpen(true);
    };
    const handleNew = () => {
        setSelectedPatient(null);
        setIsModalOpen(true);
    };
    const toggleStatus = async (patient) => {
        const newStatus = patient.status === 'active' ? 'inactive' : 'active';
        try {
            const { error } = await safeQuery(() =>
                supabase
                    .from('patients')
                    .update({ status: newStatus })
                    .eq('id', patient.id)
            );
            if (error) throw error;
            toast.success(`Paciente ${newStatus === 'active' ? 'activado' : 'desactivado'} exitosamente`);
            fetchPatients();
        } catch (error) {
            console.error("Error toggling status:", error);
            toast.error("Error al cambiar el estado del paciente");
        }
    };
    const handleSort = (column) => {
        setSortConfig(prev => ({
            column,
            direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
        setPage(1);
    };
    const totalPages = Math.ceil(totalCount / pageSize);
    const SortIndicator = ({ column }) => {
        if (sortConfig.column !== column) return <span className="ml-1 text-gray-300 dark:text-[#333333]">↕</span>;
        return <span className="ml-1 text-blue-600 dark:text-blue-400">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };
    return (
        <div className="flex flex-col gap-6 p-4 sm:px-6 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 px-3">
                <Breadcrumbs items={[{ label: "Pacientes" }]} />
                <button
                    onClick={handleNew}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 cursor-pointer"
                >
                    <FiPlus />
                    <span>Nuevo Paciente</span>
                </button>
            </div>
            { }
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    setPage(1);
                    fetchPatients();
                }}
                className="bg-white dark:bg-[#111111] p-4 rounded-lg border-2 border-gray-200 dark:border-[#262626] flex flex-col md:flex-row gap-4 items-center"
            >
                <div className="relative flex-1 w-full text-sm">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, documento o teléfono..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-[#262626] focus:ring-2 focus:ring-blue-500 outline-none transition dark:bg-[#1a1a1a] dark:text-[#f5f5f5] bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-[#262626] bg-white dark:bg-[#1a1a1a] dark:text-[#e5e5e5] outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                        <option value="Todos">Todos los estados</option>
                        <option value="Activos">Activos</option>
                        <option value="Inactivos">Inactivos</option>
                    </select>
                </div>
            </form>
            { }
            <div className="bg-white dark:bg-[#111111] rounded-lg border-2 border-gray-200 dark:border-[#262626] overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-10 flex justify-center">
                            <Loader />
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-100 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#262626]">
                                <tr>
                                    <th
                                        className="px-6 py-3 text-[11px] font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-[#222222] transition-colors"
                                        onClick={() => handleSort('first_name')}
                                    >
                                        <div className="flex items-center">Paciente <SortIndicator column="first_name" /></div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-[11px] font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-wider text-center cursor-pointer hover:bg-gray-200 dark:hover:bg-[#222222] transition-colors"
                                        onClick={() => handleSort('document_number')}
                                    >
                                        <div className="flex items-center justify-center">Documento <SortIndicator column="document_number" /></div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-[11px] font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-wider text-center cursor-pointer hover:bg-gray-200 dark:hover:bg-[#222222] transition-colors"
                                        onClick={() => handleSort('registration_date')}
                                    >
                                        <div className="flex items-center justify-center">Registro <SortIndicator column="registration_date" /></div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-[11px] font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-wider text-center cursor-pointer hover:bg-gray-200 dark:hover:bg-[#222222] transition-colors"
                                        onClick={() => handleSort('status')}
                                    >
                                        <div className="flex items-center justify-center">Estado <SortIndicator column="status" /></div>
                                    </th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-[#262626]">
                                {patients.length > 0 ? (
                                    patients.map((patient) => (
                                        <tr key={patient.id} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold text-sm dark:text-[#f5f5f5]">{patient.first_name} {patient.last_name}</p>
                                                    <p className="text-[11px] text-gray-500 dark:text-[#a3a3a3] font-medium">{patient.phone || 'Sin teléfono'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm dark:text-[#e5e5e5] text-center font-medium">
                                                {patient.document_type} {patient.document_number}
                                            </td>
                                            <td className="px-6 py-4 text-sm dark:text-[#e5e5e5] text-center">
                                                {new Date(patient.registration_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border ${patient.status === 'active'
                                                    ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                                                    : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-[#1a1a1a] dark:text-[#a3a3a3] dark:border-[#262626]'
                                                    }`}>
                                                    {patient.status === 'active' ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => toggleStatus(patient)}
                                                        className={`p-2 rounded-lg cursor-pointer transition-colors border border-transparent ${patient.status === 'active'
                                                            ? 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 dark:hover:border-red-900/30'
                                                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10 dark:hover:border-green-900/30'
                                                            }`}
                                                        title={patient.status === 'active' ? 'Desactivar' : 'Activar'}
                                                    >
                                                        {patient.status === 'active' ? <FiUserX size={16} /> : <FiUserCheck size={16} />}
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/home/patients/${patient.id}`)}
                                                        className="p-2 hover:bg-blue-50 dark:hover:bg-[#1f1f1f] text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-blue-100 dark:hover:border-[#262626]"
                                                        title="Ver detalles"
                                                    >
                                                        <FiEye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(patient)}
                                                        className="p-2 hover:bg-orange-50 dark:hover:bg-[#1f1f1f] text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-orange-100 dark:hover:border-[#262626]" title="Editar"
                                                    >
                                                        <FiEdit2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-gray-500 dark:text-[#a3a3a3] text-sm">
                                            No se encontraron pacientes.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                { }
                {totalPages > 1 && (
                    <div className="bg-gray-50 dark:bg-[#1a1a1a] px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-[#262626]">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                disabled={page === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={page === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                    Mostrando <span className="font-bold">{(page - 1) * pageSize + 1}</span> a <span className="font-bold">{Math.min(page * pageSize, totalCount)}</span> de <span className="font-bold">{totalCount}</span> resultados
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                        disabled={page === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-[#262626] bg-white dark:bg-[#111111] text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                    >
                                        <span className="sr-only">Anterior</span>
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
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
                                        onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={page === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-[#262626] bg-white dark:bg-[#111111] text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                    >
                                        <span className="sr-only">Siguiente</span>
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <PatientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSavePatient}
                patient={selectedPatient}
            />
        </div>
    );
};
export default Patients;
