"use client";

import { useRef, useMemo, Suspense, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";

const appleEase = [0.16, 1, 0.3, 1] as const;

// Shared scroll state
const scrollState = { progress: 0 };

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                        CALIBRATION CONSTANTS                                  ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// MASTER SCALE
const MODEL_SCALE = 0.05;

// PIVOT CORRECTION
const MESH_OFFSET_X = 50;
const MESH_OFFSET_Y = 0;
const MESH_OFFSET_Z = 100;
const MESH_ROTATION_Y = Math.PI;

// AFTERBURNER POSITIONS (static, no pulsing)
const BURNER_LEFT_POS: [number, number, number] = [-1.19, 0.77, 4.0];
const BURNER_RIGHT_POS: [number, number, number] = [1.25, 0.77, 4.0];
const BURNER_SCALE = 1.5;
const BURNER_LENGTH = 1.5;
const BURNER_RADIUS = 0.15;

// ENGINE NACELLE OUTLINES (procedural replacement for hairy GLTF engines)
const ENGINE_CONFIG = {
  enabled: true,              // Set false to disable procedural engines
  leftPos: [-1.19, 0.77, 1.5] as [number, number, number],
  rightPos: [1.25, 0.77, 1.5] as [number, number, number],
  radius: 0.3,
  length: 3.0,
  segments: 10,                // Low poly = clean lines
  color: "#8C8279",
  opacity: 0.2,
};

// DEBUG MODE
const DEBUG_AXES = false;

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                           EDGE WIREFRAME CONFIG                               ║
// ║  High threshold hides curved surfaces (engines), keeps sharp edges (wings)   ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const EDGE_CONFIG = {
  thresholdAngle: 11,         // HIGH = hides curved engine lines, keeps wing edges
  color: "#8C8279",
  opacity: 0.4,
};

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                           ANIMATION CONFIG                                    ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const ANIMATION = {
  bob: { amplitude: 0.25, speed: 0.5 },
  bank: { amplitude: 0.25, speed: 0.3, pitchFactor: 0.25 },
  yaw: { amplitude: 0.04, speed: 0.2 },
  lerpFactor: 0.3,
};

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                           CAMERA CONFIG                                       ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const CAMERA = {
  hero: { position: [-4, 3, -8], lookAt: [0, 1, -2] },
  about: { position: [-4, 4, -9], lookAt: [0, 0, -6] },
  engineering: { position: [-3, 3, 6], lookAt: [1.4, 0, -3] },
  contact: { position: [-7, -9, 15], lookAt: [-4, 5, 0] },
  lerpFactor: 0.08,
  scrollBreakpoints: {
    heroEnd: 0.23,
    aboutEnd: 0.8,
    engineeringEnd: 1.23,
  },
};

// Convert to Vector3 waypoints
const WAYPOINTS = {
  hero: {
    position: new THREE.Vector3(...CAMERA.hero.position),
    lookAt: new THREE.Vector3(...CAMERA.hero.lookAt),
  },
  about: {
    position: new THREE.Vector3(...CAMERA.about.position),
    lookAt: new THREE.Vector3(...CAMERA.about.lookAt),
  },
  engineering: {
    position: new THREE.Vector3(...CAMERA.engineering.position),
    lookAt: new THREE.Vector3(...CAMERA.engineering.lookAt),
  },
  contact: {
    position: new THREE.Vector3(...CAMERA.contact.position),
    lookAt: new THREE.Vector3(...CAMERA.contact.lookAt),
  },
};

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                           SCENE CONFIG                                        ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const SCENE = {
  ambientIntensity: 0.4,
  keyLight: { position: [5, 10, 5] as [number, number, number], intensity: 0.8, color: "#F2F2F2" },
  rimLight: { position: [-5, 2, -5] as [number, number, number], intensity: 0.5, color: "#C49866" },
};

// ============================================================================
// PROCEDURAL ENGINE NACELLE (Clean low-poly wireframe cylinder)
// ============================================================================
function EngineNacelle({ position }: { position: [number, number, number] }) {
  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(
      ENGINE_CONFIG.radius,
      ENGINE_CONFIG.radius * 0.8,  // Slight taper
      ENGINE_CONFIG.length,
      ENGINE_CONFIG.segments,
      1,
      true  // Open ended
    );
    return new THREE.EdgesGeometry(geo, 1);
  }, []);

  return (
    <lineSegments position={position} rotation={[Math.PI / 2, 0, 0]} geometry={geometry}>
      <lineBasicMaterial
        color={ENGINE_CONFIG.color}
        transparent
        opacity={ENGINE_CONFIG.opacity}
      />
    </lineSegments>
  );
}

