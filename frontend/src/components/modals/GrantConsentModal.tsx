import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "../UI";
import { useGrantConsent } from "../../hooks/useConsent";

interface GrantConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GrantConsentModal({
  isOpen,
  onClose,
  onSuccess,
}: GrantConsentModalProps) {
  const grantConsentApi = useGrantConsent();
  const [formData, setFormData] = useState({
    provider: "",
    purpose: "",
    scopes: [] as string[],
    expirationDays: 30,
  });

  const availableScopes = [
    { value: "view_medical_history", label: "View Medical History" },
    { value: "view_prescriptions", label: "View Prescriptions" },
    { value: "view_lab_results", label: "View Lab Results" },
    { value: "write_prescriptions", label: "Write Prescriptions" },
    { value: "update_records", label: "Update Records" },
    { value: "emergency_access", label: "Emergency Access" },
  ];

  const handleScopeToggle = (scope: string) => {
    setFormData((prev) => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter((s) => s !== scope)
        : [...prev.scopes, scope],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.provider || formData.scopes.length === 0) {
      alert("Please fill in all required fields");
      return;
    }

    const expirationTime =
      Math.floor(Date.now() / 1000) + formData.expirationDays * 24 * 60 * 60;

    const result = await grantConsentApi.execute({
      provider: formData.provider,
      scopes: formData.scopes,
      expirationTime,
      purpose: formData.purpose || undefined,
    });

    if (result) {
      alert("Consent granted successfully!");
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        provider: "",
        purpose: "",
        scopes: [],
        expirationDays: 30,
      });
    } else {
      alert(`Failed to grant consent: ${grantConsentApi.error}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-afrihealth-gray-900 border-2 border-afrihealth-orange/30 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-afrihealth-orange/10 to-afrihealth-green/10 p-6 border-b border-afrihealth-gray-700">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-afrihealth-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <h2 className="font-lora text-3xl font-bold text-white mb-2">
                  Grant New Consent
                </h2>
                <p className="text-afrihealth-gray-300 font-mono text-sm">
                  Allow a healthcare provider to access your medical records
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Provider Address */}
                <div>
                  <label className="block text-sm font-mono font-bold text-afrihealth-orange mb-2">
                    Provider Wallet Address *
                  </label>
                  <input
                    type="text"
                    value={formData.provider}
                    onChange={(e) =>
                      setFormData({ ...formData, provider: e.target.value })
                    }
                    placeholder="0x..."
                    className="w-full px-4 py-3 bg-afrihealth-gray-800 border border-afrihealth-gray-700 rounded-lg text-white font-mono focus:outline-none focus:border-afrihealth-orange"
                    required
                  />
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-sm font-mono font-bold text-afrihealth-orange mb-2">
                    Purpose (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.purpose}
                    onChange={(e) =>
                      setFormData({ ...formData, purpose: e.target.value })
                    }
                    placeholder="e.g., Annual checkup, Surgery consultation"
                    className="w-full px-4 py-3 bg-afrihealth-gray-800 border border-afrihealth-gray-700 rounded-lg text-white font-mono focus:outline-none focus:border-afrihealth-orange"
                  />
                </div>

                {/* Scopes */}
                <div>
                  <label className="block text-sm font-mono font-bold text-afrihealth-orange mb-3">
                    Access Permissions * (Select at least one)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableScopes.map((scope) => (
                      <div
                        key={scope.value}
                        onClick={() => handleScopeToggle(scope.value)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.scopes.includes(scope.value)
                            ? "border-afrihealth-green bg-afrihealth-green/10"
                            : "border-afrihealth-gray-700 hover:border-afrihealth-gray-600"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              formData.scopes.includes(scope.value)
                                ? "border-afrihealth-green bg-afrihealth-green"
                                : "border-afrihealth-gray-600"
                            }`}
                          >
                            {formData.scopes.includes(scope.value) && (
                              <span className="text-black text-xs">✓</span>
                            )}
                          </div>
                          <span className="font-mono text-sm text-white">
                            {scope.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expiration */}
                <div>
                  <label className="block text-sm font-mono font-bold text-afrihealth-orange mb-2">
                    Expiration Period
                  </label>
                  <select
                    value={formData.expirationDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expirationDays: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 bg-afrihealth-gray-800 border border-afrihealth-gray-700 rounded-lg text-white font-mono focus:outline-none focus:border-afrihealth-orange"
                  >
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                    <option value={90}>90 Days</option>
                    <option value={180}>180 Days</option>
                    <option value={365}>1 Year</option>
                  </select>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={grantConsentApi.loading}
                    className="flex-1"
                  >
                    {grantConsentApi.loading ? "Granting..." : "Grant Consent"}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
