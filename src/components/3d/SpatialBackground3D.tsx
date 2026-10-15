import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Restaurant Ambiance 3D Background
 * Subtle culinary ambiance with soft hearth embers, warm brass accents,
 * and warm architectural perspective lines. Highly optimized for mobile.
 */
export const SpatialBackground3D: React.FC<{ opacity?: number }> = ({ opacity = 0.55 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 45);
    camera.lookAt(0, 0, 0);

    // 2. Renderer (Optimized for mobile power consumption)
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: false, 
      powerPreference: 'low-power' 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Warm Golden Hearth & Kitchen Embers (Floating upward)
    const particleCount = window.innerWidth < 768 ? 45 : 85;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const speeds: { y: number; xFactor: number; zFactor: number }[] = [];

    const emberGold = new THREE.Color(0xf59e0b);   // Saffron gold
    const emberOrange = new THREE.Color(0xf97316); // Warm terracotta orange
    const emberCopper = new THREE.Color(0xd97706); // Polished copper

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;

      const chosenColor = i % 3 === 0 ? emberGold : i % 3 === 1 ? emberOrange : emberCopper;
      colors[i * 3] = chosenColor.r;
      colors[i * 3 + 1] = chosenColor.g;
      colors[i * 3 + 2] = chosenColor.b;

      speeds.push({
        y: 0.03 + Math.random() * 0.04,
        xFactor: (Math.random() - 0.5) * 0.015,
        zFactor: (Math.random() - 0.5) * 0.015,
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });

    const emberPoints = new THREE.Points(geometry, particlesMaterial);
    scene.add(emberPoints);

    // 4. Elegant Architectural Restaurant Floor Grid (Warm brass & slate)
    const gridSize = 100;
    const gridDivisions = 25;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0xd97706, 0x1e293b);
    gridHelper.position.y = -12;
    scene.add(gridHelper);

    // 5. Animation loop
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Slow architectural rotation
      gridHelper.rotation.y = elapsedTime * 0.012;

      // Drift embers upwards
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3 + 1] += speeds[i].y;
        posArray[i * 3] += Math.sin(elapsedTime + i) * speeds[i].xFactor;
        posArray[i * 3 + 2] += Math.cos(elapsedTime + i) * speeds[i].zFactor;

        // Reset if drifted above bounds
        if (posArray[i * 3 + 1] > 30) {
          posArray[i * 3 + 1] = -20;
          posArray[i * 3] = (Math.random() - 0.5) * 80;
          posArray[i * 3 + 2] = (Math.random() - 0.5) * 60;
        }
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      particlesMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ opacity }}
    />
  );
};
