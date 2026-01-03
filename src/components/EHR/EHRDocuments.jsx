import React from "react";
import { FiDownload, FiUpload, FiTrash2, FiFileText } from "react-icons/fi";
import Breadcrumbs from "../Breadcrumbs";
const EHRDocuments = () => {
  const documents = [
    {
      id: 1,
      name: "Formula_Lentes_JM.pdf",
      type: "Fórmula",
      date: "28 Dic 2023",
      size: "1.2 MB",
    },
    {
      id: 2,
      name: "Resultado_Examen_Fondo_Ojo.jpg",
      type: "Examen",
      date: "15 Jun 2023",
      size: "4.5 MB",
    },
    {
      id: 3,
      name: "Consentimiento_Informado.pdf",
      type: "Legal",
      date: "10 Ene 2023",
      size: "0.8 MB",
    },
  ];
  return (
    <div className="flex flex-col gap-6 p-4 sm:px-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 px-3">
        <Breadcrumbs
          items={[
            { label: "Historia Clínica", path: "/home/ehr" },
            { label: "Documentos" },
          ]}
        />
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 cursor-pointer">
          <FiUpload />
          <span>Subir Documento</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-white dark:bg-[#111111] p-5 rounded-lg border-2 border-gray-200 dark:border-[#262626] transition-all hover:border-gray-300 dark:hover:border-[#2a2a2a] group relative"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                <FiFileText size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="font-bold dark:text-[#f5f5f5] text-sm truncate mb-1"
                  title={doc.name}
                >
                  {doc.name}
                </h3>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                    {doc.type}
                  </span>
                  <span className="text-[11px] font-medium text-gray-400 dark:text-[#a3a3a3]">
                    {doc.date} • {doc.size}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] text-[11px] font-bold text-gray-500 dark:text-[#a3a3a3] hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer border border-gray-200 dark:border-[#262626] uppercase tracking-wider active:scale-95">
                <FiDownload size={14} /> Descargar
              </button>
              <button className="p-2 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] text-gray-400 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors cursor-pointer border border-gray-200 dark:border-[#262626] active:scale-95">
                <FiTrash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {}
        <div className="border-2 border-dashed border-gray-300 dark:border-[#262626] rounded-lg p-6 flex flex-col items-center justify-center text-center gap-3 hover:bg-gray-50 dark:hover:bg-[#161616] transition-all cursor-pointer group active:scale-[0.98]">
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all border border-gray-200 dark:border-[#262626]">
            <FiUpload size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-widest">
              Arrastra archivos
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">
              Formatos PDF, JPG o PNG
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default EHRDocuments;
