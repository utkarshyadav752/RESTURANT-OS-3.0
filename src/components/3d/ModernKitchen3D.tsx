import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, Flame, Coffee, Utensils, RotateCw, Eye, Move, CheckCircle2, ShieldCheck, Thermometer } from 'lucide-react';

/**
 * Modern High-Fidelity 3D Kitchen Island & Chef Brigade Station
 * Crafted with realistic culinary materials:
 * - Brushed stainless steel chef prep island & dark nero-marquina marble bevels
 * - Glowing ceramic induction cooktop with interactive thermal heat pulse
 * - Handcrafted copper chef sauté pan with solid brass riveted handle
 * - Brushed steel commercial espresso machine with pressure dial gauge & cup
 * - Mirror-finish silver cloche dome on black slate plating pass
 * - Rising culinary steam particles with realistic dissipation
 * - Interactive camera station focus glide (Full Island, Sauté, Barista, Cloche)
 */
export const ModernKitchen3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStation, setActiveStation] = useState<'ALL' | 'SAUTE' | 'BARISTA' | 'CLOCHE'>('ALL');
  const [autoRotate, setAutoRotate] = useState(true);
  const [heatLevel, setHeatLevel] = useState<'SIMMER' | 'SEAR'>('SEAR');
  const [isInteracting, setIsInteracting] = useState(false);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const masterGroupRef = useRef<THREE.Group | null>(null);
  const steamParticlesRef = useRef<THREE.Points | null>(null);
  const inductionLightsRef = useRef<THREE.PointLight[]>([]);

  // Camera targets for station transitions
  const targetCamPosRef = useRef({ x: 0, y: 3.4, z: 6.8 });
  const targetLookAtRef = useRef({ x: 0, y: 0.4, z: 0 });

  // Mouse & Touch interaction
  const isDraggingRef = useRef(false);
  const prevXRef = useRef(0);
  const prevYRef = useRef(0);
  const rotYRef = useRef(0.35);
  const rotXRef = useRef(0.22);

  // Switch stations smoothly
  const handleStationSelect = (station: 'ALL' | 'SAUTE' | 'BARISTA' | 'CLOCHE') => {
    setActiveStation(station);
    if (station === 'ALL') {
      targetCamPosRef.current = { x: 0, y: 3.4, z: 6.8 };
      targetLookAtRef.current = { x: 0, y: 0.4, z: 0 };
    } else if (station === 'SAUTE') {
      targetCamPosRef.current = { x: -1.4, y: 2.2, z: 4.2 };
      targetLookAtRef.current = { x: -1.2, y: 0.3, z: 0 };
    } else if (station === 'BARISTA') {
      targetCamPosRef.current = { x: 1.5, y: 2.4, z: 4.0 };
      targetLookAtRef.current = { x: 1.3, y: 0.5, z: 0 };
    } else if (station === 'CLOCHE') {
      targetCamPosRef.current = { x: 0.1, y: 2.0, z: 3.8 };
      targetLookAtRef.current = { x: 0.0, y: 0.2, z: 0.1 };
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 380;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(0, 3.4, 6.8);
    camera.lookAt(0, 0.4, 0);

    // 3. Renderer with soft shadows & ACES Tone Mapping
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      powerPreference: 'high-performance' 
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Warm Restaurant & Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 1.3);
    scene.add(ambientLight);

    // Warm overhead chef downlight
    const keyLight = new THREE.DirectionalLight(0xffedd5, 2.5);
    keyLight.position.set(3, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Warm golden rim light (simulating warm bistro pendant lighting)
    const rimLight = new THREE.DirectionalLight(0xf59e0b, 1.8);
    rimLight.position.set(-6, 4, -4);
    scene.add(rimLight);

    // Soft fill light from front-left
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.6);
    fillLight.position.set(-4, 3, 4);
    scene.add(fillLight);

    // 5. Master Model Group
    const masterGroup = new THREE.Group();
    masterGroupRef.current = masterGroup;
    scene.add(masterGroup);

    // --- MATERIALS DEFINITION ---
    // Stainless Steel (Brushed culinary grade 304)
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xdedede,
      metalness: 0.92,
      roughness: 0.18,
    });

    // Dark Nero Marquina Marble / Obsidian Quartz
    const darkMarbleMat = new THREE.MeshStandardMaterial({
      color: 0x141210,
      metalness: 0.25,
      roughness: 0.15,
    });

    // Mirror Chrome
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.98,
      roughness: 0.05,
    });

    // Polished Copper (Chef Saute Pan)
    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xbe5c1c, // Rich glowing culinary copper
      metalness: 0.92,
      roughness: 0.2,
    });

    // Brass / Gold Accents
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.22,
    });

    // Acacia Wood (Cutting Block)
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.6,
      metalness: 0.05,
    });

    // Black Slate Plating Plate
    const slateMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.75,
      metalness: 0.1,
    });

    // ================================================================
    // A. MODERN KITCHEN ISLAND BASE (Pedestal, Steel Facia, Bevels)
    // ================================================================
    // 1. Lower island cabinet pedestal
    const pedestalGeo = new THREE.BoxGeometry(4.8, 0.45, 2.6);
    const pedestal = new THREE.Mesh(pedestalGeo, darkMarbleMat);
    pedestal.position.y = -0.25;
    pedestal.receiveShadow = true;
    masterGroup.add(pedestal);

    // 2. Brass accent inset kickplate
    const kickplateGeo = new THREE.BoxGeometry(4.82, 0.06, 2.62);
    const kickplate = new THREE.Mesh(kickplateGeo, brassMat);
    kickplate.position.y = -0.02;
    masterGroup.add(kickplate);

    // 3. Ultra-sleek stainless steel chef worktop slab
    const topGeo = new THREE.BoxGeometry(4.9, 0.12, 2.7);
    const topMesh = new THREE.Mesh(topGeo, steelMat);
    topMesh.position.y = 0.06;
    topMesh.receiveShadow = true;
    topMesh.castShadow = true;
    masterGroup.add(topMesh);

    // Contact shadow plane underneath
    const shadowGeo = new THREE.PlaneGeometry(6.5, 4.5);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.48;
    shadowPlane.receiveShadow = true;
    masterGroup.add(shadowPlane);

    // ================================================================
    // B. LEFT ZONE: CERAMIC INDUCTION COOKTOP & COPPER SAUTÉ PAN
    // ================================================================
    const cooktopGroup = new THREE.Group();
    cooktopGroup.position.set(-1.25, 0.12, 0);

    // Glass ceramic induction plate
    const inductionGlassGeo = new THREE.BoxGeometry(2.1, 0.02, 2.2);
    const inductionGlass = new THREE.Mesh(inductionGlassGeo, new THREE.MeshStandardMaterial({
      color: 0x09090b,
      metalness: 0.9,
      roughness: 0.08,
    }));
    cooktopGroup.add(inductionGlass);

    // Glowing Induction Burner Ring
    const burnerRingGeo = new THREE.RingGeometry(0.62, 0.72, 48);
    const burnerRingMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
    });
    const burnerRing = new THREE.Mesh(burnerRingGeo, burnerRingMat);
    burnerRing.rotation.x = -Math.PI / 2;
    burnerRing.position.set(0, 0.015, 0.05);
    cooktopGroup.add(burnerRing);

    // Inner Concentric Ring
    const innerRingGeo = new THREE.RingGeometry(0.28, 0.34, 32);
    const innerRing = new THREE.Mesh(innerRingGeo, burnerRingMat);
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.set(0, 0.016, 0.05);
    cooktopGroup.add(innerRing);

    // Thermal Heat Glow Light
    const burnerLight = new THREE.PointLight(0xff5500, 2.2, 3.5);
    burnerLight.position.set(0, 0.3, 0.05);
    cooktopGroup.add(burnerLight);
    inductionLightsRef.current.push(burnerLight);

    // Copper Chef Sauté Pan (Handcrafted round body)
    const panGroup = new THREE.Group();
    panGroup.position.set(0, 0.02, 0.05);

    // Outer copper body
    const panBodyGeo = new THREE.CylinderGeometry(0.72, 0.6, 0.28, 48);
    const panBody = new THREE.Mesh(panBodyGeo, copperMat);
    panBody.position.y = 0.14;
    panBody.castShadow = true;
    panGroup.add(panBody);

    // Lined stainless steel interior
    const panInteriorGeo = new THREE.CylinderGeometry(0.68, 0.58, 0.26, 48);
    const panInterior = new THREE.Mesh(panInteriorGeo, steelMat);
    panInterior.position.y = 0.15;
    panGroup.add(panInterior);

    // Sizzling garlic butter / culinary oil disc inside pan
    const oilGeo = new THREE.CylinderGeometry(0.56, 0.56, 0.02, 32);
    const oilMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.1,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    const oilMesh = new THREE.Mesh(oilGeo, oilMat);
    oilMesh.position.y = 0.17;
    panGroup.add(oilMesh);

    // Long ergonomic cast stainless handle with brass rivets
    const panHandleGeo = new THREE.BoxGeometry(0.08, 0.05, 1.15);
    const panHandle = new THREE.Mesh(panHandleGeo, steelMat);
    panHandle.position.set(0, 0.28, 1.1);
    panHandle.rotation.x = 0.18;
    panHandle.castShadow = true;
    panGroup.add(panHandle);

    cooktopGroup.add(panGroup);
    masterGroup.add(cooktopGroup);

    // ================================================================
    // C. CENTER ZONE: CHEF PLATING CLOCHE & ACACIA PREP BLOCK
    // ================================================================
    const centerGroup = new THREE.Group();
    centerGroup.position.set(0.1, 0.12, 0.15);

    // Heavy round acacia wood cutting / plating riser
    const blockGeo = new THREE.CylinderGeometry(0.78, 0.78, 0.08, 48);
    const blockMesh = new THREE.Mesh(blockGeo, woodMat);
    blockMesh.position.y = 0.04;
    blockMesh.castShadow = true;
    blockMesh.receiveShadow = true;
    centerGroup.add(blockMesh);

    // Black Slate Platter
    const slateGeo = new THREE.CylinderGeometry(0.66, 0.66, 0.02, 48);
    const slatePlate = new THREE.Mesh(slateGeo, slateMat);
    slatePlate.position.y = 0.09;
    centerGroup.add(slatePlate);

    // Mirror-Polished Silver Cloche Dome
    const clocheDomeGeo = new THREE.SphereGeometry(0.52, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const clocheDome = new THREE.Mesh(clocheDomeGeo, chromeMat);
    clocheDome.position.y = 0.1;
    clocheDome.castShadow = true;
    centerGroup.add(clocheDome);

    // Cloche Golden Acorn Finial Handle
    const finialGeo = new THREE.SphereGeometry(0.07, 16, 16);
    const finial = new THREE.Mesh(finialGeo, brassMat);
    finial.position.y = 0.64;
    centerGroup.add(finial);

    // Chef Santoku Knife on Board
    const knifeBladeGeo = new THREE.BoxGeometry(0.04, 0.12, 0.75);
    const knifeBlade = new THREE.Mesh(knifeBladeGeo, chromeMat);
    knifeBlade.position.set(0.55, 0.08, 0.15);
    knifeBlade.rotation.y = -0.4;
    centerGroup.add(knifeBlade);

    const knifeHandleGeo = new THREE.BoxGeometry(0.06, 0.08, 0.35);
    const knifeHandle = new THREE.Mesh(knifeHandleGeo, darkMarbleMat);
    knifeHandle.position.set(0.7, 0.08, 0.55);
    knifeHandle.rotation.y = -0.4;
    centerGroup.add(knifeHandle);

    masterGroup.add(centerGroup);

    // ================================================================
    // D. RIGHT ZONE: COMMERCIAL BARISTA ESPRESSO MACHINE
    // ================================================================
    const baristaGroup = new THREE.Group();
    baristaGroup.position.set(1.45, 0.12, -0.05);

    // Main machine chassis (Brushed Stainless Steel & Obsidian)
    const machineBodyGeo = new THREE.BoxGeometry(1.2, 1.25, 1.3);
    const machineBody = new THREE.Mesh(machineBodyGeo, steelMat);
    machineBody.position.y = 0.65;
    machineBody.castShadow = true;
    baristaGroup.add(machineBody);

    // Front upper fascia (Piano black with illuminated pressure gauges)
    const fasciaGeo = new THREE.BoxGeometry(1.16, 0.35, 0.04);
    const fascia = new THREE.Mesh(fasciaGeo, darkMarbleMat);
    fascia.position.set(0, 1.05, 0.67);
    baristaGroup.add(fascia);

    // Twin Circular Brass Pressure Dials
    [-0.28, 0.28].forEach((dialX) => {
      const dialGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.02, 24);
      const dial = new THREE.Mesh(dialGeo, brassMat);
      dial.rotation.x = Math.PI / 2;
      dial.position.set(dialX, 1.05, 0.7);
      baristaGroup.add(dial);
    });

    // Group Head dispenser overhang
    const dispenserGeo = new THREE.BoxGeometry(0.8, 0.15, 0.4);
    const dispenser = new THREE.Mesh(dispenserGeo, chromeMat);
    dispenser.position.set(0, 0.75, 0.85);
    dispenser.castShadow = true;
    baristaGroup.add(dispenser);

    // Chrome Portafilter with bakelite handle
    const portafilterGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.12, 24);
    const portafilter = new THREE.Mesh(portafilterGeo, chromeMat);
    portafilter.position.set(0, 0.63, 0.85);
    baristaGroup.add(portafilter);

    const pfHandleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 16);
    const pfHandle = new THREE.Mesh(pfHandleGeo, darkMarbleMat);
    pfHandle.rotation.x = Math.PI / 2;
    pfHandle.position.set(0, 0.63, 1.15);
    baristaGroup.add(pfHandle);

    // Ceramic Espresso Cup under group head
    const cupGeo = new THREE.CylinderGeometry(0.14, 0.1, 0.18, 24);
    const cupMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const cup = new THREE.Mesh(cupGeo, cupMat);
    cup.position.set(0, 0.2, 0.85);
    cup.castShadow = true;
    baristaGroup.add(cup);

    // Tiny gold crema inside cup
    const cremaGeo = new THREE.CircleGeometry(0.12, 24);
    const cremaMat = new THREE.MeshStandardMaterial({ color: 0xc27803, roughness: 0.3 });
    const crema = new THREE.Mesh(cremaGeo, cremaMat);
    crema.rotation.x = -Math.PI / 2;
    crema.position.set(0, 0.28, 0.85);
    baristaGroup.add(crema);

    // Chrome steam wand
    const wandGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 12);
    const wand = new THREE.Mesh(wandGeo, chromeMat);
    wand.position.set(0.48, 0.6, 0.82);
    wand.rotation.z = -0.3;
    baristaGroup.add(wand);

    masterGroup.add(baristaGroup);

    // ================================================================
    // E. SOFT VOLUMETRIC CULINARY STEAM PARTICLES
    // ================================================================
    const steamCount = 42;
    const steamGeo = new THREE.BufferGeometry();
    const steamPos = new Float32Array(steamCount * 3);
    const steamVels: { y: number; x: number; z: number }[] = [];

    for (let i = 0; i < steamCount; i++) {
      steamPos[i * 3] = -1.25 + (Math.random() - 0.5) * 0.55;
      steamPos[i * 3 + 1] = 0.35 + Math.random() * 1.5;
      steamPos[i * 3 + 2] = 0.05 + (Math.random() - 0.5) * 0.55;

      steamVels.push({
        y: 0.012 + Math.random() * 0.014,
        x: (Math.random() - 0.5) * 0.005,
        z: (Math.random() - 0.5) * 0.005,
      });
    }

    steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
    const steamMat = new THREE.PointsMaterial({
      color: 0xffedd5,
      size: 0.32,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });

    const steamPoints = new THREE.Points(steamGeo, steamMat);
    steamParticlesRef.current = steamPoints;
    masterGroup.add(steamPoints);

    // ================================================================
    // F. ANIMATION & SMOOTH CAMERA GLIDE LOOP
    // ================================================================
    let animId: number;
    const clock = new THREE.Clock();
    const currentLookAt = new THREE.Vector3(0, 0.4, 0);

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth camera interpolation towards target station
      camera.position.x += (targetCamPosRef.current.x - camera.position.x) * 0.05;
      camera.position.y += (targetCamPosRef.current.y - camera.position.y) * 0.05;
      camera.position.z += (targetCamPosRef.current.z - camera.position.z) * 0.05;

      currentLookAt.x += (targetLookAtRef.current.x - currentLookAt.x) * 0.05;
      currentLookAt.y += (targetLookAtRef.current.y - currentLookAt.y) * 0.05;
      currentLookAt.z += (targetLookAtRef.current.z - currentLookAt.z) * 0.05;
      camera.lookAt(currentLookAt);

      // Auto rotation when idle
      if (autoRotate && !isDraggingRef.current && activeStation === 'ALL') {
        rotYRef.current += 0.004;
      }

      // Smooth group rotation with inertia
      masterGroup.rotation.y += (rotYRef.current - masterGroup.rotation.y) * 0.08;
      masterGroup.rotation.x += (rotXRef.current - masterGroup.rotation.x) * 0.08;

      // Animate thermal induction pulse
      const pulseMultiplier = heatLevel === 'SEAR' ? 1.6 : 0.9;
      inductionLightsRef.current.forEach((light) => {
        light.intensity = 1.8 * pulseMultiplier + Math.sin(elapsed * 4.5) * 0.4 * pulseMultiplier;
      });

      // Animate rising steam particles
      if (steamParticlesRef.current) {
        const positions = steamParticlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < steamCount; i++) {
          positions[i * 3 + 1] += steamVels[i].y;
          positions[i * 3] += steamVels[i].x + Math.sin(elapsed + i) * 0.002;
          positions[i * 3 + 2] += steamVels[i].z + Math.cos(elapsed + i) * 0.002;

          // Recycle particle when it floats up
          if (positions[i * 3 + 1] > 2.2) {
            positions[i * 3 + 1] = 0.35;
            positions[i * 3] = -1.25 + (Math.random() - 0.5) * 0.4;
            positions[i * 3 + 2] = 0.05 + (Math.random() - 0.5) * 0.4;
          }
        }
        steamParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // ================================================================
    // G. TOUCH & MOUSE EVENT LISTENERS
    // ================================================================
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDraggingRef.current = true;
      setIsInteracting(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevXRef.current = clientX;
      prevYRef.current = clientY;
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - prevXRef.current;
      const deltaY = clientY - prevYRef.current;

      rotYRef.current += deltaX * 0.008;
      rotXRef.current = Math.max(0.05, Math.min(0.65, rotXRef.current + deltaY * 0.005));

      prevXRef.current = clientX;
      prevYRef.current = clientY;
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      setTimeout(() => setIsInteracting(false), 1200);
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    domElement.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight || 380;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      domElement.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);

      domElement.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('resize', handleResize);

      renderer.dispose();
      scene.clear();
      if (container) container.innerHTML = '';
    };
  }, [heatLevel]);

  return (
    <div className="relative w-full rounded-3xl bg-gradient-to-b from-stone-900/90 via-stone-950/95 to-black border border-stone-800/80 shadow-2xl backdrop-blur-xl overflow-hidden p-4 sm:p-5 group">
      
      {/* Top Interactive Station Switcher Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-stone-800/80 z-20 relative">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-amber-200">
            3D Modern Culinary Suite
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
            WebGL ACES Filmic
          </span>
        </div>

        {/* Station Navigation Buttons */}
        <div className="flex items-center gap-1 bg-stone-900/90 p-1 rounded-xl border border-stone-800 text-[11px] font-bold">
          <button
            onClick={() => handleStationSelect('ALL')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activeStation === 'ALL'
                ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Full Island
          </button>
          <button
            onClick={() => handleStationSelect('SAUTE')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              activeStation === 'SAUTE'
                ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>Sauté Line</span>
          </button>
          <button
            onClick={() => handleStationSelect('BARISTA')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              activeStation === 'BARISTA'
                ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Coffee className="w-3 h-3" />
            <span>Espresso Pass</span>
          </button>
          <button
            onClick={() => handleStationSelect('CLOCHE')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              activeStation === 'CLOCHE'
                ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Utensils className="w-3 h-3" />
            <span>Plating</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas Rendering Mount Area */}
      <div 
        ref={containerRef} 
        className="w-full h-[320px] sm:h-[380px] cursor-grab active:cursor-grabbing relative z-10 touch-none select-none"
      />

      {/* Floating Tactical Badges & Interaction Prompts */}
      <div className="absolute top-16 left-6 z-20 pointer-events-none hidden sm:flex flex-col gap-2">
        <div className="px-3 py-1.5 rounded-xl bg-stone-900/80 border border-stone-800/90 backdrop-blur-md shadow-lg flex items-center gap-2 text-xs">
          <Thermometer className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-stone-300 font-medium">Induction Status:</span>
          <strong className="text-amber-300 font-mono">{heatLevel === 'SEAR' ? '240°C Active Sear' : '140°C Gentle Simmer'}</strong>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-stone-900/80 border border-stone-800/90 backdrop-blur-md shadow-lg flex items-center gap-2 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-stone-300 font-medium">BOM Recipe Costing:</span>
          <strong className="text-emerald-300 font-mono">100% Synced</strong>
        </div>
      </div>

      {/* Bottom Control Bar: Auto-Rotate, Heat Toggle & Orbit Prompt */}
      <div className="flex items-center justify-between pt-2.5 border-t border-stone-800/80 z-20 relative text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              autoRotate
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-stone-900 border-stone-800 text-stone-400'
            }`}
          >
            <RotateCw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span>{autoRotate ? 'Orbiting' : 'Paused'}</span>
          </button>

          <button
            onClick={() => setHeatLevel(heatLevel === 'SEAR' ? 'SIMMER' : 'SEAR')}
            className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Flame className="w-3 h-3 text-orange-400" />
            <span>Heat: <strong className="text-amber-300">{heatLevel}</strong></span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-stone-400 text-[11px]">
          <Move className="w-3 h-3 text-stone-500" />
          <span className="hidden sm:inline">Drag to explore in 360°</span>
          <span className="sm:hidden">Swipe to rotate</span>
        </div>
      </div>

    </div>
  );
};
