/**
 * Fully Integrated Provider Dashboard with Real API Integration
 * NO MOCK DATA - All data from backend API
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Badge, Input } from "./UI";
import { useWalletStore } from "../stores";
import {
  useProviderConsents,
  useProviderInvoices,
  useProviderRecords,
  useProviderClaims,
  useCreateRecord,
  useCreateInvoice,
} from "../hooks";
import { formatDate, formatCurrency } from "../services/mockDataService";
import type { Consent, Bill, MedicalRecord, InsuranceClaim } from "../types";

type TabName =
  | "overview"
  | "patients"
  | "appointments"
  | "records"
  | "billing"
  | "consents"
  | "profile";

/**
 * Comprehensive Provider Dashboard - Fully Integrated
 */
export default function ProviderDashboard() {
  const { accountId } = useWalletStore();
  const [activeTab, setActiveTab] = useState<TabName>("overview");
  const [searchQuery, setSearchQuery] = useState("");

  // Real API data hooks
  const {
    consents,
    loading: consentsLoading,
    refetch: refetchConsents,
  } = useProviderConsents(accountId);
  const {
    invoices,
    loading: invoicesLoading,
    refetch: refetchInvoices,
  } = useProviderInvoices(accountId);
  const {
    records,
    loading: recordsLoading,
    refetch: refetchRecords,
  } = useProviderRecords(accountId);
  const {
    claims,
    loading: claimsLoading,
    refetch: refetchClaims,
  } = useProviderClaims(accountId);

  // Calculate stats from real data
  const stats = {
    totalPatients: new Set(consents.map((c) => c.patientId)).size,
    activeConsents: consents.filter((c) => c.status === "active").length,
    pendingReviews: invoices.filter((b) => b.status === "pending_approval")
      .length,
    monthlyRevenue: invoices
      .filter((b) => b.status === "paid")
      .reduce((sum, b) => sum + b.totalAmount, 0),
    totalRecords: records.length,
    claimsProcessed: claims.filter(
      (c) => c.status === "approved" || c.status === "paid"
    ).length,
  };

  const tabs: { id: TabName; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "patients", label: "Patients", icon: "👥" },
    { id: "appointments", label: "Appointments", icon: "📅" },
    { id: "records", label: "Medical Records", icon: "📋" },
    { id: "billing", label: "Billing", icon: "💰" },
    { id: "consents", label: "Consents", icon: "🔐" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4 md:p-8">
      {/* Header */}
      <div className="mb-10 text-center max-w-7xl mx-auto">
        <h1 className="font-lora text-5xl md:text-6xl lg:text-7xl font-bold mb-4">
          Provider <span className="text-afrihealth-green">Portal</span>
        </h1>
        <p className="font-mono text-base md:text-lg text-gray-400">
          Account:{" "}
          <span className="text-afrihealth-green font-bold">
            {accountId || "Not Connected"}
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
                  ? "bg-afrihealth-green text-black scale-105"
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
                records={records}
                invoices={invoices}
                loading={recordsLoading || invoicesLoading}
              />
            )}
            {activeTab === "patients" && (
              <PatientsTab consents={consents} loading={consentsLoading} />
            )}
            {activeTab === "appointments" && <AppointmentsTab />}
            {activeTab === "records" && (
              <RecordsTab
                records={records}
                loading={recordsLoading}
                refetch={refetchRecords}
              />
            )}
            {activeTab === "billing" && (
              <BillingTab
                bills={invoices}
                loading={invoicesLoading}
                refetch={refetchInvoices}
              />
            )}
            {activeTab === "consents" && (
              <ConsentsTab
                consents={consents}
                loading={consentsLoading}
                refetch={refetchConsents}
              />
            )}
            {activeTab === "profile" && <ProfileTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================
// Stat Card Component
// ============================================
interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  change?: string;
  color?: "orange" | "green" | "red";
}

function StatCard({
  title,
  value,
  icon,
  change,
  color = "orange",
}: StatCardProps) {
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
      <div className="flex items-start justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        {change && (
          <Badge variant={change.startsWith("+") ? "success" : "danger"}>
            {change}
          </Badge>
        )}
      </div>
      <h3 className="font-mono text-sm text-gray-400 mb-1">{title}</h3>
      <p className="font-lora text-3xl font-bold">{value}</p>
    </motion.div>
  );
}

