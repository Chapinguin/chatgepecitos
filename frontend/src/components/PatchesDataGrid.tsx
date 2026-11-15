import React, { useState, useEffect, useRef } from 'react';
import type { SatellitePatch, TargetBody } from '../types';
import {
  LayoutGrid,
  Table as TableIcon,
  Search,
  Maximize2,
  X,
  UploadCloud,
  Sparkles,
  Download,
  Crosshair,
  Layers
} from 'lucide-react';

interface PatchesDataGridProps {
  targetBody: TargetBody;
}

export const PatchesDataGrid: React.FC<PatchesDataGridProps> = ({ targetBody }) => {
  const [patches, setPatches] = useState<SatellitePatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filterSource, setFilterSource] = useState<'all' | 'target' | 'tierra' | 'marte' | 'luna'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatch, setSelectedPatch] = useState<SatellitePatch | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load patches from satellite_patches.json
  useEffect(() => {
    async function loadPatches() {
      try {
        const response = await fetch('/data/satellite_patches.json');
        if (response.ok) {
          const data = await response.json();
          setPatches(data);
        }
      } catch (err) {
        console.warn('Could not load /data/satellite_patches.json, using fallback', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPatches();
  }, []);

  // Handle local PNG uploads from backend/local team
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newPatches: SatellitePatch[] = [];

    Array.from(e.target.files).forEach((file, index) => {
      const url = URL.createObjectURL(file);
      const isMars = file.name.toLowerCase().includes('marte') || file.name.toLowerCase().includes('mars');
      const isMoon = file.name.toLowerCase().includes('luna') || file.name.toLowerCase().includes('moon');
      const isTierra = file.name.toLowerCase().includes('tierra') || file.name.toLowerCase().includes('earth');

      const source = isTierra ? 'tierra' : isMars ? 'marte' : isMoon ? 'luna' : 'custom';
      const target: 'Earth' | 'Mars' | 'Moon' | 'Both' = isTierra ? 'Earth' : isMars ? 'Mars' : isMoon ? 'Moon' : 'Both';

      newPatches.push({
        id: `upload_${Date.now()}_${index}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        source,
        targetBody: target,
        imageUrl: url,
        thumbnailUrl: url,
        resolution: 'Local Crop (High Res)',
        coordinates: 'Local Satellite Patch',
        simMars: isMars ? 1.0 : isTierra ? 0.85 : 0.45,
        simMoon: isMoon ? 1.0 : isTierra ? 0.78 : 0.42,
        analogType: 'Backend Extracted Crop',
        status: 'Custom Upload',
        description: `Uploaded from local backend: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
      });
    });

    setPatches((prev) => [...newPatches, ...prev]);
  };

  // Filter patches
  const filteredPatches = patches.filter((p) => {
    // Source filter
    if (filterSource === 'target') {
      if (targetBody === 'Mars' && p.source !== 'marte' && p.source !== 'tierra') return false;
      if (targetBody === 'Moon' && p.source !== 'luna' && p.source !== 'tierra') return false;
    } else if (filterSource !== 'all' && p.source !== filterSource) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query) ||
        p.coordinates.toLowerCase().includes(query) ||
        p.analogType.toLowerCase().includes(query)
      );
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Source Filter Buttons */}
          <button
            onClick={() => setFilterSource('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filterSource === 'all'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            All Patches ({patches.length})
          </button>
          <button
            onClick={() => setFilterSource('target')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              filterSource === 'target'
                ? targetBody === 'Mars'
                  ? 'bg-orange-600 text-white font-semibold shadow-sm'
                  : 'bg-cyan-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Earth with {targetBody}</span>
          </button>
          <button
            onClick={() => setFilterSource('tierra')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filterSource === 'tierra'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Earth (Jemez NM)
          </button>
          <button
            onClick={() => setFilterSource('marte')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filterSource === 'marte'
                ? 'bg-orange-600/30 text-orange-300 border border-orange-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mars (HiRISE)
          </button>
          <button
            onClick={() => setFilterSource('luna')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filterSource === 'luna'
                ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Moon (LRO NAC)
          </button>
        </div>

        {/* View Mode & Upload Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Upload Local PNG button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-800/80 hover:bg-cyan-900/60 transition cursor-pointer"
            title="Import backend PNG patches directly into the grid"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Add PNG Patches</span>
          </button>

          {/* Grid vs Table View Mode */}
          <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'table' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Dense DataGrid View"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
        <input
          type="text"
          placeholder="Filter patches by name, ID, coordinates or analog type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-xs font-mono animate-pulse">
          Loading satellite patch manifest...
        </div>
      ) : filteredPatches.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
          No satellite patches match the selected filter or search query.
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatches.map((patch) => {
            const activeSim = targetBody === 'Mars' ? patch.simMars : patch.simMoon;

            return (
              <div
                key={patch.id}
                onClick={() => setSelectedPatch(patch)}
                className="group bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer flex flex-col"
              >
                {/* Image Header Container */}
                <div className="relative aspect-video w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                  <img
                    src={patch.imageUrl}
                    alt={patch.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Fallback to high-tech satellite preview if image file isn't uploaded yet
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225"><rect width="400" height="225" fill="%230b1120"/><circle cx="200" cy="112" r="70" fill="none" stroke="%2338bdf8" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.4"/><circle cx="200" cy="112" r="30" fill="none" stroke="%2338bdf8" stroke-width="1" opacity="0.6"/><path d="M100 112 H300 M200 40 V185" stroke="%2338bdf8" stroke-width="0.8" opacity="0.3"/><text x="200" y="116" font-family="monospace" font-size="11" fill="%2338bdf8" text-anchor="middle" font-weight="bold">${patch.source.toUpperCase()} PATCH</text><text x="200" y="136" font-family="monospace" font-size="9" fill="%2394a3b8" text-anchor="middle">${patch.id}</text></svg>`;
                    }}
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${
                        patch.source === 'tierra'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                          : patch.source === 'marte'
                          ? 'bg-orange-950/80 text-orange-300 border border-orange-500/40'
                          : patch.source === 'luna'
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-800/80 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {patch.source}
                    </span>

                    <span className="text-[10px] font-mono bg-slate-900/90 text-slate-300 px-2 py-0.5 rounded-md border border-slate-800 backdrop-blur-md">
                      {patch.resolution}
                    </span>
                  </div>

                  {/* Hover Inspect Icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-semibold shadow-lg">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Inspect Patch</span>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition leading-snug line-clamp-1">
                        {patch.name}
                      </h4>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-1">
                      <Crosshair className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{patch.coordinates}</span>
                    </div>
                  </div>

                  {/* Bhattacharyya Similarity Breakdown */}
                  <div className="space-y-1.5 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 text-xs font-mono">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Match with {targetBody}:</span>
                      <span
                        className={`font-bold ${
                          activeSim >= 0.8
                            ? 'text-emerald-400'
                            : activeSim >= 0.6
                            ? 'text-cyan-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {(activeSim * 100).toFixed(1)}% ({activeSim.toFixed(3)})
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          targetBody === 'Mars'
                            ? 'bg-gradient-to-r from-orange-500 to-amber-400'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, activeSim * 100))}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                      <span>BC(Luna): {patch.simMoon.toFixed(3)}</span>
                      <span>BC(Marte): {patch.simMars.toFixed(3)}</span>
                    </div>
                  </div>

                  {/* Analog Factor Tag */}
                  <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/60">
                    <span className="truncate max-w-[180px]">{patch.analogType}</span>
                    <span className="font-mono text-cyan-400/90 text-[10px] font-semibold">{patch.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE / DATAGRID VIEW */
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Patch Preview</th>
                <th className="py-3 px-3">Patch ID / Name</th>
                <th className="py-3 px-3">Source</th>
                <th className="py-3 px-3">Coordinates (GSD)</th>
                <th className="py-3 px-3 text-right">BC (Luna)</th>
                <th className="py-3 px-3 text-right">BC (Marte)</th>
                <th className="py-3 px-3">Analog Factor</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredPatches.map((patch) => (
                <tr
                  key={patch.id}
                  onClick={() => setSelectedPatch(patch)}
                  className="hover:bg-slate-800/40 transition cursor-pointer"
                >
                  <td className="py-2.5 px-3 w-16">
                    <div className="w-12 h-9 rounded-md bg-slate-900 overflow-hidden border border-slate-800">
                      <img
                        src={patch.imageUrl}
                        alt={patch.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="36" viewBox="0 0 48 36"><rect width="48" height="36" fill="%230b1120"/><circle cx="24" cy="18" r="8" fill="none" stroke="%2338bdf8" stroke-width="1"/></svg>`;
                        }}
                      />
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-white line-clamp-1">{patch.name}</div>
                    <div className="text-[10px] text-slate-500">{patch.id}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        patch.source === 'tierra'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : patch.source === 'marte'
                          ? 'bg-orange-950 text-orange-400 border border-orange-800/60'
                          : 'bg-cyan-950 text-cyan-400 border border-cyan-800/60'
                      }`}
                    >
                      {patch.source}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="text-[11px]">{patch.coordinates}</div>
                    <div className="text-[10px] text-slate-500">{patch.resolution}</div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-cyan-400">
                    {patch.simMoon.toFixed(3)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-orange-400">
                    {patch.simMars.toFixed(3)}
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-400 max-w-xs truncate">
                    {patch.analogType}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPatch(patch);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-white transition text-slate-400 cursor-pointer"
                      title="Inspect HD Patch"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* LIGHTBOX / HD INSPECTION MODAL */}
      {selectedPatch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedPatch(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full uppercase ${
                    selectedPatch.source === 'tierra'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                      : selectedPatch.source === 'marte'
                      ? 'bg-orange-950 text-orange-300 border border-orange-700/60'
                      : 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                  }`}
                >
                  {selectedPatch.source}
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">{selectedPatch.name}</h3>
                  <p className="text-xs font-mono text-slate-400">{selectedPatch.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatch(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-5 space-y-4">
              {/* Image Preview Container */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center max-h-[50vh]">
                <img
                  src={selectedPatch.imageUrl}
                  alt={selectedPatch.name}
                  className="w-full h-auto max-h-[50vh] object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340"><rect width="600" height="340" fill="%230b1120"/><circle cx="300" cy="170" r="100" fill="none" stroke="%2338bdf8" stroke-width="2" stroke-dasharray="6 6" opacity="0.4"/><text x="300" y="176" font-family="monospace" font-size="14" fill="%2338bdf8" text-anchor="middle" font-weight="bold">${selectedPatch.source.toUpperCase()} HD SATELLITE CROP</text><text x="300" y="202" font-family="monospace" font-size="11" fill="%2394a3b8" text-anchor="middle">${selectedPatch.id}</text></svg>`;
                  }}
                />
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] uppercase">GSD Resolution</div>
                  <div className="text-white font-bold mt-0.5">{selectedPatch.resolution}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] uppercase">Coordinates</div>
                  <div className="text-white font-bold mt-0.5 truncate">{selectedPatch.coordinates}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] uppercase">BC Similarity (Mars)</div>
                  <div className="text-orange-400 font-bold mt-0.5">
                    {(selectedPatch.simMars * 100).toFixed(1)}% ({selectedPatch.simMars.toFixed(3)})
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] uppercase">BC Similarity (Moon)</div>
                  <div className="text-cyan-400 font-bold mt-0.5">
                    {(selectedPatch.simMoon * 100).toFixed(1)}% ({selectedPatch.simMoon.toFixed(3)})
                  </div>
                </div>
              </div>

              {/* Description & Scientific Context */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                  <Layers className="w-4 h-4" />
                  <span>Geological & Morphological Characterization</span>
                </div>
                <p className="leading-relaxed">
                  {selectedPatch.description || 'Processed satellite patch demonstrating micro-texture and spectral distribution.'}
                </p>
                {selectedPatch.bboxPx && (
                  <div className="pt-2 text-[11px] font-mono text-slate-400 border-t border-slate-800/60 flex flex-wrap gap-4">
                    <span>Bounding Box Px: [{selectedPatch.bboxPx.join(', ')}]</span>
                    {selectedPatch.refMars && <span>Ref Mars: {selectedPatch.refMars}</span>}
                    {selectedPatch.refMoon && <span>Ref Moon: {selectedPatch.refMoon}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                NASA Space Apps Challenge • Terrestrial Analog Extractor
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={selectedPatch.imageUrl}
                  download={`${selectedPatch.id}.png`}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save Crop (.PNG)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
