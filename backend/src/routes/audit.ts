/**
 * Audit Routes
 * Handles audit log queries
 */

import express, { Router } from "express";
import { AfriHealthContractService } from "../services/afrihealthContractService";
import { getHederaClient } from "../services/hederaService";

const router: Router = express.Router();

/**
 * GET /api/audit/access-logs/:address
 * Get access logs for a patient
 */
router.get("/access-logs/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const { startTime, endTime } = req.query;

    if (!startTime || !endTime) {
      return res.status(400).json({
        error: "Start time and end time are required",
      });
    }

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.getAccessLogs(
      address,
      parseInt(startTime as string),
      parseInt(endTime as string)
    );

    if (result.success) {
      // Fetch details for each log
      const logs = await Promise.all(
        result.data.logIds.map(async (id: string) => {
          const logResult = await contractService.getAuditLog(id);
          return {
            id,
            ...logResult.data,
          };
        })
      );

      res.json({
        success: true,
        logs,
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
 * GET /api/audit/log/:id
 * Get audit log details
 */
router.get("/log/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const client = await getHederaClient();
    const contractService = new AfriHealthContractService({
      diamondAddress: process.env.DIAMOND_CONTRACT_ADDRESS!,
      client,
    });

    const result = await contractService.getAuditLog(id);

    if (result.success) {
      res.json({
        success: true,
        log: result.data,
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
