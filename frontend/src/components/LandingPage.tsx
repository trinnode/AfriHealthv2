import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Float,
  MeshDistortMaterial,
  Environment,
} from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { useToast } from "../hooks/useToast";
import { RoleSelectionModal } from "./RoleSelectionModal";

function HealthSphere({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.01;

      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh
        ref={meshRef}
        position={position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <icosahedronGeometry args={[1.5, 1]} />
        <MeshDistortMaterial
          color={hovered ? "#FF6B35" : "#4A5F3A"}
          attach="material"
          distort={0.3}
          speed={2}
          roughness={0.4}
        />
      </mesh>
    </Float>
  );
}

function OrbitingParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 100;

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const radius = 3 + Math.random() * 2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);

    const colorIndex = Math.floor(Math.random() * 3);
    if (colorIndex === 0) {
      colors[i3] = 1;
      colors[i3 + 1] = 0.42;
      colors[i3 + 2] = 0.21;
    } else if (colorIndex === 1) {
      colors[i3] = 0.29;
      colors[i3 + 1] = 0.37;
      colors[i3 + 2] = 0.23;
    } else {
      colors[i3] = 0.84;
      colors[i3 + 1] = 0.16;
      colors[i3 + 2] = 0.16;
    }
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

function Scene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 8]} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
      />

      <ambientLight intensity={0.5} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.3}
        penumbra={1}
        intensity={1}
      />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      <HealthSphere position={[0, 0, 0]} />
      <OrbitingParticles />

      <Environment preset="night" />
    </>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { address, isConnected } = useAccount();
  const pendingRoute = useRef<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    if (isConnected && address && pendingRoute.current) {
      navigate(pendingRoute.current);
      pendingRoute.current = null;
      showToast({
        title: "Wallet connected",
        message: `Connected with ${address.slice(0, 6)}...${address.slice(-4)}`,
        type: "success",
      });
    }
  }, [isConnected, address, navigate, showToast]);

  const handleGetStarted = () => {
    setShowRoleModal(true);
  };

  const handleSelectRole = (targetRole: "patient" | "provider") => {
    // Set the target route
    pendingRoute.current = targetRole === "patient" ? "/patient" : "/provider";

    // The RoleSelectionModal will handle opening the wallet connection
    // When the user connects, the useEffect above will redirect them
  };

  const features = [
    {
      icon: "🔐",
      title: "Patient-Controlled Data",
      description:
        "Complete ownership of your medical records. Grant and revoke access with granular permissions. Every access is logged immutably on Hedera Consensus Service.",
      color: "orange",
    },
    {
      icon: "⚡",
      title: "Instant Settlements",
      description:
        "No more waiting weeks for insurance claims. Payments processed in seconds via Hedera Token Service with transparent, itemized billing.",
      color: "green",
    },
    {
      icon: "🏥",
      title: "Community Insurance Pool",
      description:
        "Decentralized risk pooling makes healthcare affordable. AI-powered fraud detection ensures fair claims processing for everyone.",
      color: "red",
    },
    {
      icon: "🔍",
      title: "Complete Transparency",
      description:
        "Every bill itemized with medical codes. AI recommendations help you understand costs. All transactions verifiable on Hedera.",
      color: "orange",
    },
    {
      icon: "🤖",
      title: "AI-Assisted Operations",
      description:
        "Smart billing approval based on your preferences. Fraud detection protects the pool. Clinical decision support for providers.",
      color: "green",
    },
    {
      icon: "🛡️",
      title: "Privacy by Design",
      description:
        "Zero PHI on-chain. Encrypted medical records with consent-gated access. Emergency break-glass with full audit trails.",
      color: "red",
    },
  ];

  const capabilities = [
    {
      category: "For Patients",
      items: [
        "View complete medical history across all providers",
        "Schedule and manage appointments",
        "Grant time-bound consent with specific scopes",
        "Approve bills with AI recommendations",
        "Submit insurance claims instantly",
        "Track all data access in real-time",
        "Emergency access controls",
        "Prescription management and refills",
      ],
    },
    {
      category: "For Providers",
      items: [
        "Secure patient record access with consent verification",
        "Create SOAP notes and diagnoses",
        "Order labs and imaging",
        "Generate itemized bills with CPT/ICD-10 codes",
        "Instant payment upon patient approval",
        "Request consent with clear purposes",
        "Clinical decision support tools",
        "Patient analytics and insights",
      ],
    },
    {
      category: "For Insurers",
      items: [
        "Automated claims processing",
        "AI-powered fraud detection",
        "Pool management and analytics",
        "Risk assessment and pricing",
        "Multi-signature approval workflows",
        "Real-time reserves monitoring",
        "Transparent fee structure",
        "Compliance and audit trails",
      ],
    },
  ];

  const techStack = [
    { name: "Hedera Hashgraph", purpose: "Fast, fair, secure consensus" },
    { name: "HTS", purpose: "Native token operations" },
    { name: "HCS", purpose: "Immutable audit logs" },
    { name: "EIP-2535 Diamond", purpose: "Modular smart contracts" },
    { name: "React + TypeScript", purpose: "Type-safe UI" },
    { name: "HashConnect", purpose: "Wallet integration" },
    { name: "Three.js", purpose: "3D visualizations" },
    { name: "Zustand", purpose: "State management" },
  ];

  return (
    <div className="relative w-full min-h-screen bg-black text-white overflow-hidden">
      <div className="fixed inset-0 z-0 opacity-30">
        <Canvas>
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </div>

      <div className="relative z-10">
        <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-center max-w-6xl mx-auto"
          >
            <h1 className="font-lora text-6xl md:text-8xl lg:text-9xl font-bold mb-8 leading-tight">
              AfriHealth <span className="text-afrihealth-orange">Ledger</span>
            </h1>
            <p className="font-mono text-xl md:text-3xl text-gray-200 mb-6 tracking-wide">
              Privacy-Preserving Healthcare Platform on Hedera
            </p>
            <p className="font-mono text-base md:text-xl text-gray-400 max-w-4xl mx-auto mb-16 leading-relaxed px-4">
              Complete control over your medical data. Transparent billing.
              Instant settlements. Community-driven insurance. Built with
              zero-knowledge privacy and blockchain immutability.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <motion.button
                whileHover={{
                  scale: 1.08,
                  boxShadow: "0 20px 60px rgba(74, 95, 58, 0.4)",
                }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGetStarted}
                className="px-12 py-6 bg-gradient-to-r from-afrihealth-green to-afrihealth-teal text-white font-mono font-bold text-xl rounded-xl hover:shadow-2xl hover:shadow-afrihealth-green/50 transition-all"
              >
                🚀 Get Started
              </motion.button>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setShowDetails(!showDetails)}
              className="font-mono text-sm text-gray-500 hover:text-afrihealth-orange transition-colors"
            >
              {showDetails ? "▲ Hide Details" : "▼ Learn More"}
            </motion.button>
          </motion.div>
        </section>

        {/* Role Selection Modal */}
        <RoleSelectionModal
          isOpen={showRoleModal}
          onClose={() => setShowRoleModal(false)}
          onSelectRole={handleSelectRole}
        />

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Key Features */}
              <section className="py-24 px-6 bg-gradient-to-b from-black via-gray-900 to-black">
                <div className="max-w-7xl mx-auto">
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="font-lora text-5xl md:text-7xl font-bold text-center mb-20"
                  >
                    Revolutionary{" "}
                    <span className="text-afrihealth-orange">Features</span>
                  </motion.h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{
                          scale: 1.08,
                          y: -15,
                          boxShadow: "0 30px 80px rgba(255, 107, 53, 0.3)",
                        }}
                        className={`bg-gradient-to-br from-gray-900 to-black border-2 border-afrihealth-${feature.color} rounded-2xl p-10 shadow-2xl hover:shadow-afrihealth-orange/50 transition-all backdrop-blur-sm`}
                      >
                        <div className="text-7xl mb-6 text-center">
                          {feature.icon}
                        </div>
                        <h3 className="font-lora text-2xl font-bold mb-5 text-center">
                          {feature.title}
                        </h3>
                        <p className="font-mono text-sm text-gray-300 leading-loose text-center">
                          {feature.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Platform Capabilities */}
              <section className="py-24 px-6 bg-black">
                <div className="max-w-7xl mx-auto">
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="font-lora text-5xl md:text-7xl font-bold text-center mb-20"
                  >
                    <span className="text-afrihealth-green">Complete</span>{" "}
                    Ecosystem
                  </motion.h2>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {capabilities.map((cap, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.2 }}
                        whileHover={{ scale: 1.05, y: -10 }}
                        className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-gray-800 hover:border-afrihealth-orange rounded-2xl p-10 shadow-2xl hover:shadow-afrihealth-orange/30 transition-all"
                      >
                        <h3 className="font-lora text-3xl font-bold mb-8 text-center text-afrihealth-orange">
                          {cap.category}
                        </h3>
                        <ul className="space-y-4">
                          {cap.items.map((item, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="font-mono text-sm text-gray-300 flex items-start leading-relaxed"
                            >
                              <span className="text-afrihealth-green mr-3 mt-1 text-lg font-bold">
                                ✓
                              </span>
                              <span>{item}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Technology Stack */}
              <section className="py-24 px-6 bg-gradient-to-b from-black via-gray-900 to-black">
                <div className="max-w-7xl mx-auto">
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="font-lora text-5xl md:text-7xl font-bold text-center mb-20"
                  >
                    Enterprise{" "}
                    <span className="text-afrihealth-red">Technology</span>
                  </motion.h2>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {techStack.map((tech, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{
                          scale: 1.15,
                          y: -10,
                          boxShadow: "0 20px 50px rgba(255, 107, 53, 0.4)",
                        }}
                        className="bg-gradient-to-br from-gray-900 to-black border-2 border-afrihealth-orange rounded-2xl p-8 text-center shadow-xl hover:shadow-2xl transition-all"
                      >
                        <h4 className="font-mono font-bold text-xl mb-3 text-afrihealth-orange">
                          {tech.name}
                        </h4>
                        <p className="font-mono text-xs text-gray-400 leading-relaxed">
                          {tech.purpose}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Stats Section */}
              <section className="py-24 px-6 bg-black">
                <div className="max-w-7xl mx-auto">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                    {[
                      { value: "<3s", label: "Transaction Finality" },
                      { value: "$0.0001", label: "Average Fee" },
                      { value: "100%", label: "Data Ownership" },
                      { value: "∞", label: "Audit Trail" },
                    ].map((stat, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.1, y: -10 }}
                        className="bg-gradient-to-br from-gray-900 to-black border-2 border-afrihealth-orange rounded-2xl p-8 shadow-2xl hover:shadow-afrihealth-orange/50 transition-all"
                      >
                        <div className="font-lora text-6xl md:text-7xl font-bold text-afrihealth-orange mb-4">
                          {stat.value}
                        </div>
                        <div className="font-mono text-base text-gray-300 font-semibold">
                          {stat.label}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Final CTA */}
              <section className="py-32 px-6 bg-gradient-to-t from-black via-gray-900 to-black">
                <div className="max-w-5xl mx-auto text-center">
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="font-lora text-5xl md:text-7xl font-bold mb-10 leading-tight"
                  >
                    Your Health. Your Data.{" "}
                    <span className="text-afrihealth-orange">
                      Your Control.
                    </span>
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="font-mono text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed"
                  >
                    Join the future of healthcare. Transparent, fast, and
                    privacy-preserving.
                  </motion.p>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    whileHover={{
                      scale: 1.1,
                      boxShadow: "0 30px 80px rgba(255, 107, 53, 0.5)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGetStarted}
                    className="px-14 py-6 bg-afrihealth-orange text-black font-mono font-bold text-xl rounded-2xl hover:bg-opacity-90 transition-all shadow-2xl border-3 border-afrihealth-orange"
                  >
                    🚀 Get Started Now
                  </motion.button>
                </div>
              </section>

              {/* Footer */}
              <footer className="py-12 px-6 bg-black border-t border-gray-800">
                <div className="max-w-6xl mx-auto text-center">
                  <p className="font-mono text-sm text-gray-500 mb-4">
                    Powered by{" "}
                    <span className="text-afrihealth-orange">
                      Hedera Hashgraph
                    </span>{" "}
                    | Built with{" "}
                    <span className="text-afrihealth-green">
                      EIP-2535 Diamond
                    </span>
                  </p>
                  <p className="font-mono text-xs text-gray-600">
                    © 2025 AfriHealth Ledger. Privacy-first healthcare for
                    everyone.
                  </p>
                </div>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
