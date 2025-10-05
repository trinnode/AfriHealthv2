/**
 * AfriHealth API Client
 * Complete integration layer for backend API calls
 */

import axios, { AxiosError } from "axios";
import type { AxiosInstance } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TransactionResponse {
  success: boolean;
  transactionId: string;
  message: string;
  error?: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem("authToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Handle common errors
        if (error.response?.status === 401) {
          // Unauthorized - redirect to login
          localStorage.removeItem("authToken");
          window.location.href = "/";
        }
        return Promise.reject(error);
      }
    );
  }

  // ==========================================
  // 🔐 IDENTITY MANAGEMENT
  // ==========================================

  async registerIdentity(data: {
    identityType: number;
    licenseNumber?: string;
    specialization?: string;
  }): Promise<TransactionResponse> {
    const response = await this.client.post("/identity/register", data);
    return response.data;
  }

  async getIdentity(address: string): Promise<ApiResponse> {
    const response = await this.client.get(`/identity/${address}`);
    return response.data;
  }

  async verifyIdentity(address: string): Promise<TransactionResponse> {
    const response = await this.client.post("/identity/verify", { address });
    return response.data;
  }

  async deactivateIdentity(address: string): Promise<TransactionResponse> {
    const response = await this.client.post("/identity/deactivate", {
      address,
    });
    return response.data;
  }

  // ==========================================
  // 📜 CONSENT MANAGEMENT
  // ==========================================

  async grantConsent(data: {
    provider: string;
    scopes: string[];
    expirationTime: number;
    purpose?: string;
  }): Promise<TransactionResponse> {
    const response = await this.client.post("/consent/grant", data);
    return response.data;
  }

  async revokeConsent(consentId: string): Promise<TransactionResponse> {
    const response = await this.client.post("/consent/revoke", { consentId });
    return response.data;
  }

  async checkConsent(data: {
    patient: string;
    provider: string;
    scope: string;
  }): Promise<ApiResponse<{ hasConsent: boolean }>> {
    const response = await this.client.get("/consent/check", { params: data });
    return response.data;
  }

  async getPatientConsents(
    address: string
  ): Promise<ApiResponse<{ consents: any[] }>> {
    const response = await this.client.get(`/consent/patient/${address}`);
    return response.data;
  }

  async getConsent(id: string): Promise<ApiResponse<{ consent: any }>> {
    const response = await this.client.get(`/consent/${id}`);
    return response.data;
  }

  // ==========================================
  // 📋 MEDICAL RECORDS
  // ==========================================

  async createRecord(data: {
    patient: string;
    recordType: string;
    dataHash: string;
    fileHash?: string;
    metadata?: string;
  }): Promise<TransactionResponse> {
    const response = await this.client.post("/records/create", data);
    return response.data;
  }

  async getPatientRecords(
    address: string
  ): Promise<ApiResponse<{ records: any[] }>> {
    const response = await this.client.get(`/records/patient/${address}`);
    return response.data;
  }

  async getRecord(id: string): Promise<ApiResponse<{ record: any }>> {
    const response = await this.client.get(`/records/${id}`);
    return response.data;
  }

  async updateRecordMetadata(
    id: string,
    metadata: string
  ): Promise<TransactionResponse> {
    const response = await this.client.put(`/records/${id}/metadata`, {
      metadata,
    });
    return response.data;
  }

  // ==========================================
  // 💰 BILLING
  // ==========================================

  async createInvoice(data: {
    patient: string;
    amount: number;
    serviceDescription: string;
    dueDate: number;
    metadata?: string;
  }): Promise<TransactionResponse> {
    const response = await this.client.post("/billing/invoice/create", data);
    return response.data;
  }

  async payInvoice(
    invoiceId: string,
    paymentMethod: number
  ): Promise<TransactionResponse> {
    const response = await this.client.post("/billing/invoice/pay", {
      invoiceId,
      paymentMethod,
    });
    return response.data;
  }

  async disputeInvoice(
    invoiceId: string,
    reason: string
  ): Promise<TransactionResponse> {
    const response = await this.client.post("/billing/invoice/dispute", {
      invoiceId,
      reason,
    });
    return response.data;
  }

  async getInvoice(id: string): Promise<ApiResponse<{ invoice: any }>> {
    const response = await this.client.get(`/billing/invoice/${id}`);
    return response.data;
  }

  async getPatientInvoices(
    address: string
  ): Promise<ApiResponse<{ invoices: any[] }>> {
    const response = await this.client.get(
      `/billing/patient/${address}/invoices`
    );
    return response.data;
  }

  async getProviderInvoices(
    address: string
  ): Promise<ApiResponse<{ invoices: any[] }>> {
    const response = await this.client.get(
      `/billing/provider/${address}/invoices`
    );
    return response.data;
  }

  // ==========================================
  // 🏥 INSURANCE CLAIMS
  // ==========================================

  async submitClaim(data: {
    poolId: string;
    amount: number;
    claimType: string;
    description: string;
    supportingDocuments?: string[];
  }): Promise<TransactionResponse> {
    const response = await this.client.post("/claims/submit", data);
    return response.data;
  }

  async processClaim(data: {
    claimId: string;
    approved: boolean;
    approvedAmount?: number;
    comments?: string;
  }): Promise<TransactionResponse> {
    const response = await this.client.post("/claims/process", data);
    return response.data;
  }

  async getClaim(id: string): Promise<ApiResponse<{ claim: any }>> {
    const response = await this.client.get(`/claims/${id}`);
    return response.data;
  }

  async getUserClaims(
    address: string
  ): Promise<ApiResponse<{ claims: any[] }>> {
    const response = await this.client.get(`/claims/user/${address}`);
    return response.data;
  }

  // ==========================================
  // 🤖 AI POLICY
  // ==========================================

  async createAIPolicy(data: {
    name: string;
    description: string;
    modelHash: string;
    rules: string;
  }): Promise<TransactionResponse> {
    const response = await this.client.post("/ai-policy/create", data);
    return response.data;
  }

  async assignAIPolicy(
    patient: string,
    policyId: string
  ): Promise<TransactionResponse> {
    const response = await this.client.post("/ai-policy/assign", {
      patient,
      policyId,
    });
    return response.data;
  }

  async getAIPolicy(id: string): Promise<ApiResponse<{ policy: any }>> {
    const response = await this.client.get(`/ai-policy/${id}`);
    return response.data;
  }

  async getPatientAIPolicy(
    address: string
  ): Promise<ApiResponse<{ policy: any }>> {
    const response = await this.client.get(`/ai-policy/patient/${address}`);
    return response.data;
  }

  async evaluateWithAI(data: {
    patient: string;
    invoiceData: any;
  }): Promise<ApiResponse<{ evaluation: any }>> {
    const response = await this.client.post("/ai-policy/evaluate", data);
    return response.data;
  }

  // ==========================================
  // 🏊 INSURANCE POOL
  // ==========================================

  async createInsurancePool(data: {
    name: string;
    description: string;
    targetAmount: number;
    minContribution?: number;
    maxContribution?: number;
  }): Promise<TransactionResponse> {
    const response = await this.client.post("/insurance-pool/create", data);
    return response.data;
  }

  async contributeToPool(
    poolId: string,
    amount: number
  ): Promise<TransactionResponse> {
    const response = await this.client.post("/insurance-pool/contribute", {
      poolId,
      amount,
    });
    return response.data;
  }

  async getInsurancePool(id: string): Promise<ApiResponse<{ pool: any }>> {
    const response = await this.client.get(`/insurance-pool/${id}`);
    return response.data;
  }

  async getPoolMembership(
    poolId: string,
    address: string
  ): Promise<ApiResponse<{ membership: any }>> {
    const response = await this.client.get(
      `/insurance-pool/${poolId}/membership/${address}`
    );
    return response.data;
  }

  // ==========================================
  // ⚖️ DISPUTE RESOLUTION
  // ==========================================

  async createDispute(data: {
    disputeType: number;
    relatedId: string;
    reason: string;
    evidence?: string;
  }): Promise<TransactionResponse> {
    const response = await this.client.post("/dispute/create", data);
    return response.data;
  }

  async resolveDispute(data: {
    disputeId: string;
    resolution: string;
    ruling: number;
  }): Promise<TransactionResponse> {
    const response = await this.client.post("/dispute/resolve", data);
    return response.data;
  }

  async getDispute(id: string): Promise<ApiResponse<{ dispute: any }>> {
    const response = await this.client.get(`/dispute/${id}`);
    return response.data;
  }

  // ==========================================
  // 🗳️ GOVERNANCE
  // ==========================================

  async createProposal(data: {
    title: string;
    description: string;
    proposalType: number;
    votingPeriod?: number;
  }): Promise<TransactionResponse> {
    const response = await this.client.post(
      "/governance/proposal/create",
      data
    );
    return response.data;
  }

  async voteOnProposal(
    proposalId: string,
    support: boolean
  ): Promise<TransactionResponse> {
    const response = await this.client.post("/governance/proposal/vote", {
      proposalId,
      support,
    });
    return response.data;
  }

  async getProposal(id: string): Promise<ApiResponse<{ proposal: any }>> {
    const response = await this.client.get(`/governance/proposal/${id}`);
    return response.data;
  }

  // ==========================================
  // 🔍 AUDIT
  // ==========================================

  async getAccessLogs(
    address: string,
    startTime: number,
    endTime: number
  ): Promise<ApiResponse<{ logs: any[] }>> {
    const response = await this.client.get(`/audit/access-logs/${address}`, {
      params: { startTime, endTime },
    });
    return response.data;
  }

  async getAuditLog(id: string): Promise<ApiResponse<{ log: any }>> {
    const response = await this.client.get(`/audit/log/${id}`);
    return response.data;
  }

  // ==========================================
  // 🏥 HEALTH CHECK
  // ==========================================

  async healthCheck(): Promise<ApiResponse> {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
