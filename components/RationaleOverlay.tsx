
import React, { useEffect, useState } from 'react';
import { Asset } from '../types';

interface RationaleOverlayProps {
  isVisible: boolean;
  assets: Asset[];
  assetRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  windowRef: React.RefObject<HTMLDivElement>;
  sceneObjectsHash: string; 
  targetPoint: { x: number, y: number } | null; // New prop for specific tracking
}

const RationaleOverlay: React.FC<RationaleOverlayProps> = ({ 
  isVisible, 
  assets, 
  assetRefs, 
  windowRef,
  sceneObjectsHash,
  targetPoint
}) => {
  const [paths, setPaths] = useState<{ d: string; label: string; color: string }[]>([]);

  useEffect(() => {
    if (!isVisible || !windowRef.current) return;

    const calculatePaths = () => {
      const newPaths: { d: string; label: string; color: string }[] = [];
      const windowRect = windowRef.current?.getBoundingClientRect();

      if (!windowRect) return;

      // Determine Target Point (Window Center OR Specific Object Position)
      let tx: number, ty: number;

      if (targetPoint) {
          // targetPoint is relative to the internal Canvas.
          // Need to add Window absolute position.
          // Note: The tracker returns pixels relative to the canvas 0,0
          tx = windowRect.left + targetPoint.x;
          ty = windowRect.top + targetPoint.y;
      } else {
          // Default to center of window
          tx = windowRect.left + windowRect.width / 2;
          ty = windowRect.top + windowRect.height / 2;
      }

      assets.forEach((asset) => {
        const el = assetRefs.current.get(asset.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          
          // Source point: Center of the Asset Card on Canvas
          const sourceX = rect.left + rect.width / 2;
          const sourceY = rect.top + rect.height / 2;

          // Only draw lines if they are somewhat reasonable (not crazy cross screen if redundant)
          // Bezier Control Points
          const dx = tx - sourceX;
          const dy = ty - sourceY;
          
          const cp1x = sourceX + dx * 0.5;
          const cp1y = sourceY; // Horizontal ease out
          
          const cp2x = tx - dx * 0.5;
          const cp2y = ty;      // Horizontal ease in

          const d = `M ${sourceX} ${sourceY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tx} ${ty}`;
          
          // Deterministic color based on category
          let color = '#94a3b8'; // default slate
          if (asset.category === 'User Research') color = '#34d399'; // emerald
          if (asset.category === 'Style References') color = '#818cf8'; // indigo
          if (asset.category === 'Sketches') color = '#fbbf24'; // amber

          newPaths.push({
            d,
            label: `Influence: ${asset.name}`,
            color
          });
        }
      });
      setPaths(newPaths);
    };

    // Calculate immediately and on frame
    let animationFrameId: number;
    const animate = () => {
      calculatePaths();
      animationFrameId = requestAnimationFrame(animate);
    };
    
    if (isVisible) {
      animate();
    }

    return () => cancelAnimationFrame(animationFrameId);

  }, [isVisible, assets, sceneObjectsHash, assetRefs, windowRef, targetPoint]);

  if (!isVisible) return null;

  return (
    <svg className="fixed inset-0 pointer-events-none z-20 w-full h-full overflow-visible">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {paths.map((path, i) => (
        <g key={i} className="group transition-all duration-300">
          <path 
            d={path.d} 
            stroke={path.color} 
            strokeWidth="2" 
            fill="none" 
            strokeDasharray="8 4"
            className="opacity-40"
            markerEnd="url(#arrowhead)"
            filter="url(#glow)"
          />
          <circle cx={path.d.split(' ')[1]} cy={path.d.split(' ')[2]} r="3" fill={path.color} />
        </g>
      ))}
    </svg>
  );
};

export default RationaleOverlay;
