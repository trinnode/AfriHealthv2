import { Router, Request, Response } from "express";
import { hcsService } from "../server";
import { HCSMessageType } from "../services/hcsService";

const router: Router = Router();

/**
 * GET /api/hcs/topics
 * Get all registered HCS topics
 */
router.get("/topics", async (req: Request, res: Response) => {
  try {
    const topics = hcsService.getAllTopics();
    const topicList = Array.from(topics.entries()).map(([name, topicId]) => ({
      name,
      topicId: topicId.toString(),
    }));

    res.json({
      success: true,
      topics: topicList,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get topics",
    });
  }
});

/**
 * POST /api/hcs/topics/create
 * Create a new HCS topic
 */
router.post("/topics/create", async (req: Request, res: Response) => {
  try {
    const { name, memo, adminKey, submitKey } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Topic name is required",
      });
    }

    const topicId = await hcsService.createTopic(name, {
      memo,
      adminKey,
      submitKey,
    });

    res.json({
      success: true,
      topicId: topicId.toString(),
      message: `Topic "${name}" created successfully`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create topic",
    });
  }
});

/**
 * POST /api/hcs/submit
 * Submit a message to an HCS topic
 */
router.post("/submit", async (req: Request, res: Response) => {
  try {
    const { topicName, type, data, metadata } = req.body;

    if (!topicName || !type || !data) {
      return res.status(400).json({
        success: false,
        error: "topicName, type, and data are required",
      });
    }

    const message = {
      type: type as HCSMessageType,
      timestamp: Date.now(),
      data,
      metadata,
    };

    const transactionId = await hcsService.submitMessage(topicName, message);

    res.json({
      success: true,
      transactionId,
      message: "Message submitted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to submit message",
    });
  }
});

/**
 * GET /api/hcs/messages/:topicName
 * Get messages from an HCS topic
 */
router.get("/messages/:topicName", async (req: Request, res: Response) => {
  try {
    const { topicName } = req.params;
    const { limit, startTime } = req.query;

    const messages = await hcsService.getMessages(
      topicName,
      limit ? parseInt(limit as string) : 100,
      startTime ? new Date(startTime as string) : undefined
    );

    res.json({
      success: true,
      topicName,
      count: messages.length,
      messages,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get messages",
    });
  }
});

/**
 * POST /api/hcs/consent/grant
 * Submit consent granted message
 */
router.post("/consent/grant", async (req: Request, res: Response) => {
  try {
    const { consentId, patientId, providerId, scope, metadata } = req.body;

    if (!consentId || !patientId || !providerId || !scope) {
      return res.status(400).json({
        success: false,
        error: "consentId, patientId, providerId, and scope are required",
      });
    }

    const message = hcsService.createConsentMessage(
      HCSMessageType.CONSENT_GRANTED,
      consentId,
      patientId,
      providerId,
      scope,
      metadata
    );

    const transactionId = await hcsService.submitMessage("consent", message);

    res.json({
      success: true,
      transactionId,
      message: "Consent granted message submitted",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to submit consent message",
    });
  }
});

/**
 * POST /api/hcs/billing/create
 * Submit billing created message
 */
router.post("/billing/create", async (req: Request, res: Response) => {
  try {
    const { billId, patientId, providerId, amount, items, metadata } = req.body;

    if (!billId || !patientId || !providerId || !amount || !items) {
      return res.status(400).json({
        success: false,
        error: "billId, patientId, providerId, amount, and items are required",
      });
    }

    const message = hcsService.createBillingMessage(
      HCSMessageType.BILLING_CREATED,
      billId,
      patientId,
      providerId,
      amount,
      items,
      metadata
    );

    const transactionId = await hcsService.submitMessage("billing", message);

    res.json({
      success: true,
      transactionId,
      message: "Billing created message submitted",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to submit billing message",
    });
  }
});

export default router;
