import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiFileText,
  FiSettings,
  FiLogOut,
  FiMoon,
  FiSun,
  FiChevronDown,
  FiChevronUp,
  FiChevronRight,
} from "react-icons/fi";
import { FaUserEdit, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  BsLayoutSidebarInsetReverse,
  BsLayoutSidebarInset,
} from "react-icons/bs";

import EditProfileModal from "./EditProfileModal";
import { toast } from "sonner";

const Sidebar = ({ activeTab, onTabChange }) => {
  const [open, setOpen] = useState(() => {
    const savedState = localStorage.getItem("sidebarOpen");
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === "dark";
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const { user } = useAuth();
  const { signOut } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const profileMenuRef = useRef(null);
  const navigate = useNavigate();

  const fetchUserData = async () => {


    try {
      if (user) {
        const { full_name, avatar_url } = user.user_metadata || {};

        let { data: profile, error: fetchError } = await supabase
          .from("users")
          .select("role, full_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (fetchError) {
          console.error("Error fetching user profile:", fetchError);
          // Only show toast if it's not a connection error we can ignore casually
          if (!fetchError.message.includes("fetch")) {
            toast.error("Error cargando perfil desde base de datos");
          }
        }

        // Caso 1: No existe perfil -> NO creamos automáticamente
        // Los perfiles deben ser creados manualmente por un administrador
        if (!profile && !fetchError) {
          const provider = user.app_metadata.provider ||
            user.identities?.find(i => i.provider === 'google')?.provider ||
            'email';

          // Solo mostramos un mensaje informativo, no creamos el perfil automáticamente
          console.warn("Usuario sin perfil en la base de datos. Debe ser registrado por un administrador.");
          
          // Si el usuario no tiene perfil, no podemos establecer userData
          // Esto evitará que acceda a funcionalidades que requieren rol
          setUserData({
            email: user.email,
            displayName: full_name || user.email.split("@")[0],
            role: null, // Sin rol hasta que sea asignado por un administrador
            avatar: avatar_url || null
          });
          return; // Salir temprano si no hay perfil
        }
        
        // Caso 2: Existe perfil pero no tiene rol
        // NO asignamos automáticamente rol de administrador
        if (profile && !profile.role) {
          console.warn("Usuario sin rol asignado. Debe ser asignado por un administrador.");
          // No actualizamos el rol automáticamente
        }

        // Update with definitive data from DB
        if (profile) {
          setUserData({
            email: user.email,
            displayName: profile.full_name || full_name || user.email.split("@")[0],
            role: profile.role || "administrador",
            avatar: profile.avatar_url || avatar_url || null
          });
        }
      }
    } catch (error) {
      console.error("Unexpected error fetching user data:", error);
      toast.error("Error de conexión con base de datos");
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(open));
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };

  const handleEditProfile = () => {
    setIsEditProfileOpen(true);
    setProfileMenuOpen(false);
  };

  const handleProfileUpdate = () => {
    fetchUserData();
  };



  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      setIsLoggingOut(false);
    } finally {
      setProfileMenuOpen(false);
      navigate("/");
    }
  };

  const getFilteredMenuItems = () => {
    const allMenuItems = [
      { id: "dashboard", label: "Dashboard", icon: FiHome },
      { id: "patients", label: "Pacientes", icon: FiUsers },
      { id: "appointments", label: "Citas", icon: FiCalendar },
      { id: "ehr", label: "HCE", icon: FiFileText },
      { id: "settings", label: "Configuración", icon: FiSettings },
    ];

    if (!userData?.role) return allMenuItems; // Changed from [] to allMenuItems to ensure sidebar is visible

    const role = userData.role.toLowerCase();

    if (role === 'secretaria') {
      return allMenuItems.filter(item => item.id !== 'settings' && item.id !== 'ehr');
    }

    if (role === 'optometra') {
      return allMenuItems.filter(item => item.id !== 'settings');
    }

    // Administrador u otros ven todo
    return allMenuItems;
  };

  const menuItems = getFilteredMenuItems();

  return (
    <>
      <aside
        className={`${open ? "w-64" : "w-20"
          } bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-[#f5f5f5] h-screen p-4 flex flex-col transition-all duration-300 sticky top-0 z-50 border-r-2 border-gray-200 dark:border-[#262626]`}
      >
        <header
          className={`flex items-center ${open ? "justify-between" : "justify-center"
            }`}
        >
          <div className="flex items-center gap-3">
            {open && (
              <div className="flex items-center gap-2">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center">
                  <img alt="Logo SI-CO J&S" src="/Logo-removebg-preview.png" />
                </div>
                <div>
                  <h2 className="font-bold text-[16px]">SI-CO J&S</h2>
                  <p className="text-xs text-gray-500 dark:text-[#a3a3a3]">
                    Sistema de gestión
                  </p>
                </div>
              </div>
            )}
          </div>
          <button
            className="cursor-pointer px-3 py-2 text-lg rounded-lg hover:bg-gray-100 dark:hover:bg-[#1f1f1f] transition-colors dark:text-[#e5e5e5]"
            onClick={() => setOpen(!open)}
          >
            {open ? <BsLayoutSidebarInsetReverse /> : <BsLayoutSidebarInset />}
          </button>
        </header>

        <nav className="mt-8 flex-1">
          <ul className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <li key={item.id} className="relative group">
                  <button
                    onClick={() => onTabChange(item.id)}
                    className={`hover:bg-blue-50 dark:hover:bg-[#1f1f1f] hover:text-blue-500 dark:hover:text-blue-400 px-3 py-2 rounded-lg cursor-pointer flex items-center transition-all duration-200 ${open ? "gap-3" : "justify-center"
                      } ${isActive
                        ? "bg-blue-50 dark:bg-[#1a1a1a] text-blue-500 dark:text-blue-400"
                        : ""
                      } w-full`}
                  >
                    <Icon
                      className={`text-lg ${isActive ? "scale-110" : ""
                        } transition-transform`}
                    />

                    {open && (
                      <span
                        className={`font-medium text-sm ${isActive ? "font-semibold" : ""
                          }`}
                      >
                        {item.label}
                      </span>
                    )}

                    {!open && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-[#1e1e1e] dark:border dark:border-[#262626] text-white text-sm rounded whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
                        {item.label}
                        <div className="absolute right-full top-1/2 transform -translate-y-1/2">
                          <div className="border-4 border-transparent border-r-gray-900 dark:border-r-[#1e1e1e]"></div>
                        </div>
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <footer className="flex flex-col gap-3">
          {open ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                className={`flex items-center bg-gray-100 dark:bg-[#111111] rounded-lg px-3 py-2 gap-3 cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-[#1f1f1f] w-full ${profileMenuOpen ? "bg-gray-100 dark:bg-[#1f1f1f]" : ""
                  }`}
                onClick={handleProfileClick}
              >
                <div className="relative" aria-hidden="true">
                  <AvatarDisplay avatarUrl={userData?.avatar} />
                  {profileMenuOpen ? (
                    <FiChevronUp className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5" />
                  ) : (
                    <FiChevronDown className="absolute -bottom-1 -right-1 bg-gray-400 text-white rounded-full p-0.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium text-[15px] truncate">{userData?.displayName || "Cargando..."}</p>
                  <p className="text-[12px] text-gray-500 dark:text-[#a3a3a3] truncate capitalize">
                    {userData?.role || "..."}
                  </p>
                </div>

                {open && (
                  <FiChevronRight
                    className={`transition-transform duration-200 text-gray-500 dark:text-[#a3a3a3] ${profileMenuOpen ? "rotate-90" : ""
                      }`}
                  />
                )}
              </button>

                  {profileMenuOpen && (
                <div className="absolute bottom-0 left-full ml-2 bg-white dark:bg-[#1e1e1e] rounded-lg border-2 border-gray-200 dark:border-[#262626] overflow-hidden z-20 min-w-60 shadow-xl">
                  <div className="px-3 py-2 border-b border-gray-200 dark:border-[#262626] bg-gray-100 dark:bg-[#1a1a1a]">
                    <div className="flex items-center gap-3">
                      <AvatarDisplay avatarUrl={userData?.avatar} size="w-10 h-10" iconSize={24} />
                      <div>
                        <p className="font-medium dark:text-[#f5f5f5]">
                          {userData?.displayName || "Cargando..."}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-[#a3a3a3] capitalize">
                          {userData?.role || "..."}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    className="flex items-center gap-3 py-2 px-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#242424] transition-colors w-full text-left"
                    onClick={handleEditProfile}
                  >
                    <FaUserEdit className="text-gray-600 dark:text-[#a3a3a3]" />
                    <span className="font-medium text-gray-700 dark:text-[#e5e5e5]">
                      Editar perfil
                    </span>
                  </button>
                  <div className="">
                    <button
                      className="flex items-center gap-3 py-2 px-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#242424] transition-colors text-red-600 dark:text-red-400 w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                    >
                      <FiLogOut className="text-red-500" aria-hidden="true" />
                      <span className="font-medium">{isLoggingOut ? "Cerrando..." : "Cerrar sesión"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative flex justify-center" ref={profileMenuRef}>
              <button
                className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer relative group"
                onClick={handleProfileClick}
              >
                <AvatarDisplay avatarUrl={userData?.avatar} />
                {profileMenuOpen && (
                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                    <FiChevronRight className="text-xs" aria-hidden="true" />
                  </div>
                )}

                {!open && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-[#1e1e1e] dark:border dark:border-[#262626] text-white text-sm rounded whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
                    Perfil
                    <div className="absolute right-full top-1/2 transform -translate-y-1/2">
                      <div className="border-4 border-transparent border-r-gray-900 dark:border-r-[#1e1e1e]"></div>
                    </div>
                  </div>
                )}
              </button>

              {profileMenuOpen && (
                <div className="absolute bottom-0 left-full ml-2 mb-2 bg-white dark:bg-[#1e1e1e] rounded-lg border-2 border-gray-200 dark:border-[#262626] overflow-hidden z-20 min-w-60 shadow-xl">
                  <div className="px-3 py-2 border-b border-gray-200 dark:border-[#262626] bg-gray-100 dark:bg-[#1a1a1a]">
                    <div className="flex items-center gap-3">
                      <AvatarDisplay avatarUrl={userData?.avatar} size="w-10 h-10" iconSize={24} />
                      <div>
                        <p className="font-medium dark:text-[#f5f5f5]">
                          {userData?.displayName || "Cargando..."}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-[#a3a3a3] capitalize">
                          {userData?.role || "..."}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#242424] transition-colors w-full text-left"
                    onClick={handleEditProfile}
                  >
                    <FaUserEdit className="text-gray-600 dark:text-[#a3a3a3]" />
                    <span className="font-medium text-gray-700 dark:text-[#e5e5e5]">
                      Editar perfil
                    </span>
                  </button>
                  <div className="">
                    <button
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#242424] transition-colors text-red-600 dark:text-red-400 w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                    >
                      <FiLogOut className="text-red-500" aria-hidden="true" />
                      <span className="font-medium">{isLoggingOut ? "Cerrando..." : "Cerrar sesión"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {open ? (
            <div>
              <div
                className={`flex items-center justify-between text-sm p-1 rounded-lg transition-all duration-500 cursor-pointer ${isDarkMode ? "bg-[#111111]" : "bg-gray-100"
                  }`}
                onClick={toggleTheme}
              >
                <div
                  className={`flex items-center justify-center gap-2 p-2 rounded-lg flex-1 transition-all duration-300 ${isDarkMode
                    ? "text-[#a3a3a3]"
                    : "text-blue-600 bg-white shadow-sm"
                    }`}
                >
                  <FiSun
                    className={`transition-transform duration-500 ${isDarkMode ? "scale-90" : "scale-110"
                      }`}
                  />
                  <span className="font-medium">Claro</span>
                </div>

                <div
                  className={`flex items-center justify-center gap-2 p-2 rounded-lg flex-1 transition-all duration-300 ${isDarkMode
                    ? "text-[#f5f5f5] bg-[#1a1a1a] shadow-sm"
                    : "text-gray-500"
                    }`}
                >
                  <FiMoon
                    className={`transition-transform duration-500 ${isDarkMode ? "scale-110" : "scale-90"
                      }`}
                  />
                  <span className="font-medium">Oscuro</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer bg-gray-50 dark:bg-[#111111] hover:bg-gray-100 dark:hover:bg-[#1f1f1f] transition-colors text-blue-600 dark:text-[#e5e5e5] shadow-sm group relative"
                onClick={toggleTheme}
              >
                {isDarkMode ? (
                  <FiSun className="text-[20px]" />
                ) : (
                  <FiMoon className="text-[20px]" />
                )}

                {!open && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-[#1e1e1e] dark:border dark:border-[#262626] text-white text-sm rounded whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
                    {isDarkMode ? "Modo claro" : "Modo oscuro"}
                    <div className="absolute right-full top-1/2 transform -translate-y-1/2">
                      <div className="border-4 border-transparent border-r-gray-900 dark:border-r-[#1e1e1e]"></div>
                    </div>
                  </div>
                )}
              </button>
            </div>
          )}
        </footer>
      </aside>

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onProfileUpdate={handleProfileUpdate}
      />
    </>
  );
};

const AvatarDisplay = ({ avatarUrl, size = "w-12 h-12", iconSize = 24 }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  return avatarUrl && !imgError ? (
    <img
      className={`${size} rounded-full inline-block border-2 border-white dark:border-[#262626] object-cover`}
      src={avatarUrl}
      alt="User Avatar"
      referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
    />
  ) : (
    <div className={`${size} rounded-full border-2 border-white dark:border-[#262626] bg-gray-100 dark:bg-[#111111] flex items-center justify-center text-gray-400 dark:text-[#a3a3a3]`}>
      <FaUserCircle size={iconSize + 24} />
    </div>
  );
};

export default Sidebar;
