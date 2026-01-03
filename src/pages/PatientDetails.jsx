import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiUser,
  FiCalendar,
  FiFileText,
  FiPhone,
  FiMail,
  FiMapPin,
  FiActivity,
  FiClock,
  FiPlus,
  FiEdit2,
  FiExternalLink,
} from "react-icons/fi";
import { supabase } from "../supabaseClient";
import { safeQuery } from "../utils/supabaseHelpers";
import { toast } from "sonner";
import Breadcrumbs from "../components/Breadcrumbs";
import Loader from "../components/Loader";
import PatientModal from "../components/Patients/PatientModal";
import AppointmentModal from "../components/Appointments/AppointmentModal";

const PatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [consultations, setConsultations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const { data: patientData, error: patientError } = await safeQuery(() =>
        supabase.from("patients").select("*").eq("id", id).single()
      );
      if (patientError) throw patientError;
      setPatient(patientData);

      const { data: appointmentsData } = await safeQuery(() =>
        supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", id)
          .order("appointment_date", { ascending: false })
      );
      setAppointments(appointmentsData || []);

      const { data: ehrData } = await safeQuery(() =>
        supabase
          .from("medical_histories")
          .select("id")
          .eq("patient_id", id)
          .maybeSingle()
      );

      if (ehrData) {
        const { data: consData } = await safeQuery(() =>
          supabase
            .from("optometric_consultations")
            .select("*")
            .eq("medical_history_id", ehrData.id)
            .order("consultation_date", { ascending: false })
        );
        setConsultations(consData || []);
      }
    } catch (error) {
      console.error("Error fetching patient details:", error);
      toast.error("Error al cargar los detalles del paciente");
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
      // Refetch appointments
      const { data: appointmentsData } = await safeQuery(() =>
        supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", id)
          .order("appointment_date", { ascending: false })
      );
      setAppointments(appointmentsData || []);
      return true;
    } catch (error) {
      console.error("Error saving appointment:", error);
      toast.error("Error al agendar la cita");
      return false;
    }
  };

  const handleSavePatient = async (patientData) => {
    try {
      const { error } = await safeQuery(() =>
        supabase.from("patients").update(patientData).eq("id", id)
      );
      if (error) throw error;
      toast.success("Paciente actualizado exitosamente");
      fetchPatientData();
    } catch (error) {
      console.error("Error updating patient:", error);
      toast.error("Error al actualizar el paciente");
    }
  };

  const toggleStatus = async () => {
    const newStatus = patient.status === "active" ? "inactive" : "active";
    try {
      const { error } = await safeQuery(() =>
        supabase.from("patients").update({ status: newStatus }).eq("id", id)
      );
      if (error) throw error;
      toast.success(
        `Paciente ${newStatus === "active" ? "activado" : "desactivado"
        } exitosamente`
      );
      setPatient({ ...patient, status: newStatus });
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Error al cambiar el estado del paciente");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Paciente no encontrado.</p>
        <button
          onClick={() => navigate("/home/patients")}
          className="mt-4 text-blue-600 font-bold flex items-center gap-2 mx-auto"
        >
          <FiArrowLeft /> Volver a la lista
        </button>
      </div>
    );
  }

  const tabs = [
    { id: "general", label: "Datos Generales", icon: <FiUser /> },
    { id: "history", label: "Historia Clínica", icon: <FiFileText /> },
    { id: "appointments", label: "Citas", icon: <FiCalendar /> },
  ];

  const InfoRow = ({ label, value }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 dark:border-[#1a1a1a] last:border-0">
      <div>
        <p className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className="text-sm font-medium text-gray-700 dark:text-[#f5f5f5]">
          {value || "No registrado"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 p-4 sm:px-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-3">
        <Breadcrumbs
          items={[
            { label: "Pacientes", path: "/home/patients" },
            { label: `${patient.first_name} ${patient.last_name}` },
          ]}
        />
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/home/ehr', { state: { patientId: patient.id } })}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 cursor-pointer"
          >
            <FiPlus />
            <span className="hidden sm:inline">Nueva Consulta</span>
          </button>
          <button
            onClick={toggleStatus}
            className={`px-5 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 cursor-pointer border-2 ${patient.status === "active"
              ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30 dark:hover:bg-red-900/20"
              : "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-900/30 dark:hover:bg-blue-900/20"
              }`}
          >
            <span className="hidden sm:inline">{patient.status === "active" ? "Desactivar" : "Activar"}</span>
            <span className="sm:hidden">{patient.status === "active" ? "Off" : "On"}</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 px-5 py-2 rounded-lg border border-gray-200 dark:border-[#262626] font-bold text-sm hover:bg-gray-200 dark:hover:bg-[#262626] transition-all active:scale-95 cursor-pointer"
          >
            <FiEdit2 />
            <span className="hidden sm:inline">Editar</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111111] rounded-lg border-2 border-gray-200 dark:border-[#262626] p-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-lg font-black text-gray-800 dark:text-[#f5f5f5] mb-1 uppercase tracking-tight">
              {patient.first_name} {patient.last_name}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-2.5">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-[#a3a3a3] px-2 py-0.5 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-gray-100 dark:border-[#262626]">
                {patient.document_type} {patient.document_number}
              </span>
              <span
                className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${patient.status === "active"
                  ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                  : "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                  }`}
              >
                {patient.status === "active" ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer border-2 ${activeTab === tab.id
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-[#111111] text-gray-500 dark:text-[#a3a3a3] border-gray-200 dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-[#111111] rounded-lg border-2 border-gray-200 dark:border-[#262626] p-6 min-h-[400px]">
            {activeTab === "general" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest border-b border-gray-50 dark:border-[#262626] pb-2 mb-4">
                    Información de Contacto
                  </h3>
                  <InfoRow
                    label="Teléfono"
                    value={patient.phone}
                  />
                  <InfoRow
                    label="Email"
                    value={patient.email}
                  />
                  <InfoRow
                    label="Dirección"
                    value={patient.address}
                  />
                  <InfoRow
                    label="Ubicación"
                    value={`${patient.city || ""}, ${patient.state || ""}`}
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest border-b border-gray-50 dark:border-[#262626] pb-2 mb-4">
                    Información Personal
                  </h3>
                  <InfoRow
                    label="Fecha de Nacimiento"
                    value={new Date(patient.birth_date).toLocaleDateString()}
                  />
                  <InfoRow
                    label="Género"
                    value={
                      patient.gender === "Male"
                        ? "Masculino"
                        : patient.gender === "Female"
                          ? "Femenino"
                          : "Otro"
                    }
                  />
                  <InfoRow
                    label="Estado Civil"
                    value={patient.marital_status}
                  />
                  <InfoRow
                    label="Ocupación"
                    value={patient.occupation}
                  />
                </div>

                <div className="md:col-span-2 mt-8 space-y-4">
                  <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest border-b border-gray-50 dark:border-[#262626] pb-2 mb-4">
                    Información Administrativa
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                    <InfoRow
                      label="EPS"
                      value={patient.eps}
                    />
                    <InfoRow
                      label="Número de Afiliación"
                      value={patient.affiliation_number}
                    />
                    <InfoRow
                      label="Contacto de Emergencia"
                      value={patient.emergency_contact}
                    />
                    <InfoRow
                      label="Teléfono de Emergencia"
                      value={patient.emergency_phone}
                    />
                  </div>
                </div>

                {patient.general_notes && (
                  <div className="md:col-span-2 mt-8 space-y-4">
                    <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest border-b border-gray-50 dark:border-[#262626] pb-2 mb-2">
                      Notas Generales
                    </h3>
                    <div className="p-4 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-gray-100 dark:border-[#262626]">
                      <p className="text-sm text-gray-600 dark:text-gray-300 italic whitespace-pre-wrap">
                        "{patient.general_notes}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-gray-800 dark:text-[#f5f5f5] uppercase tracking-tight">
                    Evolución Médica
                  </h3>
                  <button
                    onClick={() => navigate("/home/ehr")}
                    className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-2"
                  >
                    <FiPlus /> Nueva Consulta
                  </button>
                </div>

                {consultations.length > 0 ? (
                  <div className="space-y-4">
                    {consultations.map((con) => (
                      <div
                        key={con.id}
                        className="p-5 bg-white dark:bg-[#111111] border-2 border-gray-100 dark:border-[#262626] rounded-xl hover:border-blue-100 dark:hover:border-blue-900/30 transition-all group relative overflow-hidden shadow-sm"
                      >
                        <div className="absolute top-0 right-0 p-3 opacity-5">
                          <FiActivity size={40} />
                        </div>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="p-1 px-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded leading-none">
                                {new Date(con.consultation_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                              </span>
                              {con.cie10_code && (
                                <span className="text-[9px] font-bold text-gray-400 dark:text-[#737373] uppercase tracking-tighter">
                                  CIE-10: {con.cie10_code}
                                </span>
                              )}
                            </div>
                            <h4 className="font-black text-gray-800 dark:text-[#f5f5f5] uppercase tracking-tight text-sm">
                              {con.primary_diagnosis || "Consulta de Optometría"}
                            </h4>
                          </div>
                          <button
                            onClick={() => navigate('/home/ehr-evolution', { state: { patientId: id } })}
                            className="p-2 text-gray-300 hover:text-blue-500 transition-colors"
                            title="Ver detalle completo"
                          >
                            <FiExternalLink size={18} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 bg-gray-50/50 dark:bg-[#1a1a1a]/50 rounded-lg border border-gray-50 dark:border-[#262626]">
                            <p className="text-[9px] font-black text-gray-400 dark:text-[#737373] uppercase mb-1.5 tracking-widest">
                              AV Sin Corrección
                            </p>
                            <p className="text-xs font-bold text-gray-700 dark:text-[#f5f5f5] font-mono">
                              OD: {con.visual_acuity_od || "--"} / OI: {con.visual_acuity_os || "--"}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50/50 dark:bg-[#1a1a1a]/50 rounded-lg border border-gray-50 dark:border-[#262626]">
                            <p className="text-[9px] font-black text-gray-400 dark:text-[#737373] uppercase mb-1.5 tracking-widest">
                              Plan y Recomendaciones
                            </p>
                            <p className="text-xs text-gray-500 dark:text-[#a3a3a3] line-clamp-1 italic">
                              {con.plan || "Sin observaciones registradas."}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border-2 border-dashed border-gray-200 dark:border-[#262626]">
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">
                      Sin registros médicos
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "appointments" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-gray-800 dark:text-[#f5f5f5] uppercase tracking-tight">
                    Historial de Citas
                  </h3>
                  <button
                    onClick={() => setIsAppModalOpen(true)}
                    className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-2 cursor-pointer"
                  >
                    <FiPlus /> Agendar Cita
                  </button>
                </div>

                {appointments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {appointments.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border-2 border-gray-200 dark:border-[#262626] hover:border-blue-100 dark:hover:border-blue-900/30 transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center min-w-[55px] h-[55px] bg-white dark:bg-[#111111] rounded-lg border-2 border-gray-100 dark:border-[#262626]">
                          <span className="text-[8px] font-black text-gray-400 uppercase">
                            {new Date(app.appointment_date).toLocaleString(
                              "es-ES",
                              { month: "short" }
                            )}
                          </span>
                          <span className="text-xl font-black text-gray-800 dark:text-[#f5f5f5] leading-none">
                            {new Date(app.appointment_date).getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-gray-800 dark:text-[#f5f5f5] truncate">
                            {app.service?.name || "Sin servicio"}
                          </h4>
                          <div className="flex items-center gap-3 mt-1 underline decoration-blue-500/20">
                            <span className="text-[10px] font-black text-gray-400 flex items-center gap-1">
                              {new Date(app.appointment_date).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${app.status === "confirmed"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : app.status === "cancelled"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                }`}
                            >
                              {app.status === "confirmed"
                                ? "Confirmada"
                                : app.status === "cancelled"
                                  ? "Cancelada"
                                  : app.status === "pending"
                                    ? "Pendiente"
                                    : app.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border-2 border-dashed border-gray-200 dark:border-[#262626]">
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">
                      No hay citas programadas
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <PatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePatient}
        patient={patient}
      />
      <AppointmentModal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
        onSave={handleSaveAppointment}
        initialPatient={patient}
      />
    </div>
  );
};

export default PatientDetails;
