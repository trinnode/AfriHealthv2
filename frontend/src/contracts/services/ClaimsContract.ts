/**
 * Claims Contract Interface
 * Handles all interactions with the ClaimsFacet smart contract
 */

import { ContractFunctionParameters } from "@hashgraph/sdk";
import type { ContractFunctionResult } from "@hashgraph/sdk";
import { HederaContractService } from "./HederaContractService";
import type { TransactionResult } from "./HederaContractService";

export interface Claim {
  claimId: string;
  claimant: string;
  provider: string;
  insurancePool: string;
  amount: number;
  claimType: string;
  description: string;
  supportingDocs: string[]; // IPFS hashes
  status: "Submitted" | "UnderReview" | "Approved" | "Rejected" | "Paid";
  submittedAt: number;
  reviewedAt: number;
  paidAt: number;
  reviewedBy: string;
  rejectionReason: string;
}

/**
 * Claims Facet Contract Wrapper
 */
export class ClaimsContract {
  private contractService: HederaContractService;
  private contractId: string;

  constructor(contractService: HederaContractService, diamondAddress: string) {
    this.contractService = contractService;
    this.contractId = diamondAddress;
  }

  /**
   * Submit a new insurance claim
   */
  async submitClaim(
    provider: string,
    insurancePool: string,
    amount: number,
    claimType: string,
    description: string,
    supportingDocs: string[] // IPFS hashes
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters()
      .addAddress(provider)
      .addAddress(insurancePool)
      .addUint256(amount)
      .addString(claimType)
      .addString(description)
      .addStringArray(supportingDocs);

    return await this.contractService.executeContract(
      this.contractId,
      "submitClaim",
      params,
      { gas: 600000, memo: "Submit Insurance Claim" }
    );
  }

  /**
   * Review a claim (by insurer)
   */
  async reviewClaim(
    claimId: string,
    approved: boolean,
    reason: string
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters()
      .addBytes32(Buffer.from(claimId.replace("0x", ""), "hex"))
      .addBool(approved)
      .addString(reason);

    return await this.contractService.executeContract(
      this.contractId,
      "reviewClaim",
      params,
      { gas: 400000, memo: "Review Claim" }
    );
  }

  /**
   * Process approved claim payment
   */
  async processClaim(claimId: string): Promise<TransactionResult> {
    const params = new ContractFunctionParameters().addBytes32(
      Buffer.from(claimId.replace("0x", ""), "hex")
    );

    return await this.contractService.executeContract(
      this.contractId,
      "processClaim",
      params,
      { gas: 500000, memo: "Process Claim Payment" }
    );
  }

  /**
   * Approve a claim (by insurer)
   */
  async approveClaim(claimId: string): Promise<TransactionResult> {
    return await this.reviewClaim(claimId, true, "Approved");
  }

  /**
   * Reject a claim (by insurer)
   */
  async rejectClaim(
    claimId: string,
    reason: string
  ): Promise<TransactionResult> {
    return await this.reviewClaim(claimId, false, reason);
  }

  /**
   * Add supporting documentation to a claim
   */
  async addClaimDocumentation(
    claimId: string,
    documentHash: string
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters()
      .addBytes32(Buffer.from(claimId.replace("0x", ""), "hex"))
      .addString(documentHash);

    return await this.contractService.executeContract(
      this.contractId,
      "addClaimDocumentation",
      params,
      { gas: 300000, memo: "Add Claim Documentation" }
    );
  }

  /**
   * Get claim details (read-only)
   */
  async getClaim(claimId: string): Promise<Claim | null> {
    const params = new ContractFunctionParameters().addBytes32(
      Buffer.from(claimId.replace("0x", ""), "hex")
    );

    const result = await this.contractService.queryContract(
      this.contractId,
      "getClaim",
      params,
      200000
    );

    if (!result.success || !result.data) {
      return null;
    }

    return this.parseClaimResult(result.data);
  }

  /**
   * Get all claims by claimant (read-only)
   */
  async getClaimantClaims(
    claimant: string,
    limit: number = 50
  ): Promise<string[]> {
    const params = new ContractFunctionParameters()
      .addAddress(claimant)
      .addUint256(limit);

    const result = await this.contractService.queryContract(
      this.contractId,
      "getClaimantClaims",
      params,
      200000
    );

    if (!result.success || !result.data) {
      return [];
    }

    return this.parseBytes32ArrayResult(result.data, 0);
  }

