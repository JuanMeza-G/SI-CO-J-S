import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Get initial session
        const getInitialSession = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                setSession(initialSession);
                setUser(initialSession?.user ?? null);
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
