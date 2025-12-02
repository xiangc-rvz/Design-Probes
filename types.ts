
export type AssetCategory = 'User Research' | 'Style References' | 'Sketches';

export interface Asset {
  id: string;
  url: string;
  name: string;
  type: 'image' | 'text';
  category: AssetCategory;
  timestamp: number;
  // Canvas positioning
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface StickyNoteData {
  id: string;
  x: number;
  y: number;
  text: string;
}

export type EditMode = 'translate' | 'rotate' | 'scale';

export type ShapeType = 'box' | 'cylinder' | 'sphere' | 'cone';

export interface SceneObject {
  id: string;
  type: ShapeType;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
}
