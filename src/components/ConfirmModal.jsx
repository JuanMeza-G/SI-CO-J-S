import React from "react";
import Modal from "./Modal";
import { AlertTriangle, CheckCircle } from "lucide-react";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
}) => {
  const isActivate = confirmText.toLowerCase() === "activar";
  const Icon = isActivate ? CheckCircle : AlertTriangle;
  const iconBgColor = isActivate 
    ? "bg-green-100 dark:bg-green-900/30" 
    : "bg-red-100 dark:bg-red-900/30";
  const iconColor = isActivate 
    ? "text-green-600 dark:text-green-500" 
    : "text-red-600 dark:text-red-500";
  const buttonBgColor = isActivate 
    ? "bg-green-600 hover:bg-green-700" 
    : "bg-red-600 hover:bg-red-700";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center gap-4">
        <div className={`w-16 h-16 ${iconBgColor} rounded-full flex items-center justify-center`}>
          <Icon className={`${iconColor} w-8 h-8`} />
        </div>

        <div>
          <p className="text-gray-600 dark:text-[#e5e5e5] px-2">{message}</p>
        </div>

        <div className="flex gap-3 w-full mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-[#1a1a1a] dark:hover:bg-[#242424] text-gray-700 dark:text-[#e5e5e5] rounded-lg transition-colors font-medium cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 ${buttonBgColor} text-white rounded-lg transition-colors font-medium shadow-sm hover:shadow cursor-pointer`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
