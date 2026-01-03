import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom"
import Login from "../pages/Login.jsx"
import Home from "../pages/Home.jsx"
import Dashboard from "../pages/Dashboard.jsx"
import Patients from "../pages/Patients.jsx"
import PatientDetails from "../pages/PatientDetails.jsx"
import PatientsSearch from "../components/Patients/PatientsSearch.jsx"
import Appointments from "../pages/Appointments.jsx"
import AppointmentsNew from "../components/Appointments/AppointmentsNew.jsx"
import AppointmentsAgenda from "../components/Appointments/AppointmentsAgenda.jsx"
import AppointmentsWaiting from "../components/Appointments/AppointmentsWaiting.jsx"
import EHR from "../pages/EHR.jsx"
import EHREvolution from "../components/EHR/EHREvolution.jsx"
import EHRDocuments from "../components/EHR/EHRDocuments.jsx"
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
            path: "patients/:id",
            element: <PatientDetails />
          },
          {
            path: "patients-search",
            element: <PatientsSearch />
          },
          {
            path: "appointments",
            element: <Appointments />
          },
          {
            path: "appointments-new",
            element: <AppointmentsNew />
          },
          {
            path: "appointments-agenda",
            element: <AppointmentsAgenda />
          },
          {
            path: "appointments-waiting",
            element: <AppointmentsWaiting />
          },
          {
            path: "ehr",
            element: <EHR />
          },
          {
            path: "ehr-evolution",
            element: <EHREvolution />
          },
          {
            path: "ehr-documents",
            element: <EHRDocuments />
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
const MyRoutes = () => {
  return <RouterProvider router={router} />;
};
export default MyRoutes;
