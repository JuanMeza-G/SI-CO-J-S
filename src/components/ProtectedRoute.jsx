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
      timer = setTimeout(() => {
        setMinLoading(false);
      }, 300);
    } else if (!loading && !user) {
      setMinLoading(false);
    } else {
      timer = setTimeout(() => {
        setMinLoading(false);
      }, 600);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading, user]);
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
