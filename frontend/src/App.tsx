import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import PatientDashboard from "./components/PatientDashboardIntegrated";
import ProviderDashboard from "./components/ProviderDashboardIntegrated";
import Navbar from "./components/Navbar";
import { AppProvider } from "./providers/walletProvider";

function App() {
  const Patients = () => (
    <>
      <Navbar />
      <PatientDashboard />
    </>
  )

  const Provider = () => (
    <>
      <Navbar />
      <ProviderDashboard />
    </>
  )

  return (
      <AppProvider>
        <Router>
          <div className="min-h-screen bg-afrihealth-black">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/patient" element={<Patients />} />
              <Route path="/provider" element={<Provider />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AppProvider>
    // </ClientProviders>
  );
}

export default App;
