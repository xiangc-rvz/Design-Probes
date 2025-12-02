
import React, { useState } from 'react';
import { Upload, FileImage, FileText, Sparkles, Loader2, Layers, Search } from 'lucide-react';
import { Asset, AssetCategory } from '../types';

interface SidebarProps {
  assets: Asset[];
  onUpload: (files: FileList) => Promise<void>;
  isProcessing: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ assets, onUpload, isProcessing }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const categories: AssetCategory[] = ['User Research', 'Style References', 'Sketches'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  };

  return (
    <div className="absolute left-6 top-6 bottom-6 w-72 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 flex flex-col overflow-hidden z-40 transition-all duration-300">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <Layers size={18} className="text-indigo-600" />
          <h2 className="font-bold text-slate-800 tracking-tight">Library</h2>
        </div>
        <p className="text-xs text-slate-500">Project Assets & Uploads</p>
      </div>

      {/* Upload Area */}
      <div className="p-4 bg-slate-50/50">
        <label 
          className={`
            relative group flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed transition-all cursor-pointer bg-white
            ${isDragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}
          `}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files) onUpload(e.dataTransfer.files);
          }}
        >
          <div className="flex flex-col items-center justify-center pt-2 pb-3 text-center">
            {isProcessing ? (
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mb-2" />
            ) : (
              <div className="w-8 h-8 mb-2 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                <Upload size={16} />
              </div>
            )}
            <p className="text-xs font-semibold text-slate-600">
              {isProcessing ? 'AI Sorting...' : 'Upload'}
            </p>
          </div>
          <input type="file" className="hidden" multiple onChange={handleFileChange} disabled={isProcessing} />
        </label>
      </div>

      {/* Asset List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-6">
        {categories.map((cat) => {
          const categoryAssets = assets.filter(a => a.category === cat);
          if (categoryAssets.length === 0) return null;

          return (
            <div key={cat} className="animate-in slide-in-from-left-4 fade-in duration-500 px-2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                {cat}
                <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{categoryAssets.length}</span>
              </h3>
              <div className="space-y-1">
                {categoryAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="group flex items-center p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer"
                    title="View on Canvas"
                  >
                    <div className="w-8 h-8 rounded bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-400 border border-slate-200">
                      {asset.type === 'image' ? (
                        <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                      ) : (
                        <FileText size={14} />
                      )}
                    </div>
                    <div className="ml-2 flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
                        {asset.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        
        {assets.length === 0 && !isProcessing && (
          <div className="flex flex-col items-center justify-center h-40 text-center opacity-50">
             <Search className="w-8 h-8 text-slate-300 mb-2" />
             <p className="text-xs text-slate-400">Drag files to start.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
