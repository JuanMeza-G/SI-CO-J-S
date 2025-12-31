import React, { createContext, useContext, useEffect, useState, useRef } from "react";
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
        // Función para verificar rol de administrador
        const verifyAdminRole = async (currentUser) => {
            // Evitar verificaciones múltiples
            if (adminVerificationChecked.current) return;
            adminVerificationChecked.current = true;

            try {
                const { data: userProfile, error: profileError } = await supabase
                    .from("users")
                    .select("role")
                    .eq("id", currentUser.id)
                    .single();

                if (profileError || !userProfile) {
                    // Si no existe el perfil, no es administrador autorizado
                    await supabase.auth.signOut();
                    toast.error("Acceso denegado. No tienes permisos de administrador.");
                    window.history.replaceState({}, document.title, window.location.pathname);
                    return;
                }

                if (userProfile?.role !== "administrador") {
                    await supabase.auth.signOut();
                    toast.error("Acceso denegado. No tienes permisos de administrador.");
                    window.history.replaceState({}, document.title, window.location.pathname);
                    return;
                }

                // Si es administrador, limpiar el parámetro de la URL
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (error) {
                console.error("Error verifying admin role:", error);
                await supabase.auth.signOut();
                toast.error("Error al verificar permisos de administrador.");
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        };

        // 1. Get initial session
        const getInitialSession = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                setSession(initialSession);
                setUser(initialSession?.user ?? null);
                
                // Verificar si viene del login de admin
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('admin_login') === 'true' && initialSession?.user) {
                    await verifyAdminRole(initialSession.user);
                }
            } catch (error) {
                console.error("Error getting session:", error);
            } finally {
                setLoading(false);
            }
        };

        getInitialSession();

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                setSession(currentSession);
                setUser(currentSession?.user ?? null);
                setLoading(false);

                if (event === "SIGNED_OUT") {
                    setSession(null);
                    setUser(null);
                    adminVerificationChecked.current = false; // Reset para futuros logins
                }

                // Verificar rol de admin si viene del callback de OAuth
                if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && currentSession?.user) {
                    const urlParams = new URLSearchParams(window.location.search);
                    if (urlParams.get('admin_login') === 'true') {
                        await verifyAdminRole(currentSession.user);
                    }
                }
            }
        );

        return () => {
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
