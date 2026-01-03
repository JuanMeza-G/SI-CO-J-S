import React, { useState, useEffect } from 'react';
import { FiSave, FiSearch, FiFileText, FiPlus, FiChevronDown, FiChevronUp, FiEye, FiClock, FiActivity, FiUser, FiArrowRight, FiDownload } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs';
import { supabase } from '../supabaseClient';
import { safeQuery } from '../utils/supabaseHelpers';
import { toast } from 'sonner';
import Loader from '../components/Loader';
import { generateEHR_PDF } from '../utils/pdfGenerator';

const EHR = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [foundPatients, setFoundPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [searching, setSearching] = useState(false);
    const [history, setHistory] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [recentConsultations, setRecentConsultations] = useState([]);
    const location = useLocation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        personal_background: "",
        family_background: "",
        allergies: "",
        systemic_diseases: "",
        current_medications: "",
        general_notes: "",
        consultation_reason: "",
        visual_acuity_od: "",
        visual_acuity_os: "",
        refraction_od: "",
        refraction_os: "",
        intraocular_pressure: "",
        ocular_motility: "",
        biomicroscopy: "",
        fundus_exam: "",
        primary_diagnosis: "",
        cie10_code: "",
        plan: "",
        sphere_od: "", cylinder_od: "", axis_od: "", addition_od: "",
        sphere_os: "", cylinder_os: "", axis_os: "", addition_os: "",
        lens_type: "", recommended_use: "", expiry_date: ""
    });

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.length > 2) {
                setSearching(true);
                try {
                    const { data, error } = await safeQuery(() =>
                        supabase
                            .from('patients')
                            .select('id, first_name, last_name, document_number, birth_date')
                            .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,document_number.ilike.%${searchTerm}%`)
                            .limit(5)
                    );
                    if (!error) setFoundPatients(data || []);
                } finally {
                    setSearching(false);
                }
            } else {
                setFoundPatients([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (location.state?.patientId) {
            const fetchInitialPatient = async () => {
                const { data, error } = await safeQuery(() =>
                    supabase
                        .from('patients')
                        .select('id, first_name, last_name, document_number, birth_date')
                        .eq('id', location.state.patientId)
                        .single()
                );
                if (data && !error) {
                    handleSelectPatient(data);
                }
            };
            fetchInitialPatient();
        }
    }, [location.state?.patientId]);

    const handleSelectPatient = async (patient) => {
        setSelectedPatient(patient);
        setFoundPatients([]);
        setSearchTerm("");
        setLoadingHistory(true);
        try {
            let { data: h, error: hError } = await safeQuery(() =>
                supabase
                    .from('medical_histories')
                    .select('*')
                    .eq('patient_id', patient.id)
                    .maybeSingle()
            );
            if (!h && !hError) {
                const { data: newH, error: createError } = await safeQuery(() =>
                    supabase
                        .from('medical_histories')
                        .insert([{ patient_id: patient.id }])
                        .select()
                        .single()
                );
                if (createError) throw createError;
                h = newH;
            }
            setHistory(h);
            setFormData(prev => ({
                ...prev,
                personal_background: h.personal_background || "",
                family_background: h.family_background || "",
                allergies: h.allergies || "",
                systemic_diseases: h.systemic_diseases || "",
                current_medications: h.current_medications || "",
                general_notes: h.general_notes || ""
            }));

            const { data: recent, error: recentError } = await safeQuery(() =>
                supabase
                    .from('optometric_consultations')
                    .select('*')
                    .eq('medical_history_id', h.id)
                    .order('consultation_date', { ascending: false })
                    .limit(3)
            );
            if (!recentError) setRecentConsultations(recent || []);

        } catch (error) {
            toast.error("Error cargando la historia clínica");
            console.error(error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSave = async () => {
        if (!selectedPatient || !history) return;

        if (!formData.consultation_reason?.trim()) {
            return toast.warning("El motivo de consulta es obligatorio");
        }
        if (!formData.primary_diagnosis?.trim()) {
            return toast.warning("El diagnóstico es obligatorio para completar el registro");
        }

        setIsSaving(true);
        try {
            const { error: hUpdateError } = await safeQuery(() =>
                supabase
                    .from('medical_histories')
                    .update({
                        personal_background: formData.personal_background,
                        family_background: formData.family_background,
                        allergies: formData.allergies,
                        systemic_diseases: formData.systemic_diseases,
                        current_medications: formData.current_medications,
                        general_notes: formData.general_notes
                    })
                    .eq('id', history.id)
            );
            if (hUpdateError) throw hUpdateError;
            const { data: consultation, error: cError } = await safeQuery(() =>
                supabase
                    .from('optometric_consultations')
                    .insert([{
                        medical_history_id: history.id,
                        notes: formData.consultation_reason,
                        visual_acuity_od: formData.visual_acuity_od,
                        visual_acuity_os: formData.visual_acuity_os,
                        refraction_od: formData.refraction_od,
                        refraction_os: formData.refraction_os,
                        intraocular_pressure: formData.intraocular_pressure,
                        ocular_motility: formData.ocular_motility,
                        biomicroscopy: formData.biomicroscopy,
                        fundus_exam: formData.fundus_exam,
                        primary_diagnosis: formData.primary_diagnosis,
                        cie10_code: formData.cie10_code,
                        plan: formData.plan
                    }])
                    .select()
                    .single()
            );
            if (cError) throw cError;
            if (formData.sphere_od || formData.sphere_os) {
                const { error: pError } = await safeQuery(() =>
                    supabase
                        .from('prescriptions')
                        .insert([{
                            consultation_id: consultation.id,
                            sphere_od: formData.sphere_od, cylinder_od: formData.cylinder_od, axis_od: formData.axis_od, addition_od: formData.addition_od,
                            sphere_os: formData.sphere_os, cylinder_os: formData.cylinder_os, axis_os: formData.axis_os, addition_os: formData.addition_os,
                            lens_type: formData.lens_type,
                            recommended_use: formData.recommended_use,
                            expiry_date: formData.expiry_date || null
                        }])
                );
                if (pError) throw pError;
            }
            toast.success("Historia Clínica y Consulta guardadas exitosamente");
            setFormData(prev => ({
                ...prev,
                consultation_reason: "", visual_acuity_od: "", visual_acuity_os: "",
                refraction_od: "", refraction_os: "", intraocular_pressure: "",
                ocular_motility: "", biomicroscopy: "", fundus_exam: "",
                primary_diagnosis: "", cie10_code: "", plan: "",
                sphere_od: "", cylinder_od: "", axis_od: "", addition_od: "",
                sphere_os: "", cylinder_os: "", axis_os: "", addition_os: "",
                lens_type: "", recommended_use: "", expiry_date: ""
            }));
        } catch (error) {
            toast.error("Error al guardar la información");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return "";
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    return (
        <div className="flex flex-col gap-6 p-4 sm:px-6 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 px-3">
                <Breadcrumbs items={[
                    { label: "Historia Clínica", path: "/home/ehr" },
                    { label: selectedPatient ? "Registro Médico" : "Búsqueda" }
                ]} />
                {selectedPatient && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => generateEHR_PDF(selectedPatient, { ...formData, consultation_date: new Date().toISOString() }, history)}
                            className="flex items-center gap-2 bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 px-5 py-2 rounded-lg border border-gray-200 dark:border-[#262626] font-bold text-sm hover:bg-gray-200 dark:hover:bg-[#262626] transition-all active:scale-95 cursor-pointer"
                        >
                            <FiDownload size={18} />
                            <span>PDF</span>
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                            <FiSave size={18} />
                            <span>{isSaving ? 'Guardando...' : 'Guardar Consulta'}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Selection Header */}
            <div className={`bg-white dark:bg-[#111111] p-4 rounded-lg border-2 transition-colors duration-300 ${selectedPatient ? 'border-blue-900 dark:border-blue-800' : 'border-gray-200 dark:border-[#262626]'}`}>
                {selectedPatient ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center font-black text-blue-600 dark:text-blue-400 text-xl border-2 border-blue-100 dark:border-blue-900/40">
                                {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                            </div>
                            <div>
                                <h2 className="font-black text-base sm:text-lg dark:text-[#f5f5f5] uppercase tracking-tight">{selectedPatient.first_name} {selectedPatient.last_name}</h2>
                                <p className="text-[11px] font-black text-blue-600/60 dark:text-blue-400/60 uppercase tracking-widest">
                                    CC: {selectedPatient.document_number} • {calculateAge(selectedPatient.birth_date)} años
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(`/home/patients/${selectedPatient.id}`)}
                                className="text-[10px] font-black text-gray-400 dark:text-[#737373] hover:text-blue-600 dark:hover:text-blue-400 uppercase tracking-widest flex items-center gap-2 transition-colors"
                            >
                                <FiUser /> Perfil
                            </button>
                            <div className="w-px h-6 bg-gray-100 dark:bg-[#262626]" />
                            <button
                                onClick={() => setSelectedPatient(null)}
                                className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-widest flex items-center gap-2"
                            >
                                <FiSearch /> Cambiar Paciente
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full text-sm">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, documento o teléfono..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-[#262626] focus:ring-2 focus:ring-blue-500 outline-none transition dark:bg-[#1a1a1a] dark:text-[#f5f5f5] bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searching && <div className="absolute right-4 top-1/2 -translate-y-1/2 mt-[1px]"><Loader size="xs" /></div>}
                        {foundPatients.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-[#262626] rounded-lg z-50 shadow-none overflow-hidden divide-y divide-gray-100 dark:divide-[#262626]">
                                {foundPatients.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleSelectPatient(p)}
                                        className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-blue-900/10 transition-colors flex items-center justify-between group/item"
                                    >
                                        <div>
                                            <p className="font-black text-sm dark:text-[#f5f5f5] uppercase tracking-tight group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">{p.first_name} {p.last_name}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Documento: {p.document_number}</p>
                                        </div>
                                        <FiArrowRight className="text-gray-300 group-hover/item:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {loadingHistory ? (
                <div className="flex justify-center p-32"><Loader /></div>
            ) : selectedPatient ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-20 items-start">
                    {/* Left Column: Form Sections */}
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Consultation Reason */}
                        <section className="md:col-span-2 space-y-3">
                            <label className="text-[10px] font-black text-blue-600/60 dark:text-blue-400/60 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                                <FiFileText size={14} className="text-blue-500" /> Motivo de Consulta
                            </label>
                            <textarea
                                value={formData.consultation_reason}
                                onChange={(e) => setFormData({ ...formData, consultation_reason: e.target.value })}
                                className="w-full p-5 rounded-lg border border-gray-300 dark:border-[#262626] dark:bg-[#111111] dark:text-[#f5f5f5] outline-none focus:ring-2 focus:ring-blue-500 transition-all h-32 resize-none text-sm placeholder:text-gray-400 dark:placeholder:text-[#404040] font-medium"
                                placeholder="Describa el motivo principal de la visita de forma detallada..."
                            ></textarea>
                        </section>

                        {/* Medical Background */}
                        <section className="bg-white dark:bg-[#111111] p-5 rounded-lg border-2 border-gray-200 dark:border-[#262626]">
                            <h3 className="font-black text-[11px] dark:text-[#f5f5f5] border-b border-gray-200 dark:border-[#262626] pb-4 mb-5 uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center justify-between">
                                Antecedentes Clínicos
                                <FiActivity size={14} className="opacity-30" />
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Antecedentes Personales', key: 'personal_background' },
                                    { label: 'Antecedentes Familiares', key: 'family_background' },
                                    { label: 'Alergias Conocidas', key: 'allergies' },
                                    { label: 'Enfermedades Sistémicas', key: 'systemic_diseases' },
                                    { label: 'Medicamentos Actuales', key: 'current_medications' }
                                ].map(field => (
                                    <div key={field.key} className="flex flex-col gap-1.5">
                                        <label className="text-[9px] font-black text-gray-400 dark:text-[#737373] uppercase tracking-widest px-1">{field.label}</label>
                                        <input
                                            type="text"
                                            value={formData[field.key]}
                                            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-[#1a1a1a] px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#262626] focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-[#f5f5f5] transition-all font-medium"
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Optometric Exam */}
                        <section className="bg-white dark:bg-[#111111] p-5 rounded-lg border-2 border-gray-200 dark:border-[#262626]">
                            <h3 className="font-black text-[11px] dark:text-[#f5f5f5] border-b border-gray-200 dark:border-[#262626] pb-4 mb-5 uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center justify-between">
                                Examen de Optometría
                                <FiEye size={14} className="opacity-30" />
                            </h3>
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-gray-400 dark:text-[#737373] uppercase px-1">Agudeza Visual OD</label>
                                        <input value={formData.visual_acuity_od} onChange={e => setFormData({ ...formData, visual_acuity_od: e.target.value })} className="w-full bg-gray-50 dark:bg-[#1a1a1a] px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#262626] focus:ring-2 focus:ring-blue-500 text-sm dark:text-[#f5f5f5] font-mono text-center" placeholder="20/20" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-gray-400 dark:text-[#737373] uppercase px-1">Agudeza Visual OI</label>
                                        <input value={formData.visual_acuity_os} onChange={e => setFormData({ ...formData, visual_acuity_os: e.target.value })} className="w-full bg-gray-50 dark:bg-[#1a1a1a] px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#262626] focus:ring-2 focus:ring-blue-500 text-sm dark:text-[#f5f5f5] font-mono text-center" placeholder="20/20" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-gray-400 dark:text-[#737373] uppercase px-1">Refracción OD</label>
                                        <input value={formData.refraction_od} onChange={e => setFormData({ ...formData, refraction_od: e.target.value })} className="w-full bg-gray-50 dark:bg-[#1a1a1a] px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#262626] focus:ring-2 focus:ring-blue-500 text-sm dark:text-[#f5f5f5] font-mono" placeholder="E / C / A" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-gray-400 dark:text-[#737373] uppercase px-1">Refracción OI</label>
                                        <input value={formData.refraction_os} onChange={e => setFormData({ ...formData, refraction_os: e.target.value })} className="w-full bg-gray-50 dark:bg-[#1a1a1a] px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#262626] focus:ring-2 focus:ring-blue-500 text-sm dark:text-[#f5f5f5] font-mono" placeholder="E / C / A" />
                                    </div>
                                </div>
                                {[
                                    { label: 'Presión Intraocular', key: 'intraocular_pressure', placeholder: '12 mmHg' },
                                    { label: 'Motilidad Ocular', key: 'ocular_motility', placeholder: 'Conservada' },
                                    { label: 'Biomicroscopía', key: 'biomicroscopy', placeholder: 'Segmento anterior...' },
                                    { label: 'Fondo de Ojo', key: 'fundus_exam', placeholder: 'Media, periferia...' }
                                ].map((field) => (
                                    <div key={field.key} className="space-y-1.5">
                                        <label className="text-[9px] font-black text-gray-400 dark:text-[#737373] uppercase px-1">{field.label}</label>
                                        <input
                                            value={formData[field.key]}
                                            onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-[#1a1a1a] px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#262626] focus:ring-2 focus:ring-blue-500 text-sm dark:text-[#f5f5f5] font-medium"
                                            placeholder={field.placeholder}
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Optical Prescription */}
                        <section className="md:col-span-2 bg-blue-50/20 dark:bg-blue-900/5 p-6 rounded-lg border-2 border-blue-100 dark:border-blue-900/20 relative overflow-hidden">
                            <h3 className="font-black text-[11px] dark:text-[#f5f5f5] border-b border-blue-100 dark:border-blue-900/20 pb-4 mb-6 uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Prescripción Óptica Sugerida</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                                <div className="lg:col-span-1 hidden lg:flex items-center justify-center font-black text-[10px] text-blue-600/30 dark:text-blue-400/20 uppercase tracking-[0.3em] rotate-180 [writing-mode:vertical-lr]">Ojo Derecho</div>
                                {[
                                    { label: 'Esfera', key: 'sphere_od' },
                                    { label: 'Cilindro', key: 'cylinder_od' },
                                    { label: 'Eje', key: 'axis_od' },
                                    { label: 'Adición', key: 'addition_od' }
                                ].map(field => (
                                    <div key={field.key} className="space-y-2">
                                        <label className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase text-center block tracking-widest">{field.label}</label>
                                        <input
                                            value={formData[field.key]}
                                            onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                                            className="w-full bg-white dark:bg-[#111111] px-4 py-3 rounded-lg border border-gray-200 dark:border-[#262626] text-sm text-center font-black dark:text-[#f5f5f5] focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                ))}
                                <div className="lg:col-span-1 hidden lg:flex items-center justify-center font-black text-[10px] text-blue-600/30 dark:text-blue-400/20 uppercase tracking-[0.3em] rotate-180 [writing-mode:vertical-lr]">Ojo Izquierdo</div>
                                {[
                                    { label: 'Esfera', key: 'sphere_os' },
                                    { label: 'Cilindro', key: 'cylinder_os' },
                                    { label: 'Eje', key: 'axis_os' },
                                    { label: 'Adición', key: 'addition_os' }
                                ].map(field => (
                                    <input
                                        key={field.key}
                                        value={formData[field.key]}
                                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                                        className="w-full bg-white dark:bg-[#111111] px-4 py-3 rounded-lg border border-gray-200 dark:border-[#262626] text-sm text-center font-black dark:text-[#f5f5f5] focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="0.00"
                                    />
                                ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-6 border-t border-blue-100 dark:border-blue-900/20">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Tipo de Lente</label>
                                    <input value={formData.lens_type} onChange={e => setFormData({ ...formData, lens_type: e.target.value })} className="w-full bg-white dark:bg-[#111111] px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#262626] focus:ring-2 focus:ring-blue-500 text-sm font-bold dark:text-[#f5f5f5] outline-none" placeholder="Ej: Monofocal, Progresivo" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Uso Recomendado</label>
                                    <input value={formData.recommended_use} onChange={e => setFormData({ ...formData, recommended_use: e.target.value })} className="w-full bg-white dark:bg-[#111111] px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#262626] focus:ring-2 focus:ring-blue-500 text-sm font-bold dark:text-[#f5f5f5] outline-none" placeholder="Ej: Permanente, Lectura" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Vencimiento Fórmula</label>
                                    <input type="date" value={formData.expiry_date} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} className="w-full bg-white dark:bg-[#111111] px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#262626] focus:ring-2 focus:ring-blue-500 text-sm font-bold dark:text-[#f5f5f5] outline-none" />
                                </div>
                            </div>
                        </section>

                        {/* Diagnosis & Plan */}
                        <section className="md:col-span-2 bg-white dark:bg-[#111111] p-5 rounded-lg border-2 border-gray-200 dark:border-[#262626]">
                            <h3 className="font-black text-[11px] dark:text-[#f5f5f5] border-b border-gray-200 dark:border-[#262626] pb-4 mb-5 uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center justify-between">
                                Diagnóstico Definitivo y Plan
                                <FiFileText size={14} className="opacity-30" />
                            </h3>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="md:col-span-3 flex flex-col gap-2">
                                        <label className="text-[9px] font-black text-gray-400 dark:text-[#737373] uppercase tracking-widest px-1">Diagnóstico Principal</label>
                                        <input value={formData.primary_diagnosis} onChange={e => setFormData({ ...formData, primary_diagnosis: e.target.value })} type="text" className="w-full bg-gray-50 dark:bg-[#1a1a1a] px-5 py-3 rounded-lg border border-gray-300 dark:border-[#262626] focus:ring-2 focus:ring-blue-500 outline-none text-sm font-black dark:text-[#f5f5f5] uppercase tracking-tight" placeholder="Nombre de la patología o condición..." />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[9px] font-black text-gray-400 dark:text-[#737373] uppercase tracking-widest px-1 text-center">Código CIE-10</label>
                                        <input value={formData.cie10_code} onChange={e => setFormData({ ...formData, cie10_code: e.target.value })} type="text" className="w-full bg-gray-50 dark:bg-[#1a1a1a] px-3 py-3 rounded-lg border border-gray-300 dark:border-[#262626] focus:ring-2 focus:ring-blue-500 outline-none text-sm uppercase font-mono text-center font-black text-blue-600 dark:text-blue-400" placeholder="H52.1" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-gray-400 dark:text-[#737373] uppercase tracking-widest px-1">Plan de Tratamiento y Recomendaciones</label>
                                    <textarea value={formData.plan} onChange={e => setFormData({ ...formData, plan: e.target.value })} className="w-full bg-gray-50 dark:bg-[#1a1a1a] px-5 py-4 rounded-lg border border-gray-300 dark:border-[#262626] focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none dark:text-[#f5f5f5] text-sm font-medium transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600" placeholder="Indicaciones, higiene visual, próximos controles..."></textarea>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Context Sidebar */}
                    <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-8">
                        {/* Quick Info Card */}
                        <div className="bg-white dark:bg-[#111111] p-5 rounded-lg border-2 border-gray-200 dark:border-[#262626]">
                            <h4 className="text-[10px] font-black text-gray-400 dark:text-[#737373] uppercase tracking-widest mb-5 flex items-center gap-2">
                                <FiUser className="text-blue-500" /> Resumen Clínico
                            </h4>
                            <div className="space-y-4">
                                <div className="pb-4 border-b border-gray-200 dark:border-[#262626]">
                                    <p className="text-[9px] text-gray-400 uppercase font-black tracking-tighter mb-1">Notas Generales</p>
                                    <p className="text-xs text-gray-600 dark:text-[#a3a3a3] italic font-medium leading-relaxed">
                                        {formData.general_notes ? `"${formData.general_notes.substring(0, 120)}..."` : "Sin notas preventivas registradas para este paciente."}
                                    </p>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Estado Alérgico</span>
                                    <span className={`px-2 py-0.5 rounded font-black uppercase text-[9px] ${formData.allergies ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : 'bg-green-50 text-green-500 dark:bg-green-900/20'}`}>
                                        {formData.allergies || "Ninguna"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Consultations Sidebar */}
                        <div className="bg-white dark:bg-[#111111] p-5 rounded-lg border-2 border-gray-200 dark:border-[#262626]">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-[10px] font-black text-gray-400 dark:text-[#737373] uppercase tracking-widest flex items-center gap-2">
                                    <FiClock className="text-blue-500" /> Historial Reciente
                                </h4>
                            </div>
                            <div className="space-y-5">
                                {recentConsultations.length > 0 ? (
                                    recentConsultations.map((c, idx) => (
                                        <div key={c.id} className="relative pl-6 border-l-2 border-blue-100 dark:border-blue-900/20 group cursor-default">
                                            <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-white dark:ring-[#111111]"></div>
                                            <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase font-mono tracking-widest">
                                                {new Date(c.consultation_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                            <p className="text-[10px] font-black text-gray-800 dark:text-[#f5f5f5] mt-1.5 uppercase tracking-tighter line-clamp-1">
                                                {c.primary_diagnosis || "Consulta de Control"}
                                            </p>
                                            {c.notes && (
                                                <p className="text-[9px] text-blue-600/70 dark:text-blue-400/60 font-bold uppercase tracking-tight mt-0.5 line-clamp-1">
                                                    Motivo: {c.notes}
                                                </p>
                                            )}
                                            <p className="text-[10px] text-gray-500 dark:text-[#737373] mt-1 line-clamp-1 italic font-medium">
                                                {c.plan || "Sin plan registrado."}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-10 text-center bg-gray-50/50 dark:bg-[#161616] rounded-lg border-2 border-dashed border-gray-200 dark:border-[#262626]">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Primera Consulta</p>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => navigate('/home/ehr-evolution', { state: { patientId: selectedPatient.id } })}
                                className="w-full mt-6 py-2.5 text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                                Ver Evolución Completa <FiArrowRight />
                            </button>
                        </div>
                    </aside>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#111111] border-2 border-gray-200 dark:border-[#262626] rounded-lg p-16 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-none">
                    <div className="max-w-md">
                        <h3 className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.4em] mb-2">Sin Paciente Seleccionado</h3>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-[0.2em] leading-relaxed">
                            Use la barra de búsqueda superior para encontrar un paciente e iniciar un nuevo registro clínico
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EHR;
