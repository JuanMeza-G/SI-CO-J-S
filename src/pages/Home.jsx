import React, { useEffect } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import { useAuth } from "../context/AuthContext"
const Home = () => {
  const { permissions, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.split("/")[2] || "dashboard";
  const tabs = [
    { id: "dashboard" },
    { id: "patients" },
    { id: "patients-search" },
    { id: "appointments" },
    { id: "appointments-agenda" },
    { id: "appointments-waiting" },
    { id: "ehr" },
    { id: "ehr-evolution" },
    { id: "ehr-documents" },
    { id: "settings" },
  ];
  useEffect(() => {
    if (!loading && permissions) {
      if (activeTab === 'dashboard') return;
      const permissionMap = {
        'patients': { module: 'patients', action: 'view' },
        'patients-search': { module: 'patients', action: 'search' },
        'appointments': { module: 'appointments', action: 'view' },
        'appointments-agenda': { module: 'appointments', action: 'agenda' },
        'appointments-waiting': { module: 'appointments', action: 'waiting' },
        'ehr': { module: 'ehr', action: 'view' },
        'ehr-evolution': { module: 'ehr', action: 'evolution' },
        'ehr-documents': { module: 'ehr', action: 'documents' },
        'settings': { module: 'settings', action: 'view' },
      };
      const perm = permissionMap[activeTab];
      const currentAllowed = perm ? permissions[perm.module]?.[perm.action] : false;
      if (!currentAllowed) {
        const mainModules = ["dashboard", "patients", "appointments", "ehr", "settings"];
        const firstAllowed = mainModules.find(id => permissions[id]?.view || id === 'dashboard');
        if (firstAllowed) {
          navigate(`/home/${firstAllowed}`, { replace: true });
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
