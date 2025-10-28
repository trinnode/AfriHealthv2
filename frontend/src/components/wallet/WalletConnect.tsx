import React, { useEffect, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { useWallet } from "../../hooks/useWallet";

interface WalletConnectProps {
  className?: string;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  className = "",
}) => {
  const { showToast } = useToast();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPairingModal, setShowPairingModal] = useState(false);
  const { walletState, connect, disconnect, isConnecting } = useWallet();

  const userAccountId = walletState.accountId;

  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(false);
    if (showDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showDropdown]);

  // const navigate = useNavigate(); // Removed for now - not used

  const handleConnect = async () => {
    try {
      console.log("Connecting with HashConnect...");
      showToast({ title: "Please wait", type: `info` });

      await connect();
      showToast({
        title: "Wallet Connected successfully",
        type: `success`,
        message: "Use HashPack or scan QR code to complete connection",
      });
    } catch (error) {
      console.error("Connection error: ", error);
      showToast({
        title: "Connection failed",
        type: "error",
        message: "Please try again",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      showToast({
        title: "Wallet disconnected",
        type: "success",
      });
    } catch (error) {
      console.error("Disconnect error:", error);
      showToast({
        title: "Disconnect failed",
        type: "error",
        message: "Please try again",
      });
    }
    setShowDropdown(false);
  };

  // const copyPairingString = () => {
  //   if (pairingString) {
  //     navigator.clipboard.writeText(pairingString);
  //     setCopied(true);
  //     setTimeout(() => setCopied(false), 2000);
  //   }
  // };

  const formatAccountId = (id: string) => {
    if (id.length <= 12) return id;
    return `${id.slice(0, 6)}...${id.slice(-4)}`;
  };

  return (
    <>
      <div className={`relative ${className}`}>
        {!userAccountId ? (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        ) : (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-3"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-mono text-sm">
                  {formatAccountId(userAccountId as string)}
                </span>
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${
                  showDropdown ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                <div className="p-4 border-b border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">
                    Connected Account
                  </p>
                  <p className="font-mono text-sm text-white break-all">
                    {userAccountId}
                  </p>
                </div>
                {/* <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Network</p>
                      <p className="text-sm text-white font-semibold capitalize">
                        {network}
                      </p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-semibold ${network === "mainnet"
                        ? "bg-green-900 text-green-200"
                        : "bg-yellow-900 text-yellow-200"
                        }`}
                    >
                      {network === "mainnet" ? "LIVE" : "TEST"}
                    </div>
                  </div>
                </div> */}
                <div className="p-2">
                  <button
                    onClick={handleDisconnect}
                    className="w-full px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pairing Modal */}
      {showPairingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Connect Your Wallet
                </h3>
                <button
                  onClick={() => setShowPairingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* <div className="text-sm text-gray-600">
                <p className="mb-2">
                  Scan the QR code with HashPack or copy the pairing string:
                </p>
              </div> */}

              {/* <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="font-mono text-xs text-gray-900 break-all mb-3">
                  {pairingString}
                </p>
                <button
                  onClick={copyPairingString}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy Pairing String
                    </>
                  )}
                </button>
              </div>  */}

              {/* <div className="text-xs text-gray-500">
                <p>Waiting for wallet connection...</p>
              </div> */}
            </div>{" "}
            */
            <div className="px-6 py-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowPairingModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
