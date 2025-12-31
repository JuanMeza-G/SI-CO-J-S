import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { toast } from "sonner";
import {
  FaUserShield,
  FaUserCircle,
  FaChevronDown,
  FaPowerOff,
  FaCheckCircle,
} from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { MdEmail } from "react-icons/md";
import Loader from "../Loader";
import { useAuth } from "../../context/AuthContext";
import ConfirmModal from "../ConfirmModal";

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("users").select("*");

      if (error) {
        toast.error(`Error cargando usuarios`);
        throw error;
      }
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users catch block:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      toast.success("Rol actualizado correctamente");
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Error al actualizar el rol");
    }
  };

  const confirmToggleUser = (user) => {
    setUserToToggle(user);
    setToggleModalOpen(true);
  };

  const handleToggleUser = async () => {
    if (!userToToggle) return;

    try {
      // Si is_active es null o undefined, tratarlo como true (activo)
      const currentStatus = userToToggle.is_active ?? true;
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from("users")
        .update({ is_active: newStatus })
        .eq("id", userToToggle.id);

      if (error) throw error;

      setUsers(
        users.map((user) =>
          user.id === userToToggle.id ? { ...user, is_active: newStatus } : user
        )
      );
      toast.success(
        `Usuario ${newStatus ? "activado" : "desactivado"} correctamente`
      );
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("Error al cambiar el estado del usuario");
    } finally {
      setToggleModalOpen(false);
      setUserToToggle(null);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case "administrador":
        return "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "optometra":
        return "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800";
      case "secretaria":
        return "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800";
      default:
        return "bg-gray-50 text-gray-600 dark:bg-[#1a1a1a] dark:text-[#a3a3a3] border-gray-200 dark:border-[#262626]";
    }
  };

  if (loading) {
    return <Loader text="Cargando usuarios..." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden bg-white dark:bg-[#111111] rounded-lg border-2 border-gray-200 dark:border-[#262626]">
        <table className="w-full text-left text-gray-500 dark:text-[#a3a3a3]">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-[#1a1a1a] dark:text-[#a3a3a3] border-b border-gray-200 dark:border-[#262626]">
            <tr>
              <th scope="col" className="px-6 py-3 font-semibold">
                Usuario
              </th>
              <th scope="col" className="px-6 py-3 font-semibold">
                Rol
              </th>
              <th scope="col" className="px-6 py-3 font-semibold">
                Proveedores
              </th>
              <th scope="col" className="px-6 py-3 font-semibold">
                Estado
              </th>
              <th scope="col" className="px-6 py-3 font-semibold text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-[#262626]">
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-8 text-center text-gray-500 dark:text-[#a3a3a3]"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FaUserShield className="text-4xl text-gray-300 dark:text-[#1a1a1a]" />
                    <p>No hay usuarios registrados</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className={`bg-white dark:bg-[#111111] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors duration-150 ${
                    (user.is_active ?? true) === false ? "opacity-60" : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name || user.email}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-[#262626] ring-2 ring-transparent group-hover:ring-blue-500/20 transition-all"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full border-2 border-white dark:border-[#262626] bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center text-gray-400 dark:text-[#a3a3a3]">
                          <FaUserCircle size={40} />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-[#f5f5f5]">
                            {user.full_name || user.email.split("@")[0]}
                          </span>
                          {currentUser?.id === user.id && (
                            <div
                              className="w-2.5 h-2.5 rounded-full bg-green-500 border border-white dark:border-[#0a0a0a] shadow-sm"
                              title="Sesión actual"
                            ></div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-[#a3a3a3]">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative inline-block w-fit">
                      <select
                        value={user.role || ""}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value)
                        }
                        disabled={
                          user.provider === "google" ||
                          currentUser?.id === user.id
                        }
                        className={`appearance-none w-full pl-3 pr-8 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer focus:ring-2 focus:ring-offset-1 focus:outline-none ${getRoleBadgeColor(
                          user.role
                        )} ${user.provider === "google" ||
                          currentUser?.id === user.id
                          ? "opacity-60 cursor-not-allowed pr-3"
                          : ""
                          }`}
                      >
                        <option value="secretaria">Secretaria</option>
                        <option value="optometra">Optómetra</option>
                        <option value="administrador">Administrador</option>
                      </select>
                      {!(
                        user.provider === "google" ||
                        currentUser?.id === user.id
                      ) && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-current opacity-70">
                            <FaChevronDown size={10} />
                          </div>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {user.provider === "google" && (
                        <div
                          className="flex items-center justify-center gap-2 px-2 py-1.5 w-24 rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#262626]"
                          title="Google"
                        >
                          <FcGoogle size={16} />
                          <span className="text-xs font-medium text-gray-600 dark:text-[#e5e5e5]">
                            Google
                          </span>
                        </div>
                      )}
                      {user.provider !== "google" && (
                        <div
                          className="flex items-center justify-center gap-2 px-2 py-1.5 w-24 rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#262626]"
                          title="Email"
                        >
                          <MdEmail
                            size={16}
                            className="text-gray-500 dark:text-[#a3a3a3]"
                          />
                          <span className="text-xs font-medium text-gray-600 dark:text-[#e5e5e5]">
                            Email
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {(user.is_active ?? true) !== false ? (
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800">
                          <FaCheckCircle size={14} />
                          <span className="text-xs font-medium">Activo</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400 border border-gray-200 dark:border-gray-800">
                          <FaPowerOff size={14} />
                          <span className="text-xs font-medium">Inactivo</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => confirmToggleUser(user)}
                      disabled={currentUser?.id === user.id}
                      className={`group relative p-2 rounded-lg transition-all duration-200 cursor-pointer
                        ${currentUser?.id === user.id
                          ? "text-gray-300 dark:text-[#1a1a1a] cursor-not-allowed"
                          : (user.is_active ?? true) !== false
                          ? "text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 dark:hover:text-orange-400"
                          : "text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                        }
                      `}
                      title={(user.is_active ?? true) !== false ? "Desactivar usuario" : "Activar usuario"}
                    >
                      <FaPowerOff size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={toggleModalOpen}
        onClose={() => setToggleModalOpen(false)}
        onConfirm={handleToggleUser}
        title={(userToToggle?.is_active ?? true) !== false ? "Desactivar Usuario" : "Activar Usuario"}
        message={
          <>
            <span className="font-bold text-gray-900 dark:text-[#f5f5f5]">
              ¿{(userToToggle?.is_active ?? true) !== false ? "Desactivar" : "Activar"} la cuenta {userToToggle?.email}?
            </span>
            <br />
            <span className="text-sm mt-2 block text-gray-500 dark:text-[#a3a3a3]">
              {(userToToggle?.is_active ?? true) !== false
                ? "El usuario no podrá iniciar sesión hasta que sea reactivado."
                : "El usuario podrá iniciar sesión nuevamente."}
            </span>
          </>
        }
      />
    </div >
  );
};

export default UserManagement;
