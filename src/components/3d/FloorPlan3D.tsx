import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, Sparkles, Utensils, Users, ArrowUpRight } from 'lucide-react';
import { Table } from '../../types/index.ts';

interface FloorPlan3DProps {
  tables: Table[];
  onSelectTable?: (table: Table) => void;
  onOpenPOS?: (table: Table) => void;
}

export const FloorPlan3D: React.FC<FloorPlan3DProps> = ({
  tables,
  onSelectTable,
  onOpenPOS,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredTable, setHoveredTable] = useState<Table | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [viewPreset, setViewPreset] = useState<'ISOMETRIC' | 'TOP_DOWN' | 'PERSPECTIVE'>('ISOMETRIC');
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 460;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(28, 32, 38);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(15, 30, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Warm ceiling spot lights
    const spotLight = new THREE.SpotLight(0xf59e0b, 1.2, 50, Math.PI / 4, 0.3);
    spotLight.position.set(0, 20, 0);
    scene.add(spotLight);

    // 5. Restaurant Floor Surface
    const floorGeo = new THREE.PlaneGeometry(50, 40);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.6,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.05;
    floor.receiveShadow = true;
    scene.add(floor);

    // 3D Grid Overlay on Floor
    const gridHelper = new THREE.GridHelper(50, 25, 0x334155, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Subtle Boundary Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
    });
    // Back wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(50, 4, 1), wallMat);
    backWall.position.set(0, 2, -20);
    scene.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 40), wallMat);
    leftWall.position.set(-25, 2, 0);
    scene.add(leftWall);

    // 6. Build 3D Tables with Chairs & Glowing Status Rings
    const tableMeshes: THREE.Mesh[] = [];
    const tablesGroup = new THREE.Group();

    const statusColors = {
      FREE: 0x10b981, // Emerald
      OCCUPIED: 0xf59e0b, // Amber
      BILLING: 0xa855f7, // Purple
      RESERVED: 0x3b82f6, // Blue
    };

    // Calculate grid placement for tables if not coordinate-mapped
    const cols = 4;
    const spacingX = 9;
    const spacingZ = 8;
    const startX = -((Math.min(tables.length, cols) - 1) * spacingX) / 2;
    const startZ = -10;

    tables.forEach((tbl, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const posX = startX + col * spacingX;
      const posZ = startZ + row * spacingZ;

      const colorHex = statusColors[tbl.status] || 0x10b981;
      const isRound = tbl.capacity <= 4;

      // Table Group
      const singleTableGroup = new THREE.Group();
      singleTableGroup.position.set(posX, 0, posZ);

      // A. Table Top
      let topMesh: THREE.Mesh;
      if (isRound) {
        const topGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.4, 24);
        const topMat = new THREE.MeshStandardMaterial({
          color: 0x334155,
          roughness: 0.3,
          metalness: 0.4,
        });
        topMesh = new THREE.Mesh(topGeo, topMat);
      } else {
        const topGeo = new THREE.BoxGeometry(4.2, 0.4, 3);
        const topMat = new THREE.MeshStandardMaterial({
          color: 0x334155,
          roughness: 0.3,
          metalness: 0.4,
        });
        topMesh = new THREE.Mesh(topGeo, topMat);
      }

      topMesh.position.y = 2.4;
      topMesh.castShadow = true;
      topMesh.receiveShadow = true;
      topMesh.userData = tbl;
      singleTableGroup.add(topMesh);
      tableMeshes.push(topMesh);

      // B. Center Stand / Leg
      const legGeo = new THREE.CylinderGeometry(0.3, 0.5, 2.4, 16);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.y = 1.2;
      singleTableGroup.add(leg);

      // Table Base Plate
      const baseGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.15, 16);
      const basePlate = new THREE.Mesh(baseGeo, legMat);
      basePlate.position.y = 0.08;
      singleTableGroup.add(basePlate);

      // C. 3D Glowing Status Ring on Floor
      const ringGeo = new THREE.RingGeometry(2.8, 3.2, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: tbl.status === 'OCCUPIED' || tbl.status === 'BILLING' ? 0.85 : 0.4,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.02;
      singleTableGroup.add(ring);

      // D. 3D Chairs surrounding table
      const chairCount = Math.min(tbl.capacity, 6);
      for (let c = 0; c < chairCount; c++) {
        const angle = (c / chairCount) * Math.PI * 2;
        const chairDist = isRound ? 3.0 : 2.6;
        const chairX = Math.cos(angle) * chairDist;
        const chairZ = Math.sin(angle) * chairDist;

        // Chair cushion
        const seatGeo = new THREE.BoxGeometry(1.0, 0.2, 1.0);
        const seatMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          roughness: 0.7,
        });
        const seat = new THREE.Mesh(seatGeo, seatMat);
        seat.position.set(chairX, 1.4, chairZ);

        // Chair back
        const backGeo = new THREE.BoxGeometry(1.0, 1.2, 0.15);
        const back = new THREE.Mesh(backGeo, seatMat);
        back.position.set(chairX * 1.15, 2.0, chairZ * 1.15);
        back.lookAt(0, 2.0, 0);

        singleTableGroup.add(seat);
        singleTableGroup.add(back);
      }

      // E. Center Table Candle / Lamp glow
      const lampGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.5, 12);
      const lampMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.6,
      });
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.y = 2.85;
      singleTableGroup.add(lamp);

      tablesGroup.add(singleTableGroup);
    });

    scene.add(tablesGroup);

    // 7. Raycasting for Mouse Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(tableMeshes);

      if (intersects.length > 0) {
        const table = intersects[0].object.userData as Table;
        setHoveredTable(table);
        document.body.style.cursor = 'pointer';
      } else {
        setHoveredTable(null);
        document.body.style.cursor = 'default';
      }
    };

    const onClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(tableMeshes);

      if (intersects.length > 0) {
        const table = intersects[0].object.userData as Table;
        setSelectedTable(table);
        if (onSelectTable) onSelectTable(table);
      }
    };

    renderer.domElement.addEventListener('mousemove', onPointerMove);
    renderer.domElement.addEventListener('click', onClick);

    // 8. Animation loop
    let animationId: number;
    let angle = 0.8;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (autoRotate) {
        angle += 0.004;
        const radius = 48;
        camera.position.x = Math.sin(angle) * radius;
        camera.position.z = Math.cos(angle) * radius;
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', onPointerMove);
      renderer.domElement.removeEventListener('click', onClick);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      document.body.style.cursor = 'default';
    };
  }, [tables, autoRotate]);

  const setCameraPreset = (preset: 'ISOMETRIC' | 'TOP_DOWN' | 'PERSPECTIVE') => {
    setViewPreset(preset);
    setAutoRotate(false);
    if (!cameraRef.current) return;

    if (preset === 'ISOMETRIC') {
      cameraRef.current.position.set(28, 32, 38);
      cameraRef.current.lookAt(0, 0, 0);
    } else if (preset === 'TOP_DOWN') {
      cameraRef.current.position.set(0, 50, 0.1);
      cameraRef.current.lookAt(0, 0, 0);
    } else if (preset === 'PERSPECTIVE') {
      cameraRef.current.position.set(0, 14, 32);
      cameraRef.current.lookAt(0, 2, 0);
    }
  };

  return (
    <div className="relative w-full rounded-3xl bg-stone-950 overflow-hidden border border-stone-800 shadow-sm">
      
      {/* 3D Viewport Controls & Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        
        {/* Title */}
        <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black text-white tracking-wider uppercase">
            3D Spatial Restaurant Floor Plan
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
            Live WebGL
          </span>
        </div>

        {/* Camera Preset Switches */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-700 backdrop-blur-md shadow-lg text-xs font-bold">
          <button
            onClick={() => setCameraPreset('ISOMETRIC')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              viewPreset === 'ISOMETRIC' && !autoRotate ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
            }`}
          >
            Isometric 45°
          </button>
          <button
            onClick={() => setCameraPreset('PERSPECTIVE')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              viewPreset === 'PERSPECTIVE' && !autoRotate ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
            }`}
          >
            Walkthrough
          </button>
          <button
            onClick={() => setCameraPreset('TOP_DOWN')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              viewPreset === 'TOP_DOWN' && !autoRotate ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
            }`}
          >
            Top-Down 2D
          </button>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${
              autoRotate ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
            title="Auto-Orbit Camera"
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* WebGL Canvas */}
      <div ref={containerRef} className="w-full h-[460px]" />

      {/* Status Legend (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none p-3 rounded-2xl bg-slate-950/90 border border-slate-800 backdrop-blur-md flex flex-wrap items-center gap-4 text-[10px] font-mono shadow-xl">
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-400 font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-1.5 text-purple-400 font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>Billing</span>
        </div>
        <div className="flex items-center gap-1.5 text-blue-400 font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Reserved</span>
        </div>
      </div>

      {/* Selected / Hovered Table HUD (Bottom Right) */}
      {(hoveredTable || selectedTable) && (
        <div className="absolute bottom-4 right-4 z-10 max-w-sm p-4 rounded-2xl bg-stone-900/95 border border-amber-500/40 shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-black flex items-center justify-center text-xs">
                {(hoveredTable || selectedTable)?.table_number}
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Table {(hoveredTable || selectedTable)?.table_number} · {(hoveredTable || selectedTable)?.area}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Capacity: {(hoveredTable || selectedTable)?.capacity} seats
                </span>
              </div>
            </div>

            <span
              className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full ${
                (hoveredTable || selectedTable)?.status === 'FREE'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : (hoveredTable || selectedTable)?.status === 'OCCUPIED'
                  ? 'bg-amber-500/20 text-amber-300'
                  : (hoveredTable || selectedTable)?.status === 'BILLING'
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'bg-blue-500/20 text-blue-300'
              }`}
            >
              {(hoveredTable || selectedTable)?.status}
            </span>
          </div>

          {((hoveredTable || selectedTable)?.guest_name || (hoveredTable || selectedTable)?.server_name) && (
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] space-y-1">
              {(hoveredTable || selectedTable)?.guest_name && (
                <div className="flex justify-between text-slate-300">
                  <span>Guest:</span>
                  <span className="font-bold text-amber-300">{(hoveredTable || selectedTable)?.guest_name}</span>
                </div>
              )}
              {(hoveredTable || selectedTable)?.server_name && (
                <div className="flex justify-between text-slate-300">
                  <span>Server:</span>
                  <span className="text-slate-200">{(hoveredTable || selectedTable)?.server_name}</span>
                </div>
              )}
            </div>
          )}

          {onOpenPOS && (
            <button
              onClick={() => {
                const target = selectedTable || hoveredTable;
                if (target) onOpenPOS(target);
              }}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <span>Open POS Order for Table {(hoveredTable || selectedTable)?.table_number}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

    </div>
  );
};
