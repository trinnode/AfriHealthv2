import {
  TopicId,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicMessageQuery,
  TopicMessage,
  Client,
} from "@hashgraph/sdk";
import axios from "axios";
import { HederaService } from "./hederaService";

/**
 * Message types for different HCS topics
 */
export enum HCSMessageType {
  CONSENT_GRANTED = "ConsentGranted",
  CONSENT_REVOKED = "ConsentRevoked",
  CONSENT_UPDATED = "ConsentUpdated",
  BILLING_CREATED = "BillingCreated",
  BILLING_APPROVED = "BillingApproved",
  BILLING_PAID = "BillingPaid",
  CLAIM_SUBMITTED = "ClaimSubmitted",
  CLAIM_APPROVED = "ClaimApproved",
  CLAIM_REJECTED = "ClaimRejected",
  EMERGENCY_ACCESS = "EmergencyAccess",
}

/**
 * Structure of HCS messages
 */
export interface HCSMessage {
  type: HCSMessageType;
  timestamp: number;
  data: any;
  metadata?: {
    contractId?: string;
    transactionId?: string;
    initiator?: string;
  };
}

/**
 * Topic configuration
 */
export interface TopicConfig {
  topicId?: string;
  memo?: string;
  adminKey?: boolean;
  submitKey?: boolean;
}

/**
 * Hedera Consensus Service (HCS) for managing topics and messages
 * Provides audit trail and real-time event streaming
 */
export class HCSService {
  private hederaService: HederaService;
  private topics: Map<string, TopicId> = new Map();
  private subscribers: Map<string, TopicMessageQuery> = new Map();
  private mirrorNodeUrl: string;

  // Topic names
  static readonly CONSENT_TOPIC = "consent";
  static readonly BILLING_TOPIC = "billing";
  static readonly CLAIMS_TOPIC = "claims";
  static readonly GOVERNANCE_TOPIC = "governance";

  constructor(hederaService: HederaService) {
    this.hederaService = hederaService;
    this.mirrorNodeUrl =
      process.env.HEDERA_MIRROR_NODE_URL ||
      "https://testnet.mirrornode.hedera.com";
  }

  /**
   * Initialize HCS topics from environment or create new ones
   */
  async initializeTopics(): Promise<void> {
    try {
      // Load existing topics from environment
      const consentTopicId = process.env.CONSENT_TOPIC_ID;
      const billingTopicId = process.env.BILLING_TOPIC_ID;
      const claimsTopicId = process.env.CLAIMS_TOPIC_ID;
      const governanceTopicId = process.env.GOVERNANCE_TOPIC_ID;

      if (consentTopicId) {
        this.topics.set(
          HCSService.CONSENT_TOPIC,
          TopicId.fromString(consentTopicId)
        );
        console.log(`✅ Loaded Consent Topic: ${consentTopicId}`);
      }

      if (billingTopicId) {
        this.topics.set(
          HCSService.BILLING_TOPIC,
          TopicId.fromString(billingTopicId)
        );
        console.log(`✅ Loaded Billing Topic: ${billingTopicId}`);
      }

      if (claimsTopicId) {
        this.topics.set(
          HCSService.CLAIMS_TOPIC,
          TopicId.fromString(claimsTopicId)
        );
        console.log(`✅ Loaded Claims Topic: ${claimsTopicId}`);
      }

      if (governanceTopicId) {
        this.topics.set(
          HCSService.GOVERNANCE_TOPIC,
          TopicId.fromString(governanceTopicId)
        );
        console.log(`✅ Loaded Governance Topic: ${governanceTopicId}`);
      }

      console.log(`📋 Initialized ${this.topics.size} HCS topics`);
    } catch (error) {
      console.error("❌ Failed to initialize HCS topics:", error);
      throw error;
    }
  }