// ============================================================================
// SR-71 MODEL with Hybrid Wireframe
// ============================================================================
function SR71Model() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/sr71.gltf");

  // Create clean edge wireframe from the model (high threshold hides engines)
  const edgeLines = useMemo(() => {
    const lines: THREE.LineSegments[] = [];
    
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const geometry = mesh.geometry;
        
        const edgesGeometry = new THREE.EdgesGeometry(
          geometry,
          EDGE_CONFIG.thresholdAngle
        );
        
        const lineMaterial = new THREE.LineBasicMaterial({
          color: EDGE_CONFIG.color,
          transparent: true,
          opacity: EDGE_CONFIG.opacity,
        });
        
        const lineSegments = new THREE.LineSegments(edgesGeometry, lineMaterial);
        lineSegments.position.copy(mesh.position);
        lineSegments.rotation.copy(mesh.rotation);
        lineSegments.scale.copy(mesh.scale);
        
        lines.push(lineSegments);
      }
    });
    
    return lines;
  }, [scene]);

  // Animation loop
  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const elapsed = clock.elapsedTime;
    const { bob, bank, yaw, lerpFactor } = ANIMATION;

    const autoBob = Math.sin(elapsed * bob.speed) * bob.amplitude;
    const autoBank = Math.cos(elapsed * bank.speed) * bank.amplitude;
    const autoYaw = Math.sin(elapsed * yaw.speed) * yaw.amplitude;

    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      autoBank * bank.pitchFactor,
      lerpFactor
    );
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      autoYaw,
      lerpFactor
    );
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      autoBank,
      lerpFactor
    );
    groupRef.current.position.y = autoBob;
  });

  return (
    <group ref={groupRef}>
      {DEBUG_AXES && <axesHelper args={[5]} />}

      {/* GLTF Model with high-threshold edges (clean wings, hidden engines) */}
      <group scale={MODEL_SCALE}>
        <group
          position={[MESH_OFFSET_X, MESH_OFFSET_Y, MESH_OFFSET_Z]}
          rotation={[0, MESH_ROTATION_Y, 0]}
        >
          {edgeLines.map((line, i) => (
            <primitive key={i} object={line} />
          ))}
        </group>
      </group>

      {/* PROCEDURAL ENGINE NACELLES (clean low-poly replacement) */}
      {ENGINE_CONFIG.enabled && (
        <>
          <EngineNacelle position={ENGINE_CONFIG.leftPos} />
          <EngineNacelle position={ENGINE_CONFIG.rightPos} />
        </>
      )}

      {/* AFTERBURNERS (static, no pulsing) */}
      <mesh
        position={BURNER_LEFT_POS}
        rotation={[Math.PI / 2, 0, 0]}
        scale={BURNER_SCALE}
      >
        <coneGeometry args={[BURNER_RADIUS, BURNER_LENGTH, 8]} />
        <meshStandardMaterial
          color="#FF6B35"
          emissive="#FFAA00"
          emissiveIntensity={1.5}
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>
      
      <mesh
        position={BURNER_RIGHT_POS}
        rotation={[Math.PI / 2, 0, 0]}
        scale={BURNER_SCALE}
      >
        <coneGeometry args={[BURNER_RADIUS, BURNER_LENGTH, 8]} />
        <meshStandardMaterial
          color="#FF6B35"
          emissive="#FFAA00"
          emissiveIntensity={1.5}
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// FLIGHT DIRECTOR (Scroll-based camera)
// ============================================================================
function FlightDirector() {
  const { camera } = useThree();
  const currentPosition = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());

  useEffect(() => {
    currentPosition.current.copy(WAYPOINTS.hero.position);
    currentLookAt.current.copy(WAYPOINTS.hero.lookAt);
    camera.position.copy(WAYPOINTS.hero.position);
    camera.lookAt(WAYPOINTS.hero.lookAt);
  }, [camera]);

  useFrame(() => {
    const progress = scrollState.progress;
    const { scrollBreakpoints } = CAMERA;

    let startWaypoint: keyof typeof WAYPOINTS;
    let endWaypoint: keyof typeof WAYPOINTS;
    let segmentProgress: number;

    if (progress < scrollBreakpoints.heroEnd) {
      startWaypoint = "hero";
      endWaypoint = "about";
      segmentProgress = progress / scrollBreakpoints.heroEnd;
    } else if (progress < scrollBreakpoints.aboutEnd) {
      startWaypoint = "about";
      endWaypoint = "engineering";
      segmentProgress = (progress - scrollBreakpoints.heroEnd) / (scrollBreakpoints.aboutEnd - scrollBreakpoints.heroEnd);
    } else if (progress < scrollBreakpoints.engineeringEnd) {
      startWaypoint = "engineering";
      endWaypoint = "contact";
      segmentProgress = (progress - scrollBreakpoints.aboutEnd) / (scrollBreakpoints.engineeringEnd - scrollBreakpoints.aboutEnd);
    } else {
      startWaypoint = "contact";
      endWaypoint = "contact";
      segmentProgress = 1;
    }

    const easedProgress = segmentProgress < 0.5
      ? 2 * segmentProgress * segmentProgress
      : 1 - Math.pow(-2 * segmentProgress + 2, 2) / 2;

    targetPosition.current.lerpVectors(WAYPOINTS[startWaypoint].position, WAYPOINTS[endWaypoint].position, easedProgress);
    targetLookAt.current.lerpVectors(WAYPOINTS[startWaypoint].lookAt, WAYPOINTS[endWaypoint].lookAt, easedProgress);

    currentPosition.current.lerp(targetPosition.current, CAMERA.lerpFactor);
    currentLookAt.current.lerp(targetLookAt.current, CAMERA.lerpFactor);

    camera.position.copy(currentPosition.current);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}

// ============================================================================
// STREAMLINES (Wind flowing BACKWARDS - from nose towards tail/camera)
// ============================================================================
function Streamlines() {
  const particlesRef = useRef<{ mesh: THREE.Line; speed: number; xOffset: number; yOffset: number }[]>([]);

  const particles = useMemo(() => {
    const result: typeof particlesRef.current = [];
    const count = 12;
    const spreadX = 8;
    const spreadY = 4;

    for (let i = 0; i < count; i++) {
      const xOffset = (Math.random() - 0.5) * spreadX;
      const yOffset = (Math.random() - 0.5) * spreadY;
      const length = 1.5 + Math.random() * 2;
      const speed = 2 + Math.random() * 2;
      
      // Start in FRONT of the plane (negative Z)
      const initialZ = -8 - Math.random() * 4;

      // Line extends towards positive Z (towards camera/tail)
      const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, length)];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: EDGE_CONFIG.color,
        transparent: true,
        opacity: 0.2,
      });
      const mesh = new THREE.Line(geometry, material);
      mesh.position.set(xOffset, yOffset, initialZ);

      result.push({ mesh, speed, xOffset, yOffset });
    }

    particlesRef.current = result;
    return result;
  }, []);

  useFrame(({ clock }) => {
    const elapsed = clock.elapsedTime;

    particlesRef.current.forEach((particle) => {
      // Move towards POSITIVE Z (backwards, towards camera)
      particle.mesh.position.z += particle.speed * 0.03;

      const waveX = Math.sin(elapsed * 0.5 + particle.xOffset) * 0.3;
      const waveY = Math.cos(elapsed * 0.3 + particle.yOffset) * 0.2;
      particle.mesh.position.x = particle.xOffset + waveX;
      particle.mesh.position.y = particle.yOffset + waveY;

      // Reset when past the camera
      if (particle.mesh.position.z > 12) {
        particle.mesh.position.z = -10 - Math.random() * 2;
        particle.xOffset = (Math.random() - 0.5) * 8;
        particle.yOffset = (Math.random() - 0.5) * 4;
      }

      const mat = particle.mesh.material as THREE.LineBasicMaterial;
      // Fade in from front, fade out towards back
      const fadeIn = Math.min(1, (particle.mesh.position.z + 10) / 4);
      const fadeOut = Math.min(1, (12 - particle.mesh.position.z) / 4);
      mat.opacity = 0.2 * fadeIn * fadeOut;
    });
  });

  return (
    <group>
      {particles.map((particle, i) => (
        <primitive key={i} object={particle.mesh} />
      ))}
    </group>
  );
}

