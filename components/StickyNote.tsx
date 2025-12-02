import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { StickyNoteData } from '../types';

interface StickyNoteProps {
  data: StickyNoteData;
  onUpdate: (id: string, updates: Partial<StickyNoteData>) => void;
  onDelete: (id: string) => void;
}

const StickyNote: React.FC<StickyNoteProps> = ({ data, onUpdate, onDelete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  const noteRef = useRef<HTMLDivElement>(null);

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
    if ((e.target as HTMLElement).tagName === 'TEXTAREA') return; // Allow text selection
    if ((e.target as HTMLElement).tagName === 'BUTTON') return; 
    
    setIsDragging(true);
    // Calculate offset from the top-left of the note
    const rect = noteRef.current?.getBoundingClientRect();
    if (rect) {
      offset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  return (
    <div
      ref={noteRef}
      className={`
        absolute w-48 min-h-[160px] bg-yellow-50 rounded-lg shadow-sm border border-yellow-200/50 
        transition-shadow flex flex-col z-20 hover:shadow-md hover:z-20
      `}
      style={{
        left: data.x,
        top: data.y,
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="h-6 w-full bg-yellow-100/50 rounded-t-lg flex items-center justify-end px-2 handle">
        <button 
          onClick={() => onDelete(data.id)}
          className="text-yellow-600/50 hover:text-red-500 transition-colors"
        >
          <X size={12} />
        </button>
      </div>
      <textarea
        className="flex-1 w-full p-3 bg-transparent resize-none outline-none text-sm text-slate-700 font-medium placeholder-yellow-300"
        placeholder="Type an idea..."
        value={data.text}
        onChange={(e) => onUpdate(data.id, { text: e.target.value })}
        onMouseDown={(e) => e.stopPropagation()} 
      />
    </div>
  );
};

export default StickyNote;