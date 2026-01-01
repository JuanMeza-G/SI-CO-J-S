import React from "react";
import { X } from "lucide-react";


/** Componente base de Modal reutilizable */
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1e1e1e] dark:border dark:border-[#262626] rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4  border-gray-100 dark:border-[#262626]">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-[#f5f5f5]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#242424] transition-colors text-gray-500 hover:text-gray-900 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
