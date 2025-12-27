"use client";

import { useRef, useMemo, Suspense, useEffect, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { motion } from "framer-motion";
import * as THREE from "three";

const appleEase = [0.16, 1, 0.3, 1] as const;

// Shared mouse state - avoids re-renders
const mouseState = { x: 0, y: 0 };

// Low-poly glider geometry - optimized
function GliderGeometry() {
  const meshRef = useRef<THREE.LineSegments>(null);
  
  const geometry = useMemo(() => {
    const shape = new THREE.BufferGeometry();
    
    const vertices = new Float32Array([
      // Fuselage
      0, 0, 2,      // 0 - nose
      0, 0.1, 0.5,  // 1 - cockpit top
      0, -0.1, 0.5, // 2 - cockpit bottom
      0, 0, -2,     // 3 - tail
      // Left wing
      -3, 0, 0,     // 4 - left wingtip
      -0.3, 0, 0.3, // 5 - left wing root front
      -0.3, 0, -0.5,// 6 - left wing root back
      -2.5, 0, -0.3,// 7 - left wing trailing edge
      // Right wing
      3, 0, 0,      // 8 - right wingtip
      0.3, 0, 0.3,  // 9 - right wing root front
      0.3, 0, -0.5, // 10 - right wing root back
      2.5, 0, -0.3, // 11 - right wing trailing edge
      // Vertical stabilizer
      0, 0.5, -1.5, // 12 - fin top
      0, 0, -1.2,   // 13 - fin front
      // Horizontal stabilizer
      -0.8, 0, -1.8,// 14 - left stab tip
      0.8, 0, -1.8, // 15 - right stab tip
    ]);
    
    const indices = new Uint16Array([
      0, 1, 1, 3, 3, 2, 2, 0,
      4, 5, 5, 6, 6, 7, 7, 4, 5, 0, 6, 3,
      8, 9, 9, 10, 10, 11, 11, 8, 9, 0, 10, 3,
      12, 13, 13, 3, 3, 12,
      14, 3, 3, 15, 14, 15,
      4, 8, 5, 9, 6, 10,
    ]);
    
    shape.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    shape.setIndex(new THREE.BufferAttribute(indices, 1));
    
    return shape;
  }, []);

  // Natural flight physics with organic movement
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    
    const elapsed = clock.elapsedTime;
    
    // Automatic organic movements (always active, even when mouse is still)
    const autoBob = Math.sin(elapsed * 0.5) * 0.15;       // Gentle Y bobbing
    const autoBank = Math.cos(elapsed * 0.3) * 0.15;    // Subtle Z-axis banking/sway
    const autoYaw = Math.sin(elapsed * 0.2) * 0.13;     // Very subtle horizontal drift
    
    // Target rotations: blend mouse input with automatic movements
    const targetRotationX = mouseState.y * 0.2;           // Pitch from mouse
    const targetRotationY = mouseState.x * 0.4 + autoYaw; // Yaw + subtle drift
    const targetRotationZ = mouseState.x * -0.4 + autoBank; // Bank/Roll + sway
    
    // Smooth interpolation with lerp factor 0.1
    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      targetRotationX,
      0.1
    );
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      targetRotationY,
      0.1
    );
    meshRef.current.rotation.z = THREE.MathUtils.lerp(
      meshRef.current.rotation.z,
      targetRotationZ,
      0.1
    );
    
    // Natural floating animation with sine wave bobbing
    meshRef.current.position.y = autoBob;
  });

  return (
    <lineSegments ref={meshRef} geometry={geometry}>
      <lineBasicMaterial color="#8C8279" transparent opacity={0.6} />
    </lineSegments>
  );
}

// Animated wind streamline particle
interface StreamlineParticle {
  mesh: THREE.Line;
  speed: number;
  xOffset: number;
  yOffset: number;
  length: number;
  initialZ: number;
}

