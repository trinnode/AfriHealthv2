import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ConnectButton } from '@rainbow-me/rainbowkit';

/**
 * Navigation Bar Component
 */
export default function Navbar() {
  const location = useLocation();
      });
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
            {accountId ? (
              <>
                <div className="hidden sm:block">
                  <div className="px-4 py-2 bg-afrihealth-green bg-opacity-20 border border-afrihealth-green rounded-lg">
                    <p className="font-mono text-xs text-gray-400">Connected</p>
                    <p className="font-mono text-sm text-afrihealth-green font-bold">
                      {accountId.slice(0, 6)}...
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
