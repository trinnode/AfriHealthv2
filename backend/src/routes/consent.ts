/**
 * Consent Management Routes
 * Handles consent granting, revoking, and queries
 */

import express, { Router } from "express";
import { AfriHealthContractService } from "../services/afrihealthContractService";
import { getHederaClient } from "../services/hederaService";
import { log } from "console";

const router: Router = express.Router();


router.post("/grant", async (req, res) => {
  try {
    const { provider, scopes, expirationTime, purpose } = req.body;

    if (!provider || !scopes || !expirationTime) {
      return res.status(400).json({
        error: "Provider, scopes, and expiration time are required",
      });
    }
    const client = await getHederaClient();
    log("{consent.ts:24} gotten client")
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });
    log("{consent.ts:29} instantiated contractService")
    const result = await contractService.grantConsent(
      provider,
      scopes,
      expirationTime,
      purpose || ""
    );
    log("{result}: ", result)

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.transactionId,
        message: "Consent granted successfully",
      });
    } else {
      log("error {consent.ts:44}")
      console.log("error: ", result.error)
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error: any) {
     log("error {consent.ts:52}")
      console.log("error: ", error.message)
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

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
