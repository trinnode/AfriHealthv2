// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBilling
 * @dev Interface for billing and payment management in AfriHealth Ledger
 */
interface IBilling {
    /// Emitted when an invoice is created
    event InvoiceCreated(
        bytes32 indexed invoiceId,
        address indexed patient,
        address indexed provider,
        uint256 amount,
        string currency,
        string[] itemCodes,
        uint256 dueDate
    );

    /// Emitted when an invoice is approved
    event InvoiceApproved(
        bytes32 indexed invoiceId,
        address indexed approvedBy,
        uint256 approvedAt
    );

    /// Emitted when an invoice is rejected
    event InvoiceRejected(
        bytes32 indexed invoiceId,
        address indexed rejectedBy,
        string reason,
        uint256 rejectedAt
    );

    /// Emitted when payment is processed
    event PaymentProcessed(
        bytes32 indexed invoiceId,
        address indexed paidBy,
        uint256 amount,
        string currency,
        uint256 paidAt
    );

    /// Emitted when an invoice is disputed
    event InvoiceDisputed(
        bytes32 indexed invoiceId,
        address indexed disputedBy,
        string reason,
        uint256 disputedAt
    );

    /// Emitted when a currency is added
    event CurrencyAdded(string currency, address indexed addedBy);

    /// Create a new invoice
    /// @param patient The patient's address
    /// @param amount The invoice amount
    /// @param currency The currency code (e.g., "USD", "HBAR", "AHL")
    /// @param itemCodes Medical billing codes for items/services
    /// @param dueDate When the invoice is due
    /// @param description Description of services provided
    /// @return invoiceId Unique identifier for the invoice
    function createInvoice(
        address patient,
        uint256 amount,
        string calldata currency,
        string[] calldata itemCodes,
        uint256 dueDate,
        string calldata description
    ) external returns (bytes32 invoiceId);

    /// Approve an invoice for payment
    /// @param invoiceId The invoice identifier
    function approveInvoice(bytes32 invoiceId) external;

    /// Reject an invoice
    /// @param invoiceId The invoice identifier
    /// @param reason Reason for rejection
    function rejectInvoice(bytes32 invoiceId, string calldata reason) external;

    /// Process payment for an approved invoice
    /// @param invoiceId The invoice identifier
    function processPayment(bytes32 invoiceId) external;

    /// Dispute an invoice
    /// @param invoiceId The invoice identifier
    /// @param reason Reason for dispute
    function disputeInvoice(bytes32 invoiceId, string calldata reason) external;

    /// Get invoice details
    /// @param invoiceId The invoice identifier
    /// @return patient The patient's address
    /// @return provider The provider's address
    /// @return amount The invoice amount
    /// @return currency The currency code
    /// @return itemCodes Medical billing codes
    /// @return dueDate When the invoice is due
    /// @return description Description of services
    /// @return status Current status of the invoice
    /// @return createdAt When the invoice was created
    /// @return approvedAt When the invoice was approved (if applicable)
    function getInvoice(
        bytes32 invoiceId
    )
        external
        view
        returns (
            address patient,
            address provider,
            uint256 amount,
            string memory currency,
            string[] memory itemCodes,
            uint256 dueDate,
            string memory description,
            string memory status,
            uint256 createdAt,
            uint256 approvedAt
        );

    /// Get all invoices for a patient
    /// @param patient The patient's address
    /// @return invoiceIds Array of invoice identifiers
    function getPatientInvoices(
        address patient
    ) external view returns (bytes32[] memory invoiceIds);

    /// Get all invoices for a provider
    /// @param provider The provider's address
    /// @return invoiceIds Array of invoice identifiers
    function getProviderInvoices(
        address provider
    ) external view returns (bytes32[] memory invoiceIds);

    /// Get payment details for an invoice
    /// @param invoiceId The invoice identifier
    /// @return amount The payment amount
    /// @return currency The payment currency
    /// @return paidAt When the payment was made
    /// @return transactionHash The blockchain transaction hash
    function getPayment(
        bytes32 invoiceId
    )
        external
        view
        returns (
            uint256 amount,
            string memory currency,
            uint256 paidAt,
            bytes32 transactionHash
        );

    /// Add a supported currency
    /// @param currency The currency code to add
    function addSupportedCurrency(string calldata currency) external;

    /// Get all supported currencies
    /// @return Array of supported currency codes
    function getSupportedCurrencies() external view returns (string[] memory);

    /// Check if a currency is supported
    /// @param currency The currency code to check
    /// @return True if currency is supported
    function isCurrencySupported(
        string calldata currency
    ) external view returns (bool);
}
