import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Float,
  MeshDistortMaterial,
  Environment,
} from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import { getWalletService } from "../services/walletService";

/**
 * Animated 3D Sphere representing health data
 */
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

      // Pulse effect
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
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

/**
 * Orbiting particles representing data points
 */
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

    // Random colors from palette
    const colorIndex = Math.floor(Math.random() * 3);
    if (colorIndex === 0) {
      colors[i3] = 1;
      colors[i3 + 1] = 0.42;
      colors[i3 + 2] = 0.21; // Orange
    } else if (colorIndex === 1) {
      colors[i3] = 0.29;
      colors[i3 + 1] = 0.37;
      colors[i3 + 2] = 0.23; // Army Green
    } else {
      colors[i3] = 0.84;
      colors[i3 + 1] = 0.16;
      colors[i3 + 2] = 0.16; // Red
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

/**
 * 3D Scene component
 */
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

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.3}
        penumbra={1}
        intensity={1}
      />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* 3D Elements */}
      <HealthSphere position={[0, 0, 0]} />
      <OrbitingParticles />

      {/* Environment */}
      <Environment preset="night" />
    </>
  );
}

/**
 * Main Landing Page with 3D Graphics
 */
export default function Landing3D() {
  const navigate = useNavigate();
  const [connecting, setConnecting] = useState(false);

  const handleConnectWallet = async () => {
    try {
      setConnecting(true);
      const walletService = getWalletService();
      await walletService.connect();
      // Redirect to patient dashboard after connection
      navigate("/patient");
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="relative w-full h-screen bg-afrihealth-black overflow-hidden">
      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas>
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </div>

      {/* Overlay Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mb-8"
        >
          <h1 className="font-lora text-6xl md:text-8xl font-bold text-white mb-4">
            AfriHealth <span className="text-afrihealth-orange">Ledger</span>
          </h1>
          <p className="font-mono text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
            Privacy-preserving healthcare platform on Hedera
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button 
            onClick={handleConnectWallet}
            disabled={connecting}
            className="px-8 py-4 bg-afrihealth-orange text-white font-mono font-bold rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connecting ? "Connecting..." : "Connect Wallet"}
          </button>
          <button 
            onClick={() => navigate("/patient")}
            className="px-8 py-4 bg-transparent border-2 border-afrihealth-green text-afrihealth-green font-mono font-bold rounded-lg hover:bg-afrihealth-green hover:text-white transition-all transform hover:scale-105"
          >
            Enter as Patient
          </button>
          <button 
            onClick={() => navigate("/provider")}
            className="px-8 py-4 bg-transparent border-2 border-afrihealth-orange text-afrihealth-orange font-mono font-bold rounded-lg hover:bg-afrihealth-orange hover:text-white transition-all transform hover:scale-105"
          >
            Enter as Provider
          </button>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl"
        >
          <div className="bg-black bg-opacity-50 backdrop-blur-sm border border-afrihealth-orange rounded-lg p-6">
            <div className="text-afrihealth-orange text-4xl mb-4">🔒</div>
            <h3 className="font-lora text-xl font-bold text-white mb-2">
              Patient Control
            </h3>
            <p className="font-mono text-sm text-gray-400">
              You own your data. Grant and revoke access at any time.
            </p>
          </div>

          <div className="bg-black bg-opacity-50 backdrop-blur-sm border border-afrihealth-green rounded-lg p-6">
            <div className="text-afrihealth-green text-4xl mb-4">⚡</div>
            <h3 className="font-lora text-xl font-bold text-white mb-2">
              Instant Settlement
            </h3>
            <p className="font-mono text-sm text-gray-400">
              Fast payments via Hedera Token Service. No waiting.
            </p>
          </div>

          <div className="bg-black bg-opacity-50 backdrop-blur-sm border border-afrihealth-red rounded-lg p-6">
            <div className="text-afrihealth-red text-4xl mb-4">🏥</div>
            <h3 className="font-lora text-xl font-bold text-white mb-2">
              Community Pool
            </h3>
            <p className="font-mono text-sm text-gray-400">
              Affordable insurance through decentralized risk pooling.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Bottom Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-0 right-0 z-10 text-center"
      >
        <p className="font-mono text-sm text-gray-500">
          Powered by{" "}
          <span className="text-afrihealth-orange">Hedera Hashgraph</span>
        </p>
      </motion.div>
    </div>
  );
}
