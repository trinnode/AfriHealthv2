import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

import LandingPage from "./components/LandingPage";
import PatientDashboard from "./components/PatientDashboardIntegrated";
import ProviderDashboard from "./components/ProviderDashboardIntegrated";
import Navbar from "./components/Navbar";
import { config } from "./config/wagmi";

const queryClient = new QueryClient();

function App() {
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
  );

  const Provider = () => (
    <>
      <Navbar />
      <ProviderDashboard />
    </>
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
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
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
