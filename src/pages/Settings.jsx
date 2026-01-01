import UserRegister from "../components/Settings/UserRegister";
import UserManagement from "../components/Settings/UserManagement";
import ClinicInfo from "../components/Settings/ClinicInfo";
import ServicesManagement from "../components/Settings/ServicesManagement";
import RolesAndPermissions from "../components/Settings/RolesAndPermissions";
import Modal from "../components/Modal";
import {
  FcBusinessman,
  FcConferenceCall,
  FcDepartment,
  FcTodoList,
  FcSms,
  FcLock,
  FcBinoculars,
  FcDataBackup,
} from "react-icons/fc";
import { toast } from "sonner";
import { useState } from "react";
import { IoArrowBackSharp } from "react-icons/io5";
import { FaPlus, FaSave } from "react-icons/fa";
import { useRef } from "react";

/** Página de configuración del sistema (Usuarios, Servicios, Roles, etc.) */
const Settings = () => {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [activeView, setActiveView] = useState("menu");
  const [isClinicInfoDirty, setIsClinicInfoDirty] = useState(false);
  const [isRolesAndPermissionsDirty, setIsRolesAndPermissionsDirty] = useState(false);
  const servicesRef = useRef(null);
  const clinicInfoRef = useRef(null);
  const rolesAndPermissionsRef = useRef(null);

  if (activeView !== "menu") {
    return (
      <div className="p-2 sm:p-4">
        <Modal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          title="Registrar nuevo usuario"
        >
          <UserRegister onSuccess={() => setIsRegisterModalOpen(false)} />
        </Modal>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <button
            onClick={() => setActiveView("menu")}
            className="flex text-[15px] items-center gap-2 cursor-pointer text-gray-800 dark:text-[#e5e5e5] hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:[text-shadow:0_0_1px_currentColor]"
          >
            <IoArrowBackSharp /> Volver a Configuración
          </button>
          {activeView === "userManagement" && (
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer font-medium text-sm w-full sm:w-auto"
            >
              <FaPlus />
              Registrar Usuario
            </button>
          )}
          {activeView === "services" && (
            <button
              onClick={() => servicesRef.current?.openNewModal()}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer font-medium text-sm w-full sm:w-auto"
            >
              <FaPlus />
              Nuevo Servicio
            </button>
          )}
          {activeView === "clinicInfo" && (
            <button
              onClick={() => clinicInfoRef.current?.submitForm()}
              disabled={!isClinicInfoDirty}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm w-full sm:w-auto ${!isClinicInfoDirty
                ? "bg-gray-300 cursor-not-allowed text-gray-500"
                : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                }`}
            >
              <FaSave />
              Guardar Cambios
            </button>
          )}
          {activeView === "rolesAndPermissions" && (
            <button
              onClick={() => rolesAndPermissionsRef.current?.savePermissions()}
              disabled={!isRolesAndPermissionsDirty}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm w-full sm:w-auto ${!isRolesAndPermissionsDirty
                ? "bg-gray-300 cursor-not-allowed text-gray-500"
                : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                }`}
            >
              <FaSave />
              Guardar Cambios
            </button>
          )}
        </div>
        <div className="">
          {activeView === "userManagement" && <UserManagement />}
          {activeView === "clinicInfo" && (
            <ClinicInfo
              ref={clinicInfoRef}
              onDirtyChange={setIsClinicInfoDirty}
            />
          )}
          {activeView === "services" && (
            <ServicesManagement ref={servicesRef} />
          )}
          {activeView === "rolesAndPermissions" && (
            <RolesAndPermissions
              ref={rolesAndPermissionsRef}
              onDirtyChange={setIsRolesAndPermissionsDirty}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Registrar nuevo usuario"
      >
        <UserRegister onSuccess={() => setIsRegisterModalOpen(false)} />
      </Modal>

      <div
        onClick={() => setActiveView("userManagement")}
        className="col-span-1 flex flex-col sm:flex-row gap-2 sm:gap-4 items-center bg-white rounded-lg px-4 py-3 sm:py-2 border-2 border-gray-200 dark:bg-[#111111] dark:border-[#262626] dark:text-[#f5f5f5] cursor-pointer hover:border-gray-300 dark:hover:border-[#2a2a2a] transition-colors"
      >
        <div className="flex justify-center items-center w-16 sm:w-24">
          <FcConferenceCall className="text-6xl sm:text-8xl" />
        </div>
        <div className="grid text-center sm:text-left">
          <span className="font-bold text-sm sm:text-base">
            Gestionar usuarios
          </span>
          <span className="text-xs sm:text-sm text-gray-500 dark:text-[#a3a3a3]">
            Administrar roles y usuarios
          </span>
        </div>
      </div>

      <div
        onClick={() => setActiveView("clinicInfo")}
        className="col-span-1 flex flex-col sm:flex-row gap-2 sm:gap-4 items-center bg-white rounded-lg px-4 py-3 sm:py-2 border-2 border-gray-200 dark:bg-[#111111] dark:border-[#262626] dark:text-[#f5f5f5] cursor-pointer hover:border-gray-300 dark:hover:border-[#2a2a2a] transition-colors"
      >
        <div className="flex justify-center items-center w-16 sm:w-24">
          <FcDepartment className="text-6xl sm:text-8xl" />
        </div>
        <div className="grid text-center sm:text-left">
          <span className="font-bold text-sm sm:text-base">
            Info. del centro óptico
          </span>
          <span className="text-xs sm:text-sm text-gray-500 dark:text-[#a3a3a3]">
            Datos generales y horarios/días de atención
          </span>
        </div>
      </div>

      <div
        onClick={() => setActiveView("services")}
        className="col-span-1 flex flex-col sm:flex-row gap-2 sm:gap-4 items-center bg-white rounded-lg px-4 py-3 sm:py-2 border-2 border-gray-200 dark:bg-[#111111] dark:border-[#262626] dark:text-[#f5f5f5] cursor-pointer hover:border-gray-300 dark:hover:border-[#2a2a2a] transition-colors"
      >
        <div className="flex justify-center items-center w-16 sm:w-24">
          <FcTodoList className="text-6xl sm:text-8xl" />
        </div>
        <div className="grid text-center sm:text-left">
          <span className="font-bold text-sm sm:text-base">Servicios</span>
          <span className="text-xs sm:text-sm text-gray-500 dark:text-[#a3a3a3]">
            Catálogo de servicios y precios de consulta
          </span>
        </div>
      </div>

      <div
        onClick={() => setActiveView("rolesAndPermissions")}
        className="col-span-1 flex flex-col sm:flex-row gap-2 sm:gap-4 items-center bg-white rounded-lg px-4 py-3 sm:py-2 border-2 border-gray-200 dark:bg-[#111111] dark:border-[#262626] dark:text-[#f5f5f5] cursor-pointer hover:border-gray-300 dark:hover:border-[#2a2a2a] transition-colors"
      >
        <div className="flex justify-center items-center w-16 sm:w-24">
          <FcLock className="text-6xl sm:text-8xl" />
        </div>
        <div className="grid text-center sm:text-left">
          <span className="font-bold text-sm sm:text-base">
            Roles y Permisos
          </span>
          <span className="text-xs sm:text-sm text-gray-500 dark:text-[#a3a3a3]">
            Gestión avanzada de accesos por usuario
          </span>
        </div>
      </div>

      <div
        className="col-span-1 flex flex-col sm:flex-row gap-2 sm:gap-4 items-center bg-gray-50 rounded-lg px-4 py-3 sm:py-2 border-2 border-gray-100 dark:bg-[#111111] dark:border-[#1a1a1a] dark:text-[#a3a3a3] cursor-not-allowed opacity-70 grayscale transition-colors"
        onClick={() => toast.info("Próximamente")}
      >
        <div className="flex justify-center items-center w-16 sm:w-24">
          <FcSms className="text-6xl sm:text-8xl opacity-50" />
        </div>
        <div className="grid text-center sm:text-left">
          <span className="font-bold text-sm sm:text-base text-gray-500 dark:text-[#a3a3a3]">
            Notificaciones
          </span>
          <span className="text-xs sm:text-sm text-gray-400">
            Plantillas de correo y configuración de avisos
          </span>
        </div>
      </div>

      <div
        className="col-span-1 flex flex-col sm:flex-row gap-2 sm:gap-4 items-center bg-gray-50 rounded-lg px-4 py-3 sm:py-2 border-2 border-gray-100 dark:bg-[#111111] dark:border-[#1a1a1a] dark:text-[#a3a3a3] cursor-not-allowed opacity-70 grayscale transition-colors"
        onClick={() => toast.info("Próximamente")}
      >
        <div className="flex justify-center items-center w-16 sm:w-24">
          <FcBinoculars className="text-6xl sm:text-8xl opacity-50" />
        </div>
        <div className="grid text-center sm:text-left">
          <span className="font-bold text-sm sm:text-base text-gray-500 dark:text-[#a3a3a3]">
            Auditoría
          </span>
          <span className="text-xs sm:text-sm text-gray-400">
            Registro de actividad y seguridad del sistema
          </span>
        </div>
      </div>

      <div
        className="col-span-1 flex flex-col sm:flex-row gap-2 sm:gap-4 items-center bg-gray-50 rounded-lg px-4 py-3 sm:py-2 border-2 border-gray-100 dark:bg-[#111111] dark:border-[#1a1a1a] dark:text-[#a3a3a3] cursor-not-allowed opacity-70 grayscale transition-colors"
        onClick={() => toast.info("Próximamente")}
      >
        <div className="flex justify-center items-center w-16 sm:w-24">
          <FcDataBackup className="text-6xl sm:text-8xl opacity-50" />
        </div>
        <div className="grid text-center sm:text-left">
          <span className="font-bold text-sm sm:text-base text-gray-500 dark:text-[#a3a3a3]">
            Respaldos
          </span>
          <span className="text-xs sm:text-sm text-gray-400">
            Copias de seguridad y exportación de datos
          </span>
        </div>
      </div>
    </div>
  );
};

export default Settings;
