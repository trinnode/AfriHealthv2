/**
 * Create HCS Topics for AfriHealth on Hedera Testnet
 * 
 * This script creates the required HCS (Hedera Consensus Service) topics
 * for storing immutable logs of consent, billing, and claims activities.
 * 
 * Setup:
 * 1. Install Hedera SDK:
 *    npm install @hashgraph/sdk dotenv
 * 
 * 2. Add to .env file:
 *    HEDERA_ACCOUNT_ID=0.0.xxxxx
 *    HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...
 *    HEDERA_NETWORK=testnet
 * 
 * Usage:
 *    node create-topics.js
 */

const {
  Client,
  TopicCreateTransaction,
  TopicInfoQuery,
  PrivateKey,
} = require("@hashgraph/sdk");
require("dotenv").config();

// Topic configurations
const TOPICS = {
  CONSENT: {
    name: "AfriHealth Consent Topic",
    memo: "Patient consent records and access control logs",
    description: "Immutable log of all patient consent grants and revocations",
  },
  BILLING: {
    name: "AfriHealth Billing Topic",
    memo: "Healthcare billing and payment records",
    description: "Immutable log of all invoices, payments, and billing transactions",
  },
  CLAIMS: {
    name: "AfriHealth Claims Topic",
    memo: "Insurance claims and approvals",
    description: "Immutable log of all insurance claims submissions and approvals",
  },
};

// Initialize Hedera client
function getClient() {
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  const network = process.env.HEDERA_NETWORK || "testnet";

  if (!accountId || !privateKey) {
    throw new Error(
      "Environment variables HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set"
    );
  }

  let client;
  if (network === "testnet") {
    client = Client.forTestnet();
  } else if (network === "mainnet") {
    client = Client.forMainnet();
  } else {
    throw new Error("Invalid network. Use 'testnet' or 'mainnet'");
  }

  client.setOperator(accountId, PrivateKey.fromString(privateKey));

  return client;
}

// Create a topic
async function createTopic(client, topicConfig) {
  console.log(`\nCreating ${topicConfig.name}...`);
  console.log(`Memo: ${topicConfig.memo}`);

  try {
    // Create the topic
    const transaction = new TopicCreateTransaction()
      .setTopicMemo(topicConfig.memo)
      .setAdminKey(client.operatorPublicKey)
      .setSubmitKey(client.operatorPublicKey);

    // Execute the transaction
    const txResponse = await transaction.execute(client);

    // Get the receipt
    const receipt = await txResponse.getReceipt(client);
    const topicId = receipt.topicId;

    console.log(`✓ Topic created successfully!`);
    console.log(`  Topic ID: ${topicId.toString()}`);
    console.log(`  Transaction ID: ${txResponse.transactionId.toString()}`);

    // Query topic info to verify
    const topicInfo = await new TopicInfoQuery()
      .setTopicId(topicId)
      .execute(client);

    console.log(`  Sequence Number: ${topicInfo.sequenceNumber.toString()}`);
    console.log(`  Running Hash: ${Buffer.from(topicInfo.runningHash).toString("hex").substring(0, 20)}...`);
    
    // Calculate estimated cost
    const transactionFee = receipt.transactionFee;
    // console.log(`  Cost: ~${transactionFee.toString()} tinybars (~$${(parseInt(transactionFee.toString()) / 100000000 * 0.05).toFixed(4)} USD)`);

    return {
      topicId: topicId.toString(),
      transactionId: txResponse.transactionId.toString(),
      sequenceNumber: topicInfo.sequenceNumber.toString(),
    };
  } catch (error) {
    console.error(`✗ Failed to create topic:`, error.message);
    throw error;
  }
}

// Main function
async function main() {
  console.log("===========================================");
  console.log("AfriHealth - HCS Topics Creation");
  console.log("===========================================");
  console.log("Network:", process.env.HEDERA_NETWORK || "testnet");
  console.log("Operator:", process.env.HEDERA_ACCOUNT_ID);
  console.log("");

  let client;
  const results = {};

  try {
    // Initialize client
    client = getClient();

    // Create Consent Topic
    console.log("\n[1/3] Creating Consent Topic...");
    const consentResult = await createTopic(client, TOPICS.CONSENT);
    results.CONSENT_TOPIC_ID = consentResult.topicId;

    // Wait a bit between creations to avoid rate limiting
    await sleep(2000);

    // Create Billing Topic
    console.log("\n[2/3] Creating Billing Topic...");
    const billingResult = await createTopic(client, TOPICS.BILLING);
    results.BILLING_TOPIC_ID = billingResult.topicId;

    await sleep(2000);

    // Create Claims Topic
    console.log("\n[3/3] Creating Claims Topic...");
    const claimsResult = await createTopic(client, TOPICS.CLAIMS);
    results.CLAIMS_TOPIC_ID = claimsResult.topicId;

    // Print summary
    printSummary(results);

    // Generate .env entries
    generateEnvEntries(results);

    // Save to file
    saveToFile(results);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  } finally {
    if (client) {
      client.close();
    }
  }
}

// Print summary
function printSummary(results) {
  console.log("\n===========================================");
  console.log("Topics Created Successfully!");
  console.log("===========================================");
  console.log("\nTopic IDs:");
  console.log(`  CONSENT_TOPIC_ID=${results.CONSENT_TOPIC_ID}`);
  console.log(`  BILLING_TOPIC_ID=${results.BILLING_TOPIC_ID}`);
  console.log(`  CLAIMS_TOPIC_ID=${results.CLAIMS_TOPIC_ID}`);
  console.log("\n===========================================");
}

// Generate .env entries
function generateEnvEntries(results) {
  console.log("\nAdd these to your .env file:");
  console.log("===========================================");
  console.log(`CONSENT_TOPIC_ID=${results.CONSENT_TOPIC_ID}`);
  console.log(`BILLING_TOPIC_ID=${results.BILLING_TOPIC_ID}`);
  console.log(`CLAIMS_TOPIC_ID=${results.CLAIMS_TOPIC_ID}`);
  console.log("===========================================");
}

// Save to file
function saveToFile(results) {
  const fs = require("fs");
  const path = require("path");

  const timestamp = new Date().toISOString();
  const network = process.env.HEDERA_NETWORK || "testnet";

  const data = {
    network,
    timestamp,
    operator: process.env.HEDERA_ACCOUNT_ID,
    topics: {
      consent: {
        topicId: results.CONSENT_TOPIC_ID,
        name: TOPICS.CONSENT.name,
        memo: TOPICS.CONSENT.memo,
      },
      billing: {
        topicId: results.BILLING_TOPIC_ID,
        name: TOPICS.BILLING.name,
        memo: TOPICS.BILLING.memo,
      },
      claims: {
        topicId: results.CLAIMS_TOPIC_ID,
        name: TOPICS.CLAIMS.name,
        memo: TOPICS.CLAIMS.memo,
      },
    },
  };

  const filename = `hcs-topics-${network}.json`;
  const filepath = path.join(__dirname, filename);

  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

  console.log(`\n✓ Topic information saved to: ${filename}`);
  console.log("\nNext Steps:");
  console.log("1. Update your .env file with the topic IDs above");
  console.log("2. Update your backend configuration");
  console.log("3. Test topic submission with the test script");
}

// Helper function to sleep
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});