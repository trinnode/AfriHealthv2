import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, User, Building2 } from "lucide-react";
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: "patient" | "provider") => void;
}

/**
 * Modal for selecting user role before wallet connection
 */
export function RoleSelectionModal({
  isOpen,
  onClose,
  onSelectRole,
}: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<"patient" | "provider" | null>(null);

  const handleRoleClick = (role: "patient" | "provider") => {
    setSelectedRole(role);
    onSelectRole(role);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-afrihealth-gray-900 border-2 border-afrihealth-teal/30 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-afrihealth-teal/10 to-afrihealth-orange/10 p-6 border-b border-afrihealth-gray-700">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-afrihealth-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <h2 className="font-lora text-3xl font-bold text-white mb-2">
                  Get Started with AfriHealth
                </h2>
                <p className="text-afrihealth-gray-300 font-mono text-sm">
                  {!selectedRole ? "Choose your role to connect your wallet" : "Connect your wallet"}
                </p>
              </div>

              {/* Content */}
              <div className="p-8">
                {!selectedRole ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Patient Option */}
                      <motion.button
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleRoleClick("patient")}
                        className="group relative bg-gradient-to-br from-afrihealth-green/10 to-afrihealth-green/5 border-2 border-afrihealth-green hover:border-afrihealth-green/80 rounded-xl p-8 text-left transition-all overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-afrihealth-green/0 to-afrihealth-green/0 group-hover:from-afrihealth-green/20 group-hover:to-afrihealth-green/10 transition-all duration-300" />
                        
                        <div className="relative">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-afrihealth-green/20 rounded-lg">
                              <User className="w-8 h-8 text-afrihealth-green" />
                            </div>
                            <h3 className="font-lora text-2xl font-bold text-white">
                              Patient
                            </h3>
                          </div>
                          <p className="text-afrihealth-gray-300 font-mono text-sm mb-4">
                            Access your medical records, manage appointments, and control your health data
                          </p>
                          <ul className="space-y-2 text-sm text-afrihealth-gray-400 font-mono">
                            <li className="flex items-center gap-2">
                              <span className="text-afrihealth-green">✓</span>
                              View medical history
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-afrihealth-green">✓</span>
                              Manage consents
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-afrihealth-green">✓</span>
                              Track billing
                            </li>
                          </ul>
                          <div className="mt-6 text-afrihealth-green font-mono font-bold text-sm group-hover:text-white transition-colors">
                            Select Patient →
                          </div>
                        </div>
                      </motion.button>

                      {/* Provider Option */}
                      <motion.button
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleRoleClick("provider")}
                        className="group relative bg-gradient-to-br from-afrihealth-orange/10 to-afrihealth-orange/5 border-2 border-afrihealth-orange hover:border-afrihealth-orange/80 rounded-xl p-8 text-left transition-all overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-afrihealth-orange/0 to-afrihealth-orange/0 group-hover:from-afrihealth-orange/20 group-hover:to-afrihealth-orange/10 transition-all duration-300" />
                        
                        <div className="relative">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-afrihealth-orange/20 rounded-lg">
                              <Building2 className="w-8 h-8 text-afrihealth-orange" />
                            </div>
                            <h3 className="font-lora text-2xl font-bold text-white">
                              Provider
                            </h3>
                          </div>
                          <p className="text-afrihealth-gray-300 font-mono text-sm mb-4">
                            Manage patient records, submit claims, and provide quality care
                          </p>
                          <ul className="space-y-2 text-sm text-afrihealth-gray-400 font-mono">
                            <li className="flex items-center gap-2">
                              <span className="text-afrihealth-orange">✓</span>
                              Access patient data
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-afrihealth-orange">✓</span>
                              Submit bills
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-afrihealth-orange">✓</span>
                              Manage claims
                            </li>
                          </ul>
                          <div className="mt-6 text-afrihealth-orange font-mono font-bold text-sm group-hover:text-white transition-colors">
                            Select Provider →
                          </div>
                        </div>
                      </motion.button>
                    </div>

                    <div className="mt-8 p-4 bg-afrihealth-gray-800/50 rounded-lg border border-afrihealth-gray-700">
                      <p className="text-xs text-afrihealth-gray-400 text-center font-mono">
                        🔒 Your wallet will be used to securely access the platform. <br />
                        Compatible with MetaMask, Rabby, and other EVM wallets on Hedera network.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="mb-8">
                      <div className="inline-block p-4 bg-gradient-to-br from-afrihealth-teal/20 to-afrihealth-orange/20 rounded-full mb-4">
                        {selectedRole === "patient" ? (
                          <User className="w-16 h-16 text-afrihealth-green" />
                        ) : (
                          <Building2 className="w-16 h-16 text-afrihealth-orange" />
                        )}
                      </div>
                      <h3 className="font-lora text-2xl font-bold text-white mb-2">
                        Connect Your Wallet
                      </h3>
                      <p className="text-afrihealth-gray-300 font-mono text-sm mb-6">
                        Connecting as <span className={selectedRole === "patient" ? "text-afrihealth-green" : "text-afrihealth-orange"}>
                          {selectedRole === "patient" ? "Patient" : "Provider"}
                        </span>
                      </p>
                    </div>

                    {/* RainbowKit Connect Button */}
                    <div className="flex justify-center mb-6">
                      <ConnectButton />
                    </div>

                    <button
                      onClick={() => setSelectedRole(null)}
                      className="text-afrihealth-gray-400 hover:text-white font-mono text-sm transition-colors"
                    >
                      ← Back to role selection
                    </button>

                    <div className="mt-8 p-4 bg-afrihealth-gray-800/50 rounded-lg border border-afrihealth-gray-700">
                      <p className="text-xs text-afrihealth-gray-400 text-center font-mono">
                        💡 Make sure to add Hedera network in your wallet:<br />
                        Network: Hedera Testnet | Chain ID: 296 | RPC: https://testnet.hashio.io/api
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
