/**
 * Governance Routes
 * Handles proposal creation, voting, and queries
 */

import express, { Router } from "express";
import { AfriHealthContractService } from "../services/afrihealthContractService";
import { getHederaClient } from "../services/hederaService";

const router: Router = express.Router();

/**
 * POST /api/governance/proposal/create
 * Create a new governance proposal
 */
router.post("/proposal/create", async (req, res) => {
  try {
    const { title, description, proposalType, votingPeriod } = req.body;

    if (!title || !description || proposalType === undefined) {
      return res.status(400).json({
        error: "Title, description, and proposal type are required",
      });
    }

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.createProposal(
      title,
      description,
      proposalType,
      votingPeriod || 7 * 24 * 60 * 60 // Default 7 days
    );

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.transactionId,
        message: "Proposal created successfully",
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
 * POST /api/governance/proposal/vote
 * Vote on a proposal
 */
router.post("/proposal/vote", async (req, res) => {
  try {
    const { proposalId, support } = req.body;

    if (!proposalId || support === undefined) {
      return res.status(400).json({
        error: "Proposal ID and support are required",
      });
    }

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.vote(proposalId, support);

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.transactionId,
        message: "Vote recorded successfully",
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
 * GET /api/governance/proposal/:id
 * Get proposal details
 */
router.get("/proposal/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.getProposal(id);

    if (result.success) {
      res.json({
        success: true,
        proposal: result.data,
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
