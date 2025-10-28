import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";

/**
 * Navigation Bar Component
 */
export default function Navbar() {
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

          {/* Wallet Connection - RainbowKit Button */}
          <div className="flex items-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
