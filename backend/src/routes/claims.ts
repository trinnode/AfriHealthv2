/**
 * Insurance Claims Routes
 * Handles claim submission, processing, and queries
 */

import express, { Router } from "express";
import { AfriHealthContractService } from "../services/afrihealthContractService";
import { getHederaClient } from "../services/hederaService";

const router: Router = express.Router();

/**
 * POST /api/claims/submit
 * Submit a new insurance claim
 */
router.post("/submit", async (req, res) => {
  try {
    const { poolId, amount, claimType, description, supportingDocuments } =
      req.body;

    if (!poolId || !amount || !claimType || !description) {
      return res.status(400).json({
        error: "Pool ID, amount, claim type, and description are required",
      });
    }

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.submitClaim(
      poolId,
      amount,
      claimType,
      description,
      supportingDocuments || []
    );

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.transactionId,
        message: "Claim submitted successfully",
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
 * POST /api/claims/process
 * Process a claim (insurer/admin only)
 */
router.post("/process", async (req, res) => {
  try {
    const { claimId, approved, approvedAmount, comments } = req.body;

    if (!claimId || approved === undefined) {
      return res.status(400).json({
        error: "Claim ID and approval status are required",
      });
    }

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.processClaim(
      claimId,
      approved,
      approvedAmount || 0,
      comments || ""
    );

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.transactionId,
        message: "Claim processed successfully",
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
 * GET /api/claims/:id
 * Get claim details
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.getClaim(id);

    if (result.success) {
      res.json({
        success: true,
        claim: result.data,
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
 * GET /api/claims/user/:address
 * Get all claims for a user
 */
router.get("/user/:address", async (req, res) => {
  try {
    const { address } = req.params;

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.getUserClaims(address);

    if (result.success) {
      // Fetch details for each claim
      const claims = await Promise.all(
        result.data.claimIds.map(async (id: string) => {
          const claimResult = await contractService.getClaim(id);
          return {
            id,
            ...claimResult.data,
          };
        })
      );

      res.json({
        success: true,
        claims,
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
