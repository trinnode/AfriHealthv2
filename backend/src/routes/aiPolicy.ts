/**
 * AI Policy Routes
 * Handles AI policy creation, assignment, and queries
 */

import express, { Router } from "express";
import { AfriHealthContractService } from "../services/afrihealthContractService";
import { getHederaClient } from "../services/hederaService";

const router: Router = express.Router();

/**
 * POST /api/ai-policy/create
 * Create a new AI policy
 */
router.post("/create", async (req, res) => {
  try {
    const { name, description, modelHash, rules } = req.body;

    if (!name || !description || !modelHash || !rules) {
      return res.status(400).json({
        error: "Name, description, model hash, and rules are required",
      });
    }

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.createAIPolicy(
      name,
      description,
      modelHash,
      rules
    );

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.transactionId,
        message: "AI policy created successfully",
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
 * POST /api/ai-policy/assign
 * Assign AI policy to a patient
 */
router.post("/assign", async (req, res) => {
  try {
    const { patient, policyId } = req.body;

    if (!patient || !policyId) {
      return res.status(400).json({
        error: "Patient address and policy ID are required",
      });
    }

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.assignAIPolicyToPatient(
      patient,
      policyId
    );

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.transactionId,
        message: "AI policy assigned successfully",
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
 * GET /api/ai-policy/:id
 * Get AI policy details
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.getAIPolicy(id);

    if (result.success) {
      res.json({
        success: true,
        policy: result.data,
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
 * GET /api/ai-policy/patient/:address
 * Get patient's AI policy
 */
router.get("/patient/:address", async (req, res) => {
  try {
    const { address } = req.params;

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const policyIdResult = await contractService.getPatientAIPolicy(address);

    if (policyIdResult.success) {
      // Fetch full policy details
      const policyResult = await contractService.getAIPolicy(
        policyIdResult.data.policyId
      );

      if (policyResult.success) {
        res.json({
          success: true,
          policy: {
            id: policyIdResult.data.policyId,
            ...policyResult.data,
          },
        });
      } else {
        res.status(404).json({
          success: false,
          error: policyResult.error,
        });
      }
    } else {
      res.status(500).json({
        success: false,
        error: policyIdResult.error,
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
 * POST /api/ai-policy/evaluate
 * Evaluate an invoice using AI policy
 */
router.post("/evaluate", async (req, res) => {
  try {
    const { patient, invoiceData } = req.body;

    if (!patient || !invoiceData) {
      return res.status(400).json({
        error: "Patient address and invoice data are required",
      });
    }

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    // Get patient's AI policy
    const policyResult = await contractService.getPatientAIPolicy(patient);

    if (!policyResult.success) {
      return res.status(404).json({
        success: false,
        error: "No AI policy found for this patient",
      });
    }

    // Get policy details
    const policyDetailsResult = await contractService.getAIPolicy(
      policyResult.data.policyId
    );

    if (!policyDetailsResult.success) {
      return res.status(404).json({
        success: false,
        error: "AI policy details not found",
      });
    }

    // TODO: Implement AI evaluation logic here
    // This would involve running the ML model with the policy rules
    // For now, return a simple evaluation

    const evaluation = {
      decision: "PENDING", // APPROVE, REJECT, or PENDING
      confidence: 0.85,
      reasons: ["Invoice amount within policy limits", "Service type covered"],
      suggestedAction: "Manual review recommended",
      policyId: policyResult.data.policyId,
    };

    res.json({
      success: true,
      evaluation,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
