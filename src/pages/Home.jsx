import React, { useState } from "react"
import Sidebar from "../components/Sidebar"
import Dashboard from "./Dashboard"
import Patients from "./Patients"
import Appointments from "./Appointments"
import EHR from "./EHR"
import Settings from "./Settings"

const Home = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
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