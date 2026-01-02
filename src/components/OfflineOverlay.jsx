import React, { useState } from "react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { WifiOff, RefreshCw } from "lucide-react";

const OfflineOverlay = () => {
  const { isOnline, checkConnection } = useOnlineStatus();
  const [isChecking, setIsChecking] = useState(false);

  if (isOnline) return null;

  const handleRetry = async () => {
    setIsChecking(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    await checkConnection();
    setIsChecking(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#1e1e1e] border-gray-100 dark:border-[#262626] border rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
          <WifiOff className="w-8 h-8 text-red-600 dark:text-red-500" />
        </div>

        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-[#f5f5f5]">
          Sin conexión
        </h2>

        <p className="text-gray-600 dark:text-[#e5e5e5] mb-8 px-2 text-sm">
          No se detectó una conexión a internet. Revisa tu red para continuar.
        </p>

        <button
          onClick={handleRetry}
          disabled={isChecking}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium transition-all shadow-sm active:scale-95 group cursor-pointer"
        >
          <RefreshCw
            className={`w-4 h-4 ${isChecking
                ? "animate-spin"
                : "group-hover:rotate-180 transition-transform duration-500"
              }`}
          />
          {isChecking ? "Verificando..." : "Reintentar"}
        </button>
      </div>
    </div>
  );
};

export default OfflineOverlay;
