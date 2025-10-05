/**
 * Mock Data Service for Development
 * Provides sample data for all healthcare features
 */

import type {
  Consent,
  Bill,
  Appointment,
  MedicalRecord,
  InsuranceClaim,
  Activity,
  PatientStats,
  ProviderStats,
  PatientListItem,
} from "../types";

/**
 * Generate mock patient stats
 */
export function getMockPatientStats(): PatientStats {
  return {
    activeConsents: 3,
    totalConsents: 5,
    pendingBills: 2,
    totalSpent: 1250.5,
    upcomingAppointments: 1,
    insuranceCoverage: 5000,
    claimsSubmitted: 4,
    claimsApproved: 3,
  };
}

/**
 * Generate mock provider stats
 */
export function getMockProviderStats(): ProviderStats {
  return {
    totalPatients: 124,
    newPatientsThisMonth: 8,
    appointmentsToday: 5,
    upcomingThisWeek: 23,
    pendingReviews: 12,
    monthlyRevenue: 45230.75,
    activeConsents: 89,
    pendingBills: 15,
    totalRevenue: 45230.75,
    completedAppointments: 312,
    averageRating: 4.8,
    claimsProcessed: 87,
  };
}

/**
 * Generate mock consents
 */
export function getMockConsents(): Consent[] {
  return [
    {
      id: "consent-1",
      patientId: "0.0.123456",
      providerId: "0.0.789012",
      providerName: "Dr. Sarah Johnson",
      providerSpecialty: "General Practice",
      scopes: ["read_records", "write_records", "billing"],
      status: "active",
      grantedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString(),
      purpose: "Regular checkup and consultation",
      emergencyAccess: false,
      hcsTopicId: "0.0.9999",
      hcsSequenceNumber: 123,
    },
    {
      id: "consent-2",
      patientId: "0.0.123456",
      providerId: "0.0.789013",
      providerName: "Dr. Michael Chen",
      providerSpecialty: "Cardiology",
      scopes: ["read_records", "emergency_access"],
      status: "active",
      grantedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 305 * 24 * 60 * 60 * 1000).toISOString(),
      purpose: "Cardiac monitoring and treatment",
      emergencyAccess: true,
      hcsTopicId: "0.0.9999",
      hcsSequenceNumber: 156,
    },
    {
      id: "consent-3",
      patientId: "0.0.123456",
      providerId: "0.0.789014",
      providerName: "Lab Services Inc",
      providerSpecialty: "Laboratory",
      scopes: ["write_records"],
      status: "expired",
      grantedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      purpose: "Blood test results",
      emergencyAccess: false,
    },
  ];
}

/**
 * Generate mock bills
 */
