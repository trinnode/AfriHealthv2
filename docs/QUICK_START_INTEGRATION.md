# 🚀 Quick Start: Contract Integration Guide

## 🎯 IMMEDIATE GOAL
Connect your beautiful React frontend to your Solidity smart contracts on Hedera.

---

## ✅ WHAT YOU NEED TO DO (5 Steps)

### Step 1: Compile & Deploy Contracts ⛓️

```bash
# Navigate to contracts directory
cd /home/trinnex/Developments/Hedera/contracts

# Compile contracts (generates ABIs)
forge build

# Deploy to Hedera testnet
forge script script/DeployAfriHealth.s.sol \
  --rpc-url https://testnet.hashio.io/api \
  --broadcast \
  --legacy

# Save the Diamond proxy address from deployment output
# Example: 0x1234567890abcdef1234567890abcdef12345678
```

**Output:** You'll get contract ABIs in `contracts/out/` and a deployed Diamond address.

---

### Step 2: Copy ABIs to Frontend 📋

```bash
# Create contracts directory in frontend
mkdir -p /home/trinnex/Developments/Hedera/frontend/src/contracts/abi

# Copy all ABI files
cp contracts/out/Diamond.sol/Diamond.json \
   frontend/src/contracts/abi/

cp contracts/out/IdentityFacet.sol/IdentityFacet.json \
   frontend/src/contracts/abi/

cp contracts/out/ConsentFacet.sol/ConsentFacet.json \
   frontend/src/contracts/abi/

cp contracts/out/RecordsRegistryFacet.sol/RecordsRegistryFacet.json \
   frontend/src/contracts/abi/

cp contracts/out/BillingFacet.sol/BillingFacet.json \
   frontend/src/contracts/abi/

# ... copy all other facets
```

**Tip:** Create a script to automate this:
```bash
#!/bin/bash
# scripts/copy-abis.sh
for file in contracts/out/**/*.json; do
  cp "$file" frontend/src/contracts/abi/
done
```

---

### Step 3: Create Contract Service Layer 🛠️

#### 3a. Add Environment Variables

**File:** `frontend/.env.local`
```bash
# Hedera Network
REACT_APP_HEDERA_NETWORK=testnet
REACT_APP_HEDERA_RPC=https://testnet.hashio.io/api

# Diamond Contract Address (from Step 1 deployment)
REACT_APP_DIAMOND_ADDRESS=0x1234567890abcdef1234567890abcdef12345678

# Optional: Hedera SDK credentials
REACT_APP_OPERATOR_ID=0.0.123456
REACT_APP_OPERATOR_KEY=302e...
```

#### 3b. Create Diamond Service

**File:** `frontend/src/contracts/services/diamondService.ts`
```typescript
import { ethers } from 'ethers';
import DiamondABI from '../abi/Diamond.json';

export class DiamondService {
  private contract: ethers.Contract;
  private signer: ethers.Signer | null = null;

  constructor(provider: ethers.providers.Provider, signerOrProvider?: ethers.Signer) {
    const diamondAddress = process.env.REACT_APP_DIAMOND_ADDRESS!;
    this.contract = new ethers.Contract(
      diamondAddress,
      DiamondABI.abi,
      signerOrProvider || provider
    );
    if (signerOrProvider) {
      this.signer = signerOrProvider;
    }
  }

  // Set signer after wallet connection
  setSigner(signer: ethers.Signer) {
    this.signer = signer;
    this.contract = this.contract.connect(signer);
  }

  // Get contract instance for facet calls
  getContract() {
    return this.contract;
  }

  // Get provider
  getProvider() {
    return this.contract.provider;
  }
}

// Singleton instance
let diamondService: DiamondService | null = null;

export function initializeDiamondService(
  provider: ethers.providers.Provider,
  signer?: ethers.Signer
) {
  diamondService = new DiamondService(provider, signer);
  return diamondService;
}

export function getDiamondService(): DiamondService {
  if (!diamondService) {
    throw new Error('DiamondService not initialized. Call initializeDiamondService first.');
  }
  return diamondService;
}
```

#### 3c. Create Identity Service (Example)