// ============================================================================
// SCENE
// ============================================================================
function Scene() {
  return (
    <>
      <FlightDirector />
      <SR71Model />
      <Streamlines />

      <ambientLight intensity={SCENE.ambientIntensity} />
      <directionalLight
        position={SCENE.keyLight.position}
        intensity={SCENE.keyLight.intensity}
        color={SCENE.keyLight.color}
      />
      <pointLight
        position={SCENE.rimLight.position}
        intensity={SCENE.rimLight.intensity}
        color={SCENE.rimLight.color}
      />
    </>
  );
}

// ============================================================================
// FALLBACK
// ============================================================================
function Fallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg viewBox="-50 -60 100 120" className="w-full h-full max-w-md opacity-20" stroke={EDGE_CONFIG.color} strokeWidth="0.4" fill="none">
        <path d="M0,-55 L2,-30 L3,-10 L3,25 L0,35 L-3,25 L-3,-10 L-2,-30 Z" />
        <path d="M3,0 L40,30 L5,25 Z" />
        <path d="M-3,0 L-40,30 L-5,25 Z" />
      </svg>
    </div>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================
interface AeroWireframeProps {
  className?: string;
}

export default function AeroWireframe({ className }: AeroWireframeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastUpdate = useRef(0);
  const rafRef = useRef<number>(0);

  const updateScroll = useCallback(() => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
    scrollState.progress = Math.max(0, Math.min(1, progress));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now();
      if (now - lastUpdate.current < 16) return;
      lastUpdate.current = now;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateScroll);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [updateScroll]);

  return (
    <motion.div
      ref={containerRef}
      className={`relative ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: appleEase }}
    >
      <Suspense fallback={<Fallback />}>
        <Canvas
          camera={{ position: CAMERA.hero.position as [number, number, number], fov: 45 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          dpr={[1, 1.5]}
          style={{ background: "transparent" }}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </motion.div>
  );
}

// Preload the model
useGLTF.preload("/sr71.gltf");
