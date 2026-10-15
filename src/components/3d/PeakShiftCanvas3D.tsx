import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, Sparkles, TrendingUp, Users, Clock, AlertTriangle } from 'lucide-react';
import { ProjectedPeakWindow } from '../../types/index.ts';

interface PeakShiftCanvas3DProps {
  windows: ProjectedPeakWindow[];
  onSelectWindow?: (window: ProjectedPeakWindow) => void;
  selectedWindowId?: string;
}

export const PeakShiftCanvas3D: React.FC<PeakShiftCanvas3DProps> = ({
  windows,
  onSelectWindow,
  selectedWindowId
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredWindow, setHoveredWindow] = useState<ProjectedPeakWindow | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [cameraAngle, setCameraAngle] = useState<'ISOMETRIC' | 'FRONT' | 'TOP'>('ISOMETRIC');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pillarsRef = useRef<{ mesh: THREE.Mesh; glowMesh: THREE.Mesh; windowData: ProjectedPeakWindow }[]>([]);
  const isDraggingRef = useRef<boolean>(false);
  const prevMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rotationRef = useRef<{ x: number; y: number }>({ x: 0.35, y: -0.45 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 280;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x090d16, 0.035);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(0, 5.5, 11);
    camera.lookAt(0, 1.2, 0);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x60a5fa, 2.5);
    dirLight.position.set(6, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const peakPointLight = new THREE.PointLight(0xf43f5e, 3.5, 12);
    peakPointLight.position.set(1.5, 4.5, 0);
    scene.add(peakPointLight);

    const rimLight = new THREE.DirectionalLight(0xd97706, 1.2);
    rimLight.position.set(-8, 6, -5);
    scene.add(rimLight);

    // 4. Ground Grid & Platform
    const gridHelper = new THREE.GridHelper(16, 16, 0x3b82f6, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Platform base
    const baseGeo = new THREE.BoxGeometry(14, 0.3, 8);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.2
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.16;
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);

    // 5. Build 3D Pillars & Peak Curve
    const pillars: { mesh: THREE.Mesh; glowMesh: THREE.Mesh; windowData: ProjectedPeakWindow }[] = [];
    const curvePoints: THREE.Vector3[] = [];

    const spacing = 3.2;
    const startX = -((windows.length - 1) * spacing) / 2;

    windows.forEach((win, idx) => {
      const x = startX + idx * spacing;
      const heightVal = Math.max(0.8, (win.projectedCovers / 80) * 4.2);
      const isPeak = win.loadLevel === 'CRITICAL_PEAK';
      const isHigh = win.loadLevel === 'HIGH';

      const colorHex = isPeak ? 0xf43f5e : isHigh ? 0xf59e0b : 0x38bdf8;
      const emissiveHex = isPeak ? 0x881337 : isHigh ? 0x78350f : 0x0c4a6e;

      // Pillar Geometry (Rounded Box or Chamfered Cylinder)
      const pillarGeo = new THREE.CylinderGeometry(0.7, 0.85, heightVal, 16);
      const pillarMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: emissiveHex,
        emissiveIntensity: isPeak ? 0.8 : 0.4,
        roughness: 0.25,
        metalness: 0.75,
        transparent: true,
        opacity: 0.95
      });

      const pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
      pillarMesh.position.set(x, heightVal / 2, 0);
      pillarMesh.castShadow = true;
      pillarMesh.receiveShadow = true;
      pillarMesh.userData = { windowData: win };
      scene.add(pillarMesh);

      // Top glowing disc
      const topDiscGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.08, 16);
      const topDiscMat = new THREE.MeshBasicMaterial({
        color: isPeak ? 0xff4b72 : isHigh ? 0xfbbf24 : 0x7dd3fc
      });
      const topDisc = new THREE.Mesh(topDiscGeo, topDiscMat);
      topDisc.position.set(x, heightVal + 0.04, 0);
      scene.add(topDisc);

      // Glowing Aura / Halo on Peak
      const ringGeo = new THREE.RingGeometry(0.8, 1.25, 24);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isPeak ? 0.75 : 0.35
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(x, 0.02, 0);
      scene.add(ringMesh);

      // Record point for spline curve
      curvePoints.push(new THREE.Vector3(x, heightVal + 0.1, 0));

      pillars.push({ mesh: pillarMesh, glowMesh: ringMesh, windowData: win });
    });

    pillarsRef.current = pillars;

    // 6. 3D Spline Curve connecting the tops
    if (curvePoints.length > 1) {
      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.09, 12, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0x9f1239,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.8
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      scene.add(tubeMesh);

      // Ambient floating particles along the surge curve
      const particleCount = 28;
      const particleGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        const t = i / particleCount;
        const pt = curve.getPoint(t);
        positions[i * 3] = pt.x + (Math.random() - 0.5) * 0.4;
        positions[i * 3 + 1] = pt.y + (Math.random() - 0.5) * 0.4;
        positions[i * 3 + 2] = pt.z + (Math.random() - 0.5) * 0.6;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: 0xffedd5,
        size: 0.12,
        transparent: true,
        opacity: 0.85
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);
    }

    // 7. Raycasting for Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDraggingRef.current) {
        const deltaX = e.clientX - prevMouseRef.current.x;
        const deltaY = e.clientY - prevMouseRef.current.y;
        rotationRef.current.y += deltaX * 0.008;
        rotationRef.current.x = Math.max(0.1, Math.min(1.2, rotationRef.current.x + deltaY * 0.008));
        prevMouseRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      raycaster.setFromCamera(mouse, camera);
      const meshes = pillars.map(p => p.mesh);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const target = intersects[0].object as THREE.Mesh;
        const data = target.userData.windowData as ProjectedPeakWindow;
        setHoveredWindow(data);
        container.style.cursor = 'pointer';
      } else {
        setHoveredWindow(null);
        container.style.cursor = 'grab';
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
      container.style.cursor = 'grabbing';
    };

    const handlePointerUp = (e: MouseEvent) => {
      isDraggingRef.current = false;
      container.style.cursor = 'grab';

      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = pillars.map(p => p.mesh);
      const intersects = raycaster.intersectObjects(meshes);
      if (intersects.length > 0 && onSelectWindow) {
        const data = (intersects[0].object as THREE.Mesh).userData.windowData as ProjectedPeakWindow;
        onSelectWindow(data);
      }
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mouseup', handlePointerUp);

    // 8. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Camera orbital positioning based on rotationRef
      if (autoRotate && !isDraggingRef.current) {
        rotationRef.current.y += 0.003;
      }

      const radius = 11;
      camera.position.x = Math.sin(rotationRef.current.y) * radius * Math.cos(rotationRef.current.x);
      camera.position.z = Math.cos(rotationRef.current.y) * radius * Math.cos(rotationRef.current.x);
      camera.position.y = 1.2 + Math.sin(rotationRef.current.x) * radius;
      camera.lookAt(0, 1.6, 0);

      // Pulse the peak ring
      pillars.forEach(p => {
        if (p.windowData.loadLevel === 'CRITICAL_PEAK') {
          const s = 1 + Math.sin(elapsed * 4) * 0.12;
          p.glowMesh.scale.set(s, s, s);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize observer
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight || 280;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mouseup', handlePointerUp);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [windows, autoRotate, onSelectWindow]);

  const resetCamera = (angle: 'ISOMETRIC' | 'FRONT' | 'TOP') => {
    setCameraAngle(angle);
    if (angle === 'ISOMETRIC') {
      rotationRef.current = { x: 0.35, y: -0.45 };
    } else if (angle === 'FRONT') {
      rotationRef.current = { x: 0.1, y: 0 };
    } else if (angle === 'TOP') {
      rotationRef.current = { x: 1.15, y: 0 };
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800/90 shadow-2xl">
      {/* 3D Header Bar */}
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>3D Shift Peak Trajectory Simulator</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Interactive WebGL
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Drag to orbit • Click towers to inspect station load & prep bottlenecks
            </div>
          </div>
        </div>

        {/* 3D Viewport Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <div className="flex p-0.5 bg-slate-900/90 backdrop-blur rounded-lg border border-slate-800 text-[10px]">
            <button
              onClick={() => resetCamera('ISOMETRIC')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${cameraAngle === 'ISOMETRIC' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Iso
            </button>
            <button
              onClick={() => resetCamera('FRONT')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${cameraAngle === 'FRONT' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Front
            </button>
            <button
              onClick={() => resetCamera('TOP')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${cameraAngle === 'TOP' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Top
            </button>
          </div>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${autoRotate ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'}`}
            title="Toggle Auto Rotation"
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </button>
        </div>
      </div>

      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-72 sm:h-80 cursor-grab" />

      {/* Hover Info Tooltip Overlay */}
      {hoveredWindow && (
        <div className="absolute bottom-14 left-4 z-20 pointer-events-none max-w-sm p-3 rounded-xl bg-slate-950/95 border border-slate-700/80 backdrop-blur-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-bold text-xs text-white flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {hoveredWindow.timeWindow}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
              hoveredWindow.loadLevel === 'CRITICAL_PEAK'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : hoveredWindow.loadLevel === 'HIGH'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
            }`}>
              {hoveredWindow.rushStatus}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
            <div>
              <span className="text-[10px] text-slate-400 block">Projected Volume</span>
              <span className="font-mono font-bold text-white text-sm">{hoveredWindow.projectedCovers} Covers</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Capacity Load</span>
              <span className="font-mono font-bold text-amber-300 text-sm">{hoveredWindow.capacityUtilization}% Full</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-300 leading-snug">
            <span className="text-amber-400 font-bold">Prep: </span>
            {hoveredWindow.prepPrerequisite}
          </div>
        </div>
      )}

      {/* Bottom Shift Legend Bar */}
      <div className="absolute bottom-2 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 text-[11px] bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
            <span className="text-slate-300">Warm-Up (18:00)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            <span className="text-slate-300">Dinner Surge (19:15)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
            <span className="text-rose-300 font-bold">Primary Peak (20:30, 78 Covers)</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          Total Shift Forecast: <span className="text-white font-bold">202 Covers</span>
        </div>
      </div>
    </div>
  );
};