// Animated Streamlines - flow past the glider
function AnimatedStreamlines() {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<StreamlineParticle[]>([]);
  
  // Create streamline particles
  const particles = useMemo(() => {
    const result: StreamlineParticle[] = [];
    const particleCount = 12; // Number of flowing streamlines
    
    for (let i = 0; i < particleCount; i++) {
      // Randomize position around the glider
      const xOffset = (Math.random() - 0.5) * 6; // Spread across width
      const yOffset = (Math.random() - 0.5) * 2; // Vertical spread
      const length = 1.5 + Math.random() * 2; // Variable length streamlines
      const speed = 0.8 + Math.random() * 0.6; // Variable speeds
      const initialZ = 6 + Math.random() * 4; // Stagger starting positions
      
      // Create a simple line segment
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -length),
      ];
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ 
        color: "#8C8279", 
        transparent: true, 
        opacity: 0.15 + Math.random() * 0.15,
      });
      
      const mesh = new THREE.Line(geometry, material);
      mesh.position.set(xOffset, yOffset, initialZ);
      
      result.push({
        mesh,
        speed,
        xOffset,
        yOffset,
        length,
        initialZ,
      });
    }
    
    particlesRef.current = result;
    return result;
  }, []);

  // Animate streamlines flowing past
  useFrame(({ clock }) => {
    const elapsed = clock.elapsedTime;
    
    particlesRef.current.forEach((particle) => {
      // Move streamline backward (simulating forward flight)
      particle.mesh.position.z -= particle.speed * 0.035;
      
      // Add subtle wave motion
      const waveX = Math.sin(elapsed * 0.5 + particle.xOffset) * 0.2;
      const waveY = Math.cos(elapsed * 0.3 + particle.yOffset) * 0.01;
      particle.mesh.position.x = particle.xOffset + waveX;
      particle.mesh.position.y = particle.yOffset + waveY;
      
      // Deflection near the glider body (z around 0)
      // const zPos = particle.mesh.position.z;
      // if (zPos > -2 && zPos < 2) {
      //   const distFromCenter = Math.sqrt(
      //     particle.xOffset * particle.xOffset + 
      //     particle.yOffset * particle.yOffset
      //   );
      //   const deflectionStrength = Math.exp(-distFromCenter * 0.4) * 0.3;
      //   const deflection = Math.sin((zPos + 2) * Math.PI / 4) * deflectionStrength;
        
      //   particle.mesh.position.x = particle.xOffset + deflection * Math.sign(particle.xOffset || 0.1) + waveX;
      //   particle.mesh.position.y = particle.yOffset + deflection * 0.3 + waveY;
      // }
      
      // Reset when past the glider
      if (particle.mesh.position.z < -8) {
        particle.mesh.position.z = 8 + Math.random() * 2;
        // Randomize position slightly on reset
        particle.xOffset = (Math.random() - 0.5) * 6;
        particle.yOffset = (Math.random() - 0.5) * 2;
      }
      
      // Fade based on position (fade in at front, fade out at back)
      const material = particle.mesh.material as THREE.LineBasicMaterial;
      const fadeIn = Math.min(1, (19 - particle.mesh.position.z) / 4);
      const fadeOut = Math.min(1, (particle.mesh.position.z + 8) / 4);
      material.opacity = 0.18 * fadeIn * fadeOut;
    });
  });

  return (
    <group ref={groupRef}>
      {particles.map((particle, i) => (
        <primitive key={i} object={particle.mesh} />
      ))}
    </group>
  );
}

// Static streamlines for ambient effect
function StaticStreamlines() {
  const lineObjects = useMemo(() => {
    const objects: THREE.Line[] = [];
    
    // Just 2 subtle static reference lines
    for (let i = 0; i < 2; i++) {
      const points: THREE.Vector3[] = [];
      const xOffset = (i - 0.5) * 4;
      const yOffset = 0;
      
      for (let z = 5; z >= -5; z -= 0.8) {
        const distFromCenter = Math.abs(xOffset);
        const deflection = z > -1 && z < 1 ? Math.exp(-distFromCenter * 0.3) * 0.2 : 0;
        
        points.push(new THREE.Vector3(
          xOffset + deflection * Math.sign(xOffset),
          yOffset + deflection * 0.2,
          z
        ));
      }
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ 
        color: "#4E4F50", 
        transparent: true, 
        opacity: 0.08,
      });
      objects.push(new THREE.Line(geometry, material));
    }
    
    return objects;
  }, []);

  return (
    <group>
      {lineObjects.map((lineObj, i) => (
        <primitive key={i} object={lineObj} />
      ))}
    </group>
  );
}

// Main scene
function Scene() {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} scale={0.8}>
      <GliderGeometry />
      <AnimatedStreamlines />
      <StaticStreamlines />
    </group>
  );
}

// Fallback
function Fallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg 
        viewBox="-50 -30 100 60" 
        className="w-full h-full max-w-md opacity-20"
        stroke="#8C8279"
        strokeWidth="0.5"
        fill="none"
      >
        <path d="M0,-20 L2,-5 L0,20 L-2,-5 Z" />
        <path d="M-40,0 L0,-3 L40,0 L0,3 Z" />
        <path d="M-10,15 L0,18 L10,15" />
      </svg>
    </div>
  );
}

interface AeroWireframeProps {
  className?: string;
}

export default function AeroWireframe({ className }: AeroWireframeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastUpdate = useRef(0);

  // Throttled mouse move handler - max 60fps
  // Listen on window so it works even when hovering over text layers
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const now = Date.now();
    if (now - lastUpdate.current < 16) return; // ~60fps throttle
    lastUpdate.current = now;

    // Get hero section bounds for normalized mouse position
    const heroSection = document.getElementById("hero");
    if (!heroSection) return;
    
    const rect = heroSection.getBoundingClientRect();
    
    // Only track when mouse is within the hero section viewport
    if (e.clientY < rect.top || e.clientY > rect.bottom) return;
    
    mouseState.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseState.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  }, []);

  useEffect(() => {
    // Listen on window instead of container to capture all mouse events
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

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
          camera={{ position: [0, 2, 6], fov: 45 }}
          gl={{ 
            antialias: false, // Disable for performance
            alpha: true,
            powerPreference: "high-performance",
            stencil: false,
            depth: true
          }}
          dpr={[1, 1.5]} // Cap resolution
          performance={{ min: 0.5 }} // Allow adaptive downgrading
          style={{ background: "transparent" }}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </motion.div>
  );
}
