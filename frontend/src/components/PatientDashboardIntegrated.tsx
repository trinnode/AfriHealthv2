/**
 * Fully Integrated Patient Dashboard with Real API Integration
 * NO MOCK DATA - All data from backend API
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Badge } from "./UI";
import { useAccount } from "wagmi";
import {
  usePatientConsents,
  usePatientInvoices,
  usePatientRecords,
  usePatientClaims,
  useRevokeConsent,
  usePayInvoice,
} from "../hooks";
import { formatDate, formatCurrency } from "../services/mockDataService";
import type { Consent, Bill, MedicalRecord, InsuranceClaim } from "../types";
import { GrantConsentModal } from "./modals/GrantConsentModal";

type TabName =
  | "overview"
  | "records"
  | "appointments"
  | "consents"
  | "billing"
  | "insurance"
  | "prescriptions"
  | "profile";

interface PatientStats {
  activeConsents: number;
  pendingBills: number;
  totalSpent: number;
  insuranceCoverage: number;
  claimsSubmitted: number;
  claimsApproved: number;
}

/**
 * Comprehensive Patient Dashboard - Fully Integrated
 */
export default function PatientDashboard() {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabName>("overview");
  const [showGrantConsentModal, setShowGrantConsentModal] = useState(false);

  // Redirect to home if wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      navigate("/");
    }
  }, [isConnected, navigate]);

  // Real API data hooks
  const {
    consents,
    loading: consentsLoading,
    refetch: refetchConsents,
  } = usePatientConsents(address ?? undefined);
  const {
    invoices,
    loading: invoicesLoading,
    refetch: refetchInvoices,
  } = usePatientInvoices(address ?? undefined);
  const {
    records,
    loading: recordsLoading,
    refetch: refetchRecords,
  } = usePatientRecords(address ?? undefined);
  const {
    claims,
    loading: claimsLoading,
    refetch: refetchClaims,
  } = usePatientClaims(address ?? undefined);

  // Calculate stats from real data
  const stats: PatientStats = {
    activeConsents: consents.filter((c) => c.status === "active").length,
    pendingBills: invoices.filter(
      (b) => b.status === "pending_approval" || b.status === "approved"
    ).length,
    totalSpent: invoices
      .filter((b) => b.status === "paid")
      .reduce((sum, b) => sum + b.totalAmount, 0),
    insuranceCoverage: claims
      .filter((c) => c.status === "approved" || c.status === "paid")
      .reduce((sum, c) => sum + (c.approvedAmount || c.claimedAmount), 0),
    claimsSubmitted: claims.length,
    claimsApproved: claims.filter(
      (c) => c.status === "approved" || c.status === "paid"
    ).length,
  };

  const tabs: { id: TabName; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "records", label: "Medical Records", icon: "📋" },
    { id: "appointments", label: "Appointments", icon: "📅" },
    { id: "consents", label: "Consents", icon: "🔐" },
    { id: "billing", label: "Billing", icon: "💰" },
    { id: "insurance", label: "Insurance", icon: "🏥" },
    { id: "prescriptions", label: "Prescriptions", icon: "💊" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4 md:p-8">
      {/* Header */}
      <div className="mb-10 max-w-7xl mx-auto">
        <p className="font-mono text-base md:text-lg text-gray-400">
          Account:{" "}
          <span className="text-afrihealth-green font-bold">
            {address
              ? `${address.slice(0, 6)}...${address.slice(-4)}`
              : "Not Connected"}
          </span>
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-8 flex justify-center">
        <div className="flex gap-2 overflow-x-auto max-w-7xl">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 rounded-xl font-mono text-sm font-bold transition-all whitespace-nowrap shadow-lg ${
                activeTab === tab.id
                  ? "bg-afrihealth-orange text-white scale-105"
                  : "bg-gray-900 text-gray-400 hover:bg-gray-800"
              }`}
            >
              {tab.icon} {tab.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "overview" && (
              <OverviewTab
                stats={stats}
                invoices={invoices}
                consents={consents}
                loading={invoicesLoading || consentsLoading}
                onTabChange={setActiveTab}
              />
            )}
            {activeTab === "records" && (
              <RecordsTab
                records={records}
                loading={recordsLoading}
                refetch={refetchRecords}
              />
            )}
            {activeTab === "appointments" && <AppointmentsTab />}
            {activeTab === "consents" && (
              <ConsentsTab
                consents={consents}
                loading={consentsLoading}
                refetch={refetchConsents}
                onGrantConsent={() => setShowGrantConsentModal(true)}
              />
            )}
            {activeTab === "billing" && (
              <BillingTab
                bills={invoices}
                loading={invoicesLoading}
                refetch={refetchInvoices}
              />
            )}
            {activeTab === "insurance" && (
              <InsuranceTab
                claims={claims}
                stats={stats}
                loading={claimsLoading}
                refetch={refetchClaims}
              />
            )}
            {activeTab === "prescriptions" && <PrescriptionsTab />}
            {activeTab === "profile" && <ProfileTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modals */}
      <GrantConsentModal
        isOpen={showGrantConsentModal}
        onClose={() => setShowGrantConsentModal(false)}
        onSuccess={refetchConsents}
      />
    </div>
  );
}

// ============================================
// Stat Card Component
// ============================================
interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color?: "orange" | "red" | "green";
}

function StatCard({ label, value, icon, color = "orange" }: StatCardProps) {
  const colorClasses = {
    orange: "border-afrihealth-orange text-afrihealth-orange",
    green: "border-afrihealth-green text-afrihealth-green",
    red: "border-afrihealth-red text-afrihealth-red",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-gray-900 border-2 ${colorClasses[color]} rounded-lg p-4`}
    >
      <span className="text-3xl">{icon}</span>
      <h3 className="font-mono text-sm text-gray-400 mt-2">{label}</h3>
      <p className="font-lora text-3xl font-bold">{value}</p>
    </motion.div>
  );
}

