import React, { useState, useEffect } from "react"
import Sidebar from "../components/Sidebar"
import Dashboard from "./Dashboard"
import Patients from "./Patients"
import Appointments from "./Appointments"
import EHR from "./EHR"
import Settings from "./Settings"
import { useAuth } from "../context/AuthContext"

const Home = () => {
  const { permissions, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Definir pestañas disponibles con su ID de permiso
  const tabs = [
    { id: "dashboard", component: Dashboard },
    { id: "patients", component: Patients },
    { id: "appointments", component: Appointments },
    { id: "ehr", component: EHR },
    { id: "settings", component: Settings },
  ];

  useEffect(() => {
    if (!loading && permissions) {
      // Verificar si la pestaña actual está permitida
      const currentAllowed = permissions[activeTab]?.view;

      if (!currentAllowed) {
        // Buscar la primera pestaña permitida
        const firstAllowed = tabs.find(tab => permissions[tab.id]?.view);
        if (firstAllowed) {
          setActiveTab(firstAllowed.id);
        }
      }
    }
  }, [permissions, loading, activeTab]);

  const renderContent = () => {
    if (loading) return null; // O un loader local si se prefiere

    // Verificar permisos explícitamente antes de renderizar
    if (permissions && !permissions[activeTab]?.view) {
      return (
        <div className="flex h-full items-center justify-center text-gray-500">
          Acceso no autorizado a este módulo.
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "patients":
        return <Patients />;
      case "appointments":
        return <Appointments />;
      case "ehr":
        return <EHR />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#0a0a0a]">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  )
}

export default Home