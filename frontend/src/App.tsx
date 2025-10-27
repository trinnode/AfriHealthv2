import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import LandingPage from "./components/LandingPage";
import PatientDashboard from "./components/PatientDashboardIntegrated";
import ProviderDashboard from "./components/ProviderDashboardIntegrated";
import Navbar from "./components/Navbar";
// import { getWalletService } from "./services/walletService";
import { useWalletStore } from "./stores";
// import ClientProviders from "./providers/clientProvider";
import { AppProvider } from "./providers/walletProvider";
import { ConnectButton } from "@rainbow-me/rainbowkit";

function App() {
  // const { setConnected, setDisconnected } = useWalletStore();

  // useEffect(() => {
  //   // Initialize wallet service
  //   // const walletService = getWalletService();
  //   // walletService.initialize("testnet").catch(console.error);

  //   // Listen for wallet events
  //   const handleWalletConnected = (event: Event) => {
  //     const customEvent = event as CustomEvent<{
  //       accountId: string;
  //       network: string;
  //     }>;
  //     setConnected(customEvent.detail.accountId, "testnet");
  //   };

  //   const handleWalletDisconnected = () => {
  //     setDisconnected();
  //   };

  //   window.addEventListener(
  //     "wallet:connected",
  //     handleWalletConnected as EventListener
  //   );
  //   window.addEventListener(
  //     "wallet:disconnected",
  //     handleWalletDisconnected as EventListener
  //   );

  //   return () => {
  //     window.removeEventListener(
  //       "wallet:connected",
  //       handleWalletConnected as EventListener
  //     );
  //     window.removeEventListener(
  //       "wallet:disconnected",
  //       handleWalletDisconnected as EventListener
  //     );
  //   };
  // }, [setConnected, setDisconnected]);

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
    // <ClientProviders>
      <AppProvider>
        <Router>
          <div className="min-h-screen bg-afrihealth-black">
            <ConnectButton />
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