**File:** `frontend/src/contracts/services/identityService.ts`
```typescript
import { ethers } from 'ethers';
import IdentityFacetABI from '../abi/IdentityFacet.json';
import { getDiamondService } from './diamondService';

export class IdentityService {
  private getContract() {
    const diamond = getDiamondService();
    return new ethers.Contract(
      diamond.getContract().address,
      IdentityFacetABI.abi,
      diamond.getContract().signer || diamond.getProvider()
    );
  }

  // Register identity
  async registerIdentity(
    identityType: string,
    identityData: string, // hash
    metadata: string
  ): Promise<ethers.ContractTransaction> {
    const contract = this.getContract();
    const tx = await contract.registerIdentity(identityType, identityData, metadata);
    return tx;
  }

  // Get identity
  async getIdentity(account: string) {
    const contract = this.getContract();
    const result = await contract.getIdentity(account);
    return {
      identityType: result.identityType,
      identityHash: result.identityHash,
      metadata: result.metadata,
      registeredAt: result.registeredAt.toNumber()
    };
  }

  // Verify provider
  async verifyProvider(
    provider: string,
    licenseNumber: string,
    specialty: string,
    verificationData: string
  ): Promise<ethers.ContractTransaction> {
    const contract = this.getContract();
    const tx = await contract.verifyProvider(
      provider,
      licenseNumber,
      specialty,
      verificationData
    );
    return tx;
  }

  // Check if provider is verified
  async isProviderVerified(provider: string): Promise<boolean> {
    const contract = this.getContract();
    return await contract.isProviderVerified(provider);
  }
}

// Singleton
let identityService: IdentityService | null = null;

export function getIdentityService(): IdentityService {
  if (!identityService) {
    identityService = new IdentityService();
  }
  return identityService;
}
```

---

### Step 4: Create Transaction Management 🔄

**File:** `frontend/src/stores/transactionStore.ts`
```typescript
import { create } from 'zustand';
import { ethers } from 'ethers';

export interface Transaction {
  id: string;
  hash?: string;
  status: 'pending' | 'confirming' | 'confirmed' | 'failed';
  type: string;
  description: string;
  timestamp: number;
  error?: string;
}

interface TransactionStore {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => string;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  getTransaction: (id: string) => Transaction | undefined;
  clearTransactions: () => void;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],

  addTransaction: (tx) => {
    const id = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTx: Transaction = {
      ...tx,
      id,
      timestamp: Date.now(),
    };
    set((state) => ({
      transactions: [newTx, ...state.transactions],
    }));
    return id;
  },

  updateTransaction: (id, updates) => {
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.id === id ? { ...tx, ...updates } : tx
      ),
    }));
  },

  getTransaction: (id) => {
    return get().transactions.find((tx) => tx.id === id);
  },

  clearTransactions: () => {
    set({ transactions: [] });
  },
}));
```

**File:** `frontend/src/hooks/useTransaction.ts`
```typescript
import { useState } from 'react';
import { ethers } from 'ethers';
import { useTransactionStore } from '../stores/transactionStore';

export function useTransaction() {
  const { addTransaction, updateTransaction } = useTransactionStore();
  const [isLoading, setIsLoading] = useState(false);

  const executeTransaction = async <T extends ethers.ContractTransaction>(
    txPromise: Promise<T>,
    description: string,
    type: string
  ): Promise<T | null> => {
    setIsLoading(true);
    const txId = addTransaction({
      status: 'pending',
      type,
      description,
    });

    try {
      // Wait for transaction to be sent
      const tx = await txPromise;
      
      updateTransaction(txId, {
        hash: tx.hash,
        status: 'confirming',
      });

      // Wait for confirmation
      const receipt = await tx.wait();

      updateTransaction(txId, {
        status: 'confirmed',
      });

      setIsLoading(false);
      return tx;
    } catch (error: any) {
      updateTransaction(txId, {
        status: 'failed',
        error: error.message || 'Transaction failed',
      });
      setIsLoading(false);
      throw error;
    }
  };

  return {
    executeTransaction,
    isLoading,
  };
}
```

---

### Step 5: Use in Your Components 🎨

**Example:** Identity Registration Component

