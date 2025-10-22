
import {useEffect, useState, useCallback, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    HederaSessionEvent,
    HederaJsonRpcMethod,
    DAppConnector,
    HederaChainId,
} from '@hashgraph/hedera-wallet-connect';
import { LedgerId } from '@hashgraph/sdk';
import { useToast } from '../components/ui/Toast';
import type { ProviderProps } from '../types';
import { DAppConnectorContext } from './useDappConnector';




const PROJECT_ID = '674996b2b13d42d667d90efc2d106d48';
const queryClient = new QueryClient();

const metadata = {
    name: 'AfriHealth',
    description: 'A Decentralized healthcare system that empowers you with control over your health data, providing a secure, transparent blockchain platform for healthcare management and billing.',
    url: '',
    icons: ['https://res.cloudinary.com/depwujqik/image/upload/v1759023580/AFRIHEALTH-_csktai.png'],
};



export function ClientProviders({ children }: ProviderProps) {
    const { showToast } = useToast()
    const [dAppConnector, setDAppConnector] = useState<DAppConnector | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [userAccountId, setUserAccountId] = useState<string | null>(null);
    const [sessionTopic, setSessionTopic] = useState<string | null>(null);

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

        setUserAccountId(dAppConnector.signers?.[0]?.getAccountId().toString() ?? null);
        if (dAppConnector.signers?.[0]?.topic) setSessionTopic(dAppConnector.signers[0].topic);
        return () => subscription && subscription.unsubscribe();
    }, [dAppConnector]);

    const disconnect = useCallback(async () => {
        if (dAppConnector && sessionTopic) {
            showToast({ title: "Trying to connect wallet. please wait", type: `info` });
            await dAppConnector.disconnect(sessionTopic);
            setUserAccountId(null);
            setSessionTopic(null);
        }
    }, [dAppConnector, sessionTopic, showToast]);

    const refresh = useCallback(() => {
        if (dAppConnector) {
            setUserAccountId(dAppConnector.signers?.[0]?.getAccountId().toString() ?? null);
            setSessionTopic(dAppConnector.signers?.[0]?.topic ?? null);
        }
    }, [dAppConnector]);

    const connect = useCallback(async () => {
        if (dAppConnector) {
            await dAppConnector.openModal();
            refresh();
        }
    }, [dAppConnector, refresh]);

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            try {
                const connector = new DAppConnector(
                    metadata,
                    LedgerId.TESTNET,
                    PROJECT_ID,
                    Object.values(HederaJsonRpcMethod),
                    [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
                    [HederaChainId.Mainnet, HederaChainId.Testnet],
                );
                await connector.init();
                if (isMounted) {
                    setDAppConnector(connector);
                    setIsReady(true);
                }
            } catch (error) {
                console.error('Failed to initialize connector:', error);
            }
        };

        init();

        return () => {
            isMounted = false;
        };
    }, []);

    const value = useMemo(() => ({
        dAppConnector,
        userAccountId,
        sessionTopic,
        disconnect,
        refresh,
        connect,
    }), [dAppConnector, userAccountId, sessionTopic, disconnect, refresh, connect]);

    if (!isReady)
        return (
            <div style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>
                Loading ...
            </div>
        );

    return (
        <DAppConnectorContext.Provider value={value}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </DAppConnectorContext.Provider>
    );
}