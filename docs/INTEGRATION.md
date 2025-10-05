# 🔗 AfriHealth Ledger Integration Guide

This document provides comprehensive guidance for integrating the AfriHealth Ledger platform with external systems, EHR providers, and healthcare applications.

## 📋 Table of Contents

1. [API Integration](#api-integration)
2. [Smart Contract Integration](#smart-contract-integration)
3. [Hedera SDK Integration](#hedera-sdk-integration)
4. [EHR System Integration](#ehr-system-integration)
5. [Payment Gateway Integration](#payment-gateway-integration)
6. [Insurance System Integration](#insurance-system-integration)
7. [Mobile App Integration](#mobile-app-integration)
8. [Testing Integration](#testing-integration)

## 🚀 API Integration

### Base URL Configuration

```typescript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.afrihealth.io' 
  : 'http://localhost:3001';

// Configure API client
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${your_jwt_token}`
  }
});
```

### Authentication Flow

```typescript
// 1. Connect Hedera wallet
const connectWallet = async () => {
  if (window.hashconnect) {
    const { accountId, publicKey } = await window.hashconnect.connect();
    return { accountId, publicKey };
  }
  throw new Error('HashPack wallet not available');
};

// 2. Authenticate with backend
const authenticateUser = async (accountId: string, signature: string) => {
  const response = await apiClient.post('/auth/wallet', {
    address: accountId,
    signature,
    message: 'Authenticate to AfriHealth Ledger'
  });
  
  return response.data.data.token;
};

// 3. Use authenticated requests
const getPatientData = async (token: string) => {
  const response = await apiClient.get('/patient/consents/0.0.12345', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.data;
};
```

### Error Handling

```typescript
import { ApiError } from './types/api';

const handleApiError = (error: any): ApiError => {
  if (error.response) {
    // Server responded with error status
    return {
      status: error.response.status,
      message: error.response.data.error || 'Server error',
      details: error.response.data.details
    };
  } else if (error.request) {
    // Network error
    return {
      status: 0,
      message: 'Network error - please check your connection',
      details: null
    };
  } else {
    // Other error
    return {
      status: 500,
      message: error.message || 'Unknown error',
      details: null
    };
  }
};
```

## 🔗 Smart Contract Integration

### Contract Addresses

```typescript
export const CONTRACT_ADDRESSES = {
  testnet: {
    diamond: '0.0.12345',
    platformCredit: '0.0.12346',
    insurancePool: '0.0.12347',
    reputationNFT: '0.0.12348'
  },
  mainnet: {
    diamond: '0.0.56789',
    platformCredit: '0.0.56790',
    insurancePool: '0.0.56791',
    reputationNFT: '0.0.56792'
  }
};
```

### Contract Interaction Examples

```typescript
import { 
  Client, 
  ContractExecuteTransaction, 
  ContractCallQuery,
  ContractId,
  PrivateKey,
  AccountId
} from '@hashgraph/sdk';

// Initialize Hedera client
const client = Client.forTestnet();
client.setOperator(
  AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
  PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!)
);

// Create consent request
const createConsentRequest = async (
  patientAddress: string,
  scopes: string[],
  expiresAt: number
) => {
  const contractId = ContractId.fromString(CONTRACT_ADDRESSES.testnet.diamond);
  
  const transaction = new ContractExecuteTransaction()
    .setContractId(contractId)
    .setFunction('requestConsent', 
      new ContractFunctionParameters()
        .addAddress(patientAddress)
        .addAddressArray(scopes)
        .addUint256(expiresAt)
        .addString('Medical consultation')
    )
    .setGas(150000);
    
  const response = await transaction.execute(client);
  const receipt = await response.getReceipt(client);
  
  return receipt;
};

// Query patient consents
const getPatientConsents = async (patientAddress: string) => {
  const contractId = ContractId.fromString(CONTRACT_ADDRESSES.testnet.diamond);
  
  const query = new ContractCallQuery()
    .setContractId(contractId)
    .setFunction('getPatientConsents',
      new ContractFunctionParameters()
        .addAddress(patientAddress)
    )
    .setGas(100000);
    
  const result = await query.execute(client);
  return result;
};
```

## 💼 EHR System Integration

### HL7 FHIR Integration

```typescript
interface FHIRPatient {
  resourceType: 'Patient';
  id: string;
  identifier: Array<{
    system: string;
    value: string;
  }>;
  name: Array<{
    family: string;
    given: string[];
  }>;
  telecom: Array<{
    system: 'phone' | 'email';
    value: string;
  }>;
  address: Array<{
    line: string[];
    city: string;
    country: string;
  }>;
  birthDate: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
}

class EHRSyncService {
  private apiClient: AxiosInstance;
  
  constructor(baseURL: string) {
    this.apiClient = axios.create({
      baseURL,
      headers: { 'Content-Type': 'application/fhir+json' }
    });
  }
  
  async syncPatientToBlockchain(fhirPatient: FHIRPatient): Promise<string> {
    // Convert FHIR patient to blockchain format
    const blockchainPatient = this.convertFHIRToBlockchain(fhirPatient);
    
    // Create patient record on blockchain
    const response = await this.apiClient.post('/patient/register', blockchainPatient);
    
    return response.data.blockchainId;
  }
  
  async getPatientFromBlockchain(blockchainId: string): Promise<FHIRPatient> {
    const response = await this.apiClient.get(`/patient/${blockchainId}`);
    return this.convertBlockchainToFHIR(response.data);
  }
  
  private convertFHIRToBlockchain(fhirPatient: FHIRPatient): any {
    return {
      id: fhirPatient.id,
      name: `${fhirPatient.name[0]?.given?.[0]} ${fhirPatient.name[0]?.family}`,
      email: fhirPatient.telecom?.find(t => t.system === 'email')?.value,
      phone: fhirPatient.telecom?.find(t => t.system === 'phone')?.value,
      dateOfBirth: fhirPatient.birthDate,
      gender: fhirPatient.gender,
      address: fhirPatient.address?.[0] ? {
        street: fhirPatient.address[0].line?.[0],
        city: fhirPatient.address[0].city,
        country: fhirPatient.address[0].country
      } : undefined
    };
  }
  
  private convertBlockchainToFHIR(blockchainPatient: any): FHIRPatient {
    return {
      resourceType: 'Patient',
      id: blockchainPatient.id,
      identifier: [{
        system: 'https://afrihealth.io/blockchain',
        value: blockchainPatient.blockchainId
      }],
      name: [{
        family: blockchainPatient.lastName,
        given: [blockchainPatient.firstName]
      }],
      telecom: [
        ...(blockchainPatient.email ? [{ system: 'email' as const, value: blockchainPatient.email }] : []),
        ...(blockchainPatient.phone ? [{ system: 'phone' as const, value: blockchainPatient.phone }] : [])
      ],
      birthDate: blockchainPatient.dateOfBirth,
      gender: blockchainPatient.gender
    };
  }
}
```

### Real-time Data Synchronization

```typescript
class RealTimeSyncService {
  private eventSource: EventSource;
  private subscribers: Map<string, Function[]> = new Map();
  
  constructor(apiBaseURL: string) {
    this.eventSource = new EventSource(`${apiBaseURL}/events`);
    
    this.eventSource.addEventListener('patient_updated', (event) => {
      const patientData = JSON.parse(event.data);
      this.notifySubscribers('patient_updated', patientData);
    });
    
    this.eventSource.addEventListener('consent_granted', (event) => {
      const consentData = JSON.parse(event.data);
      this.notifySubscribers('consent_granted', consentData);
    });
    
    this.eventSource.addEventListener('invoice_approved', (event) => {
      const invoiceData = JSON.parse(event.data);
      this.notifySubscribers('invoice_approved', invoiceData);
    });
  }
  
  subscribe(eventType: string, callback: Function): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    
    this.subscribers.get(eventType)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(eventType) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }
  
  private notifySubscribers(eventType: string, data: any) {
    const callbacks = this.subscribers.get(eventType) || [];
    callbacks.forEach(callback => callback(data));
  }
}
```

## 💳 Payment Gateway Integration

### Stripe Integration

```typescript
import { loadStripe } from '@stripe/stripe-js';

class PaymentService {
  private stripe: any;
  
  constructor() {
    this.initializeStripe();
  }
  
  private async initializeStripe() {
    this.stripe = await loadStripe(process.env.STRIPE_PUBLISHABLE_KEY!);
  }
  
  async processPayment(invoiceId: string, amount: number, currency: string) {
    try {
      // Create payment intent on backend
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, amount, currency })
      });
      
      const { clientSecret } = await response.json();
      
      // Confirm payment with Stripe
      const result = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: this.cardElement,
          billing_details: { name: 'Patient Name' }
        }
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      return result.paymentIntent;
    } catch (error) {
      console.error('Payment failed:', error);
      throw error;
    }
  }
}
```

### HBAR Payment Integration

```typescript
class HBARPaymentService {
  async payWithHBAR(
    recipientAddress: string,
    amount: number,
    memo: string
  ): Promise<TransactionResponse> {
    const client = this.getHederaClient();
    
    const transaction = new TransferTransaction()
      .addHbarTransfer(
        AccountId.fromString(process.env.WALLET_ACCOUNT_ID!),
        Hbar.fromTinybars(-amount) // Negative for sender
      )
      .addHbarTransfer(
        AccountId.fromString(recipientAddress),
        Hbar.fromTinybars(amount) // Positive for recipient
      )
      .setTransactionMemo(memo);
      
    return await transaction.execute(client);
  }
  
