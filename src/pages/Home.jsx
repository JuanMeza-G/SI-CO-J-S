import React, { useEffect } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import { useAuth } from "../context/AuthContext"

/** Layout principal de la aplicación con barra lateral y área de contenido */
const Home = () => {
  const { permissions, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = location.pathname.split("/").pop() || "dashboard";
  const tabs = [
    { id: "dashboard" },
    { id: "patients" },
    { id: "appointments" },
    { id: "ehr" },
    { id: "settings" },
  ];

  useEffect(() => {
    if (!loading && permissions) {
      const currentAllowed = permissions[activeTab]?.view;

      if (!currentAllowed) {
        const firstAllowed = tabs.find(tab => permissions[tab.id]?.view);
        if (firstAllowed) {
          navigate(`/home/${firstAllowed.id}`, { replace: true });
        }
      }
    }
  }, [permissions, loading, activeTab, navigate]);

  const handleTabChange = (tabId) => {
    navigate(`/home/${tabId}`);
  };

  if (loading) return null;

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#0a0a0a]">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}

export default Home