**File:** `frontend/src/components/IdentityRegistration.tsx`
```typescript
import { useState } from 'react';
import { ethers } from 'ethers';
import { Button, Input } from './UI';
import { getIdentityService } from '../contracts/services/identityService';
import { useTransaction } from '../hooks/useTransaction';
import { useWalletStore } from '../stores';

export function IdentityRegistration() {
  const { accountId } = useWalletStore();
  const { executeTransaction, isLoading } = useTransaction();
  const [identityType, setIdentityType] = useState('patient');
  const [metadata, setMetadata] = useState('');

  const handleRegister = async () => {
    try {
      const identityService = getIdentityService();
      
      // Generate hash of identity data (in real app, this would be KYC docs)
      const identityData = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(JSON.stringify({ accountId, metadata }))
      );

      // Execute transaction
      await executeTransaction(
        identityService.registerIdentity(identityType, identityData, metadata),
        `Register ${identityType} identity`,
        'IDENTITY_REGISTRATION'
      );

      alert('Identity registered successfully!');
    } catch (error) {
      console.error('Failed to register identity:', error);
      alert('Failed to register identity. See console for details.');
    }
  };

  return (
    <div className="p-6 bg-gray-900 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Register Identity</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block mb-2">Identity Type</label>
          <select
            value={identityType}
            onChange={(e) => setIdentityType(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded"
          >
            <option value="patient">Patient</option>
            <option value="provider">Healthcare Provider</option>
            <option value="insurer">Insurance Company</option>
          </select>
        </div>

        <Input
          label="Metadata"
          value={metadata}
          onChange={(e) => setMetadata(e.target.value)}
          placeholder="Additional information..."
        />

        <Button
          variant="primary"
          onClick={handleRegister}
          loading={isLoading}
          disabled={!accountId}
        >
          {isLoading ? 'Registering...' : 'Register Identity'}
        </Button>

        {!accountId && (
          <p className="text-red-500 text-sm">
            Please connect your wallet first
          </p>
        )}
      </div>
    </div>
  );
}
```

---

## 🎯 TESTING YOUR INTEGRATION

### 1. Initialize Services on App Load

**File:** `frontend/src/App.tsx` (add to useEffect)
```typescript
import { ethers } from 'ethers';
import { initializeDiamondService } from './contracts/services/diamondService';

useEffect(() => {
  // Initialize provider
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.REACT_APP_HEDERA_RPC
  );

  // Initialize Diamond service
  initializeDiamondService(provider);

  // When wallet connects, update signer
  walletService.on('connected', (accountId) => {
    const signer = walletService.getSigner();
    if (signer) {
      const diamondService = getDiamondService();
      diamondService.setSigner(signer);
    }
  });
}, []);
```

### 2. Test Contract Read

```typescript
// In a component
const identityService = getIdentityService();
const identity = await identityService.getIdentity(accountId);
console.log('Identity:', identity);
```

### 3. Test Contract Write

```typescript
// In a component with transaction hook
const { executeTransaction } = useTransaction();
await executeTransaction(
  identityService.registerIdentity('patient', dataHash, metadata),
  'Register identity',
  'IDENTITY_REG'
);
```

---

## 🐛 COMMON ISSUES & FIXES

### Issue 1: "Cannot read property 'address' of undefined"
**Cause:** Diamond service not initialized  
**Fix:** Call `initializeDiamondService()` in App.tsx useEffect

### Issue 2: "Transaction reverted"
**Cause:** Missing permissions or invalid data  
**Fix:** Check if wallet is connected and has correct role in contract

### Issue 3: "Network error"
**Cause:** Wrong RPC URL or network mismatch  
**Fix:** Verify `.env.local` has correct Hedera testnet RPC

### Issue 4: ABI not found
**Cause:** ABIs not copied from contracts/out  
**Fix:** Run `npm run copy-abis` or manually copy JSON files

---

## 📚 NEXT STEPS AFTER INTEGRATION

Once you have the basic integration working:

1. ✅ **Add more service layers** (consent, records, billing)
2. ✅ **Replace mock data** with real contract calls
3. ✅ **Add transaction notifications** (toast messages)
4. ✅ **Implement error handling** (user-friendly messages)
5. ✅ **Add loading states** (skeletons, spinners)
6. ✅ **Implement caching** (React Query for reads)
7. ✅ **Add transaction history** (display past transactions)

---

## 🚀 SUMMARY

**5 Simple Steps:**
1. ✅ Compile & deploy contracts → Get ABIs and Diamond address
2. ✅ Copy ABIs to frontend → Make contract interfaces available
3. ✅ Create service layer → Wrap contract calls in TypeScript
4. ✅ Add transaction management → Handle TX state and errors
5. ✅ Use in components → Connect UI to blockchain

**Time to Complete:** 1-2 days for basic integration

**Result:** Your frontend can now talk to your smart contracts! 🎉

---

**Ready?** Start with Step 1: Deploy your contracts! 🚀
