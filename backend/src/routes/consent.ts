/**
 * Consent Management Routes
 * Handles consent granting, revoking, and queries
 */

import express, { Router } from "express";
import { AfriHealthContractService } from "../services/afrihealthContractService";
import { getHederaClient } from "../services/hederaService";

const router: Router = express.Router();

/**
 * POST /api/consent/grant
 * Grant consent to a provider
 */
router.post("/grant", async (req, res) => {
  try {
    const { provider, scopes, expirationTime, purpose } = req.body;

    if (!provider || !scopes || !expirationTime) {
      return res.status(400).json({
        error: "Provider, scopes, and expiration time are required",
      });
    }

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.grantConsent(
      provider,
      scopes,
      expirationTime,
      purpose || ""
    );

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.transactionId,
        message: "Consent granted successfully",
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
 * POST /api/consent/revoke
 * Revoke consent
 */
router.post("/revoke", async (req, res) => {
  try {
    const { consentId } = req.body;

    if (!consentId) {
      return res.status(400).json({ error: "Consent ID is required" });
    }

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.revokeConsent(consentId);

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.transactionId,
        message: "Consent revoked successfully",
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
 * GET /api/consent/check
 * Check if valid consent exists
 */
router.get("/check", async (req, res) => {
  try {
    const { patient, provider, scope } = req.query;

    if (!patient || !provider || !scope) {
      return res.status(400).json({
        error: "Patient, provider, and scope are required",
      });
    }

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.hasValidConsent(
      patient as string,
      provider as string,
      scope as string
    );

    if (result.success) {
      res.json({
        success: true,
        hasConsent: result.data.hasConsent,
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
 * GET /api/consent/patient/:address
 * Get all consents for a patient
 */
router.get("/patient/:address", async (req, res) => {
  try {
    const { address } = req.params;

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.getPatientConsents(address);

    if (result.success) {
      // Fetch details for each consent
      const consents = await Promise.all(
        result.data.consentIds.map(async (id: string) => {
          const consentResult = await contractService.getConsent(id);
          return {
            id,
            ...consentResult.data,
          };
        })
      );

      res.json({
        success: true,
        consents,
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
 * GET /api/consent/:id
 * Get consent details
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.getConsent(id);

    if (result.success) {
      res.json({
        success: true,
        consent: result.data,
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
