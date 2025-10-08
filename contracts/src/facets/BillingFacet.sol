// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IBilling.sol";
import "../libraries/DiamondStorage.sol";
import "../utils/AccessControl.sol";
import "../utils/ReentrancyGuard.sol";
import "../utils/Pausable.sol";
import "../utils/IdGenerator.sol";

/**
 * @title BillingFacet
 * @dev Facet for billing and payment management
 */
contract BillingFacet is IBilling, AccessControl, ReentrancyGuard, Pausable {
    using DiamondStorage for DiamondStorage.DiamondStorageStruct;

    /// Storage structure for billing data
    struct BillingStorage {
        mapping(bytes32 => Invoice) invoices;
        mapping(address => bytes32[]) patientInvoices;
        mapping(address => bytes32[]) providerInvoices;
        mapping(bytes32 => Payment) payments;
        string[] supportedCurrencies;
        mapping(string => bool) currencySupported;
    }

    /// Invoice structure
    struct Invoice {
        bytes32 invoiceId;
        address patient;
        address provider;
        uint256 amount;
        string currency;
        string[] itemCodes;
        uint256 dueDate;
        string description;
        string status;
        uint256 createdAt;
        uint256 approvedAt;
    }

    /// Payment structure
    struct Payment {
        uint256 amount;
        string currency;
        uint256 paidAt;
        bytes32 transactionHash;
    }

    /// Storage position for billing data
    bytes32 constant BILLING_STORAGE_POSITION =
        keccak256("diamond.billing.storage");

    /**
     * @dev Get billing storage
     */
    function getBillingStorage()
        internal
        pure
        returns (BillingStorage storage bs)
    {
        bytes32 position = BILLING_STORAGE_POSITION;
        assembly {
            bs.slot := position
        }
    }

    /// @inheritdoc IBilling
    function createInvoice(
        address patient,
        uint256 amount,
        string calldata currency,
        string[] calldata itemCodes,
        uint256 dueDate,
        string calldata description
    )
        external
        onlyProvider
        nonReentrant
        whenNotPaused
        returns (bytes32 invoiceId)
    {
        BillingStorage storage bs = getBillingStorage();
        require(
            bs.currencySupported[currency],
            "Billing: currency not supported"
        );

        invoiceId = IdGenerator.generateInvoiceId(patient, msg.sender, amount);

        bs.invoices[invoiceId] = Invoice({
            invoiceId: invoiceId,
            patient: patient,
            provider: msg.sender,
            amount: amount,
            currency: currency,
            itemCodes: itemCodes,
            dueDate: dueDate,
            description: description,
            status: "pending",
            createdAt: block.timestamp,
            approvedAt: 0
        });

        // Add to mappings
        bs.patientInvoices[patient].push(invoiceId);
        bs.providerInvoices[msg.sender].push(invoiceId);

        emit InvoiceCreated(
            invoiceId,
            patient,
            msg.sender,
            amount,
            currency,
            itemCodes,
            dueDate
        );
    }

    /// @inheritdoc IBilling
    function approveInvoice(
        bytes32 invoiceId
    ) external nonReentrant whenNotPaused {
        BillingStorage storage bs = getBillingStorage();
        Invoice storage invoice = bs.invoices[invoiceId];

        require(invoice.patient == msg.sender, "Billing: not invoice patient");
        require(
            keccak256(abi.encodePacked(invoice.status)) ==
                keccak256(abi.encodePacked("pending")),
            "Billing: invoice not pending"
        );

        invoice.status = "approved";
        invoice.approvedAt = block.timestamp;

        emit InvoiceApproved(invoiceId, msg.sender, block.timestamp);
    }

    /// @inheritdoc IBilling
    function rejectInvoice(
        bytes32 invoiceId,
        string calldata reason
    ) external nonReentrant {
        BillingStorage storage bs = getBillingStorage();
        Invoice storage invoice = bs.invoices[invoiceId];

        require(invoice.patient == msg.sender, "Billing: not invoice patient");
        require(
            keccak256(abi.encodePacked(invoice.status)) ==
                keccak256(abi.encodePacked("pending")),
            "Billing: invoice not pending"
        );

        invoice.status = "rejected";

        emit InvoiceRejected(invoiceId, msg.sender, reason, block.timestamp);
    }

    /// @inheritdoc IBilling
    function processPayment(
        bytes32 invoiceId
    ) external onlyAdmin nonReentrant whenNotPaused {
        BillingStorage storage bs = getBillingStorage();
        Invoice storage invoice = bs.invoices[invoiceId];

        require(
            keccak256(abi.encodePacked(invoice.status)) ==
                keccak256(abi.encodePacked("approved")),
            "Billing: invoice not approved"
        );

        // Here you would integrate with payment processing
        // This could involve HTS token transfers or HBAR payments

        bs.payments[invoiceId] = Payment({
            amount: invoice.amount,
            currency: invoice.currency,
            paidAt: block.timestamp,
            transactionHash: bytes32(0) // Would be actual transaction hash
        });

        invoice.status = "paid";

        emit PaymentProcessed(
            invoiceId,
            invoice.patient,
            invoice.amount,
            invoice.currency,
            block.timestamp
        );
    }

    /// @inheritdoc IBilling
    function disputeInvoice(
        bytes32 invoiceId,
        string calldata reason
    ) external nonReentrant {
        BillingStorage storage bs = getBillingStorage();
        Invoice storage invoice = bs.invoices[invoiceId];

        require(
            invoice.patient == msg.sender || invoice.provider == msg.sender,
            "Billing: not authorized"
        );
        require(
            keccak256(abi.encodePacked(invoice.status)) !=
                keccak256(abi.encodePacked("disputed")),
            "Billing: already disputed"
        );

        invoice.status = "disputed";

        emit InvoiceDisputed(invoiceId, msg.sender, reason, block.timestamp);
    }

    /// @inheritdoc IBilling
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
        )
    {
        BillingStorage storage bs = getBillingStorage();
        Invoice memory invoice = bs.invoices[invoiceId];

        return (
            invoice.patient,
            invoice.provider,
            invoice.amount,
            invoice.currency,
            invoice.itemCodes,
            invoice.dueDate,
            invoice.description,
            invoice.status,
            invoice.createdAt,
            invoice.approvedAt
        );
    }

    /// @inheritdoc IBilling
    function getPatientInvoices(
        address patient
    ) external view returns (bytes32[] memory invoiceIds) {
        BillingStorage storage bs = getBillingStorage();
        return bs.patientInvoices[patient];
    }

    /// @inheritdoc IBilling
    function getProviderInvoices(
        address provider
    ) external view returns (bytes32[] memory invoiceIds) {
        BillingStorage storage bs = getBillingStorage();
        return bs.providerInvoices[provider];
    }

    /// @inheritdoc IBilling
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
        )
    {
        BillingStorage storage bs = getBillingStorage();
        Payment memory payment = bs.payments[invoiceId];

        return (
            payment.amount,
            payment.currency,
            payment.paidAt,
            payment.transactionHash
        );
    }

    /// @inheritdoc IBilling
    function addSupportedCurrency(
        string calldata currency
    ) external onlyAdmin nonReentrant {
        BillingStorage storage bs = getBillingStorage();

        if (!bs.currencySupported[currency]) {
            bs.currencySupported[currency] = true;
            bs.supportedCurrencies.push(currency);

            emit CurrencyAdded(currency, msg.sender);
        }
    }

    /// @inheritdoc IBilling
    function getSupportedCurrencies() external view returns (string[] memory) {
        BillingStorage storage bs = getBillingStorage();
        return bs.supportedCurrencies;
    }

    /// @inheritdoc IBilling
    function isCurrencySupported(
        string calldata currency
    ) external view returns (bool) {
        BillingStorage storage bs = getBillingStorage();
        return bs.currencySupported[currency];
    }

    /**
     * @dev Initialize billing system
     */
    function initializeBilling() external onlyAdmin {
        BillingStorage storage bs = getBillingStorage();

        // Add default supported currencies
        bs.supportedCurrencies.push("USD");
        bs.supportedCurrencies.push("HBAR");
        bs.supportedCurrencies.push("AHL");

        bs.currencySupported["USD"] = true;
        bs.currencySupported["HBAR"] = true;
        bs.currencySupported["AHL"] = true;
    }
}
