
import React, { useState, useRef, useCallback } from 'react';
import { Activity, Layers } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ThreeStudio from './components/ThreeStudio';
import StickyNote from './components/StickyNote';
import CanvasAsset from './components/CanvasAsset';
import RationaleOverlay from './components/RationaleOverlay';
import { Asset, StickyNoteData, SceneObject, AssetCategory } from './types';

const App: React.FC = () => {
  // State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNoteData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLogic, setShowLogic] = useState(false);
  const [is3DMaximized, setIs3DMaximized] = useState(false);
  
  // 3D Studio Position State
  const [studioPos, setStudioPos] = useState({ x: window.innerWidth / 2 - 300, y: window.innerHeight / 2 - 225 });

  // 3D Scene State
  const [sceneObjects, setSceneObjects] = useState<SceneObject[]>([
    {
      id: 'default-cube',
      type: 'box',
      position: [0, 0.5, 0],
      rotation: [0, Math.PI / 4, 0],
      scale: [1, 1, 1],
      color: '#ffffff'
    }
  ]);
  const [selected3DId, setSelected3DId] = useState<string | null>(null);
  const [trackerPos, setTrackerPos] = useState<{x: number, y: number} | null>(null);

  // Refs for Line Connections
  const assetRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const windowRef = useRef<HTMLDivElement>(null);

  // Callbacks (Stable references for React.memo)
  const handleStudioMove = useCallback((x: number, y: number) => {
    setStudioPos({ x, y });
  }, []);

  const handleSetSceneObjects = useCallback((value: React.SetStateAction<SceneObject[]>) => {
    setSceneObjects(value);
  }, []);

  const handleSelect3D = useCallback((id: string | null) => {
    setSelected3DId(id);
  }, []);

  const handleTrackerUpdate = useCallback((pos: {x: number, y: number} | null) => {
    setTrackerPos(pos);
  }, []);

  const handleToggleMaximize = useCallback(() => {
    setIs3DMaximized(prev => !prev);
  }, []);

  // Asset Upload Logic
  const handleUpload = async (files: FileList) => {
    setIsProcessing(true);
    
    // Simulate AI Processing Delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newAssets: Asset[] = Array.from(files).map((file, i) => {
        const categories: AssetCategory[] = ['User Research', 'Style References', 'Sketches'];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        
        // Spawn randomly on left/right of center
        const startX = window.innerWidth / 2 + (Math.random() > 0.5 ? 400 : -600) + (Math.random() * 200);
        const startY = 100 + (Math.random() * 400);

        return {
          id: Math.random().toString(36).substr(2, 9),
          url: URL.createObjectURL(file),
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'text',
          category: randomCategory,
          timestamp: Date.now(),
          x: startX,
          y: startY
        };
    });

    setAssets(prev => [...newAssets, ...prev]);
    setIsProcessing(false);
  };

  // Canvas Interactions
  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    // Only spawn note if clicking strictly on the background
    // (We check if the target is the main container or the background layer)
    const target = e.target as HTMLElement;
    if (target.closest('.interactive-area') || target.tagName === 'BUTTON' || target.tagName === 'INPUT') return;
    
    const id = Date.now().toString();
    const newNote: StickyNoteData = {
      id,
      x: e.clientX,
      y: e.clientY,
      text: ''
    };
    setStickyNotes(prev => [...prev, newNote]);
  };

  const updateStickyNote = (id: string, updates: Partial<StickyNoteData>) => {
    setStickyNotes(prev => prev.map(note => note.id === id ? { ...note, ...updates } : note));
  };
  
  const updateAsset = (id: string, updates: Partial<Asset>) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteStickyNote = (id: string) => {
    setStickyNotes(prev => prev.filter(note => note.id !== id));
  };

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden bg-slate-50"
      onDoubleClick={handleCanvasDoubleClick}
    >
      {/* Infinite Canvas Background Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Top Navigation / Toolbar */}
      <nav className="absolute top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 flex items-center justify-between px-6 interactive-area select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-indigo-200 shadow-lg">T</div>
          <h1 className="font-semibold text-lg tracking-tight text-slate-800">Traceable</h1>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowLogic(!showLogic)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
              ${showLogic 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-600 ring-offset-2' 
                : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}
            `}
          >
            {showLogic ? <Activity size={16} className="animate-pulse" /> : <Layers size={16} />}
            {showLogic ? 'Logic Connected' : 'Show Rationale'}
          </button>
          
          <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
             <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500" />
          </div>
        </div>
      </nav>

      {/* 1. Sidebar (Fixed Left) */}
      <div className="interactive-area">
        <Sidebar 
          assets={assets} 
          onUpload={handleUpload} 
          isProcessing={isProcessing}
        />
      </div>

      {/* 2. Rationale Graph Overlay (SVG) */}
      {/* We pass the tracker position if logic is on and an object is selected */}
      <RationaleOverlay 
        isVisible={showLogic} 
        assets={assets} 
        assetRefs={assetRefs}
        windowRef={windowRef}
        sceneObjectsHash={JSON.stringify(sceneObjects)}
        targetPoint={selected3DId ? trackerPos : null}
      />

      {/* 3. Canvas Assets (Images/Docs) */}
      {assets.map(asset => (
        <div key={asset.id} className="interactive-area">
            <CanvasAsset 
                data={asset} 
                onUpdate={updateAsset}
                assetRef={(el) => {
                    if (el) assetRefs.current.set(asset.id, el);
                    else assetRefs.current.delete(asset.id);
                }}
            />
        </div>
      ))}

      {/* 4. Sticky Notes */}
      {stickyNotes.map(note => (
        <div key={note.id} className="interactive-area">
          <StickyNote 
            data={note} 
            onUpdate={updateStickyNote} 
            onDelete={deleteStickyNote} 
          />
        </div>
      ))}

      {/* 5. 3D Studio Window */}
      <div className="interactive-area">
        <ThreeStudio 
          windowRef={windowRef}
          isMaximized={is3DMaximized}
          onToggleMaximize={handleToggleMaximize}
          sceneObjects={sceneObjects}
          setSceneObjects={handleSetSceneObjects}
          selectedId={selected3DId}
          onSelect={handleSelect3D}
          onObjectLocationUpdate={handleTrackerUpdate}
          x={studioPos.x}
          y={studioPos.y}
          onMove={handleStudioMove}
        />
      </div>

    </div>
  );
};

export default App;
