import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Badge, Input } from "./UI";
import { useWalletStore } from "../stores";
import {
  getMockProviderStats,
  getMockAppointments,
  getMockMedicalRecords,
  getMockPatients,
  formatDate,
  formatCurrency,
} from "../services/mockDataService";
import type { PatientListItem } from "../types";

// Import new contract-based components
import { InvoiceManagement } from "./billing/InvoiceManagement";
import { ClaimsManagement } from "./claims/ClaimsManagement";
import { ConsentManagement } from "./consent/ConsentManagement";
import { MedicalRecords } from "./records/MedicalRecords";

type TabName =
  | "overview"
  | "patients"
  | "appointments"
  | "records"
  | "billing"
  | "claims"
  | "consents"
  | "profile";

/**
 * Stat Card Component
 */
interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  change?: string;
  color?: string;
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
      className={`bg-gray-900 border-2 ${
        colorClasses[color as keyof typeof colorClasses] || colorClasses.orange
      } rounded-lg p-4`}
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

/**
 * Comprehensive Provider Dashboard
 */
export default function ProviderDashboard() {
  const { accountId } = useWalletStore();
  const [activeTab, setActiveTab] = useState<TabName>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] =
    useState<PatientListItem | null>(null);

  // Load mock data (for overview and patients only)
  const stats = getMockProviderStats();
  const appointments = getMockAppointments();
  const records = getMockMedicalRecords();
  const patients = getMockPatients();

  // Filter data based on search
  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.accountId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs: { id: TabName; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "patients", label: "Patients", icon: "👥" },
    { id: "appointments", label: "Appointments", icon: "📅" },
    { id: "records", label: "Patient Records", icon: "📋" },
    { id: "billing", label: "Billing", icon: "💰" },
    { id: "claims", label: "Claims Review", icon: "🏥" },
    { id: "consents", label: "Consents", icon: "🔐" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  // Tab content rendering
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Patients"
                value={stats.totalPatients}
                icon="👥"
                change={`+${stats.newPatientsThisMonth} this month`}
                color="orange"
              />
              <StatCard
                title="Appointments Today"
                value={stats.appointmentsToday}
                icon="📅"
                change={`${stats.upcomingThisWeek} this week`}
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
                change="+12%"
                color="green"
              />
            </div>

            {/* Today's Schedule */}
            <Card>
              <h2 className="font-lora text-2xl font-bold mb-4 flex items-center gap-2">
                📅 <span>Today's Schedule</span>
              </h2>
              <div className="space-y-3">
                {appointments.slice(0, 5).map((apt) => (
                  <motion.div
                    key={apt.id}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-800"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-2xl">
                          {apt.type === "follow_up"
                            ? "🩺"
                            : apt.type === "consultation"
                            ? "💬"
                            : "🔬"}
                        </span>
                        <div>
                          <p className="font-mono font-bold">
                            {apt.patientName}
                          </p>
                          <p className="text-sm text-gray-400">
                            {apt.type.charAt(0).toUpperCase() +
                              apt.type.slice(1)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm text-afrihealth-orange">
                        {formatDate(apt.scheduledDate)}
                      </p>
                      <Badge
                        variant={
                          apt.status === "confirmed" ? "success" : "info"
                        }
                      >
                        {apt.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <h2 className="font-lora text-2xl font-bold mb-4">
                ⚡ Quick Actions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  onClick={() => setActiveTab("records")}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                >
                  <span className="text-2xl">📋</span>
                  <span className="text-sm">New Record</span>
                </Button>
                <Button
                  onClick={() => setActiveTab("billing")}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                >
                  <span className="text-2xl">💰</span>
                  <span className="text-sm">Create Bill</span>
                </Button>
                <Button
                  onClick={() => setActiveTab("patients")}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                >
                  <span className="text-2xl">👥</span>
                  <span className="text-sm">View Patients</span>
                </Button>
                <Button
                  onClick={() => setActiveTab("appointments")}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                >
                  <span className="text-2xl">📅</span>
                  <span className="text-sm">Schedule</span>
                </Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card>
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
              </div>
            </Card>
          </div>
        );

      case "patients":
        return (
          <div className="space-y-6">
            {/* Search Bar */}
            <Card>
              <Input
                placeholder="🔍 Search patients by name or account ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </Card>

            {/* Patients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map((patient) => (
                <motion.div
                  key={patient.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedPatient(patient)}
                  className="cursor-pointer"
                >
                  <Card>
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-afrihealth-green rounded-full flex items-center justify-center text-2xl">
                        👤
                      </div>
                      <div className="flex-1">
                        <h3 className="font-lora text-xl font-bold mb-1">
                          {patient.name}
                        </h3>
                        <p className="text-xs text-gray-400 font-mono mb-2">
                          {patient.accountId}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="info">{patient.age} years</Badge>
                          <Badge variant="info">{patient.gender}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-gray-400">Records</p>
                          <p className="font-mono font-bold text-afrihealth-orange">
                            {patient.recordCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Visits</p>
                          <p className="font-mono font-bold text-afrihealth-green">
                            {patient.visitCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Last Visit</p>
                          <p className="font-mono text-xs">
                            {formatDate(patient.lastVisit).split(" ")[0]}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Patient Details Modal */}
            <AnimatePresence>
              {selectedPatient && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
                  onClick={() => setSelectedPatient(null)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-gray-900 border-2 border-afrihealth-orange rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="font-lora text-3xl font-bold mb-2">
                          {selectedPatient.name}
                        </h2>
                        <p className="font-mono text-sm text-gray-400">
                          {selectedPatient.accountId}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedPatient(null)}
                        className="text-2xl hover:text-afrihealth-red"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-400">Age</p>
                          <p className="font-mono font-bold">
                            {selectedPatient.age} years
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Gender</p>
                          <p className="font-mono font-bold">
                            {selectedPatient.gender}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Blood Type</p>
                          <p className="font-mono font-bold">
                            {selectedPatient.bloodType || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Last Visit</p>
                          <p className="font-mono text-sm">
                            {formatDate(selectedPatient.lastVisit)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-400 mb-2">Contact</p>
                        <p className="font-mono text-sm">
                          {selectedPatient.email || "No email on file"}
                        </p>
                        <p className="font-mono text-sm">
                          {selectedPatient.phone || "No phone on file"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-400 mb-2">
                          Medical History
                        </p>
                        <div className="bg-black p-4 rounded-lg">
                          <p className="font-mono text-sm text-gray-300">
                            {selectedPatient.medicalHistory ||
                              "No medical history available"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-4">
                        <Button
                          onClick={() => {
                            setActiveTab("records");
                            setSelectedPatient(null);
                          }}
                        >
                          View Records
                        </Button>
                        <Button
                          onClick={() => {
                            setActiveTab("appointments");
                            setSelectedPatient(null);
                          }}
                        >
                          Schedule
                        </Button>
                        <Button
                          onClick={() => {
                            setActiveTab("billing");
                            setSelectedPatient(null);
                          }}
                        >
                          Bill Patient
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case "appointments":
        return (
          <div className="space-y-6">
            <Card>
              <h2 className="font-lora text-2xl font-bold mb-4">
                📅 All Appointments
              </h2>
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <motion.div
                    key={apt.id}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-800"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-3xl">
                        {apt.type === "follow_up"
                          ? "🩺"
                          : apt.type === "consultation"
                          ? "💬"
                          : "🔬"}
                      </span>
                      <div className="flex-1">
                        <p className="font-mono font-bold text-lg">
                          {apt.patientName}
                        </p>
                        <p className="text-sm text-gray-400">
                          {apt.type.charAt(0).toUpperCase() + apt.type.slice(1)}
                        </p>
                        <p className="text-xs text-gray-500 font-mono mt-1">
                          Patient ID: {apt.patientId}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm text-afrihealth-orange mb-1">
                        {formatDate(apt.scheduledDate)}
                      </p>
                      <Badge
                        variant={
                          apt.status === "confirmed"
                            ? "success"
                            : apt.status === "completed"
                            ? "info"
                            : "danger"
                        }
                      >
                        {apt.status}
                      </Badge>
                      {apt.status === "confirmed" && (
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => alert("Start consultation")}
                          >
                            Start
                          </Button>
                          <Button size="sm" onClick={() => alert("Reschedule")}>
                            Reschedule
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>
        );

      case "records":
        return accountId && selectedPatient ? (
          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-lora text-2xl font-bold">
                  Patient Records
                </h2>
                <Button
                  variant="secondary"
                  onClick={() => setSelectedPatient(null)}
                >
                  ← Back to Patients
                </Button>
              </div>
              <MedicalRecords patientId={selectedPatient.accountId} />
            </Card>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">
              Select a patient to view their medical records
            </p>
            <Button onClick={() => setActiveTab("patients")}>
              View Patients
            </Button>
          </div>
        );

      case "billing":
        return accountId ? (
          <InvoiceManagement accountId={accountId} isProvider={true} />
        ) : null;

      case "claims":
        return accountId ? (
          <ClaimsManagement accountId={accountId} isReviewer={true} />
        ) : null;

      case "consents":
        return accountId ? (
          <ConsentManagement accountId={accountId} isProvider={true} />
        ) : null;

      case "profile":
        return (
          <div className="space-y-6">
            <Card>
              <h2 className="font-lora text-2xl font-bold mb-4">
                👤 Provider Profile
              </h2>
              <div className="flex items-start gap-6 mb-6">
                <div className="w-32 h-32 bg-afrihealth-green rounded-full flex items-center justify-center text-5xl">
                  👨‍⚕️
                </div>
                <div className="flex-1">
                  <h3 className="font-lora text-3xl font-bold mb-2">
                    Dr. Sarah Johnson
                  </h3>
                  <p className="font-mono text-sm text-gray-400 mb-4">
                    Account: {accountId || "0.0.234567"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="success">Verified Provider</Badge>
                    <Badge variant="info">General Practitioner</Badge>
                    <Badge variant="info">15 Years Experience</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-mono font-bold mb-3 text-afrihealth-orange">
                    Professional Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">License Number</p>
                      <p className="font-mono">MD-123456-CA</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Specialization</p>
                      <p className="font-mono">
                        Family Medicine, Internal Medicine
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">
                        Hospital Affiliation
                      </p>
                      <p className="font-mono">City General Hospital</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Years of Practice</p>
                      <p className="font-mono">15 years</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-mono font-bold mb-3 text-afrihealth-orange">
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="font-mono">dr.johnson@hospital.com</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Phone</p>
                      <p className="font-mono">+1 (555) 123-4567</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Office Address</p>
                      <p className="font-mono text-sm">
                        123 Medical Plaza, Suite 400
                        <br />
                        San Francisco, CA 94102
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-800">
                <h4 className="font-mono font-bold mb-3 text-afrihealth-orange">
                  Performance Metrics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-900 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">
                      Patient Satisfaction
                    </p>
                    <p className="font-lora text-3xl font-bold text-afrihealth-green">
                      4.9/5
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-900 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">
                      Total Consultations
                    </p>
                    <p className="font-lora text-3xl font-bold text-afrihealth-orange">
                      2,456
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-900 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Success Rate</p>
                    <p className="font-lora text-3xl font-bold text-afrihealth-green">
                      98%
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-900 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Response Time</p>
                    <p className="font-lora text-3xl font-bold text-afrihealth-orange">
                      12min
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button>Edit Profile</Button>
                <Button variant="secondary">Update Credentials</Button>
                <Button variant="secondary">View Public Profile</Button>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4 md:p-8">
      {/* Header */}
      <div className="mb-10 text-center max-w-7xl mx-auto">
        <h1 className="font-lora text-5xl md:text-6xl lg:text-7xl font-bold mb-4">
          Provider <span className="text-afrihealth-orange">Portal</span>
        </h1>
        <p className="font-mono text-base md:text-lg text-gray-400">
          Account:{" "}
          <span className="text-afrihealth-green font-bold">
            {accountId || "0.0.234567"}
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
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
