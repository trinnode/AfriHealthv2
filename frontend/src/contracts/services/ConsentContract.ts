/**
 * Consent Contract Interface
 * Handles all interactions with the ConsentFacet smart contract
 */

import { ContractFunctionParameters } from "@hashgraph/sdk";
import type { ContractFunctionResult } from "@hashgraph/sdk";
import { HederaContractService } from "./HederaContractService";
import type { TransactionResult } from "./HederaContractService";

export interface Consent {
  consentId: string;
  patient: string;
  provider: string;
  purpose: string;
  scope: string[];
  granted: boolean;
  revoked: boolean;
  grantedAt: number;
  expiresAt: number;
  revokedAt: number;
  accessCount: number;
}

export interface ConsentRequest {
  requestId: string;
  requester: string;
  patient: string;
  purpose: string;
  scope: string[];
  requestedAt: number;
  status: "Pending" | "Approved" | "Rejected";
}

/**
 * Consent Facet Contract Wrapper
 */
export class ConsentContract {
  private contractService: HederaContractService;
  private contractId: string;

  constructor(contractService: HederaContractService, diamondAddress: string) {
    this.contractService = contractService;
    this.contractId = diamondAddress;
  }

  /**
   * Request consent from a patient
   */
  async requestConsent(
    patient: string,
    purpose: string,
    scope: string[],
    duration: number // in seconds
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters()
      .addAddress(patient)
      .addString(purpose)
      .addStringArray(scope)
      .addUint256(duration);

    return await this.contractService.executeContract(
      this.contractId,
      "requestConsent",
      params,
      { gas: 400000, memo: "Request Consent" }
    );
  }

  /**
   * Grant consent
   */
  async grantConsent(
    consentId: string,
    expiresAt: number
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters()
      .addBytes32(Buffer.from(consentId.replace("0x", ""), "hex"))
      .addUint256(expiresAt);

    return await this.contractService.executeContract(
      this.contractId,
      "grantConsent",
      params,
      { gas: 300000, memo: "Grant Consent" }
    );
  }

  /**
   * Revoke consent
   */
  async revokeConsent(
    consentId: string,
    reason: string
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters()
      .addBytes32(Buffer.from(consentId.replace("0x", ""), "hex"))
      .addString(reason);

    return await this.contractService.executeContract(
      this.contractId,
      "revokeConsent",
      params,
      { gas: 250000, memo: "Revoke Consent" }
    );
  }

  /**
   * Update consent scope
   */
  async updateConsentScope(
    consentId: string,
    newScope: string[]
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters()
      .addBytes32(Buffer.from(consentId.replace("0x", ""), "hex"))
      .addStringArray(newScope);

    return await this.contractService.executeContract(
      this.contractId,
      "updateConsentScope",
      params,
      { gas: 300000, memo: "Update Consent Scope" }
    );
  }

  /**
   * Extend consent expiry
   */
  async extendConsent(
    consentId: string,
    newExpiryTime: number
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters()
      .addBytes32(Buffer.from(consentId.replace("0x", ""), "hex"))
      .addUint256(newExpiryTime);

    return await this.contractService.executeContract(
      this.contractId,
      "extendConsent",
      params,
      { gas: 200000, memo: "Extend Consent" }
    );
  }

  /**
   * Log consent access
   */
  async logConsentAccess(
    consentId: string,
    accessDetails: string
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters()
      .addBytes32(Buffer.from(consentId.replace("0x", ""), "hex"))
      .addString(accessDetails);

    return await this.contractService.executeContract(
      this.contractId,
      "logConsentAccess",
      params,
      { gas: 250000, memo: "Log Consent Access" }
    );
  }

  /**
   * Get consent details (read-only)
   */
  async getConsent(consentId: string): Promise<Consent | null> {
    const params = new ContractFunctionParameters().addBytes32(
      Buffer.from(consentId.replace("0x", ""), "hex")
    );

    const result = await this.contractService.queryContract(
      this.contractId,
      "getConsent",
      params
    );

    if (!result.success || !result.data) {
      return null;
    }

    return this.parseConsentResult(result.data);
  }

  /**
   * Check if consent is active (read-only)
   */
  async isConsentActive(consentId: string): Promise<boolean> {
    const params = new ContractFunctionParameters().addBytes32(
      Buffer.from(consentId.replace("0x", ""), "hex")
    );

    const result = await this.contractService.queryContract(
      this.contractId,
      "isConsentActive",
      params
    );

    if (!result.success || !result.data) {
      return false;
    }

    return result.data.getBool(0);
  }

