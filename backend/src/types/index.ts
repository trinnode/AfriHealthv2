import { ContractFunctionResult as SDKContractFunctionResult } from '@hashgraph/sdk';

/**
 * Backend type definitions for AfriHealth Ledger
 */

/**
 * API Response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Contract function result wrapper
 */
export interface ContractFunctionResult {
  result: any;
  rawResult: SDKContractFunctionResult;
}

/**
 * User roles in the system
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  PATIENT = 'PATIENT',
  PROVIDER = 'PROVIDER',
  INSURER = 'INSURER',
  ARBITRATOR = 'ARBITRATOR',
  ORACLE = 'ORACLE'
}

/**
 * Invoice status enumeration
 */
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED'
}

/**
 * Consent status enumeration
 */
export enum ConsentStatus {
  PENDING = 'PENDING',
  GRANTED = 'GRANTED',
  DENIED = 'DENIED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED'
}

/**
 * Line item for invoices
 */
export interface LineItem {
  itemId: string;
  description: string;
  code: string; // CPT/ICD code
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
}

/**
 * Invoice data structure
 */
export interface Invoice {
  invoiceId: string;
  patient: string;
  provider: string;
  lineItems: LineItem[];
  totalAmount: number;
  currency: string;
  createdAt: Date;
  expiresAt: Date;
  status: InvoiceStatus;
  evidenceHash?: string;
  notes?: string;
  aiPolicyChecked?: boolean;
  aiPolicyResult?: string;
  paidAt?: Date;
}

/**
 * Consent request data structure
 */
export interface ConsentRequest {
  requestId: string;
  patient: string;
  provider: string;
  scopes: string[];
  purposeOfUse: string;
  status: ConsentStatus;
  createdAt: Date;
  expiresAt: Date;
  grantedAt?: Date;
  revokedAt?: Date;
  emergencyAccess?: boolean;
  emergencyReason?: string;
}

/**
 * Insurance claim data structure
 */
export interface InsuranceClaim {
  claimId: string;
  patient: string;
  provider: string;
  amountRequested: number;
  amountApproved?: number;
  diagnosis: string;
  procedureCodes: string[];
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'PAID';
  submittedAt: Date;
  reviewedAt?: Date;
  paidAt?: Date;
}

/**
 * Payment data structure
 */
export interface Payment {
  paymentId: string;
  invoiceId: string;
  payer: string;
  payee: string;
  amount: number;
  paymentMethod: 'HBAR' | 'HTS' | 'Insurance';
  paidAt: Date;
  transactionHash?: string;
}

/**
 * User profile data structure
 */
export interface UserProfile {
  address: string;
  role: UserRole;
  name?: string;
  email?: string;
  phone?: string;
  licenseNumber?: string; // For providers
  specialization?: string; // For providers
  organization?: string; // For insurers
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Insurance pool statistics
 */
export interface PoolStats {
  totalFunds: number;
  activeClaims: number;
  totalPaid: number;
  participantCount: number;
  currency: string;
}

/**
 * Healthcare provider data structure
 */
export interface Provider {
  address: string;
  name: string;
  licenseNumber: string;
  specialization: string;
  organization?: string;
  isVerified: boolean;
  rating?: number;
  totalPatients?: number;
  createdAt: Date;
}

/**
 * Patient data structure
 */
export interface Patient {
  address: string;
  name?: string;
  dateOfBirth?: Date;
  emergencyContact?: string;
  insuranceProvider?: string;
  policyNumber?: string;
  isVerified: boolean;
  createdAt: Date;
}

/**
 * Wallet connection state
 */
export interface WalletState {
  isConnected: boolean;
  address: string;
  balance: string;
  role?: UserRole;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Filter parameters for queries
 */
export interface FilterParams {
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  provider?: string;
  patient?: string;
  amountMin?: number;
  amountMax?: number;
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  totalInvoices: number;
  pendingInvoices: number;
  paidInvoices: number;
  totalRevenue: number;
  pendingClaims: number;
  approvedClaims: number;
  patientCount: number;
  providerCount: number;
}

/**
 * Notification data structure
 */
export interface Notification {
  id: string;
  userAddress: string;
  type: 'INVOICE' | 'CONSENT' | 'CLAIM' | 'PAYMENT' | 'SYSTEM';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

/**
 * Audit log entry
 */
export interface AuditLog {
  id: string;
  userAddress: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Contract interaction result
 */
export interface ContractInteraction {
  success: boolean;
  transactionId?: string;
  contractAddress?: string;
  gasUsed?: number;
  error?: string;
  result?: any;
}

/**
 * Healthcare codes (CPT, ICD, etc.)
 */
export interface HealthcareCode {
  code: string;
  description: string;
  category: string;
  price?: number;
  isActive: boolean;
}

/**
 * AI Policy check result
 */
export interface AIPolicyResult {
  isCompliant: boolean;
  score: number;
  recommendations: string[];
  warnings: string[];
  errors: string[];
  checkedAt: Date;
}

/**
 * Emergency access request
 */
export interface EmergencyAccess {
  id: string;
  providerAddress: string;
  patientAddress: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED';
  requestedAt: Date;
  expiresAt: Date;
  approvedAt?: Date;
  deniedAt?: Date;
  approvedBy?: string;
}

/**
 * System configuration
 */
export interface SystemConfig {
  maxInvoiceAmount: number;
  defaultInvoiceExpiry: number;
  supportedCurrencies: string[];
  emergencyAccessDuration: number;
  aiPolicyRequired: boolean;
  auditLogRetention: number;
}

/**
 * API endpoint documentation
 */
export interface EndpointDoc {
  path: string;
  method: string;
  description: string;
  parameters?: any;
  responses?: any;
  requiresAuth?: boolean;
  roles?: UserRole[];
}
