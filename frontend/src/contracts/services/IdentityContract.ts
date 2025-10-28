/**
 * Identity Contract Interface
 * Handles all interactions with the IdentityFacet smart contract
 */

import { ContractFunctionParameters } from "@hashgraph/sdk";
import type { ContractFunctionResult } from "@hashgraph/sdk";
import { HederaContractService } from "./HederaContractService";
import type { TransactionResult } from "./HederaContractService";

export interface Identity {
  accountId: string;
  did: string;
  publicKey: string;
  roles: string[];
  verificationStatus: boolean;
  credentialHashes: string[];
  registeredAt: number;
  lastUpdated: number;
  isActive: boolean;
}

export interface Credential {
  credentialHash: string;
  issuer: string;
  subject: string;
  issuedAt: number;
  expiresAt: number;
  revoked: boolean;
  credentialType: string;
}

/**
 * Identity Facet Contract Wrapper
 */
export class IdentityContract {
  private contractService: HederaContractService;
  private contractId: string;

  constructor(contractService: HederaContractService, diamondAddress: string) {
    this.contractService = contractService;
    this.contractId = diamondAddress;
  }

  /**
   * Register a new identity on-chain
   */
  async registerIdentity(
    did: string,
    publicKey: string,
    roles: string[],
    metadata: string
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters()
      .addString(did)
      .addString(publicKey)
      .addStringArray(roles)
      .addString(metadata);

    return await this.contractService.executeContract(
      this.contractId,
      "registerIdentity",
      params,
      { gas: 500000, memo: "Register Identity" }
    );
  }

  /**
   * Update identity metadata
   */
  async updateIdentity(
    publicKey: string,
    metadata: string
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters()
      .addString(publicKey)
      .addString(metadata);

    return await this.contractService.executeContract(
      this.contractId,
      "updateIdentity",
      params,
      { gas: 300000, memo: "Update Identity" }
    );
  }

  /**
   * Verify an identity
   */
  async verifyIdentity(accountId: string): Promise<TransactionResult> {
    const params = new ContractFunctionParameters().addAddress(accountId);

    return await this.contractService.executeContract(
      this.contractId,
      "verifyIdentity",
      params,
      { gas: 200000, memo: "Verify Identity" }
    );
  }

  /**
   * Revoke identity verification
   */
  async revokeVerification(
    accountId: string,
    reason: string
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters()
      .addAddress(accountId)
      .addString(reason);

    return await this.contractService.executeContract(
      this.contractId,
      "revokeVerification",
      params,
      { gas: 200000, memo: "Revoke Verification" }
    );
  }

  /**
   * Issue a credential to an identity
   */
  async issueCredential(
    subject: string,
    credentialHash: string,
    expiresAt: number,
    credentialType: string
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters()
      .addAddress(subject)
      .addBytes32(Buffer.from(credentialHash.replace("0x", ""), "hex"))
      .addUint256(expiresAt)
      .addString(credentialType);

    return await this.contractService.executeContract(
      this.contractId,
      "issueCredential",
      params,
      { gas: 400000, memo: "Issue Credential" }
    );
  }

  /**
   * Revoke a credential
   */
  async revokeCredential(credentialHash: string): Promise<TransactionResult> {
    const params = new ContractFunctionParameters().addBytes32(
      Buffer.from(credentialHash.replace("0x", ""), "hex")
    );

    return await this.contractService.executeContract(
      this.contractId,
      "revokeCredential",
      params,
      { gas: 200000, memo: "Revoke Credential" }
    );
  }

  /**
   * Add a role to an identity
   */
  async addRole(accountId: string, role: string): Promise<TransactionResult> {
    const params = new ContractFunctionParameters()
      .addAddress(accountId)
      .addString(role);

    return await this.contractService.executeContract(
      this.contractId,
      "addRole",
      params,
      { gas: 200000, memo: "Add Role" }
    );
  }

  /**
   * Remove a role from an identity
   */
  async removeRole(
    accountId: string,
    role: string
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters()
      .addAddress(accountId)
      .addString(role);

    return await this.contractService.executeContract(
      this.contractId,
      "removeRole",
      params,
      { gas: 200000, memo: "Remove Role" }
    );
  }

