import React, { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.jsx"


/** Punto de entrada de la aplicación que renderiza el árbol de componentes */
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
)