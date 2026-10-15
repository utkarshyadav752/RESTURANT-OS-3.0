import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Sparkles, ChefHat, Receipt, Flame, Utensils, 
  RotateCw, Eye, Move, RefreshCw, ZoomIn, ZoomOut 
} from 'lucide-react';

export type ShowcaseObjectType = 'HANDI' | 'CLOCHE' | 'POS_TERMINAL' | 'BAR_SHAKER' | 'SPICE_KADAI';

export const KitchenShowcase3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeObject, setActiveObject] = useState<ShowcaseObjectType>('HANDI');
  const [autoRotate, setAutoRotate] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);

  // References for animation
  const sceneRef = useRef<THREE.Scene | null>(null);
  const objectsGroupRef = useRef<THREE.Group | null>(null);
  const steamParticlesRef = useRef<THREE.Points | null>(null);
  const clocheLidRef = useRef<THREE.Group | null>(null);
  const printerTicketRef = useRef<THREE.Mesh | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Touch & Mouse drag tracking
  const isDraggingRef = useRef(false);
  const prevPointerXRef = useRef(0);
  const prevPointerYRef = useRef(0);
  const targetRotationYRef = useRef(0);
  const targetRotationXRef = useRef(0.2);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 360;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(0, 3.2, 7.5);
    camera.lookAt(0, 0.5, 0);

    // 3. Renderer with high performance and mobile-friendly pixel ratio
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting Rig (Warm culinary restaurant ambiance)
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 1.2);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xfff3e0, 2.2);
    mainKeyLight.position.set(5, 8, 6);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 1024;
    mainKeyLight.shadow.mapSize.height = 1024;
    scene.add(mainKeyLight);

    // Warm hearth ember light from underneath
    const hearthLight = new THREE.PointLight(0xff5500, 3.0, 10);
    hearthLight.position.set(0, -0.6, 0);
    scene.add(hearthLight);

    // Back rim light for copper/metallic highlights
    const rimLight = new THREE.DirectionalLight(0xd97706, 1.8);
    rimLight.position.set(-6, 4, -4);
    scene.add(rimLight);

    // 5. Restaurant Table Pedestal (Polished charcoal granite / dark walnut)
    const tableGeo = new THREE.CylinderGeometry(2.8, 3.0, 0.35, 48);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.3,
      metalness: 0.1,
    });
    const tableMesh = new THREE.Mesh(tableGeo, tableMat);
    tableMesh.position.y = -0.18;
    tableMesh.receiveShadow = true;
    scene.add(tableMesh);

    // Brass edge inlay ring for fine dining elegance
    const brassRingGeo = new THREE.TorusGeometry(2.81, 0.02, 16, 64);
    const brassRingMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.9,
      roughness: 0.2,
    });
    const brassRing = new THREE.Mesh(brassRingGeo, brassRingMat);
    brassRing.rotation.x = Math.PI / 2;
    brassRing.position.y = 0.0;
    scene.add(brassRing);

    // 6. Master Objects Group
    const masterGroup = new THREE.Group();
    objectsGroupRef.current = masterGroup;
    scene.add(masterGroup);

    // --- OBJECT 1: Hand-Hammered Copper Handi / Deg ---
    const handiGroup = new THREE.Group();
    handiGroup.name = 'HANDI';

    // Lathe profile for traditional royal Dum Handi
    const points: THREE.Vector2[] = [];
    points.push(new THREE.Vector2(0, 0));
    points.push(new THREE.Vector2(0.9, 0.05));
    points.push(new THREE.Vector2(1.35, 0.4));
    points.push(new THREE.Vector2(1.5, 0.8));
    points.push(new THREE.Vector2(1.4, 1.2));
    points.push(new THREE.Vector2(1.05, 1.5));
    points.push(new THREE.Vector2(1.15, 1.6));
    points.push(new THREE.Vector2(1.1, 1.65));
    points.push(new THREE.Vector2(0.98, 1.62));
    points.push(new THREE.Vector2(0.95, 1.55));
    points.push(new THREE.Vector2(0.85, 0.2));
    points.push(new THREE.Vector2(0, 0.15));

    const handiGeo = new THREE.LatheGeometry(points, 48);
    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xb45309, // Warm rich copper
      metalness: 0.85,
      roughness: 0.28,
    });
    const handiMesh = new THREE.Mesh(handiGeo, copperMat);
    handiMesh.castShadow = true;
    handiMesh.receiveShadow = true;
    handiGroup.add(handiMesh);

    // Brass handles on sides
    const handleGeo = new THREE.TorusGeometry(0.24, 0.05, 16, 24, Math.PI);
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.92,
      roughness: 0.2,
    });

    const leftHandle = new THREE.Mesh(handleGeo, brassMat);
    leftHandle.position.set(-1.42, 1.15, 0);
    leftHandle.rotation.z = -Math.PI / 2;
    handiGroup.add(leftHandle);

    const rightHandle = new THREE.Mesh(handleGeo, brassMat);
    rightHandle.position.set(1.42, 1.15, 0);
    rightHandle.rotation.z = Math.PI / 2;
    handiGroup.add(rightHandle);

    // Domed Lid with Saffron Seal Ring
    const lidGeo = new THREE.SphereGeometry(1.02, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.45);
    const lidMesh = new THREE.Mesh(lidGeo, copperMat);
    lidMesh.position.y = 1.55;
    lidMesh.castShadow = true;
    handiGroup.add(lidMesh);

    // Lid Finial Knob
    const knobGeo = new THREE.CylinderGeometry(0.12, 0.06, 0.28, 24);
    const knobMesh = new THREE.Mesh(knobGeo, brassMat);
    knobMesh.position.y = 1.95;
    handiGroup.add(knobMesh);

    // Dough seal strip (traditional Purani Dilli Dum seal)
    const sealGeo = new THREE.TorusGeometry(1.05, 0.06, 12, 48);
    const sealMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.9, metalness: 0.0 });
    const sealMesh = new THREE.Mesh(sealGeo, sealMat);
    sealMesh.rotation.x = Math.PI / 2;
    sealMesh.position.y = 1.58;
    handiGroup.add(sealMesh);

    masterGroup.add(handiGroup);

    // --- Steam Particles for Cooking Deg ---
    const steamCount = 45;
    const steamPositions = new Float32Array(steamCount * 3);
    const steamVelocities: { x: number; y: number; z: number; initialY: number }[] = [];

    for (let i = 0; i < steamCount; i++) {
      steamPositions[i * 3] = (Math.random() - 0.5) * 0.8;
      const initialY = 1.7 + Math.random() * 1.5;
      steamPositions[i * 3 + 1] = initialY;
      steamPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.8;

      steamVelocities.push({
        x: (Math.random() - 0.5) * 0.008,
        y: 0.012 + Math.random() * 0.012,
        z: (Math.random() - 0.5) * 0.008,
        initialY: 1.7,
      });
    }

    const steamGeo = new THREE.BufferGeometry();
    steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPositions, 3));

    const steamMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.22,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });

    const steamParticles = new THREE.Points(steamGeo, steamMat);
    steamParticlesRef.current = steamParticles;
    handiGroup.add(steamParticles);

    // --- OBJECT 2: Luxury Fine Dining Serving Cloche ---
    const clocheGroup = new THREE.Group();
    clocheGroup.name = 'CLOCHE';
    clocheGroup.visible = false;

    // Silver Platter Base Tray
    const platterGeo = new THREE.CylinderGeometry(1.8, 1.6, 0.08, 48);
    const silverMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.15,
    });
    const platterMesh = new THREE.Mesh(platterGeo, silverMat);
    platterMesh.position.y = 0.04;
    platterMesh.castShadow = true;
    clocheGroup.add(platterMesh);

    // Cloche Lifting Dome Group
    const domeLid = new THREE.Group();
    clocheLidRef.current = domeLid;

    const domeGeo = new THREE.SphereGeometry(1.4, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const domeMesh = new THREE.Mesh(domeGeo, silverMat);
    domeMesh.castShadow = true;
    domeLid.add(domeMesh);

    const clocheKnob = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 24), brassMat);
    clocheKnob.position.y = 1.48;
    domeLid.add(clocheKnob);

    clocheGroup.add(domeLid);
    masterGroup.add(clocheGroup);

    // --- OBJECT 3: Smart POS Terminal & KOT Ticket Dispenser ---
    const posGroup = new THREE.Group();
    posGroup.name = 'POS_TERMINAL';
    posGroup.visible = false;

    // Weighted Base
    const posBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.0, 0.15, 32),
      new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.5, metalness: 0.4 })
    );
    posBase.position.y = 0.08;
    posGroup.add(posBase);

    // Stand Arm
    const posArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 1.1, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.3, metalness: 0.6 })
    );
    posArm.position.set(0, 0.65, -0.15);
    posArm.rotation.x = -0.15;
    posGroup.add(posArm);

    // Angled Touch Screen Bezel
    const screenBox = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.4, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.2, metalness: 0.7 })
    );
    screenBox.position.set(0, 1.4, 0.15);
    screenBox.rotation.x = -0.38;
    screenBox.castShadow = true;
    posGroup.add(screenBox);

    // Glowing Order Screen Canvas Texture
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 512;
    screenCanvas.height = 320;
    const sCtx = screenCanvas.getContext('2d');
    if (sCtx) {
      sCtx.fillStyle = '#090d16';
      sCtx.fillRect(0, 0, 512, 320);

      // Header
      sCtx.fillStyle = '#f59e0b';
      sCtx.font = 'bold 24px monospace';
      sCtx.fillText('RestaurantOS POS · T-04', 24, 40);

      // Order Items
      sCtx.fillStyle = '#e2e8f0';
      sCtx.font = '18px sans-serif';
      sCtx.fillText('2x Purani Dilli Butter Chicken', 24, 90);
      sCtx.fillText('4x Garlic Butter Naan', 24, 125);
      sCtx.fillText('1x Saffron Handi Biryani', 24, 160);
      sCtx.fillText('2x Royal Phirni Royale', 24, 195);

      // Divider & Total
      sCtx.strokeStyle = '#334155';
      sCtx.lineWidth = 2;
      sCtx.beginPath();
      sCtx.moveTo(24, 230);
      sCtx.lineTo(488, 230);
      sCtx.stroke();

      sCtx.fillStyle = '#10b981';
      sCtx.font = 'bold 28px sans-serif';
      sCtx.fillText('TOTAL: ₹2,480.00', 24, 275);

      sCtx.fillStyle = '#f59e0b';
      sCtx.font = 'bold 16px sans-serif';
      sCtx.fillText('PAID [UPI QR]', 360, 275);
    }

    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    const screenDisplay = new THREE.Mesh(
      new THREE.PlaneGeometry(2.05, 1.25),
      new THREE.MeshBasicMaterial({ map: screenTexture })
    );
    screenDisplay.position.set(0, 1.41, 0.22);
    screenDisplay.rotation.x = -0.38;
    posGroup.add(screenDisplay);

    // Thermal KOT Receipt Printer Module on Side
    const printerBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.7, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.4 })
    );
    printerBox.position.set(1.4, 0.35, -0.2);
    printerBox.castShadow = true;
    posGroup.add(printerBox);

    // Curled Paper Ticket Output
    const ticketCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(1.4, 0.71, -0.2),
      new THREE.Vector3(1.4, 0.95, 0.0),
      new THREE.Vector3(1.4, 0.85, 0.3),
      new THREE.Vector3(1.4, 0.6, 0.45)
    );
    const ticketGeo = new THREE.TubeGeometry(ticketCurve, 20, 0.15, 6, false);
    const ticketMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
    const ticketMesh = new THREE.Mesh(ticketGeo, ticketMat);
    printerTicketRef.current = ticketMesh;
    posGroup.add(ticketMesh);

    masterGroup.add(posGroup);

    // --- OBJECT 4: Stainless Steel Cocktail Shaker & Barware ---
    const barGroup = new THREE.Group();
    barGroup.name = 'BAR_SHAKER';
    barGroup.visible = false;

    // Shaker main body
    const shakerBodyPoints = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.65, 0.05),
      new THREE.Vector2(0.85, 1.2),
      new THREE.Vector2(0.8, 1.6),
      new THREE.Vector2(0.72, 1.7),
      new THREE.Vector2(0, 1.7),
    ];
    const shakerBody = new THREE.Mesh(new THREE.LatheGeometry(shakerBodyPoints, 36), silverMat);
    shakerBody.castShadow = true;
    barGroup.add(shakerBody);

    // Shaker Tapered Top & Jigger Cap
    const capPoints = [
      new THREE.Vector2(0, 1.7),
      new THREE.Vector2(0.72, 1.7),
      new THREE.Vector2(0.45, 2.3),
      new THREE.Vector2(0.35, 2.7),
      new THREE.Vector2(0, 2.7),
    ];
    const shakerCap = new THREE.Mesh(new THREE.LatheGeometry(capPoints, 36), silverMat);
    barGroup.add(shakerCap);

    // Gold jigger measure on side
    const jiggerPoints = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.35, 0.6),
      new THREE.Vector2(0.12, 0.7),
      new THREE.Vector2(0.38, 1.25),
      new THREE.Vector2(0, 1.25),
    ];
    const jiggerMesh = new THREE.Mesh(new THREE.LatheGeometry(jiggerPoints, 24), brassMat);
    jiggerMesh.position.set(1.2, 0, 0.4);
    barGroup.add(jiggerMesh);

    masterGroup.add(barGroup);

    // --- OBJECT 5: Brass Spice Kadai & Whole Spices ---
    const spiceGroup = new THREE.Group();
    spiceGroup.name = 'SPICE_KADAI';
    spiceGroup.visible = false;

    // Kadai Wok Bowl
    const kadaiPoints = [];
    for (let i = 0; i <= 24; i++) {
      const angle = (i / 24) * (Math.PI / 2.2);
      kadaiPoints.push(new THREE.Vector2(Math.sin(angle) * 1.5, (1 - Math.cos(angle)) * 0.9));
    }
    const kadaiMesh = new THREE.Mesh(new THREE.LatheGeometry(kadaiPoints, 40), brassMat);
    kadaiMesh.castShadow = true;
    spiceGroup.add(kadaiMesh);

    // Kadai Ring Handles
    const kadaiHandleGeo = new THREE.TorusGeometry(0.2, 0.04, 12, 24);
    const leftKadaiHandle = new THREE.Mesh(kadaiHandleGeo, brassMat);
    leftKadaiHandle.position.set(-1.52, 0.85, 0);
    leftKadaiHandle.rotation.y = Math.PI / 2;
    spiceGroup.add(leftKadaiHandle);

    const rightKadaiHandle = new THREE.Mesh(kadaiHandleGeo, brassMat);
    rightKadaiHandle.position.set(1.52, 0.85, 0);
    rightKadaiHandle.rotation.y = Math.PI / 2;
    spiceGroup.add(rightKadaiHandle);

    // Star Anise & Cinnamon sticks inside
    const stickGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8);
    const spiceBrownMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });

    const cinnamon1 = new THREE.Mesh(stickGeo, spiceBrownMat);
    cinnamon1.position.set(0.2, 0.45, 0.1);
    cinnamon1.rotation.set(0.6, 0.4, 0.9);
    spiceGroup.add(cinnamon1);

    const cinnamon2 = new THREE.Mesh(stickGeo, spiceBrownMat);
    cinnamon2.position.set(-0.2, 0.4, -0.1);
    cinnamon2.rotation.set(-0.4, 0.8, -0.7);
    spiceGroup.add(cinnamon2);

    masterGroup.add(spiceGroup);

    // --- Animation Loop ---
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth damped rotation from mouse/touch or auto-rotation
      if (autoRotate && !isDraggingRef.current) {
        targetRotationYRef.current += 0.007;
      }

      masterGroup.rotation.y += (targetRotationYRef.current - masterGroup.rotation.y) * 0.08;
      masterGroup.rotation.x += (targetRotationXRef.current - masterGroup.rotation.x) * 0.08;

      // Animate Steam particles
      if (steamParticlesRef.current && steamParticlesRef.current.visible) {
        const posAttr = steamParticlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;

        for (let i = 0; i < steamCount; i++) {
          arr[i * 3 + 1] += steamVelocities[i].y;
          arr[i * 3] += Math.sin(elapsedTime * 2 + i) * 0.003;
          arr[i * 3 + 2] += Math.cos(elapsedTime * 2 + i) * 0.003;

          // Loop back down
          if (arr[i * 3 + 1] > 3.4) {
            arr[i * 3 + 1] = steamVelocities[i].initialY;
            arr[i * 3] = (Math.random() - 0.5) * 0.8;
            arr[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
          }
        }
        posAttr.needsUpdate = true;
      }

      // Cloche hover breathing/lifting reveal animation
      if (clocheLidRef.current && activeObject === 'CLOCHE') {
        const lift = Math.max(0, Math.sin(elapsedTime * 1.5)) * 0.6;
        clocheLidRef.current.position.y = lift;
        clocheLidRef.current.rotation.z = Math.sin(elapsedTime * 1.5) * 0.08;
      }

      // Hearth light pulsing
      hearthLight.intensity = 2.4 + Math.sin(elapsedTime * 4.0) * 0.6;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Visible 3D Object
  useEffect(() => {
    if (!objectsGroupRef.current) return;
    const group = objectsGroupRef.current;

    group.children.forEach(child => {
      child.visible = child.name === activeObject;
    });

    // Reset camera position slightly per object for best view
    if (cameraRef.current) {
      if (activeObject === 'POS_TERMINAL') {
        cameraRef.current.position.set(0, 3.4, 6.8);
      } else if (activeObject === 'HANDI') {
        cameraRef.current.position.set(0, 3.2, 7.5);
      } else {
        cameraRef.current.position.set(0, 3.0, 7.2);
      }
    }
  }, [activeObject]);

  // Touch and Mouse Interaction Handlers
  const handlePointerDown = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    prevPointerXRef.current = clientX;
    prevPointerYRef.current = clientY;
    setIsInteracting(true);
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const deltaX = clientX - prevPointerXRef.current;
    const deltaY = clientY - prevPointerYRef.current;

    targetRotationYRef.current += deltaX * 0.008;
    targetRotationXRef.current = Math.max(-0.2, Math.min(0.6, targetRotationXRef.current + deltaY * 0.008));

    prevPointerXRef.current = clientX;
    prevPointerYRef.current = clientY;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    setIsInteracting(false);
  };

  const objectSpecs = [
    {
      id: 'HANDI' as ShowcaseObjectType,
      name: 'Copper Dum Handi',
      tag: 'Kitchen & Hearth',
      icon: <Flame className="w-3.5 h-3.5 text-amber-400" />,
      desc: 'Hand-hammered royal copper deg with live steam simulation and traditional saffron flour seal.',
      metric: '98% Yield Accuracy',
    },
    {
      id: 'CLOCHE' as ShowcaseObjectType,
      name: 'Dining Cloche',
      tag: 'Service & Plating',
      icon: <Utensils className="w-3.5 h-3.5 text-blue-400" />,
      desc: 'High-polish mirror silver dome with automated lifting reveal animation for VIP table service.',
      metric: '14.2 min Table Turn',
    },
    {
      id: 'POS_TERMINAL' as ShowcaseObjectType,
      name: 'Smart POS Register',
      tag: 'Billing & KOT',
      icon: <Receipt className="w-3.5 h-3.5 text-emerald-400" />,
      desc: 'Capacitive touch order screen displaying live UPI totals with curled thermal ticket feed.',
      metric: '2.8s Order-to-KOT',
    },
    {
      id: 'BAR_SHAKER' as ShowcaseObjectType,
      name: 'Cocktail Shaker',
      tag: 'Mixology & Bar',
      icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
      desc: 'Dual-tone stainless cobbler shaker & brass jigger for real-time liquor wastage tracking.',
      metric: '82% High-Margin Pour',
    },
    {
      id: 'SPICE_KADAI' as ShowcaseObjectType,
      name: 'Brass Spice Wok',
      tag: 'Inventory & Kirana',
      icon: <ChefHat className="w-3.5 h-3.5 text-orange-400" />,
      desc: 'Traditional spun brass wok holding whole cinnamon and star anise with live batch variance monitoring.',
      metric: 'Zero Expiry Drift',
    },
  ];

  const currentSpec = objectSpecs.find(s => s.id === activeObject) || objectSpecs[0];

  return (
    <div className="w-full flex flex-col items-center">
      {/* 3D Viewport Canvas Container */}
      <div 
        className="w-full h-[320px] sm:h-[380px] relative rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900/60 via-slate-950/80 to-slate-950 border border-slate-800/80 shadow-2xl touch-none select-none"
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 1) {
            handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchEnd={handlePointerUp}
      >
        {/* Three.js Canvas Mount */}
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Top Floating Badge with Specs */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="px-3 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700/70 text-xs flex items-center gap-2 shadow-lg">
            <span className="p-1 rounded-full bg-amber-500/10">
              {currentSpec.icon}
            </span>
            <span className="font-bold text-white text-xs sm:text-sm">{currentSpec.name}</span>
            <span className="text-[10px] text-amber-400/90 font-mono hidden sm:inline-block">[{currentSpec.tag}]</span>
          </div>

          <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] font-bold backdrop-blur-md">
            {currentSpec.metric}
          </div>
        </div>

        {/* Bottom Interactive Touch/Drag Hint & Controls */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950/70 px-2.5 py-1 rounded-full border border-slate-800 backdrop-blur-md">
            <Move className="w-3 h-3 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">Drag to rotate 360°</span>
            <span className="sm:hidden">Touch to rotate</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-1.5 rounded-full text-xs border transition-colors cursor-pointer backdrop-blur-md ${
                autoRotate
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={autoRotate ? 'Pause 3D rotation' : 'Resume 3D rotation'}
            >
              <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            </button>
          </div>
        </div>
      </div>

      {/* 3D Object Switcher Buttons (Mobile-friendly horizontal scroll / wrap) */}
      <div className="w-full mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {objectSpecs.map(spec => {
          const isSelected = activeObject === spec.id;
          return (
            <button
              key={spec.id}
              onClick={() => setActiveObject(spec.id)}
              className={`flex-1 min-w-[110px] sm:min-w-0 px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {spec.icon}
                <span className={`text-xs font-bold truncate ${isSelected ? 'text-amber-300' : 'text-slate-300'}`}>
                  {spec.name}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate font-mono">
                {spec.tag}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
