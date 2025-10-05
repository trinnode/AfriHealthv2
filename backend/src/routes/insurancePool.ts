/**
 * Insurance Pool Routes
 * Handles pool creation, contributions, and queries
 */

import express, { Router } from "express";
import { AfriHealthContractService } from "../services/afrihealthContractService";
import { getHederaClient } from "../services/hederaService";

const router: Router = express.Router();

/**
 * POST /api/insurance-pool/create
 * Create a new insurance pool
 */
router.post("/create", async (req, res) => {
  try {
    const {
      name,
      description,
      targetAmount,
      minContribution,
      maxContribution,
    } = req.body;

    if (!name || !description || !targetAmount) {
      return res.status(400).json({
        error: "Name, description, and target amount are required",
      });
    }

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.createInsurancePool(
      name,
      description,
      targetAmount,
      minContribution || 0,
      maxContribution || 0
    );

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.transactionId,
        message: "Insurance pool created successfully",
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
 * POST /api/insurance-pool/contribute
 * Contribute to an insurance pool
 */
router.post("/contribute", async (req, res) => {
  try {
    const { poolId, amount } = req.body;

    if (!poolId || !amount) {
      return res.status(400).json({
        error: "Pool ID and amount are required",
      });
    }

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.contributeToPool(poolId, amount);

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.transactionId,
        message: "Contribution successful",
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
 * GET /api/insurance-pool/:id
 * Get insurance pool details
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.getInsurancePool(id);

    if (result.success) {
      res.json({
        success: true,
        pool: result.data,
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
 * GET /api/insurance-pool/:id/membership/:address
 * Get user's membership in a pool
 */
router.get("/:id/membership/:address", async (req, res) => {
  try {
    const { id, address } = req.params;

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.getUserPoolMembership(address, id);

    if (result.success) {
      res.json({
        success: true,
        membership: result.data,
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
