import React from "react";
import MyRoutes from "./routes";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import OfflineOverlay from "./components/OfflineOverlay";


function App() {
  return (
    <AuthProvider>
      <MyRoutes />
      <OfflineOverlay />
      <Toaster
        theme="auto"
        richColors
        closeButton={false}
        visibleToasts={1}
        position="top-right"
        toastOptions={{
          duration: 2000,
          className: "my-toast",
          style: {
            fontFamily: "'Poppins', sans-serif",
            border: "2px solid var(--toast-border-color)",
            boxShadow: "none",
          }
        }}
      />
    </AuthProvider>
  );
}

export default App;
