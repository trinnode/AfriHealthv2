/**
 * Dispute Routes
 * Handles dispute creation, resolution, and queries
 */

import express, { Router } from "express";
import { AfriHealthContractService } from "../services/afrihealthContractService";
import { getHederaClient } from "../services/hederaService";

const router: Router = express.Router();

/**
 * POST /api/dispute/create
 * Create a new dispute
 */
router.post("/create", async (req, res) => {
  try {
    const { disputeType, relatedId, reason, evidence } = req.body;

    if (disputeType === undefined || !relatedId || !reason) {
      return res.status(400).json({
        error: "Dispute type, related ID, and reason are required",
      });
    }

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.createDispute(
      disputeType,
      relatedId,
      reason,
      evidence || ""
    );

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.transactionId,
        message: "Dispute created successfully",
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
 * POST /api/dispute/resolve
 * Resolve a dispute (admin/arbitrator only)
 */
router.post("/resolve", async (req, res) => {
  try {
    const { disputeId, resolution, ruling } = req.body;

    if (!disputeId || !resolution || ruling === undefined) {
      return res.status(400).json({
        error: "Dispute ID, resolution, and ruling are required",
      });
    }

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.resolveDispute(
      disputeId,
      resolution,
      ruling
    );

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.transactionId,
        message: "Dispute resolved successfully",
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
 * GET /api/dispute/:id
 * Get dispute details
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.getDispute(id);

    if (result.success) {
      res.json({
        success: true,
        dispute: result.data,
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

export default router;