  async getAccountBalance(accountId: string): Promise<Hbar> {
    const client = this.getHederaClient();
    const query = new AccountBalanceQuery()
      .setAccountId(AccountId.fromString(accountId));
      
    const balance = await query.execute(client);
    return balance.hbars;
  }
}
```

## 🏥 Insurance System Integration

### Claims Processing Integration

```typescript
interface InsuranceClaim {
  claimId: string;
  patientId: string;
  providerId: string;
  diagnosis: string;
  procedureCodes: string[];
  claimAmount: number;
  supportingDocuments: string[];
  blockchainHash: string;
}

class ClaimsIntegrationService {
  async submitClaimToInsurance(claim: InsuranceClaim): Promise<string> {
    // 1. Validate claim data
    this.validateClaim(claim);
    
    // 2. Submit to blockchain
    const blockchainResult = await this.submitToBlockchain(claim);
    
    // 3. Submit to traditional insurance
    const insuranceResult = await this.submitToInsurance(claim);
    
    // 4. Return tracking ID
    return `${blockchainResult.transactionId}-${insuranceResult.claimNumber}`;
  }
  
  async trackClaimStatus(claimId: string): Promise<ClaimStatus> {
    // Query blockchain for claim status
    const blockchainStatus = await this.getBlockchainStatus(claimId);
    
    // Get status from insurance system
    const insuranceStatus = await this.getInsuranceStatus(claimId);
    
    return {
      blockchainStatus,
      insuranceStatus,
      lastUpdated: new Date()
    };
  }
}
```

## 📱 Mobile App Integration

### React Native Integration

```typescript
// src/services/api.ts
import { HederaSDK } from '@hashgraph/hedera-sdk';

