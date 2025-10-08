/**
 * Billing Contract Interface
 * Handles all interactions with the BillingFacet smart contract
 */

import { ContractFunctionParameters, Hbar } from "@hashgraph/sdk";
import {
  HederaContractService,
  TransactionResult,
} from "./HederaContractService";

export interface Invoice {
  invoiceId: string;
  patient: string;
  provider: string;
  amount: number;
  currency: string;
  status: "Pending" | "Approved" | "Rejected" | "Paid" | "Disputed";
  services: string[];
  issuedAt: number;
  dueDate: number;
  paidAt: number;
  metadata: string;
}

export interface Payment {
  paymentId: string;
  invoiceId: string;
  payer: string;
  amount: number;
  currency: string;
  timestamp: number;
  transactionHash: string;
  status: "Pending" | "Completed" | "Failed" | "Refunded";
}

/**
 * Billing Facet Contract Wrapper
 */
export class BillingContract {
  private contractService: HederaContractService;
  private contractId: string;

  constructor(contractService: HederaContractService, diamondAddress: string) {
    this.contractService = contractService;
    this.contractId = diamondAddress;
  }

  /**
   * Create a new invoice
   */
  async createInvoice(
    patient: string,
    amount: number,
    currency: string,
    services: string[],
    dueDate: number,
    metadata: string
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters()
      .addAddress(patient)
      .addUint256(amount)
      .addString(currency)
      .addStringArray(services)
      .addUint256(dueDate)
      .addString(metadata);

    return await this.contractService.executeContract(
      this.contractId,
      "createInvoice",
      params,
      { gas: 500000, memo: "Create Invoice" }
    );
  }

  /**
   * Approve an invoice
   */
  async approveInvoice(invoiceId: string): Promise<TransactionResult> {
    const params = new ContractFunctionParameters().addBytes32(
      Buffer.from(invoiceId.replace("0x", ""), "hex")
    );

    return await this.contractService.executeContract(
      this.contractId,
      "approveInvoice",
      params,
      { gas: 250000, memo: "Approve Invoice" }
    );
  }

  /**
   * Reject an invoice
   */
  async rejectInvoice(
    invoiceId: string,
    reason: string
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters()
      .addBytes32(Buffer.from(invoiceId.replace("0x", ""), "hex"))
      .addString(reason);

    return await this.contractService.executeContract(
      this.contractId,
      "rejectInvoice",
      params,
      { gas: 250000, memo: "Reject Invoice" }
    );
  }

  /**
   * Process payment for an invoice
   */
  async processPayment(
    invoiceId: string,
    amountInHbar: number
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters().addBytes32(
      Buffer.from(invoiceId.replace("0x", ""), "hex")
    );

    return await this.contractService.executeContract(
      this.contractId,
      "processPayment",
      params,
      {
        gas: 400000,
        payableAmount: amountInHbar,
        memo: "Process Payment",
      }
    );
  }

  /**
   * Dispute an invoice
   */
  async disputeInvoice(
    invoiceId: string,
    reason: string
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters()
      .addBytes32(Buffer.from(invoiceId.replace("0x", ""), "hex"))
      .addString(reason);

    return await this.contractService.executeContract(
      this.contractId,
      "disputeInvoice",
      params,
      { gas: 350000, memo: "Dispute Invoice" }
    );
  }

  /**
   * Add supported currency
   */
  async addSupportedCurrency(
    currency: string,
    conversionRate: number
  ): Promise<TransactionResult> {
    const params = new ContractFunctionParameters()
      .addString(currency)
      .addUint256(conversionRate);

    return await this.contractService.executeContract(
      this.contractId,
      "addSupportedCurrency",
      params,
      { gas: 200000, memo: "Add Currency" }
    );
  }

  /**
   * Get invoice details (read-only)
   */
  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    const params = new ContractFunctionParameters().addBytes32(
      Buffer.from(invoiceId.replace("0x", ""), "hex")
    );

    const result = await this.contractService.queryContract(
      this.contractId,
      "getInvoice",
      params,
      150000
    );

    if (!result.success || !result.data) {
      return null;
    }

