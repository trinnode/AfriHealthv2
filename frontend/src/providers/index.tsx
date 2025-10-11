
import {type ReactNode, useEffect, useState, createContext, useContext } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  HederaSessionEvent,
  HederaJsonRpcMethod,
  DAppConnector,
  HederaChainId,
} from '@hashgraph/hedera-wallet-connect';
import { LedgerId } from '@hashgraph/sdk';


interface WalletEvent {
  name: string;
  data: {
    topic?: string;
    [key: string]: unknown;
  };
}

interface DAppConnectorWithEvents extends DAppConnector {
  events$?: {
    subscribe: (callback: (event: WalletEvent) => void) => { unsubscribe: () => void };
  };
}

const projectId = '674996b2b13d42d667d90efc2d106d48';
const queryClient = new QueryClient();

const metadata = {
  name: 'AfriHealth',
  description: 'A Decentralized healthcare system that empowers you with control over your health data, providing a secure, transparent blockchain platform for healthcare management and billing.',
  url: '',
  icons: ['https://res.cloudinary.com/depwujqik/image/upload/v1759023580/AFRIHEALTH-_csktai.png'],
};

type DAppConnectorContext = {
  dAppConnector: DAppConnector | null;
  userAccountId: string | null;
  sessionTopic: string | null;
  disconnect: (() => Promise<void>) | null;
  refresh: (() => void) | null;
};

const DAppConnectorContext = createContext<DAppConnectorContext | null>(null);
export const useDAppConnector = () => useContext(DAppConnectorContext);

type ClientProvidersProps = {
  children: ReactNode;
};

export function ClientProviders({ children }: ClientProvidersProps) {
  const [dAppConnector, setDAppConnector] = useState<DAppConnector | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [userAccountId, setUserAccountId] = useState<string | null>(null);
  const [sessionTopic, setSessionTopic] = useState<string | null>(null);

  // Listen for account/session changes using events$
  useEffect(() => {
    if (!dAppConnector) return;


    const connectorWithEvents = dAppConnector as DAppConnectorWithEvents;
    const subscription = connectorWithEvents.events$?.subscribe((event: WalletEvent) => {
      if (event.name === 'accountsChanged' || event.name === 'chainChanged') {
        setUserAccountId(dAppConnector.signers?.[0]?.getAccountId().toString() ?? null);

        if (event.data && event.data.topic) {
          setSessionTopic(event.data.topic);
        } else if (dAppConnector.signers?.[0]?.topic) {
          setSessionTopic(dAppConnector.signers[0].topic);
        } else {
          setSessionTopic(null);
        }
      } else if (event.name === 'session_delete' || event.name === 'sessionDelete') {
        setUserAccountId(null);
        setSessionTopic(null);
      }
    });

    // Set initial state
    setUserAccountId(dAppConnector.signers?.[0]?.getAccountId().toString() ?? null);
    if (dAppConnector.signers?.[0]?.topic) setSessionTopic(dAppConnector.signers[0].topic);
    return () => subscription && subscription.unsubscribe();
  }, [dAppConnector]);

  // Provide a disconnect function
  const disconnect = async () => {
    if (dAppConnector && sessionTopic) {
      await dAppConnector.disconnect(sessionTopic);
      setUserAccountId(null);
      setSessionTopic(null);
    }
  };

  const refresh = () => {
    if (dAppConnector) {
      setUserAccountId(dAppConnector.signers?.[0]?.getAccountId().toString() ?? null);
      setSessionTopic(dAppConnector.signers?.[0]?.topic ?? null);
    }
    };
    async function connect() {
      const connector = new DAppConnector(
        metadata,
        LedgerId.TESTNET,
        projectId,
        Object.values(HederaJsonRpcMethod),
        [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
        [HederaChainId.Mainnet, HederaChainId.Testnet],
      );
      await connector.init();
      if (isMounted) {
        setDAppConnector(connector);
        setIsReady(true);
      }
    }
  useEffect(() => {
    let isMounted = true;
    async function init() {
      const connector = new DAppConnector(
        metadata,
        LedgerId.TESTNET,
        projectId,
        Object.values(HederaJsonRpcMethod),
        [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
        [HederaChainId.Mainnet, HederaChainId.Testnet],
      );
      await connector.init();
      if (isMounted) {
        setDAppConnector(connector);
        setIsReady(true);
      }
    }
    init().catch(console.log);
    return () => {
      isMounted = false;
    };
  }, []);

  if (!isReady)
    return (
      <div style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>
        Loading wallet...
      </div>
    );

  return (
    <DAppConnectorContext.Provider value={{ dAppConnector, userAccountId, sessionTopic, disconnect, refresh }}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </DAppConnectorContext.Provider>
  );
}
