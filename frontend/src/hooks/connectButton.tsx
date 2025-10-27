import { useDAppConnector } from '../providers/clientProvider';

export function WalletButton() {
  const { dAppConnector, userAccountId, disconnect, refresh } = useDAppConnector() ?? {};

  const handleLogin = async () => {
    if (dAppConnector) {
      await dAppConnector.openModal();
      if (refresh) refresh();
    }
  };

  const handleDisconnect = () => {
    if (disconnect) {
      void disconnect();
    }
  };

  if (!userAccountId) {
    return (
      <button disabled={!dAppConnector} onClick={handleLogin}
        className="px-6 py-2 bg-hedera-purple hover:bg-opacity-90 text-primary dark:text-white dark:bg-[#00D74E] dark:hover:bg-green-800 hover:scale-105 font-semibold rounded-full transition-all duration-300 hover-scale border-2 border-hedera-purple hover:border-neon-accent"
        >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="px-3 py-1 bg-neon-accent/10 text-neon-accent rounded-full text-sm border border-neon-accent/30">
        {`${userAccountId.slice(0, 4)}...${userAccountId.slice(-3)}`}
      </div>
      <button onClick={handleDisconnect} disabled={!dAppConnector}
        className="px-4 py-2 hover:scale-105 bg-red-400 text-white dark:hover:bg-error/20   hover:text-error font-medium rounded-full transition-all duration-300 text-sm">
        Disconnect
      </button>
    </div>
  );
}