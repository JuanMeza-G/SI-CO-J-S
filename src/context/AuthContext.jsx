import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { supabase } from "../supabaseClient";
import { toast } from "sonner";
import { safeQuery } from "../utils/supabaseHelpers";
import { defaultPermissions, modules } from "../utils/permissions";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const adminVerificationChecked = useRef(false);
  const initialSessionLoaded = useRef(false);

  const fetchUserPermissions = async (role) => {
    if (!role) return null;

    try {
      // 1. Intentar cargar desde localStorage primero (como respaldo rápido)
      const savedPermissions = localStorage.getItem("role_permissions");
      let localPerms = null;
      if (savedPermissions) {
        try {
          localPerms = JSON.parse(savedPermissions);
        } catch (e) {
          console.warn("Error parsing saved permissions", e);
        }
      }

      // 2. Cargar desde BD
      const { data: dbPerms, error } = await safeQuery(
        () => supabase.from("role_permissions").select("*").eq("role", role),
        30000, // 30 segundos timeout
        0,     // Sin reintentos para fallar rápido
        30000  // 30 segundos máximo total
      );

      if (error || !dbPerms || dbPerms.length === 0) {
        // Si falla BD, usar localStorage si coincide el rol, o defaults
        if (localPerms && localPerms[role]) {
          return localPerms[role];
        }
        return defaultPermissions[role] || {};
      }

      // 3. Procesar datos de BD
      const formattedPerms = {};

      // Inicializar con la estructura de modulos vacia para el rol actual
      modules.forEach(m => {
        formattedPerms[m.id] = {};
        m.permissions.forEach(p => {
          formattedPerms[m.id][p] = false;
        });
      });

      // Llenar con lo que viene de BD
      dbPerms.forEach(p => {
        if (!formattedPerms[p.module]) formattedPerms[p.module] = {};
        formattedPerms[p.module][p.permission] = p.allowed;
      });

      return formattedPerms;

    } catch (error) {
      console.error("Error fetching permissions:", error);
      return defaultPermissions[role] || {};
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchProfileAndPermissions = async (userId) => {
      try {
        const { data: profile, error } = await safeQuery(
          () => supabase.from("users").select("*").eq("id", userId).single(),
          30000, // 30 segundos timeout
          0,     // Sin reintentos para fallar rápido
          30000  // 30 segundos máximo total
        );

        if (error || !profile) return null;

        const role = profile.role;
        const perms = await fetchUserPermissions(role);

        return { profile, role, perms };
      } catch (e) {
        console.error("Error fetching full profile:", e);
        return null;
      }
    };

    // Función para verificar rol de administrador y estado activo
    const verifyAdminRole = async (currentUser, onUnauthorized) => {
      // Resetear el ref al inicio de cada verificación para permitir verificaciones en recargas
      adminVerificationChecked.current = false;

      // Marcar que estamos verificando para evitar verificaciones simultáneas
      adminVerificationChecked.current = true;

      try {
        const result = await fetchProfileAndPermissions(currentUser.id);
        const userProfile = result?.profile;

        if (!userProfile) {
          if (onUnauthorized) onUnauthorized();
          await supabase.auth.signOut();
          toast.error("Acceso denegado. No tienes permisos de administrador.");
          return false;
        }

        if (userProfile?.is_active === false) {
          if (onUnauthorized) onUnauthorized();
          await supabase.auth.signOut();
          toast.error("Acceso denegado. Tu cuenta está desactivada.");
          return false;
        }

        if (userProfile?.role !== "administrador") {
          if (onUnauthorized) onUnauthorized();
          await supabase.auth.signOut();
          toast.error("Acceso denegado. No tienes permisos de administrador.");
          return false;
        }

        if (mounted) {
          setUserProfile(userProfile);
          setUserRole(userProfile.role);
          setPermissions(result.perms);
        }

        return true;
      } catch (error) {
        console.error("Error verifying admin role:", error);
        return true; // Fail-safe
      }
    };

    // Función para verificar estado activo de cualquier usuario
    const verifyUserActive = async (currentUser, onUnauthorized) => {
      try {
        const result = await fetchProfileAndPermissions(currentUser.id);
        const userProfile = result?.profile;

        if (!userProfile) {
          // Si no hay perfil, permitir acceso limitado pero no cargar permisos completos aun
          return true;
        }

        if (userProfile?.is_active === false) {
          if (onUnauthorized) onUnauthorized();
          await supabase.auth.signOut();
          toast.error("Acceso denegado. Tu cuenta está desactivada.");
          return false;
        }

        if (mounted) {
          setUserProfile(userProfile);
          setUserRole(userProfile.role);
          setPermissions(result.perms);
        }

        return true;
      } catch (error) {
        console.error("Error verifying user active status:", error);
        return true;
      }
    };

    // Función helper para limpiar el parámetro admin_login de la URL
    const clearAdminLoginParam = () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("admin_login") === "true") {
        urlParams.delete("admin_login");
        const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : "");
        window.history.replaceState({}, "", newUrl);
      }
    };

    // 1. Get initial session - SIMPLIFICADO
    const getInitialSession = async () => {
      // Resetear el ref al inicio para permitir verificaciones en recargas
      adminVerificationChecked.current = false;
      initialSessionLoaded.current = false;

      try {
        const {
          data: { session: initialSession },
          error,
        } = await safeQuery(
          () => supabase.auth.getSession(),
          30000, // 30 segundos timeout
          0,     // Sin reintentos para fallar rápido
          30000  // 30 segundos máximo total
        );

        if (error) {
          console.error("Error getting session:", error);
          if (mounted) {
            setSession(null);
            setUser(null);
            setLoading(false);
            initialSessionLoaded.current = true;
          }
          return;
        }

        if (!mounted) return;

        // Si no hay sesión, establecer estado vacío inmediatamente
        if (!initialSession?.user) {
          setSession(null);
          setUser(null);
          setLoading(false);
          initialSessionLoaded.current = true;
          return;
        }

        // Verificar si viene del login de admin
        const urlParams = new URLSearchParams(window.location.search);
        const isAdminLogin = urlParams.get("admin_login") === "true";

        // Limpiar el parámetro admin_login de la URL si existe
        if (isAdminLogin) {
          clearAdminLoginParam();
        }

        if (isAdminLogin) {
          try {
            const hasPermission = await verifyAdminRole(initialSession.user, () => {
              // Callback para establecer estado antes de signOut
              if (mounted) {
                setSession(null);
                setUser(null);
                setUserProfile(null);
                setUserRole(null);
                setPermissions(null);
              }
            });
            if (mounted) {
              if (hasPermission) {
                setSession(initialSession);
                setUser(initialSession.user);
                setLoading(false);
                initialSessionLoaded.current = true;
              } else {
                // verifyAdminRole ya estableció user/session en null y llamó a signOut()
                // usar un timeout para establecer loading en false después de signOut
                setTimeout(() => {
                  if (mounted) {
                    setLoading(false);
                    initialSessionLoaded.current = true;
                  }
                }, 300);
              }
            }
          } catch (error) {
            console.error("Error in admin verification:", error);
            if (mounted) {
              setSession(initialSession);
              setUser(initialSession.user);
              setLoading(false);
              initialSessionLoaded.current = true;
            }
          }
        } else {
          // Para usuarios normales, verificar estado activo
          try {
            const isActive = await verifyUserActive(initialSession.user, () => {
              // Callback para establecer estado antes de signOut
              if (mounted) {
                setSession(null);
                setUser(null);
                setUserProfile(null);
                setUserRole(null);
                setPermissions(null);
              }
            });
            if (mounted) {
              if (isActive) {
                setSession(initialSession);
                setUser(initialSession.user);
                setLoading(false);
                initialSessionLoaded.current = true;
              } else {
                // verifyUserActive ya estableció user/session en null y llamó a signOut()
                // usar un timeout para establecer loading en false después de signOut
                setTimeout(() => {
                  if (mounted) {
                    setLoading(false);
                    initialSessionLoaded.current = true;
                  }
                }, 300);
              }
            }
          } catch (error) {
            console.error("Error in user verification:", error);
            if (mounted) {
              // En caso de error, permitir acceso
              setSession(initialSession);
              setUser(initialSession.user);
              setLoading(false);
              initialSessionLoaded.current = true;
            }
          }
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
          initialSessionLoaded.current = true;
        }
      }
    };

    // Timeout de seguridad - reducir a 7 segundos y forzar el estado sin reintentar para evitar bloqueos largos
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading && !initialSessionLoaded.current) {
        console.warn("AuthContext: Loading timeout, forcing loading to false. Network or Supabase may be unresponsive.");
        if (mounted) {
          // No intentamos getSession de nuevo porque podría colgarse otros 30s.
          // Asumimos fallo y forzamos el render.
          setSession(null);
          setUser(null);
          setLoading(false);
          initialSessionLoaded.current = true;
          toast.error("La conexión tardó demasiado. Por favor, intenta recargar la página.");
        }
      }
    }, 7000);

    getInitialSession();

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        setUserProfile(null);
        setUserRole(null);
        setPermissions(null);
        setLoading(false);
        adminVerificationChecked.current = false;
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Si getInitialSession aún no ha terminado, ignorar estos eventos
        // para evitar conflictos con la carga inicial
        if (!initialSessionLoaded.current) {
          return;
        }

        if (!currentSession?.user) {
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setUserRole(null);
          setPermissions(null);
          setLoading(false);
          return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const isAdminLogin = urlParams.get("admin_login") === "true";

        // Limpiar el parámetro admin_login de la URL si existe
        if (isAdminLogin) {
          clearAdminLoginParam();
        }

        if (isAdminLogin) {
          try {
            const hasPermission = await verifyAdminRole(currentSession.user, () => {
              // Callback para establecer estado antes de signOut
              if (mounted) {
                setSession(null);
                setUser(null);
                setUserProfile(null);
                setUserRole(null);
                setPermissions(null);
              }
            });
            if (mounted) {
              if (hasPermission) {
                setSession(currentSession);
                setUser(currentSession.user);
                setLoading(false);
              } else {
                // verifyAdminRole ya estableció user/session en null y llamó a signOut()
                // usar un timeout para establecer loading en false después de signOut
                setTimeout(() => {
                  if (mounted) {
                    setLoading(false);
                  }
                }, 300);
              }
            }
          } catch (error) {
            console.error(
              "Error in onAuthStateChange admin verification:",
              error
            );
            if (mounted) {
              setSession(currentSession);
              setUser(currentSession.user);
              setLoading(false);
            }
          }
        } else {
          // Esperar un poco para que el formulario tenga tiempo de verificar primero
          // Esto evita toasts duplicados cuando el formulario ya maneja el error
          await new Promise(resolve => setTimeout(resolve, 100));

          try {
            // Verificar si la sesión sigue activa (el formulario podría haber hecho signOut)
            // Usar timeout más corto para no bloquear la UI
            const { data: { session: currentSessionCheck } } = await safeQuery(
              () => supabase.auth.getSession(),
              15000, // 15 segundos timeout (más corto para no bloquear)
              0,     // Sin reintentos
              15000  // 15 segundos máximo total
            );
            if (!currentSessionCheck?.user) {
              // La sesión ya fue cerrada, probablemente por el formulario
              if (mounted) {
                setSession(null);
                setUser(null);
                setLoading(false);
              }
              return;
            }

            const isActive = await verifyUserActive(currentSessionCheck.user, () => {
              // Callback para establecer estado antes de signOut
              if (mounted) {
                setSession(null);
                setUser(null);
              }
            });
            if (mounted) {
              if (isActive) {
                setSession(currentSessionCheck);
                setUser(currentSessionCheck.user);
                setLoading(false);
              } else {
                // verifyUserActive ya estableció user/session en null y llamó a signOut()
                // usar un timeout para establecer loading en false después de signOut
                setTimeout(() => {
                  if (mounted) {
                    setLoading(false);
                  }
                }, 300);
              }
            }
          } catch (error) {
            console.error(
              "Error in onAuthStateChange user verification:",
              error
            );
            if (mounted) {
              // En caso de error, intentar obtener sesión con timeout corto
              const { data: { session: currentSessionCheck } } = await safeQuery(
                () => supabase.auth.getSession(),
                10000, // 10 segundos timeout (muy corto para recuperación)
                0,     // Sin reintentos
                10000  // 10 segundos máximo total
              );
              if (currentSessionCheck?.user) {
                setSession(currentSessionCheck);
                setUser(currentSessionCheck.user);
              }
              setLoading(false);
            }
          }
        }
      } else {
        // Para otros eventos (como INITIAL_SESSION en recargas)
        // Solo actualizar si getInitialSession ya terminó Y tenemos un usuario válido establecido
        // para evitar sobrescribir un estado válido con null
        if (initialSessionLoaded.current) {
          if (currentSession?.user) {
            // Solo actualizar si tenemos una sesión válida
            setSession(currentSession);
            setUser(currentSession.user);
            setLoading(false);
          }
          // Si currentSession es null o no tiene user, NO hacer nada para preservar el estado actual
          // Solo permitir que SIGNED_OUT maneje la limpieza del estado
        }
        // Si initialSessionLoaded es false, ignorar este evento y dejar que getInitialSession maneje el estado
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = async () => {
      console.warn("AuthContext: Received unauthorized event, clearing session");
      toast.error("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");

      setSession(null);
      setUser(null);
      setUserProfile(null);
      setUserRole(null);
      setPermissions(null);
      setLoading(false);

      await supabase.auth.signOut();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const val = {
    session,
    user,
    userRole,
    permissions,
    loading,
    refreshPermissions: async () => {
      if (userRole) {
        const perms = await fetchUserPermissions(userRole);
        setPermissions(perms);
      }
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={val}>{children}</AuthContext.Provider>;
};