  /**
   * Get all consents granted by a patient (read-only)
   */
  async getPatientConsents(
    patient: string,
    limit: number = 50
  ): Promise<string[]> {
    const params = new ContractFunctionParameters()
      .addAddress(patient)
      .addUint256(limit);

    const result = await this.contractService.queryContract(
      this.contractId,
      "getPatientConsents",
      params,
      150000
    );

    if (!result.success || !result.data) {
      return [];
    }

    return this.parseBytes32ArrayResult(result.data, 0);
  }

  /**
   * Get all consents for a provider (read-only)
   */
  async getProviderConsents(
    provider: string,
    limit: number = 50
  ): Promise<string[]> {
    const params = new ContractFunctionParameters()
      .addAddress(provider)
      .addUint256(limit);

    const result = await this.contractService.queryContract(
      this.contractId,
      "getProviderConsents",
      params,
      150000
    );

    if (!result.success || !result.data) {
      return [];
    }

    return this.parseBytes32ArrayResult(result.data, 0);
  }

  /**
   * Get active consents between patient and provider (read-only)
   */
  async getActiveConsents(
    patient: string,
    provider: string
  ): Promise<string[]> {
    const params = new ContractFunctionParameters()
      .addAddress(patient)
      .addAddress(provider);

    const result = await this.contractService.queryContract(
      this.contractId,
      "getActiveConsents",
      params,
      150000
    );

    if (!result.success || !result.data) {
      return [];
    }

    return this.parseBytes32ArrayResult(result.data, 0);
  }

  /**
   * Verify consent for access (read-only)
   */
  async verifyConsent(
    consentId: string,
    provider: string,
    purpose: string
  ): Promise<boolean> {
    const params = new ContractFunctionParameters()
      .addBytes32(Buffer.from(consentId.replace("0x", ""), "hex"))
      .addAddress(provider)
      .addString(purpose);

    const result = await this.contractService.queryContract(
      this.contractId,
      "verifyConsent",
      params
    );

    if (!result.success || !result.data) {
      return false;
    }

    return result.data.getBool(0);
  }

  /**
   * Get consent access history (read-only)
   */
  async getConsentAccessHistory(
    consentId: string,
    limit: number = 50
  ): Promise<Array<{ timestamp: number; accessor: string; details: string }>> {
    const params = new ContractFunctionParameters()
      .addBytes32(Buffer.from(consentId.replace("0x", ""), "hex"))
      .addUint256(limit);

    const result = await this.contractService.queryContract(
      this.contractId,
      "getConsentAccessHistory",
      params,
      200000
    );

    if (!result.success || !result.data) {
      return [];
    }

    const count = result.data.getUint32(0);
    const history: Array<{
      timestamp: number;
      accessor: string;
      details: string;
    }> = [];

    for (let i = 0; i < count; i++) {
      history.push({
        timestamp: result.data.getUint256(1 + i * 3).toNumber(),
        accessor: result.data.getAddress(2 + i * 3),
        details: result.data.getString(3 + i * 3),
      });
    }

    return history;
  }

  /**
   * Parse consent result from contract
   */
  private parseConsentResult(data: ContractFunctionResult): Consent {
    return {
      consentId: "0x" + Buffer.from(data.getBytes32(0)).toString("hex"),
      patient: data.getAddress(1),
      provider: data.getAddress(2),
      purpose: data.getString(3),
      scope: this.parseStringArrayResult(data, 4),
      granted: data.getBool(5),
      revoked: data.getBool(6),
      grantedAt: data.getUint256(7).toNumber(),
      expiresAt: data.getUint256(8).toNumber(),
      revokedAt: data.getUint256(9).toNumber(),
      accessCount: data.getUint256(10).toNumber(),
    };
  }

  /**
   * Helper to parse string arrays from contract result
   */
  private parseStringArrayResult(
    data: ContractFunctionResult,
    startIndex: number
  ): string[] {
    const count = data.getUint32(startIndex);
    const arr: string[] = [];
    for (let i = 0; i < count; i++) {
      arr.push(data.getString(startIndex + 1 + i));
    }
    return arr;
  }

  /**
   * Helper to parse bytes32 arrays from contract result
   */
  private parseBytes32ArrayResult(
    data: ContractFunctionResult,
    startIndex: number
  ): string[] {
    const count = data.getUint32(startIndex);
    const arr: string[] = [];
    for (let i = 0; i < count; i++) {
      arr.push(
        "0x" + Buffer.from(data.getBytes32(startIndex + 1 + i)).toString("hex")
      );
    }
    return arr;
  }
}
