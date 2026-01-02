import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { supabase } from "../supabaseClient";
import { toast } from "sonner";
import { defaultPermissions, modules } from "../utils/permissions";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

const INITIAL_SESSION_TIMEOUT = 4000;
const PROFILE_TIMEOUT = 3000;
const FAST_TIMEOUT = 2000;

const withQuickTimeout = (promise, timeoutMs, operationName = "Operación") => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`${operationName} timeout (${timeoutMs}ms)`));
    }, timeoutMs);

    Promise.resolve(promise)
      .then(resolve)
      .catch(reject)
      .finally(() => {
        clearTimeout(timeoutId);
      });
  });
};

const quickQuery = async (
  queryFn,
  timeoutMs = 5000,
  operationName = "Consulta"
) => {
  try {
    return await withQuickTimeout(queryFn(), timeoutMs, operationName);
  } catch (error) {
    if (error.message.includes("timeout")) {
      throw new Error("La conexión está tardando demasiado");
    }
    throw error;
  }
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(
    navigator.onLine ? "online" : "offline"
  );


  const isMounted = useRef(true);
  const initializationAttempted = useRef(false);
  const authSubscription = useRef(null);


  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus("online");
    };

    const handleOffline = () => {
      setNetworkStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);


  const loadPermissionsFromCache = useCallback((role) => {
    if (!role) return defaultPermissions.guest || {};

    try {
      const saved = localStorage.getItem("role_permissions");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed[role]) {
          return parsed[role];
        }
      }

      const oldSaved = localStorage.getItem("role_permissions_cache");
      if (oldSaved) {
        const parsed = JSON.parse(oldSaved);
        if (parsed[role]) {
          return parsed[role];
        }
      }
    } catch (e) {
      console.warn("Error parsing permissions cache:", e);
    }

    return defaultPermissions[role] || defaultPermissions.guest || {};
  }, []);

  const fetchPermissionsFromDB = useCallback(async (role) => {
    if (!role) return null;

    try {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("*");

      if (error) throw error;

      if (data && data.length > 0) {
        const newPerms = {};
        const uniqueRoles = [...new Set(data.map(p => p.role))];

        uniqueRoles.forEach(r => {
          newPerms[r] = {};
        });

        data.forEach(p => {
          if (!newPerms[p.role][p.module]) newPerms[p.role][p.module] = {};
          newPerms[p.role][p.module][p.permission] = p.allowed;
        });

        localStorage.setItem("role_permissions", JSON.stringify(newPerms));

        return newPerms[role];
      }
    } catch (e) {
      console.warn("Error fetching permissions from DB:", e);
    }
    return null;
  }, []);

  const fetchUserProfileQuick = useCallback(
    async (userId) => {
      if (!userId) return null;

      if (networkStatus === "offline") {
        const cachedProfile = localStorage.getItem("user_profile_cache");
        if (cachedProfile) {
          try {
            return JSON.parse(cachedProfile);
          } catch (e) {
          }
        }
        return null;
      }

      try {
        const result = await quickQuery(
          () =>
            supabase.from("users").select("*").eq("id", userId).maybeSingle(),
          PROFILE_TIMEOUT,
          "Cargar perfil"
        );

        if (result?.error) return null;

        if (result?.data) {
          try {
            localStorage.setItem(
              "user_profile_cache",
              JSON.stringify({
                data: result.data,
                timestamp: Date.now(),
              })
            );
          } catch (e) {
          }
        }

        return result?.data || null;
      } catch (error) {
        console.warn("No se pudo cargar perfil (usando caché):", error.message);

        const cachedProfile = localStorage.getItem("user_profile_cache");
        if (cachedProfile) {
          try {
            const parsed = JSON.parse(cachedProfile);
            if (Date.now() - (parsed.timestamp || 0) < 300000) {
              return parsed.data;
            }
          } catch (e) {
          }
        }

        return null;
      }
    },
    [networkStatus]
  );

  const getInitialSessionQuick = useCallback(async () => {
    if (!isMounted.current || initializationAttempted.current) return;
    initializationAttempted.current = true;

    const globalTimeout = setTimeout(() => {
      if (isMounted.current && loading) {
        console.warn(
          "AuthContext: Global timeout reached, forcing ready state"
        );
        setLoading(false);
        setPermissions(defaultPermissions.guest || {});
      }
    }, 5000);

    try {
      let authSession = null;

      try {
        const sessionResult = await quickQuery(
          () => supabase.auth.getSession(),
          INITIAL_SESSION_TIMEOUT,
          "Obtener sesión"
        );

        authSession = sessionResult?.data?.session || null;
      } catch (error) {
        console.warn("No se pudo obtener sesión inicial:", error.message);
      }

      if (!authSession?.user) {
        if (isMounted.current) {
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setUserRole(null);
          setPermissions(defaultPermissions.guest || {});
          setLoading(false);
        }
        clearTimeout(globalTimeout);
        return;
      }

      if (isMounted.current) {
        setSession(authSession);

        try {
          const profile = await fetchUserProfileQuick(authSession.user.id);

          if (!isMounted.current) {
            clearTimeout(globalTimeout);
            return;
          }

          if (profile) {
            if (profile.is_active === false) {
              await supabase.auth.signOut();

              setSession(null);
              setUser(null);
              setUserProfile(null);
              setUserRole(null);
              setPermissions(defaultPermissions.guest || {});
              setLoading(false);
              clearTimeout(globalTimeout);
              return;
            }

            const role = profile.role || "invitado";
            const perms = loadPermissionsFromCache(role);

            const urlParams = new URL(window.location.href).searchParams;
            const isAdminLogin = urlParams.get("admin_login") === "true";

            if (isAdminLogin) {
              setIsVerifyingAdmin(true);
            }

            if (isAdminLogin && role !== "administrador") {
              toast.error("Acceso denegado. Se requieren permisos de administrador.");
              setPermissions(defaultPermissions.guest || {});
              setLoading(false);
              setIsVerifyingAdmin(false);
              clearTimeout(globalTimeout);
              return;
            }

            if (isAdminLogin) {
              setIsVerifyingAdmin(false);
              const url = new URL(window.location.href);
              url.searchParams.delete("admin_login");
              window.history.replaceState({}, "", url.pathname);
            }

            setUserProfile(profile);
            setUserRole(role);
            setPermissions(perms);
            setUser(authSession.user);

            const currentProvider = authSession.user.app_metadata.provider;
            if (currentProvider && profile.provider !== currentProvider) {
              supabase
                .from("users")
                .update({ provider: currentProvider })
                .eq("id", profile.id)
                .then(({ error }) => {
                  if (error) console.warn("Error sincronizando provider:", error.message);
                });
            }

            fetchPermissionsFromDB(role).then(dbPerms => {
              if (isMounted.current && dbPerms) {
                setPermissions(dbPerms);
              }
            });
          } else {

            await supabase.auth.signOut();

            setSession(null);
            setUser(null);
            setUserProfile(null);
            setUserRole(null);
            setPermissions(defaultPermissions.guest || {});
            setLoading(false);
            setIsVerifyingAdmin(false);
            clearTimeout(globalTimeout);
            return;
          }
        } catch (error) {
          console.warn("Error verificando perfil en inicio:", error.message);
          setUser(authSession.user);
        }

        setLoading(false);
      }

      clearTimeout(globalTimeout);
    } catch (error) {
      console.warn("Error en inicialización:", error.message);

      if (isMounted.current) {
        setSession(null);
        setUser(null);
        setUserProfile(null);
        setUserRole(null);
        setPermissions(defaultPermissions.guest || {});
        setLoading(false);
      }

      clearTimeout(globalTimeout);
    }
  }, [fetchUserProfileQuick, loadPermissionsFromCache, loading]);

  const handleAuthChange = useCallback(
    (event, authSession) => {
      if (!isMounted.current) return;



      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        setUserProfile(null);
        setUserRole(null);
        setPermissions(defaultPermissions.guest || {});
        setLoading(false);

        try {
          localStorage.removeItem("user_profile_cache");
        } catch (e) {
        }
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (!authSession?.user) {
          setSession(null);
          setUser(null);
          setPermissions(defaultPermissions.guest || {});
          setLoading(false);
          return;
        }

        (async () => {
          try {
            const profile = await fetchUserProfileQuick(authSession.user.id);

            if (!isMounted.current) return;

            if (profile) {
              if (profile.is_active === false) {
                await supabase.auth.signOut();
                toast.error("Tu cuenta está desactivada. Contacta al administrador.");
                setSession(null);
                setUser(null);
                setUserProfile(null);
                setUserRole(null);
                setPermissions(defaultPermissions.guest || {});
                setLoading(false);
                return;
              }

              const role = profile.role || "invitado";
              const perms = loadPermissionsFromCache(role);

              const urlParams = new URL(window.location.href).searchParams;
              const isAdminLogin = urlParams.get("admin_login") === "true";

              if (isAdminLogin) {
                setIsVerifyingAdmin(true);
              }

              if (isAdminLogin && role !== "administrador") {
                toast.error("Acceso denegado. Se requieren permisos de administrador.");
                await supabase.auth.signOut();

                const url = new URL(window.location.href);
                url.searchParams.delete("admin_login");
                window.history.replaceState({}, "", url.pathname);

                setSession(null);
                setUser(null);
                setUserProfile(null);
                setUserRole(null);
                setPermissions(defaultPermissions.guest || {});
                setLoading(false);
                setIsVerifyingAdmin(false);
                return;
              }

              setSession(authSession);
              setUser(authSession.user);
              setUserProfile(profile);
              setUserRole(role);
              setPermissions(perms);

              if (isAdminLogin) {
                setIsVerifyingAdmin(false);
                const url = new URL(window.location.href);
                url.searchParams.delete("admin_login");
                window.history.replaceState({}, "", url.pathname);
              }

              const currentProvider = authSession.user.app_metadata.provider;
              if (currentProvider && profile.provider !== currentProvider) {
                supabase
                  .from("users")
                  .update({ provider: currentProvider })
                  .eq("id", profile.id)
                  .then(({ error }) => {
                    if (error) console.warn("Error sincronizando provider en auth change:", error.message);
                  });
              }

              if (authSession.user.app_metadata.provider !== "email") {
                toast.success("Sesión iniciada correctamente");
              }
            } else {
              toast.error("Usuario sin perfil en la base de datos. Debe ser registrado por un administrador.");

              await supabase.auth.signOut();

              setSession(null);
              setUser(null);
              setUserProfile(null);
              setUserRole(null);
              setPermissions(defaultPermissions.guest || {});
              setIsVerifyingAdmin(false);
            }
          } catch (error) {
            console.warn("Error cargando perfil en auth change:", error.message);
            setUser(authSession.user);
          }
          setLoading(false);
          setIsVerifyingAdmin(false);
        })();
      }
    },
    [fetchUserProfileQuick, loadPermissionsFromCache]
  );

  useEffect(() => {
    isMounted.current = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthChange);
    authSubscription.current = subscription;

    getInitialSessionQuick();
    return () => {
      isMounted.current = false;
      initializationAttempted.current = false;

      if (authSubscription.current) {
        authSubscription.current.unsubscribe();
      }
    };
  }, [getInitialSessionQuick, handleAuthChange]);

  const value = {
    session,
    user,
    userRole,
    permissions,
    userProfile,
    loading,
    isVerifyingAdmin,
    networkStatus,
    signOut: useCallback(async () => {
      try {
        await quickQuery(
          () => supabase.auth.signOut(),
          FAST_TIMEOUT,
          "Cerrar sesión"
        );
      } catch (error) {
        setSession(null);
        setUser(null);
        setUserProfile(null);
        setUserRole(null);
        setPermissions(defaultPermissions.guest || {});
      }
    }, []),
    refreshUserProfile: useCallback(async () => {
      if (!user?.id) return;

      try {
        const profile = await fetchUserProfileQuick(user.id);
        if (profile && isMounted.current) {
          const role = profile.role || "invitado";
          const perms = loadPermissionsFromCache(role);

          setUserProfile(profile);
          setUserRole(role);
          setPermissions(perms);

          fetchPermissionsFromDB(role).then(dbPerms => {
            if (isMounted.current && dbPerms) {
              setPermissions(dbPerms);
            }
          });
        }
      } catch (error) {
        console.warn("Error refrescando perfil:", error.message);
      }
    }, [user?.id, fetchUserProfileQuick, loadPermissionsFromCache]),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
