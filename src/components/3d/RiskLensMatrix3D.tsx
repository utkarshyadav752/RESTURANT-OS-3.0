import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  RotateCw, Eye, Sparkles, Move, Filter, 
  ArrowUpRight, AlertCircle, TrendingUp, CheckCircle2 
} from 'lucide-react';

export interface MenuItemRiskNode {
  id: string;
  name: string;
  category: 'STAR' | 'PLOWHORSE' | 'PUZZLE' | 'DOG';
  volume: number; // 0 to 100
  margin: number; // 0 to 100
  risk: number; // 0 to 100
  price: number;
  cost: number;
}

const DEFAULT_NODES: MenuItemRiskNode[] = [
  { id: '1', name: 'Butter Chicken Special', category: 'STAR', volume: 92, margin: 82, risk: 18, price: 440, cost: 79 },
  { id: '2', name: 'Tandoori Garlic Naan', category: 'STAR', volume: 98, margin: 88, risk: 12, price: 85, cost: 10 },
  { id: '3', name: 'Dal Makhani Heritage', category: 'STAR', volume: 85, margin: 79, risk: 16, price: 320, cost: 67 },
  { id: '4', name: 'Chicken Biryani Handi', category: 'PLOWHORSE', volume: 90, margin: 52, risk: 32, price: 360, cost: 172 },
  { id: '5', name: 'Mutton Rogan Josh', category: 'PLOWHORSE', volume: 72, margin: 48, risk: 44, price: 520, cost: 270 },
  { id: '6', name: 'Saffron Lassi Royale', category: 'PUZZLE', volume: 38, margin: 85, risk: 24, price: 180, cost: 27 },
  { id: '7', name: 'Raw Papaya Salad', category: 'DOG', volume: 20, margin: 40, risk: 78, price: 210, cost: 126 },
  { id: '8', name: 'Fish Amritsari Fry', category: 'DOG', volume: 24, margin: 36, risk: 82, price: 460, cost: 294 },
];

