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

  useEffect(() => {
    let mounted = true;

    // Función para verificar rol de administrador y estado activo
    const verifyAdminRole = async (currentUser) => {
      if (adminVerificationChecked.current) return false;
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

    // 1. Get initial session - SIMPLIFICADO
    const getInitialSession = async () => {
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
          }
          return;
        }

        if (!mounted) return;

        // Si no hay sesión, establecer estado vacío inmediatamente
        if (!initialSession?.user) {
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        // Verificar si viene del login de admin
        const urlParams = new URLSearchParams(window.location.search);
        const isAdminLogin = urlParams.get("admin_login") === "true";

        if (isAdminLogin) {
          try {
            const hasPermission = await verifyAdminRole(initialSession.user);
            if (mounted) {
              if (hasPermission) {
                setSession(initialSession);
                setUser(initialSession.user);
                setLoading(false);
              } else {
                // verifyAdminRole ya llamó a signOut(), establecer user y session en null
                // pero mantener loading en true hasta que SIGNED_OUT se dispare
                // para evitar que se renderice el contenido antes de la redirección
                setSession(null);
                setUser(null);
                // NO establecer loading en false aquí, dejar que SIGNED_OUT lo maneje
              }
            }
          } catch (error) {
            console.error("Error in admin verification:", error);
            if (mounted) {
              // En caso de error, permitir acceso
              setSession(initialSession);
              setUser(initialSession.user);
              setLoading(false);
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
              } else {
                // verifyUserActive ya llamó a signOut(), establecer estado inmediatamente
                // para evitar que se renderice el contenido antes de la redirección
                setSession(null);
                setUser(null);
                setLoading(false);
              }
            }
          } catch (error) {
            console.error("Error in user verification:", error);
            if (mounted) {
              // En caso de error, permitir acceso
              setSession(initialSession);
              setUser(initialSession.user);
              setLoading(false);
            }
          }
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
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
        if (!currentSession?.user) {
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const isAdminLogin = urlParams.get("admin_login") === "true";

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
                // pero mantener loading en true hasta que SIGNED_OUT se dispare
                // para evitar que se renderice el contenido antes de la redirección
                setSession(null);
                setUser(null);
                // NO establecer loading en false aquí, dejar que SIGNED_OUT lo maneje
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
          try {
            const isActive = await verifyUserActive(currentSession.user);
            if (mounted) {
              if (isActive) {
                setSession(currentSession);
                setUser(currentSession.user);
                setLoading(false);
              } else {
                // verifyUserActive ya llamó a signOut(), establecer user y session en null
                // pero mantener loading en true hasta que SIGNED_OUT se dispare
                // para evitar que se renderice el contenido antes de la redirección
                setSession(null);
                setUser(null);
                // NO establecer loading en false aquí, dejar que SIGNED_OUT lo maneje
              }
            }
          } catch (error) {
            console.error(
              "Error in onAuthStateChange user verification:",
              error
            );
            if (mounted) {
              setSession(currentSession);
              setUser(currentSession.user);
              setLoading(false);
            }
          }
        }
      } else {
        // Para otros eventos
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
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
