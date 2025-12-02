
import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Grid, Environment, ContactShadows, TransformControls, OrbitControls, useCursor } from '@react-three/drei';
import { Maximize2, Minimize2, Move, Rotate3D, Scaling, Box, Trash2, Plus, Circle, Cylinder, Triangle, GripHorizontal } from 'lucide-react';
import * as THREE from 'three';
import { SceneObject, EditMode, ShapeType } from '../types';

interface ThreeStudioProps {
  isMaximized: boolean;
  onToggleMaximize: () => void;
  sceneObjects: SceneObject[];
  setSceneObjects: React.Dispatch<React.SetStateAction<SceneObject[]>>;
  windowRef: React.RefObject<HTMLDivElement>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onObjectLocationUpdate: (screenPos: { x: number; y: number } | null) => void;
  x: number;
  y: number;
  onMove: (x: number, y: number) => void;
}

// Helper to track the 2D screen position of the selected 3D object
const ObjectTracker: React.FC<{
  selectedId: string | null;
  onUpdate: (pos: { x: number; y: number } | null) => void;
  sceneRef: React.MutableRefObject<THREE.Group | null>;
}> = ({ selectedId, onUpdate, sceneRef }) => {
  const { camera, size } = useThree();
  const vec = new THREE.Vector3();

  useFrame(() => {
    if (!selectedId || !sceneRef.current) {
      return; 
    }

    const obj = sceneRef.current.getObjectByName(selectedId);
    if (obj) {
      obj.getWorldPosition(vec);
      vec.project(camera);
      const x = (vec.x * 0.5 + 0.5) * size.width;
      const y = (-(vec.y * 0.5) + 0.5) * size.height;
      onUpdate({ x, y });
    }
  });

  return null;
};

// Interactive Object Wrapper
const SceneItem: React.FC<{
  obj: SceneObject;
  isSelected: boolean;
  onSelect: (id: string) => void;
}> = ({ obj, isSelected, onSelect }) => {
  const [hovered, setHover] = useState(false);
  useCursor(hovered);

  const material = (
    <meshStandardMaterial 
      color={isSelected ? '#818cf8' : (hovered ? '#cbd5e1' : obj.color)} 
      roughness={0.2} 
      metalness={0.1}
      emissive={isSelected ? '#4f46e5' : '#000000'}
      emissiveIntensity={isSelected ? 0.3 : 0}
    />
  );

  return (
    <mesh 
      name={obj.id}
      position={obj.position}
      rotation={obj.rotation}
      scale={obj.scale}
      onClick={(e) => { e.stopPropagation(); onSelect(obj.id); }}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
      castShadow 
      receiveShadow
    >
      {obj.type === 'box' && <boxGeometry args={[1, 1, 1]} />}
      {obj.type === 'cylinder' && <cylinderGeometry args={[0.5, 0.5, 1, 32]} />}
      {obj.type === 'sphere' && <sphereGeometry args={[0.6, 32, 32]} />}
      {obj.type === 'cone' && <coneGeometry args={[0.5, 1, 32]} />}
      {material}
    </mesh>
  );
};

// Controls Wrapper to handle Interaction Logic
const EditorControls: React.FC<{
  selectedId: string | null;
  mode: EditMode;
  setSceneObjects: React.Dispatch<React.SetStateAction<SceneObject[]>>;
  sceneRef: React.MutableRefObject<THREE.Group | null>;
}> = ({ selectedId, mode, setSceneObjects, sceneRef }) => {
  const [orbitEnabled, setOrbitEnabled] = useState(true);
  
  // We use object={undefined} when selectedId is null to effectively detach controls
  const selectedObject = (selectedId && sceneRef.current) 
    ? sceneRef.current.getObjectByName(selectedId) 
    : undefined;

  return (
    <>
      <OrbitControls makeDefault enabled={orbitEnabled} />
      {selectedObject && (
        <TransformControls
          object={selectedObject}
          mode={mode}
          onMouseDown={() => setOrbitEnabled(false)}
          onMouseUp={() => {
            setOrbitEnabled(true);
            // Sync the manual transform back to React state
            const obj = selectedObject;
            if (obj) {
              setSceneObjects(prev => prev.map(item => {
                if (item.id === selectedId) {
                  return {
                    ...item,
                    position: [obj.position.x, obj.position.y, obj.position.z],
                    rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
                    scale: [obj.scale.x, obj.scale.y, obj.scale.z]
                  };
                }
                return item;
              }));
            }
          }}
        />
      )}
    </>
  );
};

