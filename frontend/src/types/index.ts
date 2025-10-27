import type { DAppConnector } from "@hashgraph/hedera-wallet-connect";

export type UserRole = "patient" | "provider" | "insurer" | "admin";

export interface User {
  id: string;
  accountId: string;
  role: UserRole;
  name: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  profileImage?: string;
  kycVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Patient extends User {
  role: "patient";
  medicalRecordNumber: string;
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
}

export interface Provider extends User {
  role: "provider";
  licenseNumber: string;
  specialty: string;
  facilityName: string;
  facilityAddress: string;
  verified: boolean;
  rating?: number;
  consultationFee?: number;
}

// ============================================
// Consent Types
// ============================================

export type ConsentStatus = "active" | "expired" | "revoked" | "pending";
export type ConsentScope =
  | "read_records"
  | "write_records"
  | "emergency_access"
  | "billing"
  | "share_with_insurance"
  | "research";

export interface Consent {
  id: string;
  patientId: string;
  providerId: string;
  providerName: string;
  providerSpecialty: string;
  scopes: ConsentScope[];
  status: ConsentStatus;
  grantedAt: string;
  expiresAt: string;
  revokedAt?: string;
  purpose: string;
  emergencyAccess: boolean;
  hcsTopicId?: string;
  hcsSequenceNumber?: number;
}

export type RecordType =
  | "consultation"
  | "lab_result"
  | "imaging"
  | "prescription"
  | "vaccination"
  | "surgery"
  | "vitals"
  | "diagnosis";

export interface MedicalRecord {
  id: string;
  patientId: string;
  providerId: string;
  providerName: string;
  type: RecordType;
  title: string;
  description: string;
  date: string;
  diagnosis?: string[];
  prescriptions?: Prescription[];
  labResults?: LabResult[];
  attachments?: Attachment[];
  dataHash: string; // IPFS or encrypted storage hash
  encryptionKey?: string;
  consentId: string; // Which consent allowed this record
  hcsTopicId?: string;
  hcsSequenceNumber?: number;
}

export interface Prescription {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  refillsAllowed: number;
  prescribedDate: string;
}

export interface LabResult {
  testName: string;
  value: string;
  unit: string;
  normalRange: string;
  status: "normal" | "abnormal" | "critical";
  testDate: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  storageHash: string; // IPFS/encrypted storage
}

export interface VitalSigns {
  temperature?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  recordedAt: string;
}

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type AppointmentType =
  | "consultation"
  | "follow_up"
  | "emergency"
  | "procedure"
  | "vaccination"
  | "lab_test";

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  providerSpecialty: string;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduledDate: string;
  duration: number; // minutes
  reason: string;
  notes?: string;
  consentId?: string;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}


export type BillStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "paid"
  | "partially_paid"
  | "rejected"
  | "disputed"
  | "overdue";

export type PaymentMethod = "hbar" | "platform_credit" | "insurance" | "cash";

export interface BillItem {
  id: string;
  description: string;
  code: string; // CPT/ICD-10 code
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  appointmentId?: string;
  items: BillItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: BillStatus;
  paymentMethod?: PaymentMethod;
  insuranceClaimId?: string;
  dueDate: string;
  paidDate?: string;
  notes?: string;
  aiRecommendation?: {
    action: "approve" | "hold" | "review";
    reason: string;
    confidence: number;
  };
  hcsTopicId?: string;
  hcsSequenceNumber?: number;
  transactionHash?: string;
  createdAt: string;
  updatedAt: string;
}


export type ClaimStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "additional_info_required"
  | "approved"
  | "partially_approved"
  | "denied"
  | "paid"
  | "appealed";

export type CoverageType =
  | "inpatient"
  | "outpatient"
  | "emergency"
  | "preventive"
  | "dental"
  | "vision"
  | "prescription"
  | "maternity";

export interface InsurancePool {
  id: string;
  name: string;
  description: string;
  tokenAddress: string;
  totalMembers: number;
  totalFunds: number;
  reserveRatio: number;
  monthlyPremium: number;
  coverageTypes: CoverageType[];
  maxCoverageAmount: number;
  deductible: number;
  createdAt: string;
}

