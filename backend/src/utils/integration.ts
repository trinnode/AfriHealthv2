import { hederaService, contractService } from '../server';
import { TransactionResult, ContractCall } from '../types/api';

/**
 * Integration utilities for frontend-backend-contract communication
 */
export class IntegrationUtils {
  /**
   * Format contract call for frontend consumption
   */
  static formatContractCall(call: ContractCall): any {
    return {
      contractId: call.contractId,
      functionName: call.functionName,
      parameters: call.parameters,
      gasLimit: call.gasLimit || 100000,
      estimatedGas: this.estimateGas(call.functionName)
    };
  }

  /**
   * Estimate gas for contract function calls
   */
  static estimateGas(functionName: string): number {
    const gasEstimates: { [key: string]: number } = {
      'requestConsent': 150000,
      'grantConsent': 100000,
      'revokeConsent': 100000,
      'createInvoice': 200000,
      'approveInvoice': 100000,
      'processPayment': 150000,
      'submitClaim': 150000,
      'joinPool': 100000,
      'mintPlatformCredit': 100000,
      'transferTokens': 50000
    };

    return gasEstimates[functionName] || 100000;
  }

  /**
   * Format transaction result for frontend
   */
  static formatTransactionResult(result: any): TransactionResult {
    return {
      success: result.success || false,
      transactionId: result.transactionId,
      error: result.error,
      gasUsed: result.gasUsed,
      result: result.result
    };
  }

  /**
   * Validate Hedera address format
   */
  static isValidHederaAddress(address: string): boolean {
    return /^0\.0\.\d+$/.test(address);
  }

  /**
   * Format address for display (truncate)
   */
  static formatAddressForDisplay(address: string, chars: number = 6): string {
    if (!this.isValidHederaAddress(address)) {
      return address;
    }
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  }

  /**
   * Convert amount from cents to HBAR
   */
  static convertCentsToHbar(cents: number): number {
    // 1 HBAR = 100,000,000 tinybar = $0.05 (approx)
    // This is a simplified conversion - in production use oracle rates
    const hbarPrice = 0.05; // USD per HBAR
    const usdAmount = cents / 100;
    return Math.round(usdAmount / hbarPrice);
  }

  /**
   * Convert HBAR to cents
   */
  static convertHbarToCents(hbar: number): number {
    // 1 HBAR = 100,000,000 tinybar = $0.05 (approx)
    const hbarPrice = 0.05; // USD per HBAR
    const usdAmount = hbar * hbarPrice;
    return Math.round(usdAmount * 100);
  }

  /**
   * Format currency amount for display
   */
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100); // Assuming amount is in cents
  }

  /**
   * Format date for display
   */
  static formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Calculate days until expiry
   */
  static daysUntilExpiry(expiryDate: Date | string): number {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if date is expired
   */
  static isExpired(date: Date | string): boolean {
    return new Date(date) < new Date();
  }

  /**
   * Generate mock data for development
   */
  static generateMockData(type: 'patient' | 'provider' | 'invoice' | 'claim'): any {
    const mockData = {
      patient: {
        id: '0.0.12345',
        name: 'John Doe',
        email: 'john.doe@email.com',
        isVerified: true,
        joinedAt: new Date('2024-01-15'),
        lastActive: new Date()
      },
      provider: {
        id: '0.0.12346',
        name: 'Dr. Jane Smith',
        license: 'MD123456',
        specialty: 'Family Medicine',
        isVerified: true
      },
      invoice: {
        invoiceId: '1',
        patient: '0.0.12345',
        provider: '0.0.12346',
        lineItems: [
          {
            description: 'General Consultation',
            code: '99213',
            quantity: 1,
            unitPrice: 15000,
            totalPrice: 15000
          }
        ],
        totalAmount: 15000,
        currency: 'USD',
        status: 'pending_approval',
        createdAt: new Date()
      },
      claim: {
        claimId: '1',
        patient: '0.0.12345',
        provider: '0.0.12346',
        amountRequested: 15000,
        diagnosis: 'Hypertension Management',
        procedureCodes: ['99213', '85025'],
        status: 'submitted',
        submittedAt: new Date()
      }
    };

    return mockData[type];
  }

  /**
   * Validate API response format
   */
  static validateApiResponse(response: any): boolean {
    return response && typeof response.success === 'boolean';
  }

  /**
   * Create standardized error response
   */
  static createErrorResponse(error: string, details?: any): any {
    return {
      success: false,
      error,
      details,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create standardized success response
   */
  static createSuccessResponse(data: any, message?: string): any {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Retry async operation with exponential backoff
   */
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: any): boolean {
    const retryableErrors = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'TEMPORARY_FAILURE',
      'SERVICE_UNAVAILABLE'
    ];

    return retryableErrors.some(retryableError => 
      error.message?.includes(retryableError) || 
      error.code === retryableError
    );
  }
}
