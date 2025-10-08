/**
 * Records Contract Interface
 * Handles all interactions with the RecordsRegistryFacet smart contract
 */

import { ContractFunctionParameters } from "@hashgraph/sdk";
import {
  HederaContractService,
  TransactionResult,
} from "./HederaContractService";

export interface MedicalRecord {
  recordId: string;
  patient: string;
  provider: string;
  recordType: string;
  recordHash: string; // IPFS/HFS hash
  encryptionKey: string;
  timestamp: number;
  scope: string;
  consentRequired: boolean;
  retentionPeriod: number;
  accessCount: number;
  lastAccessed: number;
  metadata: string;
}

export interface RecordAccess {
  accessor: string;
  timestamp: number;
  purpose: string;
  consentId: string;
}

/**
 * Records Registry Facet Contract Wrapper
 */
export class RecordsContract {
  private contractService: HederaContractService;
  private contractId: string;

  constructor(contractService: HederaContractService, diamondAddress: string) {
    this.contractService = contractService;
    this.contractId = diamondAddress;
  }

  /**
   * Register a new medical record
   */
  async registerRecord(
    recordType: string,
    recordHash: string, // IPFS/HFS hash
    encryptionKey: string,
    scope: string,
    consentRequired: boolean,
    metadata: string
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters()
      .addString(recordType)
      .addBytes32(Buffer.from(recordHash.replace("0x", ""), "hex"))
      .addString(encryptionKey)
      .addString(scope)
      .addBool(consentRequired)
      .addString(metadata);

    return await this.contractService.executeContract(
      this.contractId,
      "registerRecord",
      params,
      { gas: 500000, memo: "Register Medical Record" }
    );
  }

  /**
   * Log access to a medical record
   */
  async logRecordAccess(
    recordId: string,
    purpose: string,
    consentId: string
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters()
      .addBytes32(Buffer.from(recordId.replace("0x", ""), "hex"))
      .addString(purpose)
      .addBytes32(Buffer.from(consentId.replace("0x", ""), "hex"));

    return await this.contractService.executeContract(
      this.contractId,
      "logRecordAccess",
      params,
      { gas: 300000, memo: "Log Record Access" }
    );
  }

  /**
   * Update record URI (for record amendments)
   */
  async updateRecordUri(
    recordId: string,
    newRecordHash: string,
    reason: string
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters()
      .addBytes32(Buffer.from(recordId.replace("0x", ""), "hex"))
      .addBytes32(Buffer.from(newRecordHash.replace("0x", ""), "hex"))
      .addString(reason);

    return await this.contractService.executeContract(
      this.contractId,
      "updateRecordUri",
      params,
      { gas: 350000, memo: "Update Record URI" }
    );
  }

  /**
   * Set retention policy for records
   */
  async setRetentionPolicy(
    recordType: string,
    retentionPeriod: number // in seconds
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters()
      .addString(recordType)
      .addUint256(retentionPeriod);

    return await this.contractService.executeContract(
      this.contractId,
      "setRetentionPolicy",
      params,
      { gas: 200000, memo: "Set Retention Policy" }
    );
  }

  /**
   * Cleanup expired records
   */
  async cleanupExpiredRecords(
    maxRecords: number = 50
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters().addUint256(maxRecords);

    return await this.contractService.executeContract(
      this.contractId,
      "cleanupExpiredRecords",
      params,
      { gas: 800000, memo: "Cleanup Expired Records" }
    );
  }

  /**
   * Get record details (read-only)
   */
  async getRecord(recordId: string): Promise<MedicalRecord | null> {
    const params = new ContractFunctionParameters().addBytes32(
      Buffer.from(recordId.replace("0x", ""), "hex")
    );

    const result = await this.contractService.queryContract(
      this.contractId,
      "getRecord",
      params,
      150000
    );

    if (!result.success || !result.data) {
      return null;
    }

    return this.parseRecordResult(result.data);
  }

  /**
   * Get all records for a patient (read-only)
   */
  async getPatientRecords(
    patient: string,
    limit: number = 50
  ): Promise<string[]> {
    const params = new ContractFunctionParameters()
      .addAddress(patient)
      .addUint256(limit);

    const result = await this.contractService.queryContract(
      this.contractId,
      "getPatientRecords",
      params,
      200000
    );

    if (!result.success || !result.data) {
      return [];
    }

    return this.parseBytes32ArrayResult(result.data, 0);
  }

