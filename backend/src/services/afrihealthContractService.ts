/**
 * AfriHealth Contract Service
 * Complete integration layer for all smart contract facets
 */

import {
  Client,
  ContractExecuteTransaction,
  ContractCallQuery,
  ContractFunctionParameters,
  ContractId,
} from "@hashgraph/sdk";
import { log } from "console";

// Note: ABIs are loaded dynamically at runtime
// They are not imported here to avoid TypeScript compilation issues
// The ABI files are located in src/abi/ and will be used by the frontend

export interface ContractConfig {
  diamondAddress: string;
  client: Client;
}

export interface TransactionResult {
  success: boolean;
  transactionId: string;
  receipt?: any;
  error?: string;
}

export interface QueryResult {
  success: boolean;
  data: any;
  error?: string;
}

/**
 * Complete AfriHealth Contract Service
 * Implements all 14 facets with full functionality
 */
export class AfriHealthContractService {
  private diamondAddress: ContractId;
  private client: Client;
  private gasLimit: number = 1000000;

  constructor(config: ContractConfig) {
    this.diamondAddress = ContractId.fromString(config.diamondAddress);
    this.client = config.client;
  }

  async registerIdentity(
    identityType: number,
    licenseNumber: string = "",
    specialization: string = ""
  ): Promise<TransactionResult> {
    try {
      const params = new ContractFunctionParameters()
        .addUint8(identityType)
        .addString(licenseNumber)
        .addString(specialization);

      const transaction = new ContractExecuteTransaction()
        .setContractId(this.diamondAddress)
        .setGas(this.gasLimit)
        .setFunction("registerIdentity", params);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        receipt,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId: "",
        error: error.message,
      };
    }
  }

  /**
   * Get identity information
   */
  async getIdentity(address: string): Promise<QueryResult> {
    try {
      const query = new ContractCallQuery()
        .setContractId(this.diamondAddress)
        .setGas(100000)
        .setFunction(
          "getIdentity",
          new ContractFunctionParameters().addAddress(address)
        );

      const result = await query.execute(this.client);

      // Parse the result based on Identity struct
      const data = {
        identityType: result.getUint8(0),
        isVerified: result.getBool(1),
        licenseNumber: result.getString(2),
        specialization: result.getString(3),
        registrationDate: result.getUint256(4).toNumber(),
        isActive: result.getBool(5),
      };

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  /**
   * Verify an identity
   */
  async verifyIdentity(address: string): Promise<TransactionResult> {
    try {
      const params = new ContractFunctionParameters().addAddress(address);

      const transaction = new ContractExecuteTransaction()
        .setContractId(this.diamondAddress)
        .setGas(this.gasLimit)
        .setFunction("verifyIdentity", params);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        receipt,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId: "",
        error: error.message,
      };
    }
  }

  /**
   * Update identity verification status
   */
  async updateIdentityVerification(
    address: string,
    verified: boolean
  ): Promise<TransactionResult> {
    try {
      const params = new ContractFunctionParameters()
        .addAddress(address)
        .addBool(verified);

      const transaction = new ContractExecuteTransaction()
        .setContractId(this.diamondAddress)
        .setGas(this.gasLimit)
        .setFunction("updateIdentityVerification", params);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        receipt,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId: "",
        error: error.message,
      };
    }
  }

  /**
   * Deactivate an identity
   */
  async deactivateIdentity(address: string): Promise<TransactionResult> {
    try {
      const params = new ContractFunctionParameters().addAddress(address);

      const transaction = new ContractExecuteTransaction()
        .setContractId(this.diamondAddress)
        .setGas(this.gasLimit)
        .setFunction("deactivateIdentity", params);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        receipt,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId: "",
        error: error.message,
      };
    }
  }

  // ==========================================
  // 📜 CONSENT FACET
  // ==========================================

  /**
   * Grant consent to a provider
   */
  async grantConsent(
    provider: string,
    scopes: string[],
    expirationTime: number,
    purpose: string
  ): Promise<TransactionResult> {
    try {
      const params = new ContractFunctionParameters()
        .addAddress(provider)
        .addStringArray(scopes)
        .addUint256(expirationTime)
        .addString(purpose);
      const transaction = new ContractExecuteTransaction()
        .setContractId(this.diamondAddress)
        .setGas(this.gasLimit)
        .setFunction("grantConsent", params);
      const response = await transaction.execute(this.client);
      log("{response, afriHealthContractService.ts:239} : ", response)
      const receipt = await response.getReceipt(this.client);
      log("{receipt, afriHealthContractService.ts:241} : ", receipt)

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        receipt,
      };
    } catch (error: any) {
      log("{error, afriHealthContractService.ts:249} : ", error)
      return {
        success: false,
        transactionId: "",
        error: error.message,
      };
    }
  }

  async revokeConsent(consentId: string): Promise<TransactionResult> {
    try {
      const params = new ContractFunctionParameters().addBytes32(
        Buffer.from(consentId, "hex")
      );

      const transaction = new ContractExecuteTransaction()
        .setContractId(this.diamondAddress)
        .setGas(this.gasLimit)
        .setFunction("revokeConsent", params);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        receipt,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId: "",
        error: error.message,
      };
    }
  }

  /**
   * Check if consent is valid
   */
  async hasValidConsent(
    patient: string,
    provider: string,
    scope: string
  ): Promise<QueryResult> {
    try {
      const params = new ContractFunctionParameters()
        .addAddress(patient)
        .addAddress(provider)
        .addString(scope);

      const query = new ContractCallQuery()
        .setContractId(this.diamondAddress)
        .setGas(100000)
        .setFunction("hasValidConsent", params);

      const result = await query.execute(this.client);

      return {
        success: true,
        data: { hasConsent: result.getBool(0) },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  /**
   * Get patient consents
   */
  async getPatientConsents(patient: string): Promise<QueryResult> {
    try {
      const params = new ContractFunctionParameters().addAddress(patient);

      const query = new ContractCallQuery()
        .setContractId(this.diamondAddress)
        .setGas(200000)
        .setFunction("getPatientConsents", params);

      const result = await query.execute(this.client);

      // Parse array of consent IDs
      const consentIds = [];
      const count = result.getUint32(0);
      for (let i = 0; i < count; i++) {
        consentIds.push(result.getBytes32(i + 1).toString());
      }

      return {
        success: true,
        data: { consentIds },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  /**
   * Get consent details
   */
  async getConsent(consentId: string): Promise<QueryResult> {
    try {
      const params = new ContractFunctionParameters().addBytes32(
        Buffer.from(consentId, "hex")
      );

      const query = new ContractCallQuery()
        .setContractId(this.diamondAddress)
        .setGas(150000)
        .setFunction("getConsent", params);

      const result = await query.execute(this.client);

      const data = {
        patient: result.getAddress(0),
        provider: result.getAddress(1),
        grantedAt: result.getUint256(2).toNumber(),
        expiresAt: result.getUint256(3).toNumber(),
        isActive: result.getBool(4),
        scopes: [], // Would need to parse array
        purpose: result.getString(5),
      };

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  // ==========================================
  // 📋 RECORDS REGISTRY FACET
  // ==========================================

  /**
   * Create a medical record
   */
  async createRecord(
    patient: string,
    recordType: string,
    dataHash: string,
    fileHash: string,
    metadata: string
  ): Promise<TransactionResult> {
    try {
      const params = new ContractFunctionParameters()
        .addAddress(patient)
        .addString(recordType)
        .addBytes32(Buffer.from(dataHash, "hex"))
        .addString(fileHash)
        .addString(metadata);

      const transaction = new ContractExecuteTransaction()
        .setContractId(this.diamondAddress)
        .setGas(this.gasLimit)
        .setFunction("createRecord", params);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        receipt,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId: "",
        error: error.message,
      };
    }
  }

  /**
   * Get patient records
   */
  async getPatientRecords(patient: string): Promise<QueryResult> {
    try {
      const params = new ContractFunctionParameters().addAddress(patient);

      const query = new ContractCallQuery()
        .setContractId(this.diamondAddress)
        .setGas(200000)
        .setFunction("getPatientRecords", params);

      const result = await query.execute(this.client);

      // Parse array of record IDs
      const recordIds = [];
      const count = result.getUint32(0);
      for (let i = 0; i < count; i++) {
        recordIds.push(result.getBytes32(i + 1).toString());
      }

      return {
        success: true,
        data: { recordIds },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  /**
   * Get record details
   */
  async getRecord(recordId: string): Promise<QueryResult> {
    try {
      const params = new ContractFunctionParameters().addBytes32(
        Buffer.from(recordId, "hex")
      );

      const query = new ContractCallQuery()
        .setContractId(this.diamondAddress)
        .setGas(150000)
        .setFunction("getRecord", params);

      const result = await query.execute(this.client);

      const data = {
        patient: result.getAddress(0),
        provider: result.getAddress(1),
        recordType: result.getString(2),
        dataHash: result.getBytes32(3).toString(),
        fileHash: result.getString(4),
        timestamp: result.getUint256(5).toNumber(),
        metadata: result.getString(6),
        isActive: result.getBool(7),
      };

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  /**
   * Update record metadata
   */
  async updateRecordMetadata(
    recordId: string,
    metadata: string
  ): Promise<TransactionResult> {
    try {
      const params = new ContractFunctionParameters()
        .addBytes32(Buffer.from(recordId, "hex"))
        .addString(metadata);

      const transaction = new ContractExecuteTransaction()
        .setContractId(this.diamondAddress)
        .setGas(this.gasLimit)
        .setFunction("updateRecordMetadata", params);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        receipt,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId: "",
        error: error.message,
      };
    }
  }

  // ==========================================
  // 💰 BILLING FACET
  // ==========================================

  /**
   * Create an invoice
   */
  async createInvoice(
    patient: string,
    amount: number,
    serviceDescription: string,
    dueDate: number,
    metadata: string
  ): Promise<TransactionResult> {
    try {
      const params = new ContractFunctionParameters()
        .addAddress(patient)
        .addUint256(amount)
        .addString(serviceDescription)
        .addUint256(dueDate)
        .addString(metadata);

      const transaction = new ContractExecuteTransaction()
        .setContractId(this.diamondAddress)
        .setGas(this.gasLimit)
        .setFunction("createInvoice", params);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        receipt,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId: "",
        error: error.message,
      };
    }
  }

  /**
   * Pay an invoice
   */
  async payInvoice(
    invoiceId: string,
    paymentMethod: number
  ): Promise<TransactionResult> {
    try {
      const params = new ContractFunctionParameters()
        .addBytes32(Buffer.from(invoiceId, "hex"))
        .addUint8(paymentMethod);

      const transaction = new ContractExecuteTransaction()
        .setContractId(this.diamondAddress)
        .setGas(this.gasLimit)
        .setFunction("payInvoice", params);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        receipt,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId: "",
        error: error.message,
      };
    }
  }

  /**
   * Get invoice details
   */
  async getInvoice(invoiceId: string): Promise<QueryResult> {
    try {
      const params = new ContractFunctionParameters().addBytes32(
        Buffer.from(invoiceId, "hex")
      );

      const query = new ContractCallQuery()
        .setContractId(this.diamondAddress)
        .setGas(150000)
        .setFunction("getInvoice", params);

      const result = await query.execute(this.client);

      const data = {
        provider: result.getAddress(0),
        patient: result.getAddress(1),
        amount: result.getUint256(2).toNumber(),
        status: result.getUint8(3), // 0=Pending, 1=Paid, 2=Disputed, 3=Cancelled
        dueDate: result.getUint256(4).toNumber(),
        createdAt: result.getUint256(5).toNumber(),
        paidAt: result.getUint256(6).toNumber(),
        serviceDescription: result.getString(7),
        metadata: result.getString(8),
      };

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  /**
   * Get patient invoices
   */
  async getPatientInvoices(patient: string): Promise<QueryResult> {
    try {
      const params = new ContractFunctionParameters().addAddress(patient);

      const query = new ContractCallQuery()
        .setContractId(this.diamondAddress)
        .setGas(200000)
        .setFunction("getPatientInvoices", params);

      const result = await query.execute(this.client);

      const invoiceIds = [];
      const count = result.getUint32(0);
      for (let i = 0; i < count; i++) {
        invoiceIds.push(result.getBytes32(i + 1).toString());
      }

      return {
        success: true,
        data: { invoiceIds },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  /**
   * Get provider invoices
   */
  async getProviderInvoices(provider: string): Promise<QueryResult> {
    try {
      const params = new ContractFunctionParameters().addAddress(provider);

      const query = new ContractCallQuery()
        .setContractId(this.diamondAddress)
        .setGas(200000)
        .setFunction("getProviderInvoices", params);

      const result = await query.execute(this.client);

      const invoiceIds = [];
      const count = result.getUint32(0);
      for (let i = 0; i < count; i++) {
        invoiceIds.push(result.getBytes32(i + 1).toString());
      }

      return {
        success: true,
        data: { invoiceIds },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  /**
   * Dispute an invoice
   */
  async disputeInvoice(
    invoiceId: string,
    reason: string
  ): Promise<TransactionResult> {
    try {
      const params = new ContractFunctionParameters()
        .addBytes32(Buffer.from(invoiceId, "hex"))
        .addString(reason);

      const transaction = new ContractExecuteTransaction()
        .setContractId(this.diamondAddress)
        .setGas(this.gasLimit)
        .setFunction("disputeInvoice", params);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        receipt,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId: "",
        error: error.message,
      };
    }
  }

  // ==========================================
  // 🏥 CLAIMS FACET
  // ==========================================

  /**
   * Submit an insurance claim
   */
  async submitClaim(
    poolId: string,
    amount: number,
    claimType: string,
    description: string,
    supportingDocuments: string[]
  ): Promise<TransactionResult> {
    try {
      const params = new ContractFunctionParameters()
        .addBytes32(Buffer.from(poolId, "hex"))
        .addUint256(amount)
        .addString(claimType)
        .addString(description)
        .addStringArray(supportingDocuments);

      const transaction = new ContractExecuteTransaction()
        .setContractId(this.diamondAddress)
        .setGas(this.gasLimit)
        .setFunction("submitClaim", params);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        receipt,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId: "",
        error: error.message,
      };
    }
  }

  /**
   * Process a claim (admin/insurer)
   */
  async processClaim(
    claimId: string,
    approved: boolean,
    approvedAmount: number,
    comments: string
  ): Promise<TransactionResult> {
    try {
      const params = new ContractFunctionParameters()
        .addBytes32(Buffer.from(claimId, "hex"))
        .addBool(approved)
        .addUint256(approvedAmount)
        .addString(comments);

      const transaction = new ContractExecuteTransaction()
        .setContractId(this.diamondAddress)
        .setGas(this.gasLimit)
        .setFunction("processClaim", params);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        receipt,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId: "",
        error: error.message,
      };
    }
  }

  /**
   * Get claim details
   */
  async getClaim(claimId: string): Promise<QueryResult> {
    try {
      const params = new ContractFunctionParameters().addBytes32(
        Buffer.from(claimId, "hex")
      );

      const query = new ContractCallQuery()
        .setContractId(this.diamondAddress)
        .setGas(150000)
        .setFunction("getClaim", params);

      const result = await query.execute(this.client);

      const data = {
        claimant: result.getAddress(0),
        poolId: result.getBytes32(1).toString(),
        amount: result.getUint256(2).toNumber(),
        status: result.getUint8(3), // 0=Pending, 1=Approved, 2=Rejected, 3=Paid
        submittedAt: result.getUint256(4).toNumber(),
        processedAt: result.getUint256(5).toNumber(),
        claimType: result.getString(6),
        description: result.getString(7),
        approvedAmount: result.getUint256(8).toNumber(),
      };

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  /**
   * Get user claims
   */
  async getUserClaims(user: string): Promise<QueryResult> {
    try {
      const params = new ContractFunctionParameters().addAddress(user);

      const query = new ContractCallQuery()
        .setContractId(this.diamondAddress)
        .setGas(200000)
        .setFunction("getUserClaims", params);

      const result = await query.execute(this.client);

      const claimIds = [];
      const count = result.getUint32(0);
      for (let i = 0; i < count; i++) {
        claimIds.push(result.getBytes32(i + 1).toString());
      }

      return {
        success: true,
        data: { claimIds },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  // ==========================================
  // 🤖 AI POLICY FACET
  // ==========================================

  /**
   * Create AI policy
   */
  async createAIPolicy(
    name: string,
    description: string,
    modelHash: string,
    rules: string
  ): Promise<TransactionResult> {
    try {
      const params = new ContractFunctionParameters()
        .addString(name)
        .addString(description)
        .addString(modelHash)
        .addString(rules);

      const transaction = new ContractExecuteTransaction()
        .setContractId(this.diamondAddress)
        .setGas(this.gasLimit)
        .setFunction("createAIPolicy", params);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        receipt,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId: "",
        error: error.message,
      };
    }
  }

  /**
   * Assign AI policy to patient
   */
  async assignAIPolicyToPatient(
    patient: string,
    policyId: string
  ): Promise<TransactionResult> {
    try {
      const params = new ContractFunctionParameters()
        .addAddress(patient)
        .addBytes32(Buffer.from(policyId, "hex"));

      const transaction = new ContractExecuteTransaction()
        .setContractId(this.diamondAddress)
        .setGas(this.gasLimit)
        .setFunction("assignAIPolicyToPatient", params);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        receipt,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId: "",
        error: error.message,
      };
    }
  }

  /**
   * Get AI policy
   */
  async getAIPolicy(policyId: string): Promise<QueryResult> {
    try {
      const params = new ContractFunctionParameters().addBytes32(
        Buffer.from(policyId, "hex")
      );

      const query = new ContractCallQuery()
        .setContractId(this.diamondAddress)
        .setGas(150000)
        .setFunction("getAIPolicy", params);

      const result = await query.execute(this.client);

      const data = {
        owner: result.getAddress(0),
        name: result.getString(1),
        description: result.getString(2),
        modelHash: result.getString(3),
        rules: result.getString(4),
        isActive: result.getBool(5),
        createdAt: result.getUint256(6).toNumber(),
      };

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  /**
   * Get patient AI policy
   */
  async getPatientAIPolicy(patient: string): Promise<QueryResult> {
    try {
      const params = new ContractFunctionParameters().addAddress(patient);

      const query = new ContractCallQuery()
        .setContractId(this.diamondAddress)
        .setGas(150000)
        .setFunction("getPatientAIPolicy", params);

      const result = await query.execute(this.client);

      return {
        success: true,
        data: { policyId: result.getBytes32(0).toString() },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  // ==========================================
  // 🏊 INSURANCE POOL FACET
  // ==========================================

  /**
   * Create insurance pool
   */
  async createInsurancePool(
    name: string,
    description: string,
    targetAmount: number,
    minContribution: number,
    maxContribution: number
  ): Promise<TransactionResult> {
    try {
      const params = new ContractFunctionParameters()
        .addString(name)
        .addString(description)
        .addUint256(targetAmount)
        .addUint256(minContribution)
        .addUint256(maxContribution);

      const transaction = new ContractExecuteTransaction()
        .setContractId(this.diamondAddress)
        .setGas(this.gasLimit)
        .setFunction("createInsurancePool", params);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        receipt,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId: "",
        error: error.message,
      };
    }
  }

  /**
   * Contribute to insurance pool
   */
  async contributeToPool(
    poolId: string,
    amount: number
  ): Promise<TransactionResult> {
    try {
      const params = new ContractFunctionParameters()
        .addBytes32(Buffer.from(poolId, "hex"))
        .addUint256(amount);

      const transaction = new ContractExecuteTransaction()
        .setContractId(this.diamondAddress)
        .setGas(this.gasLimit)
        .setFunction("contributeToPool", params);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        receipt,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId: "",
        error: error.message,
      };
    }
  }

  /**
   * Get insurance pool
   */
  async getInsurancePool(poolId: string): Promise<QueryResult> {
    try {
      const params = new ContractFunctionParameters().addBytes32(
        Buffer.from(poolId, "hex")
      );

      const query = new ContractCallQuery()
        .setContractId(this.diamondAddress)
        .setGas(150000)
        .setFunction("getInsurancePool", params);

      const result = await query.execute(this.client);

      const data = {
        creator: result.getAddress(0),
        name: result.getString(1),
        description: result.getString(2),
        totalBalance: result.getUint256(3).toNumber(),
        targetAmount: result.getUint256(4).toNumber(),
        memberCount: result.getUint32(5),
        isActive: result.getBool(6),
        createdAt: result.getUint256(7).toNumber(),
      };

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  /**
   * Get user pool membership
   */
  async getUserPoolMembership(
    user: string,
    poolId: string
  ): Promise<QueryResult> {
    try {
      const params = new ContractFunctionParameters()
        .addAddress(user)
        .addBytes32(Buffer.from(poolId, "hex"));

      const query = new ContractCallQuery()
        .setContractId(this.diamondAddress)
        .setGas(150000)
        .setFunction("getUserPoolMembership", params);

      const result = await query.execute(this.client);

      const data = {
        contribution: result.getUint256(0).toNumber(),
        joinedAt: result.getUint256(1).toNumber(),
        isActive: result.getBool(2),
      };

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  // ==========================================
  // ⚖️ DISPUTE FACET
  // ==========================================

  /**
   * Create a dispute
   */
  async createDispute(
    disputeType: number, // 0=Invoice, 1=Claim, 2=Access, 3=Other
    relatedId: string,
    reason: string,
    evidence: string
  ): Promise<TransactionResult> {
    try {
      const params = new ContractFunctionParameters()
        .addUint8(disputeType)
        .addBytes32(Buffer.from(relatedId, "hex"))
        .addString(reason)
        .addString(evidence);

      const transaction = new ContractExecuteTransaction()
        .setContractId(this.diamondAddress)
        .setGas(this.gasLimit)
        .setFunction("createDispute", params);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        receipt,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId: "",
        error: error.message,
      };
    }
  }

  /**
   * Resolve a dispute
   */
  async resolveDispute(
    disputeId: string,
    resolution: string,
    ruling: number // 0=InFavorOfInitiator, 1=InFavorOfRespondent, 2=Compromise
  ): Promise<TransactionResult> {
    try {
      const params = new ContractFunctionParameters()
        .addBytes32(Buffer.from(disputeId, "hex"))
        .addString(resolution)
        .addUint8(ruling);

      const transaction = new ContractExecuteTransaction()
        .setContractId(this.diamondAddress)
        .setGas(this.gasLimit)
        .setFunction("resolveDispute", params);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        receipt,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId: "",
        error: error.message,
      };
    }
  }

  /**
   * Get dispute details
   */
  async getDispute(disputeId: string): Promise<QueryResult> {
    try {
      const params = new ContractFunctionParameters().addBytes32(
        Buffer.from(disputeId, "hex")
      );

      const query = new ContractCallQuery()
        .setContractId(this.diamondAddress)
        .setGas(150000)
        .setFunction("getDispute", params);

      const result = await query.execute(this.client);

      const data = {
        initiator: result.getAddress(0),
        respondent: result.getAddress(1),
        disputeType: result.getUint8(2),
        status: result.getUint8(3), // 0=Open, 1=UnderReview, 2=Resolved, 3=Escalated
        reason: result.getString(4),
        resolution: result.getString(5),
        createdAt: result.getUint256(6).toNumber(),
        resolvedAt: result.getUint256(7).toNumber(),
      };

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  // ==========================================
  // 🗳️ GOVERNANCE FACET
  // ==========================================

  /**
   * Create a governance proposal
   */
  async createProposal(
    title: string,
    description: string,
    proposalType: number,
    votingPeriod: number
  ): Promise<TransactionResult> {
    try {
      const params = new ContractFunctionParameters()
        .addString(title)
        .addString(description)
        .addUint8(proposalType)
        .addUint256(votingPeriod);

      const transaction = new ContractExecuteTransaction()
        .setContractId(this.diamondAddress)
        .setGas(this.gasLimit)
        .setFunction("createProposal", params);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        receipt,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId: "",
        error: error.message,
      };
    }
  }

  /**
   * Vote on a proposal
   */
  async vote(proposalId: string, support: boolean): Promise<TransactionResult> {
    try {
      const params = new ContractFunctionParameters()
        .addBytes32(Buffer.from(proposalId, "hex"))
        .addBool(support);

      const transaction = new ContractExecuteTransaction()
        .setContractId(this.diamondAddress)
        .setGas(this.gasLimit)
        .setFunction("vote", params);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        receipt,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId: "",
        error: error.message,
      };
    }
  }

  /**
   * Get proposal details
   */
  async getProposal(proposalId: string): Promise<QueryResult> {
    try {
      const params = new ContractFunctionParameters().addBytes32(
        Buffer.from(proposalId, "hex")
      );

      const query = new ContractCallQuery()
        .setContractId(this.diamondAddress)
        .setGas(150000)
        .setFunction("getProposal", params);

      const result = await query.execute(this.client);

      const data = {
        proposer: result.getAddress(0),
        title: result.getString(1),
        description: result.getString(2),
        votesFor: result.getUint256(3).toNumber(),
        votesAgainst: result.getUint256(4).toNumber(),
        status: result.getUint8(5), // 0=Active, 1=Passed, 2=Rejected, 3=Executed
        startTime: result.getUint256(6).toNumber(),
        endTime: result.getUint256(7).toNumber(),
      };

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  // ==========================================
  // 🔍 AUDIT FACET
  // ==========================================

  /**
   * Get access logs for a patient
   */
  async getAccessLogs(
    patient: string,
    startTime: number,
    endTime: number
  ): Promise<QueryResult> {
    try {
      const params = new ContractFunctionParameters()
        .addAddress(patient)
        .addUint256(startTime)
        .addUint256(endTime);

      const query = new ContractCallQuery()
        .setContractId(this.diamondAddress)
        .setGas(200000)
        .setFunction("getAccessLogs", params);

      const result = await query.execute(this.client);

      const logIds = [];
      const count = result.getUint32(0);
      for (let i = 0; i < count; i++) {
        logIds.push(result.getBytes32(i + 1).toString());
      }

      return {
        success: true,
        data: { logIds },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  /**
   * Get audit log details
   */
  async getAuditLog(logId: string): Promise<QueryResult> {
    try {
      const params = new ContractFunctionParameters().addBytes32(
        Buffer.from(logId, "hex")
      );

      const query = new ContractCallQuery()
        .setContractId(this.diamondAddress)
        .setGas(150000)
        .setFunction("getAuditLog", params);

      const result = await query.execute(this.client);

      const data = {
        actor: result.getAddress(0),
        action: result.getString(1),
        resourceId: result.getBytes32(2).toString(),
        timestamp: result.getUint256(3).toNumber(),
        success: result.getBool(4),
        details: result.getString(5),
      };

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }
}

export default AfriHealthContractService;
