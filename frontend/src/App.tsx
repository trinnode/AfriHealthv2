import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import LandingPage from "./components/LandingPage";
import PatientDashboard from "./components/PatientDashboard";
import ProviderDashboard from "frontend/src/components/ProviderDashboard.tsx";
import Navbar from "./components/Navbar";
import { getWalletService } from "./services/walletService";
import { useWalletStore } from "./stores";

function App() {
  const { setConnected, setDisconnected } = useWalletStore();

  useEffect(() => {
    // Initialize wallet service
    const walletService = getWalletService();
    walletService.initialize("testnet").catch(console.error);

    // Listen for wallet events
    const handleWalletConnected = (event: Event) => {
      const customEvent = event as CustomEvent<{
        accountId: string;
        network: string;
      }>;
      setConnected(customEvent.detail.accountId, "testnet");
    };

    const handleWalletDisconnected = () => {
      setDisconnected();
    };

    window.addEventListener(
      "wallet:connected",
      handleWalletConnected as EventListener
    );
    window.addEventListener(
      "wallet:disconnected",
      handleWalletDisconnected as EventListener
    );

    return () => {
      window.removeEventListener(
        "wallet:connected",
        handleWalletConnected as EventListener
      );
      window.removeEventListener(
        "wallet:disconnected",
        handleWalletDisconnected as EventListener
      );
    };
  }, [setConnected, setDisconnected]);

  return (
    <Router>
      <div className="min-h-screen bg-afrihealth-black">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/patient"
            element={
              <>
                <Navbar />
                <PatientDashboard />
              </>
            }
          />
          <Route
            path="/provider"
            element={
              <>
                <Navbar />
                <ProviderDashboard />
              </>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