  /**
   * Get all claims for a provider (read-only)
   */
  async getProviderClaims(
    provider: string,
    limit: number = 50
  ): Promise<string[]> {
    const params = new ContractFunctionParameters()
      .addAddress(provider)
      .addUint256(limit);

    const result = await this.contractService.queryContract(
      this.contractId,
      "getProviderClaims",
      params,
      200000
    );

    if (!result.success || !result.data) {
      return [];
    }

    return this.parseBytes32ArrayResult(result.data, 0);
  }

  /**
   * Get all claims for an insurance pool (read-only)
   */
  async getPoolClaims(
    poolAddress: string,
    limit: number = 50
  ): Promise<string[]> {
    const params = new ContractFunctionParameters()
      .addAddress(poolAddress)
      .addUint256(limit);

    const result = await this.contractService.queryContract(
      this.contractId,
      "getPoolClaims",
      params,
      200000
    );

    if (!result.success || !result.data) {
      return [];
    }

    return this.parseBytes32ArrayResult(result.data, 0);
  }

  /**
   * Get pending claims requiring review (read-only)
   */
  async getPendingClaims(limit: number = 50): Promise<string[]> {
    const params = new ContractFunctionParameters().addUint256(limit);

    const result = await this.contractService.queryContract(
      this.contractId,
      "getPendingClaims",
      params,
      200000
    );

    if (!result.success || !result.data) {
      return [];
    }

    return this.parseBytes32ArrayResult(result.data, 0);
  }

  /**
   * Get claim statistics (read-only)
   */
  async getClaimStatistics(claimant: string): Promise<{
    totalClaims: number;
    approvedClaims: number;
    rejectedClaims: number;
    pendingClaims: number;
    totalAmountClaimed: number;
    totalAmountPaid: number;
  }> {
    const claimIds = await this.getClaimantClaims(claimant, 1000);

    let approvedClaims = 0;
    let rejectedClaims = 0;
    let pendingClaims = 0;
    let totalAmountClaimed = 0;
    let totalAmountPaid = 0;

    // Note: In production, this should be a single contract call for efficiency
    for (const claimId of claimIds) {
      const claim = await this.getClaim(claimId);
      if (claim) {
        totalAmountClaimed += claim.amount;

        switch (claim.status) {
          case "Approved":
            approvedClaims++;
            break;
          case "Rejected":
            rejectedClaims++;
            break;
          case "Submitted":
          case "UnderReview":
            pendingClaims++;
            break;
          case "Paid":
            approvedClaims++;
            totalAmountPaid += claim.amount;
            break;
        }
      }
    }

    return {
      totalClaims: claimIds.length,
      approvedClaims,
      rejectedClaims,
      pendingClaims,
      totalAmountClaimed,
      totalAmountPaid,
    };
  }

  /**
   * Parse claim result from contract
   */
  private parseClaimResult(data: ContractFunctionResult): Claim {
    const statusMap: Claim["status"][] = [
      "Submitted",
      "UnderReview",
      "Approved",
      "Rejected",
      "Paid",
    ];
    const statusIndex = data.getUint8(8);
    const status = statusMap[statusIndex] ?? "Submitted";

    return {
      claimId: "0x" + Buffer.from(data.getBytes32(0)).toString("hex"),
      claimant: data.getAddress(1),
      provider: data.getAddress(2),
      insurancePool: data.getAddress(3),
      amount: data.getUint256(4).toNumber(),
      claimType: data.getString(5),
      description: data.getString(6),
      supportingDocs: this.parseStringArrayResult(data, 7),
      status,
      submittedAt: data.getUint256(9).toNumber(),
      reviewedAt: data.getUint256(10).toNumber(),
      paidAt: data.getUint256(11).toNumber(),
      reviewedBy: data.getAddress(12),
      rejectionReason: data.getString(13),
    };
  }

  /**
   * Helper to parse string arrays
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
   * Helper to parse bytes32 arrays
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
