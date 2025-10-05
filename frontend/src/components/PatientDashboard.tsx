import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Badge, Input } from "./UI";
import { useWalletStore } from "../stores";
import {
  getMockPatientStats,
  getMockConsents,
  getMockBills,
  getMockAppointments,
  getMockMedicalRecords,
  getMockInsuranceClaims,
  getMockActivities,
  formatDate,
  formatCurrency,
} from "../services/mockDataService";
import type {
  Consent,
  Bill,
  Appointment,
  MedicalRecord,
  InsuranceClaim,
  Activity,
} from "../types";

type TabName =
  | "overview"
  | "records"
  | "appointments"
  | "consents"
  | "billing"
  | "insurance"
  | "prescriptions"
  | "profile";

/**
 * Comprehensive Patient Dashboard
 */
export default function PatientDashboard() {
  const { accountId } = useWalletStore();
  const [activeTab, setActiveTab] = useState<TabName>("overview");

  // Load mock data
  const stats = getMockPatientStats();
  const consents = getMockConsents();
  const bills = getMockBills();
  const appointments = getMockAppointments();
  const records = getMockMedicalRecords();
  const claims = getMockInsuranceClaims();
  const activities = getMockActivities();

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
      <div className="mb-10 text-center max-w-7xl mx-auto">
        <h1 className="font-lora text-5xl md:text-6xl lg:text-7xl font-bold mb-4">
          Patient <span className="text-afrihealth-orange">Portal</span>
        </h1>
        <p className="font-mono text-base md:text-lg text-gray-400">
          Account:{" "}
          <span className="text-afrihealth-green font-bold">
            {accountId || "0.0.123456"}
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
              activities={activities}
              appointments={appointments}
              bills={bills}
            />
          )}
          {activeTab === "records" && <RecordsTab records={records} />}
          {activeTab === "appointments" && (
            <AppointmentsTab appointments={appointments} />
          )}
          {activeTab === "consents" && <ConsentsTab consents={consents} />}
          {activeTab === "billing" && <BillingTab bills={bills} />}
          {activeTab === "insurance" && (
            <InsuranceTab claims={claims} stats={stats} />
          )}
          {activeTab === "prescriptions" && <PrescriptionsTab />}
          {activeTab === "profile" && <ProfileTab />}
        </motion.div>
      </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================
// Overview Tab
// ============================================
interface OverviewTabProps {
  stats: ReturnType<typeof getMockPatientStats>;
  activities: Activity[];
  appointments: Appointment[];
  bills: Bill[];
}

function OverviewTab({
  stats,
  activities,
  appointments,
  bills,
}: OverviewTabProps) {
  const upcomingAppointment = appointments.find(
    (a) => a.status === "scheduled"
  );
  const pendingBill = bills.find((b) => b.status === "pending_approval");

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
          <Button variant="primary" size="sm" fullWidth>
            📅 Book Appointment
          </Button>
          <Button variant="secondary" size="sm" fullWidth>
            📋 View Records
          </Button>
          <Button variant="success" size="sm" fullWidth>
            💊 Refill Prescription
          </Button>
          <Button variant="danger" size="sm" fullWidth>
            🆘 Emergency Access
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointment */}
        {upcomingAppointment && (
          <Card variant="green">
            <h3 className="font-lora text-xl font-bold mb-4">
              Next Appointment
            </h3>
            <div className="space-y-2">
              <p className="font-mono text-sm">
                <span className="text-gray-400">Provider:</span>{" "}
                {upcomingAppointment.providerName}
              </p>
              <p className="font-mono text-sm">
                <span className="text-gray-400">Date:</span>{" "}
                {new Date(
                  upcomingAppointment.scheduledDate
                ).toLocaleDateString()}{" "}
                at{" "}
                {new Date(
                  upcomingAppointment.scheduledDate
                ).toLocaleTimeString()}
              </p>
              <p className="font-mono text-sm">
                <span className="text-gray-400">Reason:</span>{" "}
                {upcomingAppointment.reason}
              </p>
              <Button variant="success" size="sm" className="mt-4">
                View Details
              </Button>
            </div>
          </Card>
        )}

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
      </div>

      {/* Recent Activity */}
      <Card variant="default">
        <h3 className="font-lora text-2xl font-bold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {activities.slice(0, 5).map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
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
}