class MobileApiService {
  private hederaClient: Client;
  
  constructor() {
    this.initializeHedera();
  }
  
  private async initializeHedera() {
    // Initialize for mobile environment
    this.hederaClient = Client.forTestnet();
    
    // In mobile, get credentials from secure storage
    const credentials = await this.getSecureCredentials();
    this.hederaClient.setOperator(
      AccountId.fromString(credentials.accountId),
      PrivateKey.fromString(credentials.privateKey)
    );
  }
  
  async authenticateWithBiometrics(): Promise<boolean> {
    try {
      // Use device biometrics (Face ID, Touch ID, Fingerprint)
      const biometricResult = await ReactNativeBiometrics.simplePrompt({
        promptMessage: 'Authenticate to access healthcare data',
        fallbackPromptMessage: 'Use device passcode'
      });
      
      return biometricResult.success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }
}
```

### Offline Support

```typescript
class OfflineSyncService {
  private db: SQLiteDatabase;
  private pendingOperations: any[] = [];
  
  async saveForOffline(operation: any) {
    // Save operation to local SQLite database
    await this.db.execute(
      'INSERT INTO pending_operations (type, data, timestamp) VALUES (?, ?, ?)',
      [operation.type, JSON.stringify(operation.data), new Date().toISOString()]
    );
    
    this.pendingOperations.push(operation);
  }
  
