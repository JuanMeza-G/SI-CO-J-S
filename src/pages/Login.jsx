import { FcManager, FcSettings } from "react-icons/fc";
import { useState } from "react";
import { MdOutlineKeyboardBackspace } from "react-icons/md";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminForm from "../components/AdminForm";
import OperativeForm from "../components/OperativeForm";
const Login = () => {
  const [selectedRole, setSelectedRole] = useState("");
  const [searchParams] = useSearchParams();
  const { user, loading, isVerifyingAdmin } = useAuth();
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#0a0a0a] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 dark:text-[#a3a3a3]">Cargando...</span>
        </div>
      </div>
    );
  }
  if (user && !isVerifyingAdmin) {
    return <Navigate to="/home" replace />;
  }
  return (
    <div className="bg-white dark:bg-[#0a0a0a] min-h-screen flex flex-col px-4 transition-colors duration-200">
      <div className="flex-1 flex flex-col justify-center items-center gap-8 py-8">
        <div className="grid items-center">
          <div className="flex flex-col items-center text-center gap-2">
            <img
              className="w-20 h-16"
              src="/Logo-removebg-preview.png"
              alt="Logo"
            />
            <div className="grid">
              <span className="font-semibold text-gray-900 dark:text-[#f5f5f5]">CENTRO ÓPTICO J&S</span>
              <span className="text-sm text-gray-500 dark:text-[#a3a3a3]">Sistema de gestión</span>
            </div>
          </div>
        </div>
        {!selectedRole && (
          <div className="text-center mt-6">
            <span className="text-2xl font-bold text-gray-900 dark:text-[#f5f5f5]">Seleccione tu rol</span>
            <div className="mt-4 flex flex-col gap-4">
              <button
                onClick={() => setSelectedRole("admin")}
                className="flex items-center p-4 rounded-lg border border-gray-300 dark:border-[#262626] bg-white dark:bg-[#111111] hover:border-blue-500 dark:hover:border-blue-500 hover:ring-blue-600 dark:hover:ring-blue-500 hover:ring-2 transition cursor-pointer gap-4"
              >
                <FcManager className="text-6xl" />
                <div className="grid text-left">
                  <span className="font-bold text-[18px] text-gray-900 dark:text-[#f5f5f5]">Administrador</span>
                  <span className="text-sm text-gray-600 dark:text-[#a3a3a3]">
                    Configuración del sistema y gestión de usuarios
                  </span>
                </div>
              </button>
              <button
                onClick={() => setSelectedRole("operative")}
                className="flex items-center p-4 rounded-lg border border-gray-300 dark:border-[#262626] bg-white dark:bg-[#111111] hover:border-green-500 dark:hover:border-green-500 hover:ring-green-600 dark:hover:ring-green-500 hover:ring-2 transition cursor-pointer gap-4"
              >
                <FcSettings className="text-6xl" />
                <div className="grid text-left">
                  <span className="font-bold text-[18px] text-gray-900 dark:text-[#f5f5f5]">Operativo</span>
                  <span className="text-sm text-gray-600 dark:text-[#a3a3a3]">
                    Gestión diaria y operaciones del sistema (secretaria /
                    optometra)
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}
        {selectedRole === "admin" && (
          <div className="">
            <div
              onClick={() => setSelectedRole("")}
              className="text-2xl font-bold mb-4 cursor-pointer hover:text-gray-800 dark:hover:text-[#e5e5e5] text-gray-600 dark:text-[#a3a3a3] transition-colors"
            >
              <div className="flex items-center gap-2 text-base mb-8">
                <MdOutlineKeyboardBackspace className="text-xl" />
                <span>Volver</span>
              </div>
              <span className="grid text-center">
                <span className="text-gray-900 dark:text-[#f5f5f5]">Administrador</span>
                <p className="text-sm text-gray-500 dark:text-[#a3a3a3]">
                  Ingresa con tus credenciales
                </p>
              </span>
            </div>
            <AdminForm />
          </div>
        )}
        {selectedRole === "operative" && (
          <div className="">
            <div
              onClick={() => setSelectedRole("")}
              className="text-2xl font-bold mb-4 cursor-pointer hover:text-gray-800 dark:hover:text-[#e5e5e5] text-gray-600 dark:text-[#a3a3a3] transition-colors"
            >
              <div className="flex items-center gap-2 mb-8 text-base">
                <MdOutlineKeyboardBackspace className="text-xl" />
                <span>Volver</span>
              </div>
              <span className="grid text-center my-4">
                <span className="text-gray-900 dark:text-[#f5f5f5]">Operativo</span>
                <p className="text-sm text-gray-500 dark:text-[#a3a3a3]">
                  Ingresa con tus credenciales
                </p>
              </span>
            </div>
            <OperativeForm />
          </div>
        )}
      </div>
      <footer className="w-full border-t border-gray-200 dark:border-[#262626] py-4 text-center text-sm text-gray-500 dark:text-[#a3a3a3] transition-colors">
        © {new Date().getFullYear()} Centro Óptico J&S · Todos los derechos
        reservados
      </footer>
    </div>
  );
};
export default Login;
