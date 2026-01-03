import React, { useState, useEffect } from 'react';
import { FiSave, FiSearch, FiFileText, FiPlus, FiChevronDown, FiChevronUp, FiEye } from 'react-icons/fi';
import Breadcrumbs from '../components/Breadcrumbs';
import { supabase } from '../supabaseClient';
import { safeQuery } from '../utils/supabaseHelpers';
import { toast } from 'sonner';
import Loader from '../components/Loader';
const EHR = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [foundPatients, setFoundPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [searching, setSearching] = useState(false);
    const [history, setHistory] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
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
        } catch (error) {
            toast.error("Error cargando la historia clínica");
            console.error(error);
        } finally {
            setLoadingHistory(false);
        }
    };
    const handleSave = async () => {
        if (!selectedPatient || !history) return;
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
                        consultation_reason: formData.consultation_reason,
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
                    { label: "Registro" }
                ]} />
                <button
                    onClick={handleSave}
                    disabled={!selectedPatient || isSaving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                    <FiSave />
                    <span>{isSaving ? 'Guardando...' : 'Guardar Consulta'}</span>
                </button>
            </div>
            {}
            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border-2 border-blue-100 dark:border-blue-900/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                {selectedPatient ? (
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-sm border border-blue-200 dark:border-blue-900/40">
                            {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                        </div>
                        <div>
                            <h2 className="font-bold text-sm sm:text-base dark:text-[#f5f5f5]">{selectedPatient.first_name} {selectedPatient.last_name}</h2>
                            <p className="text-[11px] font-medium text-gray-500 dark:text-[#a3a3a3] uppercase tracking-wider">CC: {selectedPatient.document_number} • {calculateAge(selectedPatient.birth_date)} años</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 w-full relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar paciente para abrir historia..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-[#262626] dark:bg-[#111111] dark:text-[#f5f5f5] outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader size="xs" /></div>}
                        {foundPatients.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#262626] rounded-lg shadow-xl z-20">
                                {foundPatients.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleSelectPatient(p)}
                                        className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-[#202020] border-b dark:border-[#262626] last:border-0"
                                    >
                                        <p className="font-bold text-sm dark:text-[#f5f5f5]">{p.first_name} {p.last_name}</p>
                                        <p className="text-[10px] text-gray-400">{p.document_number}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {selectedPatient && (
                    <button
                        onClick={() => setSelectedPatient(null)}
                        className="text-blue-600 dark:text-blue-400 font-bold text-xs hover:underline cursor-pointer flex items-center gap-1.5 uppercase tracking-widest"
                    >
                        <FiSearch /> Cambiar
                    </button>
                )}
            </div>
            {loadingHistory ? (
                <div className="flex justify-center p-20"><Loader /></div>
            ) : selectedPatient && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
                    {}
                    <section className="md:col-span-2 space-y-2">
                        <label className="text-[11px] font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-widest flex items-center gap-2">
                            <FiFileText className="text-blue-500" /> Motivo de Consulta
                        </label>
                        <textarea
                            value={formData.consultation_reason}
                            onChange={(e) => setFormData({ ...formData, consultation_reason: e.target.value })}
                            className="w-full p-4 rounded-lg border-2 border-gray-200 dark:border-[#262626] dark:bg-[#111111] dark:text-[#f5f5f5] outline-none focus:border-blue-500 transition-colors h-24 resize-none text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600"
                            placeholder="Ingrese el motivo de la consulta aquí..."
                        ></textarea>
                    </section>
                    {}
                    <section className="bg-white dark:bg-[#111111] p-5 rounded-lg border-2 border-gray-200 dark:border-[#262626]">
                        <h3 className="font-bold text-sm dark:text-[#f5f5f5] border-b border-gray-100 dark:border-[#262626] pb-3 mb-4 uppercase tracking-widest">Antecedentes Médicos</h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Antecedentes Personales', key: 'personal_background' },
                                { label: 'Antecedentes Familiares', key: 'family_background' },
                                { label: 'Alergias', key: 'allergies' },
                                { label: 'Enfermedades Sistémicas', key: 'systemic_diseases' },
                                { label: 'Medicamentos Actuales', key: 'current_medications' }
                            ].map(field => (
                                <div key={field.key} className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-[#a3a3a3] uppercase tracking-widest">{field.label}</label>
                                    <input
                                        type="text"
                                        value={formData[field.key]}
                                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-[#1a1a1a] px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] outline-none text-sm dark:text-[#f5f5f5] focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                    {}
                    <section className="bg-white dark:bg-[#111111] p-5 rounded-lg border-2 border-gray-200 dark:border-[#262626]">
                        <h3 className="font-bold text-sm dark:text-[#f5f5f5] border-b border-gray-100 dark:border-[#262626] pb-3 mb-4 uppercase tracking-widest">Examen Optométrico</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-[#a3a3a3] uppercase">AV OD</label>
                                    <input value={formData.visual_acuity_od} onChange={e => setFormData({ ...formData, visual_acuity_od: e.target.value })} className="w-full bg-gray-50 dark:bg-[#1a1a1a] px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] text-sm dark:text-[#f5f5f5]" placeholder="20/20" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-[#a3a3a3] uppercase">AV OI</label>
                                    <input value={formData.visual_acuity_os} onChange={e => setFormData({ ...formData, visual_acuity_os: e.target.value })} className="w-full bg-gray-50 dark:bg-[#1a1a1a] px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] text-sm dark:text-[#f5f5f5]" placeholder="20/20" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-[#a3a3a3] uppercase">RX OD</label>
                                    <input value={formData.refraction_od} onChange={e => setFormData({ ...formData, refraction_od: e.target.value })} className="w-full bg-gray-50 dark:bg-[#1a1a1a] px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] text-sm dark:text-[#f5f5f5]" placeholder="Esf / Cil / Eje" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-[#a3a3a3] uppercase">RX OI</label>
                                    <input value={formData.refraction_os} onChange={e => setFormData({ ...formData, refraction_os: e.target.value })} className="w-full bg-gray-50 dark:bg-[#1a1a1a] px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] text-sm dark:text-[#f5f5f5]" placeholder="Esf / Cil / Eje" />
                                </div>
                            </div>
                            {[
                                { label: 'Presión Intraocular', key: 'intraocular_pressure' },
                                { label: 'Motilidad Ocular', key: 'ocular_motility' },
                                { label: 'Biomicroscopía', key: 'biomicroscopy' },
                                { label: 'Fondo de Ojo', key: 'fundus_exam' }
                            ].map((field) => (
                                <div key={field.key} className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-[#a3a3a3] uppercase">{field.label}</label>
                                    <input
                                        value={formData[field.key]}
                                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-[#1a1a1a] px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] text-sm dark:text-[#f5f5f5]"
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                    {}
                    <section className="md:col-span-2 bg-blue-50/30 dark:bg-blue-900/5 p-5 rounded-lg border-2 border-blue-100 dark:border-blue-900/20">
                        <h3 className="font-bold text-sm dark:text-[#f5f5f5] border-b border-blue-100 dark:border-blue-900/20 pb-3 mb-4 uppercase tracking-widest text-blue-600 dark:text-blue-400">Prescripción Óptica</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                            <div className="lg:col-span-1 hidden lg:flex items-center justify-center font-bold text-xs text-gray-400">OD</div>
                            {[
                                { label: 'Esfera', key: 'sphere_od' },
                                { label: 'Cilindro', key: 'cylinder_od' },
                                { label: 'Eje', key: 'axis_od' },
                                { label: 'Adición', key: 'addition_od' }
                            ].map(field => {
                                return (
                                    <div key={field.key} className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 dark:text-[#a3a3a3] uppercase text-center block">{field.label}</label>
                                        <input
                                            value={formData[field.key]}
                                            onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                                            className="w-full bg-white dark:bg-[#111111] px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] text-sm text-center"
                                        />
                                    </div>
                                );
                            })}
                            <div className="lg:col-span-1 hidden lg:flex items-center justify-center font-bold text-xs text-gray-400">OI</div>
                            {[
                                { label: 'Esfera', key: 'sphere_os' },
                                { label: 'Cilindro', key: 'cylinder_os' },
                                { label: 'Eje', key: 'axis_os' },
                                { label: 'Adición', key: 'addition_os' }
                            ].map(field => {
                                return (
                                    <input
                                        key={field.key}
                                        value={formData[field.key]}
                                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                                        className="w-full bg-white dark:bg-[#111111] px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] text-sm text-center"
                                    />
                                );
                            })}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Tipo de Lente</label>
                                <input value={formData.lens_type} onChange={e => setFormData({ ...formData, lens_type: e.target.value })} className="w-full bg-white dark:bg-[#111111] px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Uso Recomendado</label>
                                <input value={formData.recommended_use} onChange={e => setFormData({ ...formData, recommended_use: e.target.value })} className="w-full bg-white dark:bg-[#111111] px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Fecha de Vencimiento</label>
                                <input type="date" value={formData.expiry_date} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} className="w-full bg-white dark:bg-[#111111] px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] text-sm" />
                            </div>
                        </div>
                    </section>
                    {}
                    <section className="md:col-span-2 bg-white dark:bg-[#111111] p-5 rounded-lg border-2 border-gray-200 dark:border-[#262626]">
                        <h3 className="font-bold text-sm dark:text-[#f5f5f5] border-b border-gray-100 dark:border-[#262626] pb-3 mb-4 uppercase tracking-widest">Diagnóstico y Plan</h3>
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-3 flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-[#a3a3a3] uppercase tracking-widest">Diagnóstico Principal</label>
                                    <input value={formData.primary_diagnosis} onChange={e => setFormData({ ...formData, primary_diagnosis: e.target.value })} type="text" className="w-full bg-gray-50 dark:bg-[#1a1a1a] px-4 py-2 rounded-lg border border-gray-200 dark:border-[#262626] text-sm" placeholder="Nombre del diagnóstico..." />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-[#a3a3a3] uppercase tracking-widest">Código CIE-10</label>
                                    <input value={formData.cie10_code} onChange={e => setFormData({ ...formData, cie10_code: e.target.value })} type="text" className="w-full bg-gray-50 dark:bg-[#1a1a1a] px-4 py-2 rounded-lg border border-gray-200 dark:border-[#262626] text-sm uppercase" placeholder="H52.1" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-gray-400 dark:text-[#a3a3a3] uppercase tracking-widest">Plan / Recomendaciones</label>
                                <textarea value={formData.plan} onChange={e => setFormData({ ...formData, plan: e.target.value })} className="w-full bg-gray-50 dark:bg-[#1a1a1a] px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#262626] outline-none h-24 resize-none dark:text-[#f5f5f5] text-sm focus:border-blue-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600" placeholder="Instrucciones para el paciente..."></textarea>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};
export default EHR;
