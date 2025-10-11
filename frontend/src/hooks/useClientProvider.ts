// exportinterface WalletEvent {
//   name: string;
//   data: {
//     topic?: string;
//     [key: string]: unknown;
//   };
// }

// export interface DAppConnectorWithEvents extends DAppConnector {
//   events$?: {
//     subscribe: (callback: (event: WalletEvent) => void) => { unsubscribe: () => void };
//   };
// }

// type DAppConnectorContext = {
//   dAppConnector: DAppConnector | null;
//   userAccountId: string | null;
//   sessionTopic: string | null;
//   disconnect: (() => Promise<void>) | null;
//   refresh: (() => void) | null;
// };

// const DAppConnectorContext = createContext<DAppConnectorContext | null>(null);
// export const useDAppConnector = () => useContext(DAppConnectorContext);
