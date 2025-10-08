/**
 * Contract Manager
 * Central manager for all contract interactions
 */

import { Client, AccountId } from "@hashgraph/sdk";
import { HederaContractService } from "./HederaContractService";
import { IdentityContract } from "./IdentityContract";
import { ConsentContract } from "./ConsentContract";
import { RecordsContract } from "./RecordsContract";
import { BillingContract } from "./BillingContract";
import { ClaimsContract } from "./ClaimsContract";

export interface ContractAddresses {
  diamond: string;
}

/**
 * Centralized Contract Manager
 * Manages all contract service instances and provides unified access
 */
export class ContractManager {
  private contractService: HederaContractService;
  private addresses: ContractAddresses;

  // Contract instances
  public identity: IdentityContract;
  public consent: ConsentContract;
  public records: RecordsContract;
  public billing: BillingContract;
  public claims: ClaimsContract;

  constructor(
    client: Client,
    accountId: AccountId,
    addresses: ContractAddresses
  ) {
    // Initialize core contract service
    this.contractService = new HederaContractService(client, accountId);
    this.addresses = addresses;

    // Initialize all contract wrappers (all use diamond address for facet pattern)
    this.identity = new IdentityContract(
      this.contractService,
      addresses.diamond
    );
    this.consent = new ConsentContract(this.contractService, addresses.diamond);
    this.records = new RecordsContract(this.contractService, addresses.diamond);
    this.billing = new BillingContract(this.contractService, addresses.diamond);
    this.claims = new ClaimsContract(this.contractService, addresses.diamond);
  }

  /**
   * Update client (when wallet changes)
   */
  updateClient(client: Client, accountId: AccountId) {
    this.contractService.updateClient(client, accountId);
  }

  /**
   * Get current account ID
   */
  getAccountId(): string {
    return this.contractService.getAccountId();
  }

  /**
   * Get diamond contract address
   */
  getDiamondAddress(): string {
    return this.addresses.diamond;
  }

  /**
   * Verify all contracts are accessible
   */
  async verifyContracts(): Promise<{
    success: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      const diamondInfo = await this.contractService.getContractInfo(
        this.addresses.diamond
      );
      if (!diamondInfo.success) {
        errors.push("Diamond contract not accessible");
      }
    } catch (error: any) {
      errors.push(`Contract verification failed: ${error.message}`);
    }

    return {
      success: errors.length === 0,
      errors,
    };
  }

  /**
   * Get contract service for advanced usage
   */
  getContractService(): HederaContractService {
    return this.contractService;
  }
}

// Singleton instance
let contractManagerInstance: ContractManager | null = null;

/**
 * Initialize the contract manager
 */
export function initializeContractManager(
  client: Client,
  accountId: AccountId,
  addresses: ContractAddresses
): ContractManager {
  contractManagerInstance = new ContractManager(client, accountId, addresses);
  return contractManagerInstance;
}

/**
 * Get the contract manager instance
 */
export function getContractManager(): ContractManager {
  if (!contractManagerInstance) {
    throw new Error(
      "ContractManager not initialized. Call initializeContractManager first."
    );
  }
  return contractManagerInstance;
}

/**
 * Update the contract manager's client
 */
export function updateContractManagerClient(
  client: Client,
  accountId: AccountId
) {
  if (contractManagerInstance) {
    contractManagerInstance.updateClient(client, accountId);
  }
}

/**
 * Clear the contract manager instance
 */
export function clearContractManager() {
  contractManagerInstance = null;
}