function RecordsTab({ records }: RecordsTabProps) {
  const [filter, setFilter] = useState<string>("all");

  const filteredRecords =
    filter === "all" ? records : records.filter((r) => r.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-lora text-3xl font-bold">Medical Records</h2>
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
      </div>
    </div>
  );
}

// ============================================
// Appointments Tab
// ============================================
interface AppointmentsTabProps {
  appointments: Appointment[];
}

function AppointmentsTab({ appointments }: AppointmentsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-lora text-3xl font-bold">Appointments</h2>
        <Button variant="primary">📅 Book New Appointment</Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {appointments.map((apt) => (
          <Card
            key={apt.id}
            variant={apt.status === "scheduled" ? "green" : "default"}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant={
                      apt.status === "completed"
                        ? "success"
                        : apt.status === "scheduled"
                        ? "info"
                        : "warning"
                    }
                  >
                    {apt.status.toUpperCase()}
                  </Badge>
                  <Badge variant="info">{apt.type.replace("_", " ")}</Badge>
                </div>
                <h3 className="font-lora text-xl font-bold mb-2">
                  {apt.providerName}
                </h3>
                <p className="font-mono text-sm text-gray-400 mb-2">
                  {apt.providerSpecialty}
                </p>
                <p className="font-mono text-sm">
                  📅 {new Date(apt.scheduledDate).toLocaleDateString()} at{" "}
                  {new Date(apt.scheduledDate).toLocaleTimeString()}
                </p>
                <p className="font-mono text-sm text-gray-400 mt-2">
                  Reason: {apt.reason}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {apt.status === "scheduled" && (
                  <>
                    <Button variant="success" size="sm">
                      Confirm
                    </Button>
                    <Button variant="danger" size="sm">
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Consents Tab
// ============================================
interface ConsentsTabProps {
  consents: Consent[];
}

function ConsentsTab({ consents }: ConsentsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-lora text-3xl font-bold">Access Consents</h2>
        <Button variant="primary">+ Grant New Consent</Button>
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
                    <Button variant="secondary" size="sm">
                      Extend
                    </Button>
                    <Button variant="danger" size="sm">
                      Revoke
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
      </div>
    </div>
  );
}

// ============================================
// Billing Tab
// ============================================
interface BillingTabProps {
  bills: Bill[];
}

function BillingTab({ bills }: BillingTabProps) {
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
                    <Button variant="success" size="sm">
                      ✓ Approve & Pay
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
      </div>
    </div>
  );
}

// ============================================
// Insurance Tab
// ============================================
interface InsuranceTabProps {
  claims: InsuranceClaim[];
  stats: ReturnType<typeof getMockPatientStats>;
}

function InsuranceTab({ claims, stats }: InsuranceTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-lora text-3xl font-bold">Insurance & Claims</h2>
        <Button variant="primary">+ Submit New Claim</Button>
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
              {((stats.claimsApproved / stats.claimsSubmitted) * 100).toFixed(
                0
              )}
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
                    {claim.status.replace("_", " ").toUpperCase()}
                  </Badge>
                  <span className="font-mono text-sm text-gray-400">
                    {claim.claimNumber}
                  </span>
                </div>
                <h3 className="font-lora text-xl font-bold mb-2">
                  {formatCurrency(claim.claimedAmount)}
                </h3>
                <p className="font-mono text-sm text-gray-400 mb-2">
                  Provider: {claim.providerName}
                </p>
                <p className="font-mono text-sm text-gray-400 mb-3">
                  Submitted: {formatDate(claim.submittedDate)}
                </p>
                {claim.approvedAmount && (
                  <p className="font-mono text-sm text-afrihealth-green mb-2">
                    Approved: {formatCurrency(claim.approvedAmount)}
                  </p>
                )}
                {claim.reviewerNotes && (
                  <p className="font-mono text-xs text-gray-500">
                    Note: {claim.reviewerNotes}
                  </p>
                )}
              </div>
              <Button variant="secondary" size="sm">
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Prescriptions Tab
// ============================================
function PrescriptionsTab() {
  const prescriptions = [
    {
      id: "1",
      medication: "Lisinopril 10mg",
      dosage: "1 tablet daily",
      refills: 2,
      prescriber: "Dr. Sarah Johnson",
      expires: "2025-06-01",
      status: "active",
    },
    {
      id: "2",
      medication: "Metformin 500mg",
      dosage: "2 tablets twice daily",
      refills: 0,
      prescriber: "Dr. Sarah Johnson",
      expires: "2025-04-15",
      status: "refill_needed",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-lora text-3xl font-bold">Prescriptions</h2>
        <Button variant="primary">💊 Request Refill</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prescriptions.map((rx) => (
          <Card key={rx.id} variant="default">
            <div className="flex justify-between items-start mb-3">
              <Badge
                variant={
                  rx.status === "active"
                    ? "success"
                    : rx.status === "refill_needed"
                    ? "warning"
                    : "danger"
                }
              >
                {rx.status.replace("_", " ").toUpperCase()}
              </Badge>
              <Badge variant="info">{rx.refills} refills left</Badge>
            </div>
            <h3 className="font-lora text-xl font-bold mb-2">
              {rx.medication}
            </h3>
            <p className="font-mono text-sm text-gray-400 mb-2">{rx.dosage}</p>
            <p className="font-mono text-sm text-gray-500 mb-2">
              Prescribed by: {rx.prescriber}
            </p>
            <p className="font-mono text-xs text-gray-600 mb-4">
              Expires: {rx.expires}
            </p>
            <div className="flex gap-2">
              {rx.status === "refill_needed" && (
                <Button variant="success" size="sm" fullWidth>
                  Request Refill
                </Button>
              )}
              <Button variant="secondary" size="sm" fullWidth>
                Details
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Profile Tab
// ============================================
function ProfileTab() {
  return (
    <div className="space-y-6">
      <h2 className="font-lora text-3xl font-bold">Profile & Settings</h2>

      <Card variant="default">
        <h3 className="font-lora text-2xl font-bold mb-6">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Full Name" value="John Doe" />
          <Input label="Date of Birth" value="1990-01-15" type="date" />
          <Input label="Email" value="john.doe@example.com" type="email" />
          <Input label="Phone" value="+1 234 567 8900" type="tel" />
          <Input label="Blood Type" value="A+" />
          <Input label="Allergies" value="Penicillin, Peanuts" />
        </div>
        <Button variant="primary" className="mt-6">
          Save Changes
        </Button>
      </Card>

      <Card variant="orange">
        <h3 className="font-lora text-2xl font-bold mb-6">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Name" value="Jane Doe" />
          <Input label="Relationship" value="Spouse" />
          <Input label="Phone" value="+1 234 567 8901" type="tel" />
          <Input label="Email" value="jane.doe@example.com" type="email" />
        </div>
        <Button variant="success" className="mt-6">
          Update Emergency Contact
        </Button>
      </Card>

      <Card variant="green">
        <h3 className="font-lora text-2xl font-bold mb-6">AI Preferences</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-5 h-5" />
            <span className="font-mono text-sm">
              Auto-approve bills under $100
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-5 h-5" />
            <span className="font-mono text-sm">
              Get AI recommendations for billing
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="w-5 h-5" />
            <span className="font-mono text-sm">
              Auto-submit insurance claims
            </span>
          </label>
        </div>
        <Button variant="primary" className="mt-6">
          Save Preferences
        </Button>
      </Card>
    </div>
  );
}

// ============================================
// Helper Components
// ============================================
interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: "orange" | "green" | "red";
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorClasses = {
    orange: "border-afrihealth-orange text-afrihealth-orange",
    green: "border-afrihealth-green text-afrihealth-green",
    red: "border-afrihealth-red text-afrihealth-red",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`bg-black border-2 ${colorClasses[color]} rounded-lg p-6`}
    >
      <div className="text-4xl mb-2">{icon}</div>
      <div className="font-lora text-3xl font-bold mb-1">{value}</div>
      <div className="font-mono text-xs text-gray-400">{label}</div>
    </motion.div>
  );
}

interface ActivityItemProps {
  activity: Activity;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const icons: Record<Activity["type"], string> = {
    consent_granted: "🔐",
    consent_revoked: "🔓",
    record_accessed: "📋",
    record_created: "📝",
    appointment_scheduled: "📅",
    bill_created: "💰",
    bill_paid: "💵",
    claim_submitted: "🏥",
    claim_approved: "✅",
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">
      <div className="text-2xl">{icons[activity.type]}</div>
      <div className="flex-1">
        <p className="font-mono text-sm font-bold">{activity.title}</p>
        <p className="font-mono text-xs text-gray-400">
          {activity.description}
        </p>
      </div>
      <span className="font-mono text-xs text-gray-500">
        {formatDate(activity.timestamp)}
      </span>
    </div>
  );
}
