
import React, { useState, useRef, useEffect } from 'react';
import { FileText, GripHorizontal } from 'lucide-react';
import { Asset } from '../types';

interface CanvasAssetProps {
  data: Asset;
  onUpdate: (id: string, updates: Partial<Asset>) => void;
  // Ref for the Rationale Overlay to connect to
  assetRef: (el: HTMLDivElement | null) => void;
}

const CanvasAsset: React.FC<CanvasAssetProps> = ({ data, onUpdate, assetRef }) => {
  const [isDragging, setIsDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      onUpdate(data.id, {
        x: e.clientX - offset.current.x,
        y: e.clientY - offset.current.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, data.id, onUpdate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    
    setIsDragging(true);
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    offset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  return (
    <div
      ref={assetRef}
      className={`
        absolute flex flex-col bg-white rounded-lg shadow-sm border border-slate-200 
        transition-all hover:shadow-lg hover:border-indigo-300 group z-10
      `}
      style={{
        left: data.x,
        top: data.y,
        width: 240, // Fixed width for uniformity
        cursor: isDragging ? 'grabbing' : 'default',
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Drag Handle & Header */}
      <div 
        className="h-8 w-full bg-slate-50 border-b border-slate-100 rounded-t-lg flex items-center justify-between px-3 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 overflow-hidden">
           <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider truncate max-w-[120px]">
             {data.category}
           </span>
        </div>
        <GripHorizontal size={14} className="text-slate-300" />
      </div>

      {/* Content */}
      <div className="p-3 bg-white rounded-b-lg">
        {data.type === 'image' ? (
          <div className="rounded overflow-hidden border border-slate-100">
            <img 
              src={data.url} 
              alt={data.name} 
              className="w-full h-auto object-cover max-h-64 pointer-events-none" 
            />
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded border border-slate-100 text-slate-600 text-sm font-mono flex items-center gap-3">
            <FileText size={24} className="text-slate-400" />
            <span className="truncate">{data.name}</span>
          </div>
        )}
        <div className="mt-2 text-xs text-slate-500 font-medium truncate">
            {data.name}
        </div>
      </div>

      {/* Connection Node Point (Visual only, used by overlay logic implicitly via bounding box) */}
      <div className="absolute -right-1 top-1/2 w-2 h-2 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

export default CanvasAsset;
