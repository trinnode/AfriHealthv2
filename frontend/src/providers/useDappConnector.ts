import { createContext, useContext } from "react";
import type { DAppConnectorContextProps } from "../types";

export const DAppConnectorContext = createContext<DAppConnectorContextProps | null>(null);
export const useDAppConnector = () => useContext(DAppConnectorContext);
