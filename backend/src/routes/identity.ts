/**
 * Identity Management Routes
 * Handles identity registration, verification, and queries
 */

import express, { Router } from "express";
import { AfriHealthContractService } from "../services/afrihealthContractService";
import { getHederaClient } from "../services/hederaService";

const router: Router = express.Router();

/**
 * POST /api/identity/register
 * Register a new identity
 */
router.post("/register", async (req, res) => {
  try {
    const { identityType, licenseNumber, specialization } = req.body;

    if (identityType === undefined) {
      return res.status(400).json({ error: "Identity type is required" });
    }

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.registerIdentity(
      identityType,
      licenseNumber || "",
      specialization || ""
    );

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.transactionId,
        message: "Identity registered successfully",
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
 * GET /api/identity/:address
 * Get identity information
 */
router.get("/:address", async (req, res) => {
  try {
    const { address } = req.params;

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.getIdentity(address);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
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
 * POST /api/identity/verify
 * Verify an identity (admin only)
 */
router.post("/verify", async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.verifyIdentity(address);

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.transactionId,
        message: "Identity verified successfully",
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
 * POST /api/identity/deactivate
 * Deactivate an identity (admin only)
 */
router.post("/deactivate", async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.deactivateIdentity(address);

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.transactionId,
        message: "Identity deactivated successfully",
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
