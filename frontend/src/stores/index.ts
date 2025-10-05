import { create } from "zustand";
import type { WalletState } from "../services/walletService";

/**
 * Wallet Store
 */
interface WalletStore extends WalletState {
  setConnected: (accountId: string, network: string) => void;
  setDisconnected: () => void;
  setPairingString: (pairingString: string) => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
  isConnected: false,
  accountId: null,
  network: null,
  topic: null,
  pairingString: null,

  setConnected: (accountId: string, network: string) =>
    set({ isConnected: true, accountId, network }),

  setDisconnected: () =>
    set({ isConnected: false, accountId: null, network: null }),

  setPairingString: (pairingString: string) => set({ pairingString }),
}));

/**
 * UI Store
 */
interface UIStore {
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (message: string | null) => void;
  clearMessages: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isLoading: false,
  error: null,
  successMessage: null,

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  setSuccess: (message: string | null) => set({ successMessage: message }),
  clearMessages: () => set({ error: null, successMessage: null }),
}));

/**
 * Consent Store
 */
interface ConsentData {
  id: string;
  patientId: string;
  providerId: string;
  scope: string[];
  expiresAt: number;
  status: "active" | "revoked" | "expired";
  createdAt: number;
}

interface ConsentStore {
  consents: ConsentData[];
  addConsent: (consent: ConsentData) => void;
  updateConsent: (id: string, updates: Partial<ConsentData>) => void;
  removeConsent: (id: string) => void;
  getConsent: (id: string) => ConsentData | undefined;
}

export const useConsentStore = create<ConsentStore>((set, get) => ({
  consents: [],

  addConsent: (consent) =>
    set((state) => ({ consents: [...state.consents, consent] })),

  updateConsent: (id, updates) =>
    set((state) => ({
      consents: state.consents.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  removeConsent: (id) =>
    set((state) => ({
      consents: state.consents.filter((c) => c.id !== id),
    })),

  getConsent: (id) => get().consents.find((c) => c.id === id),
}));

/**
 * Billing Store
 */
interface BillData {
  id: string;
  patientId: string;
  providerId: string;
  amount: number;
  items: Array<{ description: string; amount: number }>;
  status: "pending" | "approved" | "paid" | "rejected";
  createdAt: number;
  paidAt?: number;
}

interface BillingStore {
  bills: BillData[];
  addBill: (bill: BillData) => void;
  updateBill: (id: string, updates: Partial<BillData>) => void;
  getBill: (id: string) => BillData | undefined;
  getPatientBills: (patientId: string) => BillData[];
}

export const useBillingStore = create<BillingStore>((set, get) => ({
  bills: [],

  addBill: (bill) => set((state) => ({ bills: [...state.bills, bill] })),

  updateBill: (id, updates) =>
    set((state) => ({
      bills: state.bills.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),

  getBill: (id) => get().bills.find((b) => b.id === id),

  getPatientBills: (patientId) =>
    get().bills.filter((b) => b.patientId === patientId),
}));