  /**
   * Get records by scope (read-only)
   */
  async getRecordsByScope(
    patient: string,
    scope: string,
    limit: number = 50
  ): Promise<string[]> {
    const params = new ContractFunctionParameters()
      .addAddress(patient)
      .addString(scope)
      .addUint256(limit);

    const result = await this.contractService.queryContract(
      this.contractId,
      "getRecordsByScope",
      params,
      200000
    );

    if (!result.success || !result.data) {
      return [];
    }

    return this.parseBytes32ArrayResult(result.data, 0);
  }

  /**
   * Get record access history (read-only)
   */
  async getRecordAccessHistory(
    recordId: string,
    limit: number = 50
  ): Promise<RecordAccess[]> {
    const params = new ContractFunctionParameters()
      .addBytes32(Buffer.from(recordId.replace("0x", ""), "hex"))
      .addUint256(limit);

    const result = await this.contractService.queryContract(
      this.contractId,
      "getRecordAccessHistory",
      params,
      250000
    );

    if (!result.success || !result.data) {
      return [];
    }

    const count = result.data.getUint32(0);
    const history: RecordAccess[] = [];

    for (let i = 0; i < count; i++) {
      history.push({
        accessor: result.data.getAddress(1 + i * 4),
        timestamp: result.data.getUint256(2 + i * 4).toNumber(),
        purpose: result.data.getString(3 + i * 4),
        consentId:
          "0x" + Buffer.from(result.data.getBytes32(4 + i * 4)).toString("hex"),
      });
    }

    return history;
  }

  /**
   * Check if record is accessible (read-only)
   */
  async isRecordAccessible(
    recordId: string,
    accessor: string,
    consentId: string
  ): Promise<boolean> {
    const params = new ContractFunctionParameters()
      .addBytes32(Buffer.from(recordId.replace("0x", ""), "hex"))
      .addAddress(accessor)
      .addBytes32(Buffer.from(consentId.replace("0x", ""), "hex"));

    const result = await this.contractService.queryContract(
      this.contractId,
      "isRecordAccessible",
      params
    );

    if (!result.success || !result.data) {
      return false;
    }

    return result.data.getBool(0);
  }

  /**
   * Check if record is expired (read-only)
   */
  async isRecordExpired(recordId: string): Promise<boolean> {
    const params = new ContractFunctionParameters().addBytes32(
      Buffer.from(recordId.replace("0x", ""), "hex")
    );

    const result = await this.contractService.queryContract(
      this.contractId,
      "isRecordExpired",
      params
    );

    if (!result.success || !result.data) {
      return false;
    }

    return result.data.getBool(0);
  }

  /**
   * Get expiring records (read-only)
   */
  async getExpiringRecords(
    withinDays: number,
    limit: number = 50
  ): Promise<string[]> {
    const params = new ContractFunctionParameters()
      .addUint256(withinDays * 24 * 60 * 60) // Convert days to seconds
      .addUint256(limit);

    const result = await this.contractService.queryContract(
      this.contractId,
      "getExpiringRecords",
      params,
      250000
    );

    if (!result.success || !result.data) {
      return [];
    }

    return this.parseBytes32ArrayResult(result.data, 0);
  }

  /**
   * Parse medical record result from contract
   */
  private parseRecordResult(data: any): MedicalRecord {
    return {
      recordId: "0x" + Buffer.from(data.getBytes32(0)).toString("hex"),
      patient: data.getAddress(1),
      provider: data.getAddress(2),
      recordType: data.getString(3),
      recordHash: "0x" + Buffer.from(data.getBytes32(4)).toString("hex"),
      encryptionKey: data.getString(5),
      timestamp: data.getUint256(6).toNumber(),
      scope: data.getString(7),
      consentRequired: data.getBool(8),
      retentionPeriod: data.getUint256(9).toNumber(),
      accessCount: data.getUint256(10).toNumber(),
      lastAccessed: data.getUint256(11).toNumber(),
      metadata: data.getString(12),
    };
  }

  /**
   * Helper to parse bytes32 arrays from contract result
   */
  private parseBytes32ArrayResult(data: any, startIndex: number): string[] {
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
