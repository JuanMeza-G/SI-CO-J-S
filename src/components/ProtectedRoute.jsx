import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const [minLoading, setMinLoading] = React.useState(true);

  React.useEffect(() => {
    let timer;
    
    if (!loading && user) {
      // Si loading es false y hay user, esperar un poco más para asegurar que el estado esté completamente establecido
      timer = setTimeout(() => {
        setMinLoading(false);
      }, 300);
    } else if (!loading && !user) {
      // Si no hay user y loading es false, permitir la redirección inmediatamente
      setMinLoading(false);
    } else {
      // Mientras loading es true, mantener minLoading en true por un tiempo mínimo
      timer = setTimeout(() => {
        setMinLoading(false);
      }, 600);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading, user]);

  // Siempre mostrar loader si loading es true
  if (loading || minLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-white dark:bg-[#0a0a0a]">
        <Loader text="Cargando sesión..." />
      </div>
    );
  }

  // Si no hay user, redirigir inmediatamente
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Solo renderizar Outlet si hay user y loading es false
  return <Outlet />;
};

export default ProtectedRoute;