    return this.parseInvoiceResult(result.data);
  }

  /**
   * Get all invoices for a patient (read-only)
   */
  async getPatientInvoices(
    patient: string,
    limit: number = 50
  ): Promise<string[]> {
    const params = new ContractFunctionParameters()
      .addAddress(patient)
      .addUint256(limit);

    const result = await this.contractService.queryContract(
      this.contractId,
      "getPatientInvoices",
      params,
      200000
    );

    if (!result.success || !result.data) {
      return [];
    }

    return this.parseBytes32ArrayResult(result.data, 0);
  }

  /**
   * Get all invoices for a provider (read-only)
   */
  async getProviderInvoices(
    provider: string,
    limit: number = 50
  ): Promise<string[]> {
    const params = new ContractFunctionParameters()
      .addAddress(provider)
      .addUint256(limit);

    const result = await this.contractService.queryContract(
      this.contractId,
      "getProviderInvoices",
      params,
      200000
    );

    if (!result.success || !result.data) {
      return [];
    }

    return this.parseBytes32ArrayResult(result.data, 0);
  }

  /**
   * Get payment details (read-only)
   */
  async getPayment(paymentId: string): Promise<Payment | null> {
    const params = new ContractFunctionParameters().addBytes32(
      Buffer.from(paymentId.replace("0x", ""), "hex")
    );

    const result = await this.contractService.queryContract(
      this.contractId,
      "getPayment",
      params,
      150000
    );

    if (!result.success || !result.data) {
      return null;
    }

    return this.parsePaymentResult(result.data);
  }

  /**
   * Get supported currencies (read-only)
   */
  async getSupportedCurrencies(): Promise<string[]> {
    const result = await this.contractService.queryContract(
      this.contractId,
      "getSupportedCurrencies",
      new ContractFunctionParameters(),
      100000
    );

    if (!result.success || !result.data) {
      return [];
    }

    return this.parseStringArrayResult(result.data, 0);
  }

  /**
   * Check if currency is supported (read-only)
   */
  async isCurrencySupported(currency: string): Promise<boolean> {
    const params = new ContractFunctionParameters().addString(currency);

    const result = await this.contractService.queryContract(
      this.contractId,
      "isCurrencySupported",
      params
    );

    if (!result.success || !result.data) {
      return false;
    }

    return result.data.getBool(0);
  }

  /**
   * Get invoice statistics for a patient (read-only)
   */
  async getPatientInvoiceStats(patient: string): Promise<{
    totalInvoices: number;
    pendingAmount: number;
    paidAmount: number;
  }> {
    const invoiceIds = await this.getPatientInvoices(patient, 1000);

    let pendingAmount = 0;
    let paidAmount = 0;

    // Note: In production, this should be a single contract call for efficiency
    for (const invoiceId of invoiceIds) {
      const invoice = await this.getInvoice(invoiceId);
      if (invoice) {
        if (invoice.status === "Paid") {
          paidAmount += invoice.amount;
        } else if (
          invoice.status === "Pending" ||
          invoice.status === "Approved"
        ) {
          pendingAmount += invoice.amount;
        }
      }
    }

    return {
      totalInvoices: invoiceIds.length,
      pendingAmount,
      paidAmount,
    };
  }

  /**
   * Parse invoice result from contract
   */
  private parseInvoiceResult(data: any): Invoice {
    const statusMap = ["Pending", "Approved", "Rejected", "Paid", "Disputed"];

    return {
      invoiceId: "0x" + Buffer.from(data.getBytes32(0)).toString("hex"),
      patient: data.getAddress(1),
      provider: data.getAddress(2),
      amount: data.getUint256(3).toNumber(),
      currency: data.getString(4),
      status: statusMap[data.getUint8(5)] as any,
      services: this.parseStringArrayResult(data, 6),
      issuedAt: data.getUint256(7).toNumber(),
      dueDate: data.getUint256(8).toNumber(),
      paidAt: data.getUint256(9).toNumber(),
      metadata: data.getString(10),
    };
  }

  /**
   * Parse payment result from contract
   */
  private parsePaymentResult(data: any): Payment {
    const statusMap = ["Pending", "Completed", "Failed", "Refunded"];

    return {
      paymentId: "0x" + Buffer.from(data.getBytes32(0)).toString("hex"),
      invoiceId: "0x" + Buffer.from(data.getBytes32(1)).toString("hex"),
      payer: data.getAddress(2),
      amount: data.getUint256(3).toNumber(),
      currency: data.getString(4),
      timestamp: data.getUint256(5).toNumber(),
      transactionHash: data.getString(6),
      status: statusMap[data.getUint8(7)] as any,
    };
  }

  /**
   * Helper to parse string arrays
   */
  private parseStringArrayResult(data: any, startIndex: number): string[] {
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
