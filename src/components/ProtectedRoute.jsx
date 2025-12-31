import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const [minLoading, setMinLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (loading || minLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-white dark:bg-[#0a0a0a]">
        <Loader text="Cargando sesión..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