export function getMockBills(): Bill[] {
  return [
    {
      id: "bill-1",
      billNumber: "INV-2025-001",
      patientId: "0.0.123456",
      patientName: "John Doe",
      providerId: "0.0.789012",
      providerName: "Dr. Sarah Johnson",
      items: [
        {
          id: "item-1",
          description: "General Consultation",
          code: "99213",
          quantity: 1,
          unitPrice: 150,
          totalPrice: 150,
          category: "Consultation",
        },
        {
          id: "item-2",
          description: "Blood Pressure Check",
          code: "99000",
          quantity: 1,
          unitPrice: 25,
          totalPrice: 25,
          category: "Diagnostic",
        },
      ],
      subtotal: 175,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 175,
      amountPaid: 0,
      balanceDue: 175,
      status: "pending_approval",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      aiRecommendation: {
        action: "approve",
        reason: "Routine consultation within normal range",
        confidence: 0.92,
      },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "bill-2",
      billNumber: "INV-2025-002",
      patientId: "0.0.123456",
      patientName: "John Doe",
      providerId: "0.0.789013",
      providerName: "Dr. Michael Chen",
      items: [
        {
          id: "item-3",
          description: "ECG Test",
          code: "93000",
          quantity: 1,
          unitPrice: 250,
          totalPrice: 250,
          category: "Diagnostic",
        },
        {
          id: "item-4",
          description: "Cardiology Consultation",
          code: "99243",
          quantity: 1,
          unitPrice: 200,
          totalPrice: 200,
          category: "Consultation",
        },
      ],
      subtotal: 450,
      taxAmount: 0,
      discountAmount: 50,
      totalAmount: 400,
      amountPaid: 400,
      balanceDue: 0,
      status: "paid",
      paymentMethod: "hbar",
      paidDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      transactionHash: "0x1234567890abcdef",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

/**
 * Generate mock appointments
 */
export function getMockAppointments(): Appointment[] {
  return [
    {
      id: "apt-1",
      patientId: "0.0.123456",
      patientName: "John Doe",
      providerId: "0.0.789012",
      providerName: "Dr. Sarah Johnson",
      providerSpecialty: "General Practice",
      type: "follow_up",
      status: "scheduled",
      scheduledDate: new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000
      ).toISOString(),
      duration: 30,
      reason: "Follow-up on blood pressure",
      notes: "Bring current medication list",
      reminderSent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "apt-2",
      patientId: "0.0.123456",
      patientName: "John Doe",
      providerId: "0.0.789013",
      providerName: "Dr. Michael Chen",
      providerSpecialty: "Cardiology",
      type: "consultation",
      status: "completed",
      scheduledDate: new Date(
        Date.now() - 14 * 24 * 60 * 60 * 1000
      ).toISOString(),
      duration: 45,
      reason: "Cardiac checkup",
      notes: "ECG performed, results normal",
      reminderSent: true,
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

/**
 * Generate mock medical records
 */
export function getMockMedicalRecords(): MedicalRecord[] {
  return [
    {
      id: "record-1",
      patientId: "0.0.123456",
      providerId: "0.0.789012",
      providerName: "Dr. Sarah Johnson",
      type: "consultation",
      title: "Annual Physical Examination",
      description: "Routine checkup - all vitals normal",
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      diagnosis: [
        "Z00.00 - Encounter for general adult medical examination without abnormal findings",
      ],
      dataHash: "QmX1234567890abcdefghijk",
      consentId: "consent-1",
    },
    {
      id: "record-2",
      patientId: "0.0.123456",
      providerId: "0.0.789013",
      providerName: "Dr. Michael Chen",
      type: "lab_result",
      title: "ECG Test Results",
      description: "Electrocardiogram - Normal sinus rhythm",
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      labResults: [
        {
          testName: "ECG",
          value: "Normal",
          unit: "N/A",
          normalRange: "Normal sinus rhythm",
          status: "normal",
          testDate: new Date(
            Date.now() - 14 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      ],
      dataHash: "QmY7890abcdefghijklmnop",
      consentId: "consent-2",
    },
  ];
}

/**
 * Generate mock insurance claims
 */
export function getMockInsuranceClaims(): InsuranceClaim[] {
  return [
    {
      id: "claim-1",
      claimNumber: "CLM-2025-001",
      patientId: "0.0.123456",
      patientName: "John Doe",
      providerId: "0.0.789013",
      providerName: "Dr. Michael Chen",
      poolId: "pool-1",
      billId: "bill-2",
      status: "approved",
      diagnosisCodes: ["I10 - Essential hypertension"],
      procedureCodes: ["93000 - ECG"],
      claimedAmount: 400,
      approvedAmount: 350,
      paidAmount: 350,
      supportingDocuments: [],
      submittedDate: new Date(
        Date.now() - 10 * 24 * 60 * 60 * 1000
      ).toISOString(),
      reviewedDate: new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      paidDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      reviewerNotes: "Approved - medically necessary",
      fraudRiskScore: 0.05,
    },
  ];
}

/**
 * Generate mock activities
 */
export function getMockActivities(): Activity[] {
  return [
    {
      id: "act-1",
      userId: "0.0.123456",
      type: "bill_paid",
      title: "Payment Processed",
      description: "Paid bill INV-2025-002 for ℏ400",
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "act-2",
      userId: "0.0.123456",
      type: "consent_granted",
      title: "Consent Granted",
      description: "Granted access to Dr. Sarah Johnson",
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "act-3",
      userId: "0.0.123456",
      type: "appointment_scheduled",
      title: "Appointment Scheduled",
      description: "Follow-up with Dr. Sarah Johnson",
      timestamp: new Date().toISOString(),
    },
  ];
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

  return date.toLocaleDateString();
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Generate mock patients list
 */
export function getMockPatients(): PatientListItem[] {
  return [
    {
      id: "patient-1",
      accountId: "0.0.123456",
      name: "John Doe",
      age: 35,
      gender: "Male",
      bloodType: "O+",
      email: "john.doe@email.com",
      phone: "+1 (555) 123-4567",
      lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      recordCount: 12,
      visitCount: 24,
      medicalHistory:
        "Hypertension, managed with medication. No known allergies.",
    },
    {
      id: "patient-2",
      accountId: "0.0.234567",
      name: "Mary Johnson",
      age: 42,
      gender: "Female",
      bloodType: "A+",
      email: "mary.johnson@email.com",
      phone: "+1 (555) 234-5678",
      lastVisit: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      recordCount: 18,
      visitCount: 35,
      medicalHistory:
        "Type 2 Diabetes, regular monitoring. Allergic to penicillin.",
    },
    {
      id: "patient-3",
      accountId: "0.0.345678",
      name: "Robert Smith",
      age: 28,
      gender: "Male",
      bloodType: "B+",
      email: "robert.smith@email.com",
      phone: "+1 (555) 345-6789",
      lastVisit: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      recordCount: 8,
      visitCount: 15,
      medicalHistory: "Asthma, uses inhaler as needed. No other conditions.",
    },
    {
      id: "patient-4",
      accountId: "0.0.456789",
      name: "Lisa Chen",
      age: 51,
      gender: "Female",
      bloodType: "AB-",
      email: "lisa.chen@email.com",
      phone: "+1 (555) 456-7890",
      lastVisit: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      recordCount: 25,
      visitCount: 48,
      medicalHistory:
        "Arthritis, regular physical therapy. High cholesterol under control.",
    },
    {
      id: "patient-5",
      accountId: "0.0.567890",
      name: "Ahmed Hassan",
      age: 39,
      gender: "Male",
      bloodType: "O-",
      email: "ahmed.hassan@email.com",
      phone: "+1 (555) 567-8901",
      lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      recordCount: 10,
      visitCount: 20,
      medicalHistory:
        "Recent surgery recovery, follow-up appointments scheduled.",
    },
    {
      id: "patient-6",
      accountId: "0.0.678901",
      name: "Sarah Williams",
      age: 26,
      gender: "Female",
      bloodType: "A-",
      email: "sarah.williams@email.com",
      phone: "+1 (555) 678-9012",
      lastVisit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      recordCount: 5,
      visitCount: 8,
      medicalHistory: "Healthy, routine checkups only.",
    },
  ];
}