  async syncWhenOnline() {
    if (!navigator.onLine) return;
    
    for (const operation of this.pendingOperations) {
      try {
        await this.executeOnline(operation);
        await this.removeFromPending(operation.id);
      } catch (error) {
        console.error('Failed to sync operation:', operation.id, error);
      }
    }
  }
}
```

## 🧪 Testing Integration

### Unit Testing Setup

```typescript
// tests/integration/hedera.test.ts
import { HederaService } from '../../src/services/hederaService';

describe('Hedera Integration', () => {
  let hederaService: HederaService;
  
  beforeAll(async () => {
    hederaService = new HederaService();
    await hederaService.initialize();
  });
  
  test('should create consent request', async () => {
    const result = await hederaService.createConsentRequest(
      '0.0.12345', // patient
      '0.0.12346', // provider
      ['labs', 'medications'],
      Math.floor(Date.now() / 1000) + 86400, // 24 hours
      'Medical consultation'
    );
    
    expect(result.success).toBe(true);
    expect(result.transactionId).toBeDefined();
  });
});
```

### Integration Testing

```typescript
// tests/integration/api.test.ts
describe('API Integration', () => {
  test('should complete full patient journey', async () => {
    // 1. Create patient
    const patientResponse = await apiClient.post('/patient', mockPatientData);
    const patientId = patientResponse.data.data.id;
    
    // 2. Create consent request
    const consentResponse = await apiClient.post('/provider/consent-requests', {
      patientAddress: patientId,
      scopes: ['labs', 'medications'],
      purposeOfUse: 'Annual checkup'
    });
    
    // 3. Grant consent
    await apiClient.post(`/patient/consents/${consentResponse.data.data.requestId}/grant`);
    
    // 4. Create invoice
    const invoiceResponse = await apiClient.post('/provider/invoices', {
      patientAddress: patientId,
      lineItems: mockLineItems,
      currency: 'USD'
    });
    
    // 5. Approve invoice
    await apiClient.post(`/patient/invoices/${invoiceResponse.data.data.invoiceId}/approve`);
    
    // 6. Process payment
    await apiClient.post(`/patient/invoices/${invoiceResponse.data.data.invoiceId}/pay`, {
      paymentMethod: 'HTS'
    });
    
    expect('Full journey completed successfully').toBeTruthy();
  });
});
```

## �� Security Integration

### Data Encryption

```typescript
import CryptoJS from 'crypto-js';

class EncryptionService {
  private encryptionKey: string;
  
  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY!;
  }
  
  encryptSensitiveData(data: string): string {
    return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
  }
  
  decryptSensitiveData(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
  
  hashMedicalRecord(record: any): string {
    const recordString = JSON.stringify(record);
    return CryptoJS.SHA256(recordString).toString();
  }
}
```

### Audit Logging

```typescript
interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  details: any;
  blockchainHash?: string;
}

