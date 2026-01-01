import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { supabase } from "../../supabaseClient";
import { toast } from "sonner";
import { FaCheck, FaTimes, FaShieldAlt } from "react-icons/fa";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import Loader from "../Loader";
import { safeQuery } from "../../utils/supabaseHelpers";
import { modules, defaultPermissions } from "../../utils/permissions";

const RolesAndPermissions = forwardRef(({ onDirtyChange }, ref) => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [initialPermissions, setInitialPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const permissionLabels = {
    view: "Ver",
    create: "Crear",
    edit: "Editar",
    delete: "Eliminar",
    cancel: "Cancelar",
    activate: "Activar/Desactivar",
  };

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const fetchRolesAndPermissions = async () => {
    setLoading(true);
    try {
      // Obtener roles únicos de la base de datos
      const { data: usersData, error } = await safeQuery(
        () => supabase
          .from("users")
          .select("role")
          .not("role", "is", null)
        // Usar valores por defecto: 20s timeout, 1 reintento, 60s máximo total
      );

      if (error) throw error;

      // Obtener roles únicos
      const uniqueRoles = [...new Set(usersData.map((u) => u.role))].filter(Boolean);

      // Si no hay roles en la BD, usar los roles por defecto
      const rolesList = uniqueRoles.length > 0
        ? uniqueRoles
        : ["administrador", "optometra", "secretaria"];

      setRoles(rolesList);

      // Intentar cargar desde localStorage primero
      const savedPermissions = localStorage.getItem("role_permissions");
      if (savedPermissions) {
        try {
          const parsed = JSON.parse(savedPermissions);
          // Verificar que tenga la estructura correcta
          if (parsed && typeof parsed === "object") {
            setPermissions(parsed);
            setInitialPermissions(JSON.parse(JSON.stringify(parsed))); // Deep copy
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn("Error parsing saved permissions from localStorage:", e);
        }
      }

      // Intentar obtener permisos desde la base de datos
      const { data: permissionsData, error: permError } = await safeQuery(
        () => supabase
          .from("role_permissions")
          .select("*")
        // Usar valores por defecto: 20s timeout, 1 reintento, 60s máximo total
      );

      if (permError || !permissionsData || permissionsData.length === 0) {
        // Usar permisos por defecto
        const defaultPerms = {};
        rolesList.forEach((role) => {
          defaultPerms[role] = defaultPermissions[role] || {};
        });
        setPermissions(defaultPerms);
        setInitialPermissions(JSON.parse(JSON.stringify(defaultPerms))); // Deep copy
        // Guardar en localStorage
        localStorage.setItem("role_permissions", JSON.stringify(defaultPerms));
      } else {
        // Convertir datos de BD a formato de permisos
        const perms = {};
        rolesList.forEach((role) => {
          perms[role] = {};
          modules.forEach((module) => {
            perms[role][module.id] = {};
            module.permissions.forEach((perm) => {
              const permData = permissionsData.find(
                (p) => p.role === role && p.module === module.id && p.permission === perm
              );
              perms[role][module.id][perm] = permData?.allowed || false;
            });
          });
        });
        setPermissions(perms);
        setInitialPermissions(JSON.parse(JSON.stringify(perms))); // Deep copy
        // Guardar en localStorage como respaldo
        localStorage.setItem("role_permissions", JSON.stringify(perms));
      }
    } catch (error) {
      console.error("Error fetching roles and permissions:", error);
      // En caso de error, intentar cargar desde localStorage
      const savedPermissions = localStorage.getItem("role_permissions");
      if (savedPermissions) {
        try {
          const parsed = JSON.parse(savedPermissions);
          if (parsed && typeof parsed === "object") {
            setPermissions(parsed);
            setInitialPermissions(JSON.parse(JSON.stringify(parsed))); // Deep copy
            // Obtener roles desde los permisos guardados
            const savedRoles = Object.keys(parsed);
            if (savedRoles.length > 0) {
              setRoles(savedRoles);
            } else {
              setRoles(["administrador", "optometra", "secretaria"]);
            }
          } else {
            throw new Error("Invalid saved permissions");
          }
        } catch (e) {
          // Si falla, usar roles y permisos por defecto
          const defaultRoles = ["administrador", "optometra", "secretaria"];
          setRoles(defaultRoles);
          const defaultPerms = {};
          defaultRoles.forEach((role) => {
            defaultPerms[role] = defaultPermissions[role] || {};
          });
          setPermissions(defaultPerms);
          setInitialPermissions(JSON.parse(JSON.stringify(defaultPerms))); // Deep copy
        }
      } else {
        // Usar roles y permisos por defecto
        const defaultRoles = ["administrador", "optometra", "secretaria"];
        setRoles(defaultRoles);
        const defaultPerms = {};
        defaultRoles.forEach((role) => {
          defaultPerms[role] = defaultPermissions[role] || {};
        });
        setPermissions(defaultPerms);
        setInitialPermissions(JSON.parse(JSON.stringify(defaultPerms))); // Deep copy
      }
      toast.error("Error cargando roles y permisos. Usando configuración guardada o por defecto.");
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (role, moduleId, permission, value) => {
    setPermissions((prev) => {
      const updated = {
        ...prev,
        [role]: {
          ...prev[role],
          [moduleId]: {
            ...prev[role]?.[moduleId],
            [permission]: value,
          },
        },
      };
      // Guardar en localStorage inmediatamente
      localStorage.setItem("role_permissions", JSON.stringify(updated));
      return updated;
    });
  };

  // Detectar cambios en los permisos
  useEffect(() => {
    const hasChanges = JSON.stringify(permissions) !== JSON.stringify(initialPermissions);
    if (onDirtyChange) {
      onDirtyChange(hasChanges);
    }
  }, [permissions, initialPermissions, onDirtyChange]);

  const handleSavePermissions = async () => {
    setSaving(true);
    const toastId = toast.loading("Guardando permisos...");

    try {
      if (!roles || roles.length === 0) {
        throw new Error("No hay roles definidos para guardar.");
      }

      // Primero, eliminar permisos existentes para estos roles
      const { error: deleteError } = await supabase
        .from("role_permissions")
        .delete()
        .in("role", roles);

      if (deleteError && deleteError.code !== "PGRST116") {
        console.error("Error deleting permissions:", deleteError);
        throw deleteError;
      }

      // Preparar datos para insertar
      const permissionsToInsert = [];
      roles.forEach((role) => {
        modules.forEach((module) => {
          module.permissions.forEach((permission) => {
            const allowed = permissions[role]?.[module.id]?.[permission] || false;
            permissionsToInsert.push({
              role,
              module: module.id,
              permission,
              allowed,
            });
          });
        });
      });

      // Insertar nuevos permisos
      if (permissionsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("role_permissions")
          .insert(permissionsToInsert);

        if (insertError) {
          console.error("Error inserting permissions:", insertError);
          // Si la tabla no existe o error, guardar localmente
          if (insertError.code === "42P01") {
            localStorage.setItem("role_permissions", JSON.stringify(permissions));
            toast.success("Permisos guardados localmente (tabla no existe).", { id: toastId });
          } else {
            throw insertError;
          }
        } else {
          localStorage.setItem("role_permissions", JSON.stringify(permissions));
          toast.success("Permisos guardados correctamente.", { id: toastId });
        }
      } else {
        toast.success("No hay permisos para guardar.", { id: toastId });
      }

      // Actualizar estado inicial y recargar
      setInitialPermissions(JSON.parse(JSON.stringify(permissions)));
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error("Error saving permissions:", error);
      // Fallback local
      localStorage.setItem("role_permissions", JSON.stringify(permissions));
      toast.error("Error guardando permisos (backup local).", { id: toastId });

      // Intentar recargar de todos modos para asegurar consistencia
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } finally {
      setSaving(false);
    }
  };

  const getRoleDisplayName = (role) => {
    const names = {
      administrador: "Administrador",
      optometra: "Optómetra",
      secretaria: "Secretaria",
    };
    return names[role] || role;
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

  useImperativeHandle(ref, () => ({
    savePermissions: handleSavePermissions,
  }));

  if (loading) {
    return <Loader text="Cargando roles y permisos..." />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden bg-white dark:bg-[#111111] rounded-lg border-2 border-gray-200 dark:border-[#262626]">
        <table className="w-full text-left text-gray-500 dark:text-[#a3a3a3]">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-[#1a1a1a] dark:text-[#a3a3a3] border-b border-gray-200 dark:border-[#262626]">
            <tr>
              <th scope="col" className="px-6 py-3 font-semibold">
                Módulo / Permiso
              </th>
              {roles.map((role) => (
                <th key={role} scope="col" className="px-6 py-3 font-semibold text-center">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-medium border ${getRoleBadgeColor(
                      role
                    )}`}
                  >
                    {getRoleDisplayName(role)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-[#262626]">
            {roles.length === 0 ? (
              <tr>
                <td
                  colSpan={roles.length + 1}
                  className="px-6 py-8 text-center text-gray-500 dark:text-[#a3a3a3]"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FaShieldAlt className="text-4xl text-gray-300 dark:text-[#1a1a1a]" />
                    <p>No hay roles configurados</p>
                  </div>
                </td>
              </tr>
            ) : (
              modules.map((module) => (
                <React.Fragment key={module.id}>
                  <tr
                    className="bg-gray-50 dark:bg-[#1a1a1a] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#202020] transition-colors"
                    onClick={() => toggleModule(module.id)}
                  >
                    <td
                      colSpan={roles.length + 1}
                      className="px-6 py-3 font-semibold text-gray-900 dark:text-[#f5f5f5]"
                    >
                      <div className="flex items-center gap-2">
                        <FiChevronRight
                          className={`text-gray-500 transition-transform duration-200 ${expandedModules[module.id] ? "rotate-90" : ""}`}
                        />
                        <div className="flex flex-col">
                          <span>{module.name}</span>
                          <span className="text-xs font-normal text-gray-500 dark:text-[#a3a3a3]">
                            {module.description}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  {expandedModules[module.id] && module.permissions.map((permission) => (
                    <tr
                      key={`${module.id}-${permission}`}
                      className="bg-white dark:bg-[#111111] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors duration-150 animate-fadeIn"
                    >
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-[#a3a3a3] pl-12">
                        {permissionLabels[permission]}
                      </td>
                      {roles.map((role) => (
                        <td key={role} className="px-6 py-4 text-center">
                          <button
                            onClick={() =>
                              handlePermissionChange(
                                role,
                                module.id,
                                permission,
                                !permissions[role]?.[module.id]?.[permission]
                              )
                            }
                            className={`w-10 h-10 rounded-lg border-2 transition-all flex items-center justify-center mx-auto ${permissions[role]?.[module.id]?.[permission]
                              ? "bg-green-500 border-green-600 text-white hover:bg-green-600"
                              : "bg-gray-100 dark:bg-[#1a1a1a] border-gray-300 dark:border-[#262626] text-gray-400 hover:bg-gray-200 dark:hover:bg-[#262626]"
                              }`}
                            title={
                              permissions[role]?.[module.id]?.[permission]
                                ? "Desactivar permiso"
                                : "Activar permiso"
                            }
                          >
                            {permissions[role]?.[module.id]?.[permission] ? (
                              <FaCheck size={14} />
                            ) : (
                              <FaTimes size={14} />
                            )}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col gap-4">
        {roles.length === 0 ? (
          <div className="bg-white dark:bg-[#111111] rounded-lg border-2 border-gray-200 dark:border-[#262626] p-8">
            <div className="flex flex-col items-center justify-center gap-2 text-gray-500 dark:text-[#a3a3a3]">
              <FaShieldAlt className="text-4xl text-gray-300 dark:text-[#1a1a1a]" />
              <p>No hay roles configurados</p>
            </div>
          </div>
        ) : (
          roles.map((role) => (
            <div
              key={role}
              className="bg-white dark:bg-[#111111] rounded-lg border-2 border-gray-200 dark:border-[#262626] p-4"
            >
              <div className="flex flex-col gap-4">
                {/* Role Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-[#262626]">
                  <span
                    className={`px-3 py-1 rounded-lg text-sm font-medium border ${getRoleBadgeColor(
                      role
                    )}`}
                  >
                    {getRoleDisplayName(role)}
                  </span>
                </div>

                {/* Modules */}
                {modules.map((module) => (
                  <div
                    key={module.id}
                    className="pb-4 last:pb-0 border-b border-gray-200 dark:border-[#262626] last:border-0"
                  >
                    <div
                      className="mb-3 flex items-center justify-between cursor-pointer"
                      onClick={() => toggleModule(module.id)}
                    >
                      <div className="flex flex-col">
                        <h3 className="font-semibold text-gray-900 dark:text-[#f5f5f5] text-sm">
                          {module.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-[#a3a3a3]">
                          {module.description}
                        </p>
                      </div>
                      <FiChevronRight
                        className={`text-gray-500 transition-transform duration-300 ${expandedModules[module.id] ? "rotate-90" : ""}`}
                      />
                    </div>

                    <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${expandedModules[module.id] ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                      <div className="overflow-hidden">
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          {module.permissions.map((permission) => (
                            <button
                              key={permission}
                              onClick={() =>
                                handlePermissionChange(
                                  role,
                                  module.id,
                                  permission,
                                  !permissions[role]?.[module.id]?.[permission]
                                )
                              }
                              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border-2 transition-all text-xs ${permissions[role]?.[module.id]?.[permission]
                                ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400"
                                : "bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#262626] text-gray-600 dark:text-[#a3a3a3]"
                                } hover:bg-gray-100 dark:hover:bg-[#262626] cursor-pointer`}
                            >
                              <span>{permissionLabels[permission]}</span>
                              {permissions[role]?.[module.id]?.[permission] ? (
                                <FaCheck size={12} />
                              ) : (
                                <FaTimes size={12} />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

export default RolesAndPermissions;
