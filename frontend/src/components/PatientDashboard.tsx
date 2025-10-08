import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Badge, Input } from "./UI";
import { useWalletStore } from "../stores";
import {
  getMockPatientStats,
  getMockBills,
  getMockAppointments,
  getMockActivities,
  formatDate,
  formatCurrency,
} from "../services/mockDataService";
import type { Bill, Appointment, Activity } from "../types";

// Import new contract-based components
import { MedicalRecords } from "./records/MedicalRecords";
import { InvoiceManagement } from "./billing/InvoiceManagement";
import { ClaimsManagement } from "./claims/ClaimsManagement";
import { ConsentManagement } from "./consent/ConsentManagement";
import { IdentityManagement } from "./identity/IdentityManagement";

type TabName =
  | "overview"
  | "records"
  | "appointments"
  | "consents"
  | "billing"
  | "insurance"
  | "identity"
  | "prescriptions"
  | "profile";

/**
 * Comprehensive Patient Dashboard
 */
export default function PatientDashboard() {
  const { accountId } = useWalletStore();
  const [activeTab, setActiveTab] = useState<TabName>("overview");

  // Load mock data (for overview only)
  const stats = getMockPatientStats();
  const bills = getMockBills();
  const appointments = getMockAppointments();
  const activities = getMockActivities();

  const tabs: { id: TabName; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "records", label: "Medical Records", icon: "📋" },
    { id: "appointments", label: "Appointments", icon: "📅" },
    { id: "consents", label: "Consents", icon: "🔐" },
    { id: "billing", label: "Billing", icon: "💰" },
    { id: "insurance", label: "Insurance", icon: "🏥" },
    { id: "identity", label: "Identity", icon: "🆔" },
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
            {activeTab === "records" && accountId && (
              <MedicalRecords patientId={accountId} />
            )}
            {activeTab === "consents" && accountId && (
              <ConsentManagement accountId={accountId} isProvider={false} />
            )}
            {activeTab === "billing" && accountId && (
              <InvoiceManagement accountId={accountId} isProvider={false} />
            )}
            {activeTab === "insurance" && accountId && (
              <ClaimsManagement accountId={accountId} isReviewer={false} />
            )}
            {activeTab === "identity" && accountId && (
              <IdentityManagement accountId={accountId} isAdmin={false} />
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
