/**
 * Billing Routes
 * Handles invoice creation, payments, and queries
 */

import express, { Router } from "express";
import { AfriHealthContractService } from "../services/afrihealthContractService";
import { getHederaClient } from "../services/hederaService";

const router: Router = express.Router();

/**
 * POST /api/billing/invoice/create
 * Create a new invoice
 */
router.post("/invoice/create", async (req, res) => {
  try {
    const { patient, amount, serviceDescription, dueDate, metadata } = req.body;

    if (!patient || !amount || !serviceDescription || !dueDate) {
      return res.status(400).json({
        error:
          "Patient, amount, service description, and due date are required",
      });
    }

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.createInvoice(
      patient,
      amount,
      serviceDescription,
      dueDate,
      metadata || ""
    );

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.transactionId,
        message: "Invoice created successfully",
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/billing/invoice/pay
 * Pay an invoice
 */
router.post("/invoice/pay", async (req, res) => {
  try {
    const { invoiceId, paymentMethod } = req.body;

    if (!invoiceId || paymentMethod === undefined) {
      return res.status(400).json({
        error: "Invoice ID and payment method are required",
      });
    }

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.payInvoice(invoiceId, paymentMethod);

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.transactionId,
        message: "Invoice paid successfully",
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/billing/invoice/dispute
 * Dispute an invoice
 */
router.post("/invoice/dispute", async (req, res) => {
  try {
    const { invoiceId, reason } = req.body;

    if (!invoiceId || !reason) {
      return res.status(400).json({
        error: "Invoice ID and reason are required",
      });
    }

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.disputeInvoice(invoiceId, reason);

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.transactionId,
        message: "Invoice disputed successfully",
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/billing/invoice/:id
 * Get invoice details
 */
router.get("/invoice/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.getInvoice(id);

    if (result.success) {
      res.json({
        success: true,
        invoice: result.data,
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/billing/patient/:address/invoices
 * Get all invoices for a patient
 */
router.get("/patient/:address/invoices", async (req, res) => {
  try {
    const { address } = req.params;

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.getPatientInvoices(address);

    if (result.success) {
      // Fetch details for each invoice
      const invoices = await Promise.all(
        result.data.invoiceIds.map(async (id: string) => {
          const invoiceResult = await contractService.getInvoice(id);
          return {
            id,
            ...invoiceResult.data,
          };
        })
      );

      res.json({
        success: true,
        invoices,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/billing/provider/:address/invoices
 * Get all invoices for a provider
 */
router.get("/provider/:address/invoices", async (req, res) => {
  try {
    const { address } = req.params;

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.getProviderInvoices(address);

    if (result.success) {
      // Fetch details for each invoice
      const invoices = await Promise.all(
        result.data.invoiceIds.map(async (id: string) => {
          const invoiceResult = await contractService.getInvoice(id);
          return {
            id,
            ...invoiceResult.data,
          };
        })
      );

      res.json({
        success: true,
        invoices,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
