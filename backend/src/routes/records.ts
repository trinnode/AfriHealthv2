/**
 * Medical Records Routes
 * Handles record creation, queries, and updates
 */

import express, { Router } from "express";
import { AfriHealthContractService } from "../services/afrihealthContractService";
import { getHederaClient } from "../services/hederaService";

const router: Router = express.Router();

/**
 * POST /api/records/create
 * Create a new medical record
 */
router.post("/create", async (req, res) => {
  try {
    const { patient, recordType, dataHash, fileHash, metadata } = req.body;

    if (!patient || !recordType || !dataHash) {
      return res.status(400).json({
        error: "Patient, record type, and data hash are required",
      });
    }

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.createRecord(
      patient,
      recordType,
      dataHash,
      fileHash || "",
      metadata || ""
    );

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.transactionId,
        message: "Record created successfully",
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
 * GET /api/records/patient/:address
 * Get all records for a patient
 */
router.get("/patient/:address", async (req, res) => {
  try {
    const { address } = req.params;

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.getPatientRecords(address);

    if (result.success) {
      // Fetch details for each record
      const records = await Promise.all(
        result.data.recordIds.map(async (id: string) => {
          const recordResult = await contractService.getRecord(id);
          return {
            id,
            ...recordResult.data,
          };
        })
      );

      res.json({
        success: true,
        records,
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
 * GET /api/records/:id
 * Get record details
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.getRecord(id);

    if (result.success) {
      res.json({
        success: true,
        record: result.data,
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
 * PUT /api/records/:id/metadata
 * Update record metadata
 */
router.put("/:id/metadata", async (req, res) => {
  try {
    const { id } = req.params;
    const { metadata } = req.body;

    if (!metadata) {
      return res.status(400).json({ error: "Metadata is required" });
    }

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.updateRecordMetadata(id, metadata);

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.transactionId,
        message: "Metadata updated successfully",
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
