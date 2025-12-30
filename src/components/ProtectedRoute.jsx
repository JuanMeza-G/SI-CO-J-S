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
    return <Loader fullScreen text="Cargando sesión..." />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
