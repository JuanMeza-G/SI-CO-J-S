import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Genera un PDF profesional con la historia clínica y branding del centro óptico
 * @param {Object} patient - Datos del paciente
 * @param {Object} consultation - Datos de la consulta
 * @param {Object} history - Antecedentes (opcional)
 */
export const generateEHR_PDF = (patient, consultation, history = {}) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- Configuración de Colores y Estilos ---
    const primaryColor = [30, 58, 138]; // Azul Navy Profundo (Blue 900)
    const secondaryColor = [71, 85, 105]; // Slate 600
    const accentColor = [37, 99, 235]; // Azul Brillante (Blue 600)
    const lightGray = [248, 250, 252]; // Slate 50
    const borderGray = [226, 232, 240]; // Slate 200

    // --- Función para dibujar el Icono del Centro Óptico ---
    const drawClinicLogo = (x, y) => {
        // Estilo de línea para el ojo
        doc.setDrawColor(...accentColor);
        doc.setLineWidth(1);

        // Contorno del ojo (forma de almendra)
        doc.ellipse(x, y, 12, 6, 'S');

        // Iris
        doc.setFillColor(...accentColor);
        doc.circle(x, y, 3.5, 'F');

        // Pupila
        doc.setFillColor(255, 255, 255);
        doc.circle(x, y, 1.2, 'F');

        // Brillo
        doc.circle(x + 0.5, y - 0.5, 0.4, 'F');

        // Líneas decorativas (pestañas estilizadas o reflejos)
        doc.setDrawColor(...accentColor);
        doc.setLineWidth(0.5);
        doc.line(x - 15, y, x - 13, y);
        doc.line(x + 13, y, x + 15, y);
    };

    // --- Encabezado Profesional ---
    // Fondo sutil para la cabecera
    doc.setFillColor(...lightGray);
    doc.rect(0, 0, pageWidth, 50, 'F');
    doc.setDrawColor(...borderGray);
    doc.line(0, 50, pageWidth, 50);

    // Logo e Icono
    drawClinicLogo(30, 25);

    doc.setTextColor(...primaryColor);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("SI-CO J&S", 50, 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...secondaryColor);
    doc.text("SISTEMA DE GESTIÓN OPTOMÉTRICA", 50, 28);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Especialistas en Salud Visual • Registro Profesional: 000000", 50, 33);
    doc.text("Bogotá, Colombia • contacto@si-co-js.com", 50, 37);

    // Título del Documento
    doc.setFillColor(...primaryColor);
    doc.rect(pageWidth - 80, 15, 60, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("HISTORIA CLÍNICA", pageWidth - 50, 21.5, { align: 'center' });

    doc.setTextColor(...secondaryColor);
    const reportDate = new Date().toLocaleDateString('es-ES', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
    doc.setFontSize(8);
    doc.text(`Fecha de Emisión: ${reportDate}`, pageWidth - 50, 29, { align: 'center' });

    let currentY = 65;

    // --- Sección 1: Datos del Paciente ---
    doc.setTextColor(...primaryColor);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("IDENTIFICACIÓN DEL PACIENTE", 20, currentY);

    currentY += 4;
    autoTable(doc, {
        startY: currentY,
        theme: 'plain',
        body: [
            ['PACIENTE:', `${patient.first_name} ${patient.last_name}`.toUpperCase(), 'DOCUMENTO:', patient.document_number],
            ['NACIMIENTO:', patient.birth_date || 'N/A', 'FECHA CONSULTA:', new Date(consultation.consultation_date).toLocaleDateString().toUpperCase()]
        ],
        styles: { fontSize: 8.5, cellPadding: 2, font: 'helvetica' },
        columnStyles: {
            0: { fontStyle: 'bold', textColor: primaryColor, width: 30 },
            2: { fontStyle: 'bold', textColor: primaryColor, width: 35 }
        }
    });

    currentY = doc.lastAutoTable.finalY + 12;

    // --- Sección 2: Antecedentes (Si existen) ---
    if (history && history.id) {
        doc.setTextColor(...primaryColor);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("ANAMNESIS Y ANTECEDENTES", 20, currentY);

        currentY += 4;
        const historyData = [
            ['Personales:', history.personal_background || 'Sin reportar'],
            ['Familiares:', history.family_background || 'Sin reportar'],
            ['Sistémicos:', history.systemic_diseases || 'Sin reportar'],
            ['Medicamentos:', history.current_medications || 'Sin reportar'],
            ['Alergias:', history.allergies || 'Ninguna']
        ];

        autoTable(doc, {
            startY: currentY,
            theme: 'grid',
            body: historyData,
            styles: { fontSize: 8, cellPadding: 3, lineColor: borderGray, hex: primaryColor },
            columnStyles: {
                0: { fontStyle: 'bold', width: 35, fillColor: lightGray, textColor: primaryColor }
            }
        });
        currentY = doc.lastAutoTable.finalY + 12;
    }

    // --- Sección 3: Hallazgos Optométricos ---
    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("VALORACIÓN OPTOMÉTRICA", 20, currentY);

    currentY += 4;
    const examData = [
        ['Motivo de Consulta:', { content: consultation.notes || 'Consulta de rutina', colSpan: 3 }],
        ['Agudeza Visual OD:', consultation.visual_acuity_od || '---', 'Agudeza Visual OI:', consultation.visual_acuity_os || '---'],
        ['Refracción OD:', consultation.refraction_od || '---', 'Refracción OI:', consultation.refraction_os || '---'],
        ['Presión Intraocular:', consultation.intraocular_pressure || '---', 'Motilidad Ocular:', consultation.ocular_motility || '---'],
        ['Biomicroscopía:', { content: consultation.biomicroscopy || 'Sin observaciones', colSpan: 3 }],
        ['Fondo de Ojo:', { content: consultation.fundus_exam || 'Sin observaciones', colSpan: 3 }]
    ];

    autoTable(doc, {
        startY: currentY,
        theme: 'grid',
        body: examData,
        styles: { fontSize: 8, cellPadding: 3, lineColor: borderGray },
        columnStyles: {
            0: { fontStyle: 'bold', fillColor: lightGray, width: 35, textColor: primaryColor },
            2: { fontStyle: 'bold', fillColor: lightGray, width: 35, textColor: primaryColor }
        }
    });

    currentY = doc.lastAutoTable.finalY + 12;

    // --- Sección 4: Prescripción Óptica ---
    const prescription = consultation.prescriptions?.[0] || consultation;
    const hasPrescription = prescription.sphere_od || prescription.sphere_os || prescription.lens_type;

    if (hasPrescription) {
        doc.setTextColor(...primaryColor);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("FÓRMULA ÓPTICA SUGERIDA", 20, currentY);

        currentY += 4;
        autoTable(doc, {
            startY: currentY,
            head: [['OJO', 'ESFERA', 'CILINDRO', 'EJE', 'ADICIÓN']],
            body: [
                ['DERECHO (OD)', prescription.sphere_od || '---', prescription.cylinder_od || '---', prescription.axis_od || '---', prescription.addition_od || '---'],
                ['IZQUIERDO (OI)', prescription.sphere_os || '---', prescription.cylinder_os || '---', prescription.axis_os || '---', prescription.addition_os || '---']
            ],
            theme: 'striped',
            headStyles: { fillColor: primaryColor, halign: 'center', fontSize: 8, fontStyle: 'bold' },
            bodyStyles: { halign: 'center', fontSize: 9 },
            styles: { lineColor: borderGray }
        });

        currentY = doc.lastAutoTable.finalY + 8;
        doc.setFontSize(8.5);

        // Fila extra para tipo de lente y uso
        doc.setTextColor(...primaryColor);
        doc.setFont("helvetica", "bold");
        doc.text("TIPO DE LENTE:", 20, currentY);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(prescription.lens_type || 'N/A', 45, currentY);

        doc.setTextColor(...primaryColor);
        doc.setFont("helvetica", "bold");
        doc.text("RECOMENDACIÓN:", 100, currentY);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(prescription.recommended_use || 'N/A', 130, currentY);

        currentY += 15;
    }

    // --- Sección 5: Conclusiones ---
    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("DIAGNÓSTICO Y PLAN DE TRATAMIENTO", 20, currentY);

    currentY += 4;
    autoTable(doc, {
        startY: currentY,
        theme: 'grid',
        body: [
            ['Diagnóstico Principal:', `${consultation.cie10_code || ''} - ${consultation.primary_diagnosis || 'Sin diagnóstico registrado'}`],
            ['Plan de Manejo:', consultation.plan || 'Sin observaciones adicionales.']
        ],
        styles: { fontSize: 8.5, cellPadding: 4, lineColor: borderGray },
        columnStyles: {
            0: { fontStyle: 'bold', width: 45, fillColor: lightGray, textColor: primaryColor }
        }
    });

    // --- Pie de Página y Firma ---
    const finalY = doc.lastAutoTable.finalY + 35;

    // Línea de firma
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 30, finalY, pageWidth / 2 + 30, finalY);

    doc.setFontSize(8);
    doc.setTextColor(...secondaryColor);
    doc.text("Firma del Profesional Optómetra", pageWidth / 2, finalY + 5, { align: 'center' });
    doc.text("Registro Profesional: 00000000", pageWidth / 2, finalY + 9, { align: 'center' });

    // Numeración de página
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(`SICO - Gestión de Historias Clínicas Electrónicas • Página ${i} de ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    // Guardar PDF
    const fileName = `HC_${patient.last_name}_${consultation.consultation_date.split('T')[0]}.pdf`;
    doc.save(fileName.replace(/\s+/g, '_'));
};
