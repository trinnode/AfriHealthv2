/**
 * API Response types for AfriHealth Ledger Backend
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any[];
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: any[];
  stack?: string;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Hedera SDK related types
 */
export interface ContractFunctionResult {
  result: any;
  rawResult: any;
}

export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  gasUsed?: number;
  result?: any;
}

/**
 * Authentication types
 */
export interface AuthToken {
  token: string;
  address: string;
  expiresIn: string;
}

export interface WalletAuthRequest {
  address: string;
  signature: string;
  message: string;
}

/**
 * Patient API types
 */
export interface PatientStats {
  totalConsents: number;
  activeConsents: number;
  pendingInvoices: number;
  approvedInvoices: number;
  totalClaims: number;
  pendingClaims: number;
  insuranceCoverage: number;
  monthlySpending: number;
}

export interface PatientBalance {
  platformCredit: number;
  insurancePool: number;
  hbar: number;
  fiatEquivalent: number;
}

/**
 * Provider API types
 */
export interface ProviderStats {
  totalPatients: number;
  activeConsents: number;
  pendingInvoices: number;
  totalClaims: number;
  totalRevenue: number;
  claimApprovalRate: number;
  averageProcessingTime: number;
}

/**
 * Contract interaction types
 */
export interface ContractCall {
  contractId: string;
  functionName: string;
  parameters?: any[];
  gasLimit?: number;
}

export interface DeployResult {
  contractId: string;
  transactionId: string;
  deployedAt: Date;
}

/**
 * Insurance pool types
 */
export interface PoolStats {
  totalMembers: number;
  totalShares: number;
  totalReserves: number;
  reserveRatio: number;
  solvencyThreshold: number;
  premiumRate: number;
  claimCount: number;
}

/**
 * Analytics types
 */
export interface AnalyticsData {
  totalPatients: number;
  totalInvoices: number;
  totalRevenue: number;
  averageClaimAmount: number;
  claimApprovalRate: number;
  monthlyTrends: MonthlyTrend[];
  topProcedures: TopProcedure[];
  patientSatisfaction: number;
  averageProcessingTime: number;
}

export interface MonthlyTrend {
  month: string;
  patients: number;
  revenue: number;
  claims: number;
}

export interface TopProcedure {
  code: string;
  description: string;
  count: number;
  revenue: number;
}

/**
 * Notification types
 */
export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
}

export enum NotificationType {
  CONSENT_REQUEST = 'consent_request',
  INVOICE_APPROVAL = 'invoice_approval',
  CLAIM_UPDATE = 'claim_update',
  EMERGENCY_ACCESS = 'emergency_access',
  PAYMENT_RECEIVED = 'payment_received',
  SYSTEM_UPDATE = 'system_update'
}

/**
 * Request/Response validation types
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface RequestWithUser extends Request {
  user?: {
    address: string;
    type: string;
    iat: number;
    exp: number;
  };
}

/**
 * Environment configuration types
 */
export interface Config {
  nodeEnv: string;
  port: number;
  hedera: {
    network: 'mainnet' | 'testnet' | 'previewnet';
    operatorId: string;
    operatorKey: string;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
  };
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
  cors: {
    origin: string[];
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
}
