import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { supabase } from "../supabaseClient";
import { toast } from "sonner";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const adminVerificationChecked = useRef(false);
  const initialSessionLoaded = useRef(false);

  useEffect(() => {
    let mounted = true;

    // Función para verificar rol de administrador y estado activo
    const verifyAdminRole = async (currentUser) => {
      // Resetear el ref al inicio de cada verificación para permitir verificaciones en recargas
      adminVerificationChecked.current = false;
      
      // Marcar que estamos verificando para evitar verificaciones simultáneas
      adminVerificationChecked.current = true;

      try {
        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("role, is_active")
          .eq("id", currentUser.id)
          .single();

        if (profileError || !userProfile) {
          await supabase.auth.signOut();
          toast.error("Acceso denegado. No tienes permisos de administrador.");
          return false;
        }

        if (userProfile?.is_active === false) {
          await supabase.auth.signOut();
          toast.error("Acceso denegado. Tu cuenta está desactivada.");
          return false;
        }

        if (userProfile?.role !== "administrador") {
          await supabase.auth.signOut();
          toast.error("Acceso denegado. No tienes permisos de administrador.");
          return false;
        }

        return true;
      } catch (error) {
        console.error("Error verifying admin role:", error);
        // En caso de error, permitir acceso (fail-safe)
        return true;
      }
    };

    // Función para verificar estado activo de cualquier usuario
    const verifyUserActive = async (currentUser) => {
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("is_active")
          .eq("id", currentUser.id)
          .single();

        // Si hay error o no hay perfil, permitir acceso (puede ser usuario nuevo o columna no existe)
        if (profileError || !userProfile) {
          return true;
        }

        if (userProfile?.is_active === false) {
          await supabase.auth.signOut();
          toast.error("Acceso denegado. Tu cuenta está desactivada.");
          return false;
        }

        return true;
      } catch (error) {
        console.error("Error verifying user active status:", error);
        // En caso de error, permitir acceso (fail-safe)
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
        } = await supabase.auth.getSession();

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
            const hasPermission = await verifyAdminRole(initialSession.user);
            if (mounted) {
              if (hasPermission) {
                setSession(initialSession);
                setUser(initialSession.user);
                setLoading(false);
                initialSessionLoaded.current = true;
              } else {
                // verifyAdminRole ya llamó a signOut(), establecer user y session en null
                // usar un timeout pequeño para establecer loading en false después de signOut
                setSession(null);
                setUser(null);
                setTimeout(() => {
                  if (mounted) {
                    setLoading(false);
                    initialSessionLoaded.current = true;
                  }
                }, 100);
              }
            }
          } catch (error) {
            console.error("Error in admin verification:", error);
            if (mounted) {
              // En caso de error, permitir acceso
              setSession(initialSession);
              setUser(initialSession.user);
              setLoading(false);
              initialSessionLoaded.current = true;
            }
          }
        } else {
          // Para usuarios normales, verificar estado activo
          try {
            const isActive = await verifyUserActive(initialSession.user);
            if (mounted) {
              if (isActive) {
                setSession(initialSession);
                setUser(initialSession.user);
                setLoading(false);
                initialSessionLoaded.current = true;
              } else {
                // verifyUserActive ya llamó a signOut(), establecer user y session en null
                // usar un timeout pequeño para establecer loading en false después de signOut
                setSession(null);
                setUser(null);
                setTimeout(() => {
                  if (mounted) {
                    setLoading(false);
                    initialSessionLoaded.current = true;
                  }
                }, 100);
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

    // Timeout de seguridad - reducir a 5 segundos
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("AuthContext: Loading timeout, forcing loading to false");
        setLoading(false);
      }
    }, 5000);

    getInitialSession();

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
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
            const hasPermission = await verifyAdminRole(currentSession.user);
            if (mounted) {
              if (hasPermission) {
                setSession(currentSession);
                setUser(currentSession.user);
                setLoading(false);
              } else {
                // verifyAdminRole ya llamó a signOut(), establecer user y session en null
                // usar un timeout pequeño para establecer loading en false después de signOut
                setSession(null);
                setUser(null);
                setTimeout(() => {
                  if (mounted) {
                    setLoading(false);
                  }
                }, 100);
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
            const { data: { session: currentSessionCheck } } = await supabase.auth.getSession();
            if (!currentSessionCheck?.user) {
              // La sesión ya fue cerrada, probablemente por el formulario
              if (mounted) {
                setSession(null);
                setUser(null);
                setLoading(false);
              }
              return;
            }
            
            const isActive = await verifyUserActive(currentSessionCheck.user);
            if (mounted) {
              if (isActive) {
                setSession(currentSessionCheck);
                setUser(currentSessionCheck.user);
                setLoading(false);
              } else {
                // verifyUserActive ya llamó a signOut(), establecer user y session en null
                // usar un timeout pequeño para establecer loading en false después de signOut
                setSession(null);
                setUser(null);
                setTimeout(() => {
                  if (mounted) {
                    setLoading(false);
                  }
                }, 100);
              }
            }
          } catch (error) {
            console.error(
              "Error in onAuthStateChange user verification:",
              error
            );
            if (mounted) {
              const { data: { session: currentSessionCheck } } = await supabase.auth.getSession();
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

  const val = {
    session,
    user,
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={val}>{children}</AuthContext.Provider>;
};