class AuditService {
  async logAccess(patientId: string, providerId: string, dataType: string) {
    const logEntry: AuditLogEntry = {
      id: this.generateId(),
      userId: providerId,
      action: 'DATA_ACCESS',
      resource: `patient:${patientId}:${dataType}`,
      timestamp: new Date(),
      ipAddress: this.getClientIP(),
      userAgent: this.getUserAgent(),
      details: { dataType, purpose: 'Medical consultation' }
    };
    
    // Store in database
    await this.saveToDatabase(logEntry);
    
    // Store hash on blockchain for immutability
    await this.saveToBlockchain(logEntry);
  }
}
```

## 📊 Monitoring Integration

### Health Checks

```typescript
// src/monitoring/healthCheck.ts
export const healthCheck = {
  async checkDatabase(): Promise<boolean> {
    try {
      await database.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  },
  
  async checkHederaConnection(): Promise<boolean> {
    try {
      const client = hederaService.getClient();
      await client.ping();
      return true;
    } catch (error) {
      return false;
    }
  },
  
  async checkSmartContracts(): Promise<boolean> {
    try {
      const contractInfo = await contractService.getContractInfo();
      return contractInfo.isDeployed;
    } catch (error) {
      return false;
    }
  }
};
```

### Performance Monitoring

```typescript
import * as Sentry from '@sentry/node';

class PerformanceMonitor {
  startTransaction(name: string) {
    return Sentry.startTransaction({ name });
  }
  
  recordMetric(name: string, value: number, tags?: any) {
    Sentry.metrics.increment(name, value, tags);
  }
  
  recordTiming(name: string, duration: number, tags?: any) {
    Sentry.metrics.timing(name, duration, tags);
  }
}
```

## 🚀 Deployment Integration

### Docker Integration

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

USER node
EXPOSE 3001

CMD ["npm", "start"]
```

### Environment Configuration

```bash
# .env.production
NODE_ENV=production
PORT=3001

# Hedera Mainnet
HEDERA_NETWORK=mainnet
HEDERA_ACCOUNT_ID=0.0.YOUR_MAINNET_ACCOUNT
HEDERA_PRIVATE_KEY=YOUR_MAINNET_PRIVATE_KEY

# Production Database
DATABASE_URL=postgresql://prod:password@db:5432/afrihealth_prod

# Production Redis
REDIS_URL=redis://redis:6379

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
```

## 🔧 Troubleshooting

### Common Integration Issues

1. **Hedera Network Connection**
   ```typescript
   // Check network connectivity
   const isConnected = await hederaService.ping();
   if (!isConnected) {
     throw new Error('Unable to connect to Hedera network');
   }
   ```

2. **Contract Interaction Failures**
   ```typescript
   // Verify contract deployment
   const contractInfo = await contractService.getContractInfo();
   if (!contractInfo.isDeployed) {
     throw new Error('Smart contracts not deployed');
   }
   ```

3. **Wallet Connection Issues**
   ```typescript
   // Check wallet compatibility
   if (!window.hashconnect && !window.ethereum) {
     throw new Error('No compatible wallet found');
   }
   ```

### Debug Mode

```typescript
// Enable debug logging
process.env.DEBUG = 'afrihealth:*';

// Log all contract interactions
hederaService.enableDebugLogging();

// Log all API requests
apiClient.interceptors.request.use((config) => {
  console.log('API Request:', config);
  return config;
});
```

## 📚 Additional Resources

- [Hedera SDK Documentation](https://docs.hedera.com/)
- [HashPack Wallet Integration](https://docs.hashpack.app/)
- [HL7 FHIR Specification](https://www.hl7.org/fhir/)
- [HIPAA Compliance Guide](https://www.hhs.gov/hipaa/)
- [GDPR Compliance Guide](https://gdpr.eu/)

## 🤝 Support

For integration support and questions:
- **Email**: integration@afrihealth.io
- **Discord**: [AfriHealth Developer Community](https://discord.gg/afrihealth)
- **GitHub Issues**: [Report Issues](https://github.com/afrihealth/issues)

---

*This integration guide is continuously updated. Last updated: December 2024*
