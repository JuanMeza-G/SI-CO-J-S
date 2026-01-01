import React from "react";
import MyRoutes from "./routes";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";


/** Componente principal que maneja los proveedores y rutas */
function App() {
  return (
    <AuthProvider>
      <MyRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2000,
        }}
      />
    </AuthProvider>
  );
}

export default App;