  /**
   * Create a new HCS topic
   */
  async createTopic(name: string, config: TopicConfig = {}): Promise<TopicId> {
    try {
      const client = this.hederaService.getClient();
      const operatorKey = this.hederaService.getOperatorKey();

      if (!client || !operatorKey) {
        throw new Error("Hedera client not initialized");
      }

      // Create topic transaction
      let transaction = new TopicCreateTransaction();

      if (config.memo) {
        transaction = transaction.setTopicMemo(config.memo);
      }

      if (config.adminKey) {
        transaction = transaction.setAdminKey(operatorKey);
      }

      if (config.submitKey) {
        transaction = transaction.setSubmitKey(operatorKey);
      }

      // Execute transaction
      const txResponse = await transaction.execute(client);
      const receipt = await txResponse.getReceipt(client);
      const topicId = receipt.topicId;

      if (!topicId) {
        throw new Error("Failed to get topic ID from receipt");
      }

      // Store topic
      this.topics.set(name, topicId);

      console.log(`✅ Created HCS topic "${name}": ${topicId.toString()}`);
      console.log(
        `💡 Add to .env: ${name.toUpperCase()}_TOPIC_ID=${topicId.toString()}`
      );

      return topicId;
    } catch (error) {
      console.error(`❌ Failed to create topic "${name}":`, error);
      throw error;
    }
  }