const ThreeStudio: React.FC<ThreeStudioProps> = React.memo(({
  isMaximized,
  onToggleMaximize,
  sceneObjects,
  setSceneObjects,
  windowRef,
  selectedId,
  onSelect,
  onObjectLocationUpdate,
  x,
  y,
  onMove
}) => {
  const [mode, setMode] = useState<EditMode>('translate');
  const sceneRef = useRef<THREE.Group>(null);

  const addShape = (type: ShapeType) => {
    const newObj: SceneObject = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      position: [0, 0.5, 0], // Spawn at center
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#ffffff'
    };
    setSceneObjects(prev => [...prev, newObj]);
    onSelect(newObj.id);
  };

  const deleteSelected = () => {
    if (selectedId) {
      setSceneObjects(prev => prev.filter(o => o.id !== selectedId));
      onSelect(null);
      onObjectLocationUpdate(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return; // Don't drag if fullscreen
    // Prevent dragging if clicking a button/control in the header
    if ((e.target as HTMLElement).closest('button')) return;
    
    e.preventDefault();
    const startX = e.clientX - x;
    const startY = e.clientY - y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      onMove(moveEvent.clientX - startX, moveEvent.clientY - startY);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div 
      ref={windowRef}
      className={`
        fixed bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 z-30
        ${isMaximized ? 'inset-4' : ''}
      `}
      style={!isMaximized ? { 
        left: x, 
        top: y, 
        width: 600, 
        height: 450 
      } : { zIndex: 50 }}
    >
      {/* Window Header */}
      <div 
        className={`h-12 border-b border-slate-100 flex items-center justify-between px-4 bg-slate-50 select-none ${!isMaximized ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onMouseDown={handleMouseDown}
        onDoubleClick={onToggleMaximize}
      >
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <Box size={16} className="text-indigo-600" />
          <span className="text-sm">Massing Studio</span>
          {!isMaximized && <GripHorizontal size={14} className="text-slate-300 ml-2" />}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggleMaximize} className="p-1.5 hover:bg-slate-200 rounded text-slate-500">
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="h-10 border-b border-slate-100 flex items-center justify-between px-4 bg-white z-10">
        <div className="flex items-center gap-1">
          <button 
             onClick={() => setMode('translate')}
             className={`p-1.5 rounded ${mode === 'translate' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
             title="Move"
          >
            <Move size={16} />
          </button>
          <button 
             onClick={() => setMode('rotate')}
             className={`p-1.5 rounded ${mode === 'rotate' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
             title="Rotate"
          >
            <Rotate3D size={16} />
          </button>
          <button 
             onClick={() => setMode('scale')}
             className={`p-1.5 rounded ${mode === 'scale' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
             title="Scale"
          >
            <Scaling size={16} />
          </button>
          <div className="w-px h-4 bg-slate-200 mx-2" />
          <button onClick={deleteSelected} disabled={!selectedId} className="p-1.5 rounded text-red-400 hover:bg-red-50 disabled:opacity-30">
            <Trash2 size={16} />
          </button>
        </div>

        <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">Add</span>
            <button onClick={() => addShape('box')} className="p-1.5 rounded hover:bg-slate-100 text-slate-600" title="Box">
                <Box size={16} />
            </button>
            <button onClick={() => addShape('sphere')} className="p-1.5 rounded hover:bg-slate-100 text-slate-600" title="Sphere">
                <Circle size={16} />
            </button>
            <button onClick={() => addShape('cylinder')} className="p-1.5 rounded hover:bg-slate-100 text-slate-600" title="Cylinder">
                <Cylinder size={16} />
            </button>
            <button onClick={() => addShape('cone')} className="p-1.5 rounded hover:bg-slate-100 text-slate-600" title="Cone">
                <Triangle size={16} />
            </button>
        </div>
      </div>

      {/* 3D Scene */}
      <div className="flex-1 bg-slate-100 relative">
        <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
          <Suspense fallback={null}>
            <Environment preset="city" />
            <ambientLight intensity={0.5} />
            <directionalLight 
              position={[10, 10, 5]} 
              intensity={1} 
              castShadow 
              shadow-mapSize={[1024, 1024]} 
            />
            
            <group ref={sceneRef}>
              {sceneObjects.map((obj) => (
                <SceneItem 
                  key={obj.id} 
                  obj={obj} 
                  isSelected={selectedId === obj.id} 
                  onSelect={onSelect} 
                />
              ))}
            </group>

            <Grid 
              position={[0, -0.01, 0]} 
              args={[10, 10]} 
              cellSize={1} 
              cellThickness={0.5} 
              sectionSize={5} 
              sectionThickness={1}
              fadeDistance={20} 
              sectionColor="#cbd5e1" 
              cellColor="#e2e8f0" 
            />
            <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
            
            <EditorControls 
                selectedId={selectedId} 
                mode={mode} 
                setSceneObjects={setSceneObjects} 
                sceneRef={sceneRef}
            />

            <ObjectTracker 
              selectedId={selectedId} 
              onUpdate={onObjectLocationUpdate} 
              sceneRef={sceneRef} 
            />
          </Suspense>
        </Canvas>
        
        {/* Help Text */}
        <div className="absolute bottom-3 left-3 px-2 py-1 bg-white/80 rounded backdrop-blur text-[10px] text-slate-500 pointer-events-none">
          {selectedId ? 'Drag handles to edit • Click background to deselect' : 'Double click header to maximize • Select an object to edit'}
        </div>
      </div>
    </div>
  );
});

export default ThreeStudio;