export interface InsuranceMembership {
  id: string;
  patientId: string;
  poolId: string;
  poolName: string;
  status: "active" | "inactive" | "suspended";
  joinedDate: string;
  nextPremiumDate: string;
  totalPremiumsPaid: number;
  tokensHeld: number;
  coverageAmount: number;
  deductibleRemaining: number;
}

export interface InsuranceClaim {
  id: string;
  claimNumber: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  poolId: string;
  billId: string;
  status: ClaimStatus;
  diagnosisCodes: string[];
  procedureCodes: string[];
  claimedAmount: number;
  approvedAmount: number;
  paidAmount: number;
  denialReason?: string;
  supportingDocuments: Attachment[];
  submittedDate: string;
  reviewedDate?: string;
  paidDate?: string;
  reviewerNotes?: string;
  fraudRiskScore?: number;
  hcsTopicId?: string;
  hcsSequenceNumber?: number;
}


export interface WalletState {
  isConnected: boolean;
  accountId: string | null;
  network: string | null;
  balance: {
    hbar: number;
    platformCredit: number;
    insuranceTokens: number;
  };
}

export type TransactionType =
  | "bill_payment"
  | "premium_payment"
  | "claim_payout"
  | "token_transfer"
  | "credit_purchase";

export interface Transaction {
  id: string;
  type: TransactionType;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: "hbar" | "platform_credit" | "insurance_token";
  status: "pending" | "completed" | "failed";
  transactionHash?: string;
  timestamp: string;
  description: string;
  metadata?: Record<string, unknown>;
}


export type NotificationType =
  | "consent_request"
  | "consent_granted"
  | "consent_revoked"
  | "appointment_reminder"
  | "bill_received"
  | "payment_received"
  | "claim_update"
  | "emergency_access"
  | "system";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}


export type ActivityType =
  | "consent_granted"
  | "consent_revoked"
  | "record_accessed"
  | "record_created"
  | "appointment_scheduled"
  | "bill_created"
  | "bill_paid"
  | "claim_submitted"
  | "claim_approved";

export interface Activity {
  id: string;
  userId: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PatientStats {
  activeConsents: number;
  totalConsents: number;
  pendingBills: number;
  totalSpent: number;
  upcomingAppointments: number;
  insuranceCoverage: number;
  claimsSubmitted: number;
  claimsApproved: number;
}

export interface ProviderStats {
  totalPatients: number;
  newPatientsThisMonth: number;
  appointmentsToday: number;
  upcomingThisWeek: number;
  pendingReviews: number;
  monthlyRevenue: number;
  activeConsents: number;
  pendingBills: number;
  totalRevenue: number;
  completedAppointments: number;
  averageRating: number;
  claimsProcessed: number;
}

export interface PatientListItem {
  id: string;
  accountId: string;
  name: string;
  age: number;
  gender: string;
  bloodType?: string;
  email?: string;
  phone?: string;
  lastVisit: string;
  recordCount: number;
  visitCount: number;
  medicalHistory?: string;
}


export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}


export interface ConsentFormData {
  providerId: string;
  scopes: ConsentScope[];
  expiresAt: string;
  purpose: string;
  emergencyAccess: boolean;
}

export interface BillFormData {
  patientId: string;
  appointmentId?: string;
  items: Omit<BillItem, "id" | "totalPrice">[];
  notes?: string;
}

export interface ClaimFormData {
  billId: string;
  poolId: string;
  diagnosisCodes: string[];
  procedureCodes: string[];
  supportingDocuments: File[];
}

export interface AppointmentFormData {
  providerId: string;
  type: AppointmentType;
  scheduledDate: string;
  duration: number;
  reason: string;
  notes?: string;
}
export interface WalletEvent {
    name: string;
    data: {
        topic?: string;
        [key: string]: unknown;
    };
}

export interface DAppConnectorWithEvents extends DAppConnector {
    events$?: {
        subscribe: (callback: (event: WalletEvent) => void) => { unsubscribe: () => void };
    };
}
export interface DAppConnectorContextProps {
    dAppConnector: DAppConnector | null;
    userAccountId: string | null;
    sessionTopic: string | null;
    disconnect: (() => Promise<void>) | null;
    refresh: (() => void) | null;
    connect: () => Promise<void>
};

export interface ProviderProps {
    children: React.ReactNode;
};