// ============================================
// Overview Tab
// ============================================
interface OverviewTabProps {
  stats: any;
  records: MedicalRecord[];
  invoices: Bill[];
  loading: boolean;
}

function OverviewTab({ stats, records, invoices, loading }: OverviewTabProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-afrihealth-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          icon="👥"
          color="orange"
        />
        <StatCard
          title="Active Consents"
          value={stats.activeConsents}
          icon="🔐"
          color="green"
        />
        <StatCard
          title="Pending Reviews"
          value={stats.pendingReviews}
          icon="📋"
          color="orange"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          icon="💰"
          color="green"
        />
      </div>

      {/* Quick Actions */}
      <Card variant="default">
        <h2 className="font-lora text-2xl font-bold mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="primary"
            className="h-24 flex flex-col items-center justify-center gap-2"
          >
            <span className="text-2xl">📋</span>
            <span className="text-sm">New Record</span>
          </Button>
          <Button
            variant="secondary"
            className="h-24 flex flex-col items-center justify-center gap-2"
          >
            <span className="text-2xl">💰</span>
            <span className="text-sm">Create Bill</span>
          </Button>
          <Button
            variant="success"
            className="h-24 flex flex-col items-center justify-center gap-2"
          >
            <span className="text-2xl">👥</span>
            <span className="text-sm">View Patients</span>
          </Button>
          <Button
            variant="danger"
            className="h-24 flex flex-col items-center justify-center gap-2"
          >
            <span className="text-2xl">📅</span>
            <span className="text-sm">Schedule</span>
          </Button>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card variant="default">
        <h2 className="font-lora text-2xl font-bold mb-4">
          📈 Recent Activity
        </h2>
        <div className="space-y-2">
          {records.slice(0, 5).map((record) => (
            <div
              key={record.id}
              className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg"
            >
              <span className="text-xl">📋</span>
              <div className="flex-1">
                <p className="font-mono text-sm">
                  Record created for patient{" "}
                  <span className="text-afrihealth-orange">
                    {record.patientId}
                  </span>
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(record.date)}
                </p>
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <p className="text-center text-gray-500 font-mono text-sm py-4">
              No recent activity. Start by creating medical records.
            </p>
          )}
        </div>
      </Card>

      {/* Pending Invoices */}
      <Card variant="orange">
        <h2 className="font-lora text-2xl font-bold mb-4">
          💰 Pending Invoices
        </h2>
        <div className="space-y-2">
          {invoices
            .filter((b) => b.status === "pending_approval")
            .slice(0, 3)
            .map((invoice) => (
              <div
                key={invoice.id}
                className="flex justify-between items-center p-3 bg-black bg-opacity-30 rounded"
              >
                <div>
                  <p className="font-mono font-bold">{invoice.billNumber}</p>
                  <p className="font-mono text-xs text-gray-400">
                    Patient: {invoice.patientId}
                  </p>
                </div>
                <p className="font-lora text-xl font-bold text-afrihealth-orange">
                  {formatCurrency(invoice.totalAmount)}
                </p>
              </div>
            ))}
          {invoices.filter((b) => b.status === "pending_approval").length ===
            0 && (
            <p className="text-center text-gray-500 font-mono text-sm py-4">
              No pending invoices.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

// ============================================
// Patients Tab
// ============================================
interface PatientsTabProps {
  consents: Consent[];
  loading: boolean;
}

function PatientsTab({ consents, loading }: PatientsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Get unique patients from consents
  const uniquePatients = Array.from(
    new Set(consents.map((c) => c.patientId))
  ).map((patientId) => {
    const patientConsents = consents.filter((c) => c.patientId === patientId);
    return {
      patientId,
      consents: patientConsents,
      activeConsents: patientConsents.filter((c) => c.status === "active")
        .length,
    };
  });

  const filteredPatients = uniquePatients.filter((p) =>
    p.patientId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-afrihealth-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-lora text-3xl font-bold">My Patients</h2>
      </div>

      {/* Search Bar */}
      <Card variant="default">
        <Input
          placeholder="🔍 Search patients by account ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </Card>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map((patient) => (
          <motion.div
            key={patient.patientId}
            whileHover={{ scale: 1.02 }}
            className="cursor-pointer"
          >
            <Card variant="default">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-afrihealth-green rounded-full flex items-center justify-center text-2xl">
                  👤
                </div>
                <div className="flex-1">
                  <h3 className="font-lora text-xl font-bold mb-1">Patient</h3>
                  <p className="text-xs text-gray-400 font-mono mb-2">
                    {patient.patientId}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="success">
                      {patient.activeConsents} Active Consents
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="primary" size="sm" fullWidth>
                  View Records
                </Button>
                <Button variant="secondary" size="sm" fullWidth>
                  Create Bill
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
        {filteredPatients.length === 0 && (
          <Card variant="default" className="col-span-full">
            <p className="text-center text-gray-500 font-mono text-sm py-8">
              No patients found. Patients will appear here after they grant you
              consent.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============================================
// Appointments Tab (placeholder)
// ============================================
function AppointmentsTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-lora text-3xl font-bold">Appointments</h2>
        <Button variant="primary">Schedule New</Button>
      </div>

      <Card variant="default">
        <p className="text-center text-gray-500 font-mono text-sm py-8">
          Appointment scheduling coming soon via Hedera Consensus Service.
        </p>
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
  const createRecordApi = useCreateRecord();

  const filteredRecords =
    filter === "all" ? records : records.filter((r) => r.type === filter);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-afrihealth-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-lora text-3xl font-bold">Medical Records</h2>
        <div className="flex gap-2">
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
          </select>
          <Button variant="primary">+ Create Record</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredRecords.map((record) => (
          <Card key={record.id} variant="default">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="success">
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
                  Patient: {record.patientId}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="secondary" size="sm">
                  View Details
                </Button>
                <Button variant="success" size="sm">
                  Edit
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {filteredRecords.length === 0 && (
          <Card variant="default">
            <p className="text-center text-gray-500 font-mono text-sm py-8">
              No medical records found. Create records for your patients.
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
  const createInvoiceApi = useCreateInvoice();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-afrihealth-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-lora text-3xl font-bold">Billing & Invoices</h2>
        <Button variant="primary">+ Create Invoice</Button>
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
                <h3 className="font-lora text-2xl font-bold mb-2 text-afrihealth-green">
                  {formatCurrency(bill.totalAmount)}
                </h3>
                <p className="font-mono text-sm text-gray-400 mb-3">
                  Patient: {bill.patientId}
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

                <div className="text-xs font-mono text-gray-500">
                  <p>Due: {formatDate(bill.dueDate)}</p>
                  {bill.paidDate && <p>Paid: {formatDate(bill.paidDate)}</p>}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="secondary" size="sm">
                  View Details
                </Button>
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
              No invoices found. Create invoices for your patients.
            </p>
          </Card>
        )}
      </div>
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
}

function ConsentsTab({ consents, loading, refetch }: ConsentsTabProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-afrihealth-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-lora text-3xl font-bold">Patient Consents</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {consents.map((consent) => (
          <Card key={consent.id} variant="default">
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
                  Patient: {consent.patientId}
                </h3>
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
                    <Button variant="primary" size="sm">
                      View Records
                    </Button>
                    <Button variant="secondary" size="sm">
                      Create Bill
                    </Button>
                  </>
                )}
                <Button variant="success" size="sm">
                  View Logs
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {consents.length === 0 && (
          <Card variant="default">
            <p className="text-center text-gray-500 font-mono text-sm py-8">
              No consent records found. Patients must grant you consent to
              appear here.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============================================
// Profile Tab
// ============================================
function ProfileTab() {
  const { accountId } = useWalletStore();

  return (
    <div className="space-y-6">
      <h2 className="font-lora text-3xl font-bold">Provider Profile</h2>

      <Card variant="default">
        <h3 className="font-lora text-xl font-bold mb-4">
          Account Information
        </h3>
        <div className="space-y-3">
          <div>
            <p className="font-mono text-sm text-gray-400">Hedera Account ID</p>
            <p className="font-mono text-lg font-bold text-afrihealth-green">
              {accountId || "Not Connected"}
            </p>
          </div>
          <div>
            <p className="font-mono text-sm text-gray-400">Role</p>
            <Badge variant="success">PROVIDER</Badge>
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