export const RiskLensMatrix3D: React.FC<{ items?: MenuItemRiskNode[] }> = ({ items = DEFAULT_NODES }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<MenuItemRiskNode>(items[0]);
  const [hoveredNode, setHoveredNode] = useState<MenuItemRiskNode | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'STAR' | 'PLOWHORSE' | 'PUZZLE' | 'DOG'>('ALL');

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const nodesGroupRef = useRef<THREE.Group | null>(null);

  // Drag interaction
  const isDraggingRef = useRef(false);
  const prevPointerXRef = useRef(0);
  const prevPointerYRef = useRef(0);
  const targetAngleRef = useRef(0.8);
  const targetElevationRef = useRef(20);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 320;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera (Mobile-optimized FOV)
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 500);
    cameraRef.current = camera;
    camera.position.set(34, 22, 34);
    camera.lookAt(0, 8, 0);

    // 3. Renderer (Mobile battery & GPU optimized)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = false;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const dirLight = new THREE.DirectionalLight(0xfff5ea, 1.8);
    dirLight.position.set(15, 30, 20);
    scene.add(dirLight);

    // 5. Simplified Grid Plane (Warm Amber & Slate)
    const grid = new THREE.GridHelper(40, 16, 0xf59e0b, 0x334155);
    grid.position.y = 0;
    scene.add(grid);

    // Axis visual lines
    const axisGroup = new THREE.Group();
    // X axis (Volume)
    const xGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-20, 0, 0), new THREE.Vector3(20, 0, 0)]);
    axisGroup.add(new THREE.Line(xGeo, new THREE.LineBasicMaterial({ color: 0x10b981 })));
    // Y axis (Margin)
    const yGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 24, 0)]);
    axisGroup.add(new THREE.Line(yGeo, new THREE.LineBasicMaterial({ color: 0xf59e0b })));
    scene.add(axisGroup);

    // 6. 3D Nodes
    const nodesGroup = new THREE.Group();
    nodesGroupRef.current = nodesGroup;
    const nodeMeshes: THREE.Mesh[] = [];

    const categoryColors = {
      STAR: 0x10b981,      // Emerald Green
      PLOWHORSE: 0x3b82f6, // Ocean Blue
      PUZZLE: 0xa855f7,    // Royal Purple
      DOG: 0xf43f5e,       // Crimson Red
    };

    items.forEach((item) => {
      // Coordinate mapping
      const posX = ((item.volume - 50) / 50) * 16;
      const posY = (item.margin / 100) * 20 + 1.5;
      const posZ = ((item.risk - 50) / 50) * 16;

      const sphereMat = new THREE.MeshStandardMaterial({
        color: categoryColors[item.category],
        roughness: 0.25,
        metalness: 0.4,
      });

      const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.3, 18, 18), sphereMat);
      sphere.position.set(posX, posY, posZ);
      sphere.userData = item;
      nodesGroup.add(sphere);
      nodeMeshes.push(sphere);

      // Clean, light vertical stalk
      const stalkGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(posX, 0, posZ),
        new THREE.Vector3(posX, posY, posZ),
      ]);
      const stalkMat = new THREE.LineBasicMaterial({
        color: categoryColors[item.category],
        transparent: true,
        opacity: 0.35,
      });
      nodesGroup.add(new THREE.Line(stalkGeo, stalkMat));
    });

    scene.add(nodesGroup);

    // 7. Raycasting for Touch & Mouse Selection
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const pickNode = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);
      if (intersects.length > 0) {
        const item = intersects[0].object.userData as MenuItemRiskNode;
        setSelectedNode(item);
        return item;
      }
      return null;
    };

    // 8. Animation Loop
    let animId: number;
    let angle = 0.8;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (autoRotate && !isDraggingRef.current) {
        targetAngleRef.current += 0.005;
      }

      angle += (targetAngleRef.current - angle) * 0.1;
      const radius = 42;
      camera.position.x = Math.sin(angle) * radius;
      camera.position.z = Math.cos(angle) * radius;
      camera.position.y += (targetElevationRef.current - camera.position.y) * 0.1;
      camera.lookAt(0, 8, 0);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 320;
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
  }, [items, autoRotate]);

  // Handle Category Filter Highlight
  useEffect(() => {
    if (!nodesGroupRef.current) return;
    nodesGroupRef.current.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.userData?.category) {
        const item = child.userData as MenuItemRiskNode;
        const matches = categoryFilter === 'ALL' || item.category === categoryFilter;
        (child.material as THREE.MeshStandardMaterial).opacity = matches ? 1.0 : 0.2;
        (child.material as THREE.MeshStandardMaterial).transparent = !matches;
        child.scale.setScalar(matches ? (item.id === selectedNode.id ? 1.4 : 1.0) : 0.6);
      }
    });
  }, [categoryFilter, selectedNode]);

  // Pointer drag controls (Mouse & Touch)
  const handlePointerDown = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    prevPointerXRef.current = clientX;
    prevPointerYRef.current = clientY;
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const deltaX = clientX - prevPointerXRef.current;
    const deltaY = clientY - prevPointerYRef.current;

    targetAngleRef.current += deltaX * 0.008;
    targetElevationRef.current = Math.max(8, Math.min(38, targetElevationRef.current - deltaY * 0.12));

    prevPointerXRef.current = clientX;
    prevPointerYRef.current = clientY;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="w-full flex flex-col space-y-3">
      {/* 3D Canvas Box */}
      <div 
        className="w-full h-[260px] sm:h-[340px] relative rounded-3xl overflow-hidden bg-slate-950/90 border border-slate-800 shadow-2xl touch-none select-none"
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
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Top Controls Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 backdrop-blur-md text-[11px] font-bold text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>3D RiskLens Matrix</span>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-1.5 rounded-full border text-xs transition-colors cursor-pointer backdrop-blur-md ${
                autoRotate 
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                  : 'bg-slate-900/80 border-slate-700 text-slate-400'
              }`}
              title="Toggle Auto-Rotation"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Drag Hint */}
        <div className="absolute bottom-3 left-3 pointer-events-none">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/70 border border-slate-800 text-[10px] text-slate-400 font-mono">
            <Move className="w-3 h-3 text-amber-400" />
            <span>Drag to rotate</span>
          </div>
        </div>
      </div>

      {/* Category Filter Pills (Mobile Scrollable) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {[
          { key: 'ALL' as const, label: 'All Items', color: 'border-slate-700 text-slate-300' },
          { key: 'STAR' as const, label: 'Stars (High Profit)', color: 'border-emerald-500/50 text-emerald-400' },
          { key: 'PLOWHORSE' as const, label: 'Plowhorses (Volume)', color: 'border-blue-500/50 text-blue-400' },
          { key: 'PUZZLE' as const, label: 'Puzzles (Margin)', color: 'border-purple-500/50 text-purple-400' },
          { key: 'DOG' as const, label: 'Dogs (High Risk)', color: 'border-rose-500/50 text-rose-400' },
        ].map(cat => (
          <button
            key={cat.key}
            onClick={() => setCategoryFilter(cat.key)}
            className={`px-2.5 py-1 rounded-xl border text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
              categoryFilter === cat.key 
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-400' 
                : `bg-slate-900/60 hover:bg-slate-900 ${cat.color}`
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Selected Node Summary Card (Mobile friendly) */}
      {selectedNode && (
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{selectedNode.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                selectedNode.category === 'STAR' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                selectedNode.category === 'PLOWHORSE' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                selectedNode.category === 'PUZZLE' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {selectedNode.category}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 font-mono">
              <span>Price: <strong className="text-white">₹{selectedNode.price}</strong></span>
              <span>Margin: <strong className="text-emerald-400">{selectedNode.margin}%</strong></span>
              <span>Wastage Risk: <strong className="text-rose-400">{selectedNode.risk}%</strong></span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Plate Cost</span>
            <span className="text-sm font-bold text-amber-400">₹{selectedNode.cost}</span>
          </div>
        </div>
      )}
    </div>
  );
};
