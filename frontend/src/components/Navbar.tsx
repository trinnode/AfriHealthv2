import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "./UI";
// import { useWalletStore } from "../stores";
// import { getWalletService } from "../services/walletService";
import { useState } from "react";

/**
 * Navigation Bar Component
 */
export default function Navbar() {
  const location = useLocation();
  // const { userAccountId, disconnect } = useDAppConnector() ?? {};
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setConnecting(true);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect?.()
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  return (
    <nav className="bg-black bg-opacity-80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-lora text-2xl font-bold text-white">
              AfriHealth <span className="text-afrihealth-orange">Ledger</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink to="/patient" active={location.pathname === "/patient"}>
              Patient
            </NavLink>
            <NavLink to="/provider" active={location.pathname === "/provider"}>
              Provider
            </NavLink>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            { userAccountId? (
              <>
                <div className="hidden sm:block">
                  <div className="px-4 py-2 bg-afrihealth-green bg-opacity-20 border border-afrihealth-green rounded-lg">
                    <p className="font-mono text-xs text-gray-400">Connected</p>
                    <p className="font-mono text-sm text-afrihealth-green font-bold">
                      {userAccountId?.slice(0, 10)}...
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="danger" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={handleConnect}
                loading={connecting}
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

/**
 * Navigation Link Component
 */
function NavLink({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link to={to}>
      <motion.div
        className={`font-mono font-bold px-3 py-2 rounded-lg transition-colors ${
          active
            ? "text-afrihealth-orange bg-afrihealth-orange bg-opacity-10"
            : "text-gray-400 hover:text-white hover:bg-gray-800"
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {children}
      </motion.div>
    </Link>
  );
}