// ============================================
// Overview Tab
// ============================================
interface OverviewTabProps {
  stats: PatientStats;
  invoices: Bill[];
  consents: Consent[];
  loading: boolean;
  onTabChange: (tab: TabName) => void;
}

function OverviewTab({
  stats,
  invoices,
  consents,
  loading,
  onTabChange,
}: OverviewTabProps) {
  const pendingBill = invoices.find((b) => b.status === "pending_approval");

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-afrihealth-orange"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Active Consents"
          value={stats.activeConsents}
          icon="🔐"
          color="orange"
        />
        <StatCard
          label="Pending Bills"
          value={stats.pendingBills}
          icon="💰"
          color="red"
        />
        <StatCard
          label="Total Spent"
          value={formatCurrency(stats.totalSpent)}
          icon="💵"
          color="green"
        />
        <StatCard
          label="Insurance Coverage"
          value={formatCurrency(stats.insuranceCoverage)}
          icon="🏥"
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <Card variant="default">
        <h2 className="font-lora text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={() => onTabChange("appointments")}
          >
            📅 Book Appointment
          </Button>
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() => onTabChange("records")}
          >
            📋 View Records
          </Button>
          <Button
            variant="success"
            size="sm"
            fullWidth
            onClick={() => onTabChange("prescriptions")}
          >
            💊 Refill Prescription
          </Button>
          <Button
            variant="danger"
            size="sm"
            fullWidth
            onClick={() => onTabChange("consents")}
          >
            🆘 Emergency Access
          </Button>
        </div>
      </Card>

      {/* Pending Bill Alert */}
      {pendingBill && (
        <Card variant="orange">
          <h3 className="font-lora text-xl font-bold mb-4">
            ⚠️ Action Required
          </h3>
          <div className="space-y-2">
            <p className="font-mono text-sm">
              <span className="text-gray-400">Bill:</span>{" "}
              {pendingBill.billNumber}
            </p>
            <p className="font-mono text-sm">
              <span className="text-gray-400">Amount:</span>{" "}
              {formatCurrency(pendingBill.totalAmount)}
            </p>
            <p className="font-mono text-sm">
              <span className="text-gray-400">Provider:</span>{" "}
              {pendingBill.providerName}
            </p>
            {pendingBill.aiRecommendation && (
              <div className="mt-3 p-3 bg-black bg-opacity-50 rounded">
                <p className="font-mono text-xs text-afrihealth-green">
                  🤖 AI: {pendingBill.aiRecommendation.reason}
                </p>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <Button variant="success" size="sm">
                ✓ Approve
              </Button>
              <Button variant="danger" size="sm">
                ✗ Decline
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Consents */}
      <Card variant="default">
        <h3 className="font-lora text-2xl font-bold mb-4">Recent Consents</h3>
        <div className="space-y-3">
          {consents.slice(0, 3).map((consent) => (
            <div
              key={consent.id}
              className="flex justify-between items-center p-3 bg-gray-800 rounded"
            >
              <div>
                <p className="font-mono font-bold">{consent.providerName}</p>
                <p className="font-mono text-xs text-gray-400">
                  {consent.scopes.join(", ")}
                </p>
              </div>
              <Badge
                variant={consent.status === "active" ? "success" : "warning"}
              >
                {consent.status}
              </Badge>
            </div>
          ))}
          {consents.length === 0 && (
            <p className="text-center text-gray-500 font-mono text-sm py-4">
              No consents yet. Grant consent to providers to start.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

// ============================================
// Medical Records Tab
// ============================================
interface RecordsTabProps {
  records: MedicalRecord[];
  loading: boolean;
  refetch: () => void;
}

function RecordsTab({ records, loading, refetch }: RecordsTabProps) {
  const [filter, setFilter] = useState<string>("all");

  const filteredRecords =
    filter === "all" ? records : records.filter((r) => r.type === filter);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-afrihealth-orange"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="font-lora text-3xl font-bold">Medical Records</h2>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg font-mono text-sm"
          >
            <option value="all">All Records</option>
            <option value="consultation">Consultations</option>
            <option value="lab_result">Lab Results</option>
            <option value="imaging">Imaging</option>
            <option value="prescription">Prescriptions</option>
            <option value="vaccination">Vaccinations</option>
          </select>
          <Button variant="secondary" size="sm" onClick={refetch}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredRecords.map((record) => (
          <Card key={record.id} variant="default">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant={
                      record.type === "lab_result" ? "danger" : "success"
                    }
                  >
                    {record.type.replace("_", " ").toUpperCase()}
                  </Badge>
                  <span className="font-mono text-sm text-gray-400">
                    {formatDate(record.date)}
                  </span>
                </div>
                <h3 className="font-lora text-xl font-bold mb-2">
                  {record.title}
                </h3>
                <p className="font-mono text-sm text-gray-400 mb-3">
                  {record.description}
                </p>
                <p className="font-mono text-xs text-gray-500">
                  Provider: {record.providerName}
                </p>
              </div>
              <Button variant="secondary" size="sm">
                View Details
              </Button>
            </div>
          </Card>
        ))}
        {filteredRecords.length === 0 && (
          <Card variant="default">
            <p className="text-center text-gray-500 font-mono text-sm py-8">
              No medical records found. Records will appear here after
              consultations.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============================================
// Appointments Tab (placeholder - to be implemented with HCS)
// ============================================
function AppointmentsTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-lora text-3xl font-bold">Appointments</h2>
        <Badge variant="warning">� COMING SOON</Badge>
      </div>

      <Card variant="default">
        <div className="text-center py-12">
          <p className="text-gray-400 font-mono text-lg mb-4">
            📅 Appointment Scheduling
          </p>
          <p className="text-gray-500 font-mono text-sm">
            This feature will be available soon via Hedera Consensus Service.
          </p>
          <p className="text-gray-600 font-mono text-xs mt-4">
            You'll be able to book, reschedule, and manage appointments with
            healthcare providers.
          </p>
        </div>
      </Card>
    </div>
  );
}

// ============================================
// Consents Tab
// ============================================
interface ConsentsTabProps {
  consents: Consent[];
  loading: boolean;
  refetch: () => void;
  onGrantConsent: () => void;
}

function ConsentsTab({
  consents,
  loading,
  refetch,
  onGrantConsent,
}: ConsentsTabProps) {
  const revokeConsentApi = useRevokeConsent();

  const handleRevoke = async (consentId: string) => {
    if (!confirm("Are you sure you want to revoke this consent?")) return;

    const result = await revokeConsentApi.execute(consentId);
    if (result) {
      alert("Consent revoked successfully");
      refetch();
    } else {
      alert("Failed to revoke consent: " + revokeConsentApi.error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-afrihealth-orange"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-lora text-3xl font-bold">Access Consents</h2>
        <Button variant="primary" onClick={onGrantConsent}>
          + Grant New Consent
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {consents.map((consent) => (
          <Card key={consent.id} variant="orange">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge
                    variant={
                      consent.status === "active"
                        ? "success"
                        : consent.status === "expired"
                        ? "warning"
                        : "danger"
                    }
                  >
                    {consent.status.toUpperCase()}
                  </Badge>
                  {consent.emergencyAccess && (
                    <Badge variant="danger">🆘 EMERGENCY</Badge>
                  )}
                </div>
                <h3 className="font-lora text-xl font-bold mb-2">
                  {consent.providerName}
                </h3>
                <p className="font-mono text-sm text-gray-400 mb-3">
                  {consent.providerSpecialty}
                </p>
                <p className="font-mono text-sm mb-2">
                  Purpose: {consent.purpose}
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {consent.scopes.map((scope) => (
                    <span
                      key={scope}
                      className="px-2 py-1 bg-afrihealth-green bg-opacity-20 text-afrihealth-green rounded text-xs font-mono"
                    >
                      {scope.replace("_", " ")}
                    </span>
                  ))}
                </div>
                <div className="text-xs font-mono text-gray-500">
                  <p>Granted: {formatDate(consent.grantedAt)}</p>
                  <p>Expires: {formatDate(consent.expiresAt)}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {consent.status === "active" && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled
                      className="opacity-50 cursor-not-allowed"
                    >
                      Extend (Coming Soon)
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRevoke(consent.id)}
                      disabled={revokeConsentApi.loading}
                    >
                      {revokeConsentApi.loading ? "Revoking..." : "Revoke"}
                    </Button>
                  </>
                )}
                <Button
                  variant="success"
                  size="sm"
                  disabled
                  className="opacity-50 cursor-not-allowed"
                >
                  View Logs (Coming Soon)
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {consents.length === 0 && (
          <Card variant="default">
            <p className="text-center text-gray-500 font-mono text-sm py-8">
              No consent records found. Grant consent to providers to share your
              medical data.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============================================
// Billing Tab
// ============================================
interface BillingTabProps {
  bills: Bill[];
  loading: boolean;
  refetch: () => void;
}

function BillingTab({ bills, loading, refetch }: BillingTabProps) {
  const payInvoiceApi = usePayInvoice();

  const handlePay = async (invoiceId: string, amount: number) => {
    if (!confirm(`Pay ${formatCurrency(amount)}?`)) return;

    const result = await payInvoiceApi.execute({
      invoiceId,
      paymentMethod: 0,
    });
    if (result) {
      alert("Payment successful!");
      refetch();
    } else {
      alert("Payment failed: " + payInvoiceApi.error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-afrihealth-orange"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-lora text-3xl font-bold">Billing & Payments</h2>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            Download Statement
          </Button>
          <Button variant="success" size="sm">
            Payment History
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {bills.map((bill) => (
          <Card
            key={bill.id}
            variant={
              bill.status === "paid"
                ? "green"
                : bill.status === "pending_approval"
                ? "orange"
                : "default"
            }
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge
                    variant={
                      bill.status === "paid"
                        ? "success"
                        : bill.status === "pending_approval"
                        ? "warning"
                        : "info"
                    }
                  >
                    {bill.status.replace("_", " ").toUpperCase()}
                  </Badge>
                  <span className="font-mono text-sm text-gray-400">
                    {bill.billNumber}
                  </span>
                </div>
                <h3 className="font-lora text-2xl font-bold mb-2 text-afrihealth-orange">
                  {formatCurrency(bill.totalAmount)}
                </h3>
                <p className="font-mono text-sm text-gray-400 mb-3">
                  {bill.providerName}
                </p>

                {/* Bill Items */}
                <div className="space-y-2 mb-3">
                  {bill.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm font-mono"
                    >
                      <span>
                        {item.description} ({item.code})
                      </span>
                      <span>{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>

                {/* AI Recommendation */}
                {bill.aiRecommendation && (
                  <div className="p-3 bg-black bg-opacity-50 rounded mb-3">
                    <p className="font-mono text-xs text-afrihealth-green mb-1">
                      🤖 AI Recommendation:{" "}
                      {bill.aiRecommendation.action.toUpperCase()}
                    </p>
                    <p className="font-mono text-xs text-gray-400">
                      {bill.aiRecommendation.reason}
                    </p>
                    <p className="font-mono text-xs text-gray-500 mt-1">
                      Confidence:{" "}
                      {(bill.aiRecommendation.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                )}

                <div className="text-xs font-mono text-gray-500">
                  <p>Due: {formatDate(bill.dueDate)}</p>
                  {bill.paidDate && <p>Paid: {formatDate(bill.paidDate)}</p>}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {bill.status === "pending_approval" && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handlePay(bill.id, bill.totalAmount)}
                      disabled={payInvoiceApi.loading}
                    >
                      {payInvoiceApi.loading
                        ? "Processing..."
                        : "✓ Approve & Pay"}
                    </Button>
                    <Button variant="danger" size="sm">
                      ✗ Decline
                    </Button>
                    <Button variant="secondary" size="sm">
                      🤔 Review
                    </Button>
                  </>
                )}
                {bill.status === "paid" && (
                  <Button variant="success" size="sm">
                    📄 Receipt
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
        {bills.length === 0 && (
          <Card variant="default">
            <p className="text-center text-gray-500 font-mono text-sm py-8">
              No bills found. Bills from providers will appear here.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============================================
// Insurance Tab
// ============================================
interface InsuranceTabProps {
  claims: InsuranceClaim[];
  stats: PatientStats;
  loading: boolean;
  refetch: () => void;
}

function InsuranceTab({ claims, stats, loading, refetch }: InsuranceTabProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-afrihealth-orange"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="font-lora text-3xl font-bold">Insurance & Claims</h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={refetch}>
            Refresh
          </Button>
          <Button variant="primary">+ Submit New Claim</Button>
        </div>
      </div>

      {/* Coverage Summary */}
      <Card variant="green">
        <h3 className="font-lora text-2xl font-bold mb-4">Coverage Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="font-mono text-sm text-gray-400">Total Coverage</p>
            <p className="font-lora text-2xl font-bold text-afrihealth-green">
              {formatCurrency(stats.insuranceCoverage)}
            </p>
          </div>
          <div>
            <p className="font-mono text-sm text-gray-400">Claims Submitted</p>
            <p className="font-lora text-2xl font-bold">
              {stats.claimsSubmitted}
            </p>
          </div>
          <div>
            <p className="font-mono text-sm text-gray-400">Claims Approved</p>
            <p className="font-lora text-2xl font-bold text-afrihealth-green">
              {stats.claimsApproved}
            </p>
          </div>
          <div>
            <p className="font-mono text-sm text-gray-400">Approval Rate</p>
            <p className="font-lora text-2xl font-bold">
              {stats.claimsSubmitted > 0
                ? (
                    (stats.claimsApproved / stats.claimsSubmitted) *
                    100
                  ).toFixed(0)
                : 0}
              %
            </p>
          </div>
        </div>
      </Card>

      {/* Claims List */}
      <div className="grid grid-cols-1 gap-4">
        {claims.map((claim) => (
          <Card key={claim.id} variant="default">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge
                    variant={
                      claim.status === "approved" || claim.status === "paid"
                        ? "success"
                        : claim.status === "denied"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {claim.status.toUpperCase()}
                  </Badge>
                  <span className="font-mono text-sm text-gray-400">
                    {claim.claimNumber}
                  </span>
                </div>
                <h3 className="font-lora text-2xl font-bold mb-2">
                  {formatCurrency(claim.claimedAmount)}
                </h3>
                <p className="font-mono text-sm text-gray-400 mb-2">
                  Provider: {claim.providerName}
                </p>
                <p className="font-mono text-sm text-gray-400 mb-3">
                  Diagnosis: {claim.diagnosisCodes.join(", ")}
                </p>
                <div className="text-xs font-mono text-gray-500">
                  <p>Submitted: {formatDate(claim.submittedDate)}</p>
                  {claim.reviewedDate && (
                    <p>Reviewed: {formatDate(claim.reviewedDate)}</p>
                  )}
                  {claim.approvedAmount && (
                    <p className="text-afrihealth-green">
                      Approved: {formatCurrency(claim.approvedAmount)}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="secondary" size="sm">
                View Details
              </Button>
            </div>
          </Card>
        ))}
        {claims.length === 0 && (
          <Card variant="default">
            <p className="text-center text-gray-500 font-mono text-sm py-8">
              No insurance claims found. Submit claims for reimbursement.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============================================
// Prescriptions Tab (placeholder)
// ============================================
function PrescriptionsTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-lora text-3xl font-bold">Prescriptions</h2>
        <Badge variant="warning">🚧 COMING SOON</Badge>
      </div>

      <Card variant="default">
        <div className="text-center py-12">
          <p className="text-gray-400 font-mono text-lg mb-4">
            💊 Prescription Management
          </p>
          <p className="text-gray-500 font-mono text-sm">
            This feature is currently under development.
          </p>
          <p className="text-gray-600 font-mono text-xs mt-4">
            You'll be able to view prescriptions, request refills, and track
            medication history.
          </p>
        </div>
      </Card>
    </div>
  );
}

// ============================================
// Profile Tab (placeholder)
// ============================================
function ProfileTab() {
  const { address } = useAccount();

  return (
    <div className="space-y-6">
      <h2 className="font-lora text-3xl font-bold">Profile Settings</h2>

      <Card variant="default">
        <h3 className="font-lora text-xl font-bold mb-4">
          Account Information
        </h3>
        <div className="space-y-3">
          <div>
            <p className="font-mono text-sm text-gray-400">Wallet Address</p>
            <p className="font-mono text-lg font-bold text-afrihealth-green">
              {address || "Not Connected"}
            </p>
          </div>
          <div>
            <p className="font-mono text-sm text-gray-400">Role</p>
            <Badge variant="success">PATIENT</Badge>
          </div>
        </div>
      </Card>

      <Card variant="default">
        <p className="text-center text-gray-500 font-mono text-sm py-8">
          Profile editing coming soon.
        </p>
      </Card>
    </div>
  );
}