  /**
   * Get identity by account ID (read-only)
   */
  async getIdentity(accountId: string): Promise<Identity | null> {
    const params = new ContractFunctionParameters().addAddress(accountId);

    const result = await this.contractService.queryContract(
      this.contractId,
      "getIdentity",
      params
    );

    if (!result.success || !result.data) {
      return null;
    }

    // Parse result based on contract return structure
    return this.parseIdentityResult(result.data);
  }

  /**
   * Get identity by DID (read-only)
   */
  async getIdentityByDID(did: string): Promise<Identity | null> {
    const params = new ContractFunctionParameters().addString(did);

    const result = await this.contractService.queryContract(
      this.contractId,
      "getIdentityByDID",
      params
    );

    if (!result.success || !result.data) {
      return null;
    }

    return this.parseIdentityResult(result.data);
  }

  /**
   * Check if identity is verified (read-only)
   */
  async isVerified(accountId: string): Promise<boolean> {
    const params = new ContractFunctionParameters().addAddress(accountId);

    const result = await this.contractService.queryContract(
      this.contractId,
      "isVerified",
      params
    );

    if (!result.success || !result.data) {
      return false;
    }

    return result.data.getBool(0);
  }

  /**
   * Check if identity has a specific role (read-only)
   */
  async hasRole(accountId: string, role: string): Promise<boolean> {
    const params = new ContractFunctionParameters()
      .addAddress(accountId)
      .addString(role);

    const result = await this.contractService.queryContract(
      this.contractId,
      "hasRole",
      params
    );

    if (!result.success || !result.data) {
      return false;
    }

    return result.data.getBool(0);
  }

  /**
   * Get credential details (read-only)
   */
  async getCredential(credentialHash: string): Promise<Credential | null> {
    const params = new ContractFunctionParameters().addBytes32(
      Buffer.from(credentialHash.replace("0x", ""), "hex")
    );

    const result = await this.contractService.queryContract(
      this.contractId,
      "getCredential",
      params
    );

    if (!result.success || !result.data) {
      return null;
    }

    return this.parseCredentialResult(result.data);
  }

  /**
   * Verify a credential (read-only)
   */
  async verifyCredential(credentialHash: string): Promise<boolean> {
    const params = new ContractFunctionParameters().addBytes32(
      Buffer.from(credentialHash.replace("0x", ""), "hex")
    );

    const result = await this.contractService.queryContract(
      this.contractId,
      "verifyCredential",
      params
    );

    if (!result.success || !result.data) {
      return false;
    }

    return result.data.getBool(0);
  }

  /**
   * Get all roles for an identity (read-only)
   */
  async getIdentityRoles(accountId: string): Promise<string[]> {
    const params = new ContractFunctionParameters().addAddress(accountId);

    const result = await this.contractService.queryContract(
      this.contractId,
      "getIdentityRoles",
      params
    );

    if (!result.success || !result.data) {
      return [];
    }

    // Parse string array from result
    const count = result.data.getUint32(0);
    const roles: string[] = [];
    for (let i = 0; i < count; i++) {
      roles.push(result.data.getString(i + 1));
    }
    return roles;
  }

  /**
   * Parse identity result from contract
   */
  private parseIdentityResult(data: ContractFunctionResult): Identity {
    return {
      accountId: data.getAddress(0),
      did: data.getString(1),
      publicKey: data.getString(2),
      roles: this.parseStringArray(data, 3),
      verificationStatus: data.getBool(4),
      credentialHashes: this.parseBytes32Array(data, 5),
      registeredAt: data.getUint256(6).toNumber(),
      lastUpdated: data.getUint256(7).toNumber(),
      isActive: data.getBool(8),
    };
  }

  /**
   * Parse credential result from contract
   */
  private parseCredentialResult(data: ContractFunctionResult): Credential {
    return {
      credentialHash: "0x" + Buffer.from(data.getBytes32(0)).toString("hex"),
      issuer: data.getAddress(1),
      subject: data.getAddress(2),
      issuedAt: data.getUint256(3).toNumber(),
      expiresAt: data.getUint256(4).toNumber(),
      revoked: data.getBool(5),
      credentialType: data.getString(6),
    };
  }

  /**
   * Helper to parse string arrays
   */
  private parseStringArray(
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
   * Helper to parse bytes32 arrays
   */
  private parseBytes32Array(
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
