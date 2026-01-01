import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom"
import Login from "../pages/Login.jsx"
import Home from "../pages/Home.jsx"
import Dashboard from "../pages/Dashboard.jsx"
import Patients from "../pages/Patients.jsx"
import Appointments from "../pages/Appointments.jsx"
import EHR from "../pages/EHR.jsx"
import Settings from "../pages/Settings.jsx"
import ProtectedRoute from "../components/ProtectedRoute.jsx"

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/home",
        element: <Home />,
        children: [
          {
            index: true,
            element: <Navigate to="dashboard" replace />
          },
          {
            path: "dashboard",
            element: <Dashboard />
          },
          {
            path: "patients",
            element: <Patients />
          },
          {
            path: "appointments",
            element: <Appointments />
          },
          {
            path: "ehr",
            element: <EHR />
          },
          {
            path: "settings",
            element: <Settings />
          }
        ]
      },
    ],
  },
]);

/** Componente definidor de rutas de la aplicación */
const MyRoutes = () => {
  return <RouterProvider router={router} />;
};

export default MyRoutes;