  /**
   * Submit a message to an HCS topic
   */
  async submitMessage(topicName: string, message: HCSMessage): Promise<string> {
    try {
      const client = this.hederaService.getClient();

      if (!client) {
        throw new Error("Hedera client not initialized");
      }

      const topicId = this.topics.get(topicName);

      if (!topicId) {
        throw new Error(
          `Topic "${topicName}" not found. Initialize topics first.`
        );
      }

      // Add timestamp if not present
      if (!message.timestamp) {
        message.timestamp = Date.now();
      }

      // Serialize message
      const messageBytes = Buffer.from(JSON.stringify(message));

      // Submit message
      const transaction = new TopicMessageSubmitTransaction({
        topicId,
        message: messageBytes,
      });

      const txResponse = await transaction.execute(client);
      const receipt = await txResponse.getReceipt(client);

      const transactionId = txResponse.transactionId.toString();

      console.log(
        `✅ Message submitted to ${topicName}: ${message.type} (${transactionId})`
      );

      return transactionId;
    } catch (error) {
      console.error(`❌ Failed to submit message to ${topicName}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to HCS topic messages via Mirror Node
   */
  async subscribeToTopic(
    topicName: string,
    callback: (message: HCSMessage, sequenceNumber: number) => void,
    startTime?: Date
  ): Promise<void> {
    try {
      const topicId = this.topics.get(topicName);

      if (!topicId) {
        throw new Error(`Topic "${topicName}" not found`);
      }

      console.log(`🔔 Subscribing to ${topicName} (${topicId.toString()})...`);

      // Use Mirror Node REST API for reliable message retrieval
      await this.pollMirrorNode(topicId, callback, startTime);
    } catch (error) {
      console.error(`❌ Failed to subscribe to ${topicName}:`, error);
      throw error;
    }
  }

  /**
   * Poll Mirror Node for topic messages
   */
  private async pollMirrorNode(
    topicId: TopicId,
    callback: (message: HCSMessage, sequenceNumber: number) => void,
    startTime?: Date
  ): Promise<void> {
    const topicIdString = topicId.toString();
    let lastSequenceNumber = 0;

    // Build query URL
    let url = `${this.mirrorNodeUrl}/api/v1/topics/${topicIdString}/messages`;

    if (startTime) {
      const timestamp = Math.floor(startTime.getTime() / 1000);
      url += `?timestamp=gte:${timestamp}`;
    }

    // Initial fetch
    try {
      const response = await axios.get(url);
      const messages = response.data.messages || [];

      for (const msg of messages) {
        try {
          const messageData = Buffer.from(msg.message, "base64").toString(
            "utf8"
          );
          const parsedMessage: HCSMessage = JSON.parse(messageData);
          callback(parsedMessage, msg.sequence_number);
          lastSequenceNumber = msg.sequence_number;
        } catch (parseError) {
          console.warn(
            `⚠️ Failed to parse message ${msg.sequence_number}:`,
            parseError
          );
        }
      }

      console.log(`✅ Processed ${messages.length} existing messages`);
    } catch (error) {
      console.warn(`⚠️ Failed to fetch existing messages:`, error);
    }

    // Poll for new messages every 5 seconds
    setInterval(async () => {
      try {
        const pollUrl = `${this.mirrorNodeUrl}/api/v1/topics/${topicIdString}/messages?sequenceNumber=gt:${lastSequenceNumber}&limit=100`;
        const response = await axios.get(pollUrl);
        const messages = response.data.messages || [];

        for (const msg of messages) {
          try {
            const messageData = Buffer.from(msg.message, "base64").toString(
              "utf8"
            );
            const parsedMessage: HCSMessage = JSON.parse(messageData);
            callback(parsedMessage, msg.sequence_number);
            lastSequenceNumber = msg.sequence_number;
          } catch (parseError) {
            console.warn(
              `⚠️ Failed to parse message ${msg.sequence_number}:`,
              parseError
            );
          }
        }

        if (messages.length > 0) {
          console.log(`📨 Received ${messages.length} new messages`);
        }
      } catch (error) {
        // Silent fail for polling errors
      }
    }, 5000);
  }

  /**
   * Get messages from Mirror Node REST API
   */
  async getMessages(
    topicName: string,
    limit: number = 100,
    startTime?: Date
  ): Promise<any[]> {
    try {
      const topicId = this.topics.get(topicName);

      if (!topicId) {
        throw new Error(`Topic "${topicName}" not found`);
      }

      let url = `${
        this.mirrorNodeUrl
      }/api/v1/topics/${topicId.toString()}/messages?limit=${limit}&order=desc`;

      if (startTime) {
        const timestamp = Math.floor(startTime.getTime() / 1000);
        url += `&timestamp=gte:${timestamp}`;
      }

      const response = await axios.get(url);
      const messages = response.data.messages || [];

      // Parse messages
      return messages.map((msg: any) => {
        try {
          const messageData = Buffer.from(msg.message, "base64").toString(
            "utf8"
          );
          return {
            sequenceNumber: msg.sequence_number,
            consensusTimestamp: msg.consensus_timestamp,
            message: JSON.parse(messageData),
            runningHash: msg.running_hash,
          };
        } catch (error) {
          return {
            sequenceNumber: msg.sequence_number,
            consensusTimestamp: msg.consensus_timestamp,
            message: null,
            error: "Failed to parse message",
          };
        }
      });
    } catch (error) {
      console.error(`❌ Failed to get messages from ${topicName}:`, error);
      throw error;
    }
  }

  /**
   * Get topic info
   */
  getTopicId(topicName: string): TopicId | undefined {
    return this.topics.get(topicName);
  }

  /**
   * Get all registered topics
   */
  getAllTopics(): Map<string, TopicId> {
    return new Map(this.topics);
  }

  /**
   * Helper: Create consent message
   */
  createConsentMessage(
    type: HCSMessageType,
    consentId: string,
    patientId: string,
    providerId: string,
    scope: string[],
    metadata?: any
  ): HCSMessage {
    return {
      type,
      timestamp: Date.now(),
      data: {
        consentId,
        patientId,
        providerId,
        scope,
        ...metadata,
      },
    };
  }

  /**
   * Helper: Create billing message
   */
  createBillingMessage(
    type: HCSMessageType,
    billId: string,
    patientId: string,
    providerId: string,
    amount: number,
    items: any[],
    metadata?: any
  ): HCSMessage {
    return {
      type,
      timestamp: Date.now(),
      data: {
        billId,
        patientId,
        providerId,
        amount,
        items,
        ...metadata,
      },
    };
  }

  /**
   * Helper: Create claims message
   */
  createClaimsMessage(
    type: HCSMessageType,
    claimId: string,
    patientId: string,
    providerId: string,
    amount: number,
    diagnosis: string,
    metadata?: any
  ): HCSMessage {
    return {
      type,
      timestamp: Date.now(),
      data: {
        claimId,
        patientId,
        providerId,
        amount,
        diagnosis,
        ...metadata,
      },
    };
  }
}
