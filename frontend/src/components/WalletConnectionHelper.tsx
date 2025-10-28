import { AlertCircle, Download, Wifi } from "lucide-react";

interface WalletConnectionHelperProps {
  onConnectExtension?: () => void;
  onRetryModal?: () => void;
  isConnecting?: boolean;
}

/**
 * Helper component to display connection options and troubleshooting
 */
export function WalletConnectionHelper({
  onConnectExtension,
  onRetryModal,
  isConnecting = false,
}: WalletConnectionHelperProps) {
  return (
    <div className="bg-afrihealth-gray-900 border border-afrihealth-teal/20 rounded-lg p-6 max-w-md mx-auto">
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle className="w-5 h-5 text-afrihealth-orange mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Connection Options
          </h3>
          <p className="text-sm text-afrihealth-gray-200 mb-4">
            WalletConnect relay may be blocked by your network. Choose an option
            below:
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Option 1: HashPack Extension */}
        <div className="bg-afrihealth-gray-800 rounded-lg p-4 border border-afrihealth-teal/10">
          <div className="flex items-center gap-2 mb-2">
            <Download className="w-4 h-4 text-afrihealth-teal" />
            <h4 className="font-medium text-white">
              HashPack Extension (Recommended)
            </h4>
          </div>
          <p className="text-sm text-afrihealth-gray-300 mb-3">
            Direct connection without requiring WalletConnect relay
          </p>
          {onConnectExtension && (
            <button
              onClick={onConnectExtension}
              disabled={isConnecting}
              className="w-full py-2 px-4 bg-afrihealth-teal hover:bg-afrihealth-teal/80 disabled:bg-afrihealth-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
            >
              {isConnecting ? "Connecting..." : "Connect HashPack Extension"}
            </button>
          )}
        </div>

        {/* Option 2: WalletConnect Modal */}
        <div className="bg-afrihealth-gray-800 rounded-lg p-4 border border-afrihealth-teal/10">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="w-4 h-4 text-afrihealth-orange" />
            <h4 className="font-medium text-white">WalletConnect Modal</h4>
          </div>
          <p className="text-sm text-afrihealth-gray-300 mb-3">
            Requires network access to relay.walletconnect.com
          </p>
          {onRetryModal && (
            <button
              onClick={onRetryModal}
              disabled={isConnecting}
              className="w-full py-2 px-4 bg-afrihealth-gray-700 hover:bg-afrihealth-gray-600 disabled:bg-afrihealth-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
            >
              {isConnecting ? "Connecting..." : "Try WalletConnect Modal"}
            </button>
          )}
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="mt-4 pt-4 border-t border-afrihealth-gray-700">
        <p className="text-xs text-afrihealth-gray-400 mb-2">
          <strong>Troubleshooting:</strong>
        </p>
        <ul className="text-xs text-afrihealth-gray-400 space-y-1 list-disc list-inside">
          <li>
            Install HashPack from{" "}
            <a
              href="https://www.hashpack.app/download"
              target="_blank"
              rel="noopener noreferrer"
              className="text-afrihealth-teal hover:underline"
            >
              hashpack.app
            </a>
          </li>
          <li>Check if VPN/firewall is blocking WebSocket connections</li>
          <li>Try from a different network (e.g., mobile hotspot)</li>
          <li>Ensure DNS can resolve relay.walletconnect.com</li>
        </ul>
      </div>
    </div>
  );
}
