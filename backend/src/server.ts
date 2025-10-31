import express, { Application } from "express";
import cors from "cors";
// import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import patientRoutes from "./routes/patient";
import providerRoutes from "./routes/provider";
import contractRoutes from "./routes/contracts";
import authRoutes from "./routes/auth";
import identityRoutes from "./routes/identity";
import consentRoutes from "./routes/consent";
import recordsRoutes from "./routes/records";
import billingRoutes from "./routes/billing";
import claimsRoutes from "./routes/claims";
import aiPolicyRoutes from "./routes/aiPolicy";
import insurancePoolRoutes from "./routes/insurancePool";
import disputeRoutes from "./routes/dispute";
import governanceRoutes from "./routes/governance";
import auditRoutes from "./routes/audit";
import { errorHandler } from "./middleware/errorHandler";   
import { notFoundHandler } from "./middleware/notFoundHandler";
import { HederaService } from "./services/hederaService";
import { ContractService } from "./services/contractService";
import { HCSService } from "./services/hcsService";

dotenv.config();

export const hederaService = new HederaService();
export const contractService = new ContractService(hederaService);
export const hcsService = new HCSService(hederaService);

const app: Application = express();
const PORT = process.env.PORT || 3001;

// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         styleSrc: ["'self'", "'unsafe-inline'"],
//         scriptSrc: ["'self'"],
//         imgSrc: ["'self'", "data:", "https:"],
//       },
//     },
//     crossOriginEmbedderPolicy: false,
//   })
// );

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

app.use(
  cors({
    origin:"*",
      // process.env.NODE_ENV === "production"? process.env.FRONTEND_URL : ["http://localhost:5174", "http://localhost:5173"],
    // credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(compression());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/provider", providerRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/hcs", require("./routes/hcs").default);

app.use("/api/identity", identityRoutes);
app.use("/api/consent", consentRoutes);
app.use("/api/records", recordsRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/claims", claimsRoutes);
app.use("/api/ai-policy", aiPolicyRoutes);
app.use("/api/insurance-pool", insurancePoolRoutes);
app.use("/api/dispute", disputeRoutes);
app.use("/api/governance", governanceRoutes);
app.use("/api/audit", auditRoutes);

app.get("/api", (req, res) => {
  res.json({
    message: "AfriHealth Ledger API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      patient: "/api/patient",
      provider: "/api/provider",
      contracts: "/api/contracts",
      identity: "/api/identity",
      consent: "/api/consent",
      records: "/api/records",
      billing: "/api/billing",
      claims: "/api/claims",
      aiPolicy: "/api/ai-policy",
      insurancePool: "/api/insurance-pool",
      dispute: "/api/dispute",
      governance: "/api/governance",
      audit: "/api/audit",
      health: "/health",
    },
    documentation: "/api/docs",
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

if (require.main === module) {
  app.listen(PORT, async () => {
    console.log("");
    console.log("═══════════════════════════════════════════════");
    console.log("🏥 AfriHealth Ledger API Server");
    console.log("═══════════════════════════════════════════════");
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API endpoints: http://localhost:${PORT}/api`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log("═══════════════════════════════════════════════");
    console.log("");

    try {
      await hederaService.initialize();
      if (hederaService["initialized"]) {
        console.log("✅ Hedera service initialized successfully");

        try {
          await hcsService.initializeTopics();
          console.log("✅ HCS topics initialized successfully");
        } catch (hcsError) {
          console.warn("⚠️  HCS topics not fully initialized:", hcsError);
          console.log("💡 You can create topics manually using the API");
        }
      }
      else {
        console.log("⚠️  Running without Hedera connection (development mode)");
        console.log("💡 To connect to Hedera testnet:");
        console.log("   1. Get free testnet account at https://portal.hedera.com");
        console.log("   2. Update backend/.env with your credentials");
        console.log("   3. Restart the server");
      }
    } catch (error) {
      console.error("❌ Failed to initialize Hedera service:", error);
      if (process.env.NODE_ENV === "production") {
        process.exit(1);
      }
    }

    console.log("");
    console.log("✨ Server ready! Press Ctrl+C to stop");
    console.log("");
  });
}

export default app;
