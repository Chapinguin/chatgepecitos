import React, { useState, useRef } from 'react';
import type { VariableResult, PlanetaryAnalogSite, TargetBody } from '../types';
import {
  Search,
  Download,
  MapPin,
  Sparkles,
  SlidersHorizontal,
  Image as ImageIcon,
  Maximize2,
  X,
  UploadCloud,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import { PatchesDataGrid } from './PatchesDataGrid';

interface VariablesTableProps {
  variables: VariableResult[];
  analogSites: PlanetaryAnalogSite[];
  targetBody: TargetBody;
  filename: string;
}

export const VariablesTable: React.FC<VariablesTableProps> = ({
  variables,
  analogSites,
  targetBody,
  filename: _filename,
}) => {
  const [activeTab, setActiveTab] = useState<'sites' | 'variables' | 'patches'>('sites');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSiteModal, setSelectedSiteModal] = useState<PlanetaryAnalogSite | null>(null);
  const [activeModalView, setActiveModalView] = useState<'both' | 'earth' | 'target'>('both');
  const [customSiteImages, setCustomSiteImages] = useState<Record<string, { earth?: string; target?: string }>>({});
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetSite, setUploadTargetSite] = useState<{ id: string; type: 'earth' | 'target' } | null>(null);

  const categories = ['all', ...Array.from(new Set(variables.map((v) => v.category)))];

  const filteredVariables = variables.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || v.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const filteredSites = analogSites.filter((s) => {
    return (
      s.earthLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.targetLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.earthCountry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.keyAnalogFactor.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleSiteImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !uploadTargetSite) return;
    const file = e.target.files[0];
    const url = URL.createObjectURL(file);
    setCustomSiteImages((prev) => ({
      ...prev,
      [uploadTargetSite.id]: {
        ...prev[uploadTargetSite.id],
        [uploadTargetSite.type]: url,
      },
    }));
    setUploadTargetSite(null);
  };

  const getSiteImage = (site: PlanetaryAnalogSite, type: 'earth' | 'target') => {
    if (customSiteImages[site.id]?.[type]) {
      return customSiteImages[site.id][type]!;
    }
    return type === 'earth' ? site.earthImageUrl : site.targetImageUrl;
  };

  const getSvgFallback = (label: string, body: 'earth' | 'mars' | 'moon', location: string) => {
    const color = body === 'earth' ? '%2310b981' : body === 'mars' ? '%23f97316' : '%2338bdf8';
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="110" viewBox="0 0 160 110"><rect width="160" height="110" fill="%230b1120"/><circle cx="80" cy="50" r="26" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5"/><circle cx="80" cy="50" r="12" fill="none" stroke="${color}" stroke-width="1" opacity="0.7"/><path d="M40 50 H120 M80 20 V80" stroke="${color}" stroke-width="0.8" opacity="0.3"/><text x="80" y="54" font-family="monospace" font-size="8" fill="${color}" text-anchor="middle" font-weight="bold">${label.toUpperCase()}</text><text x="80" y="98" font-family="monospace" font-size="7" fill="%2394a3b8" text-anchor="middle">${location.substring(0, 16)}</text></svg>`;
  };

  const exportCSV = () => {
    if (activeTab === 'sites') {
      const headers = ['ID', 'Earth Location', 'Country', 'Target Location', 'Target Body', 'Overall Match Score (%)', 'Mineral Match', 'Terrain Match', 'Key Analog Factor', 'Status'];
      const rows = filteredSites.map((s) => [
        `"${s.id}"`,
        `"${s.earthLocation}"`,
        `"${s.earthCountry}"`,
        `"${s.targetLocation}"`,
        `"${s.targetBody}"`,
        `"${s.overallMatchScore}"`,
        `"${s.mineralMatch}"`,
        `"${s.terrainMatch}"`,
        `"${s.keyAnalogFactor}"`,
        `"${s.status}"`,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      triggerDownload(csvContent, `analog_sites_earth_with_${targetBody.toLowerCase()}.csv`);
    } else {
      const headers = ['Variable', 'Key', 'Value', 'Unit', 'Category', 'Status', 'Description'];
      const rows = filteredVariables.map((v) => [
        `"${v.name}"`,
        `"${v.key}"`,
        `"${v.value}"`,
        `"${v.unit || ''}"`,
        `"${v.category}"`,
        `"${v.status}"`,
        `"${v.description || ''}"`,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      triggerDownload(csvContent, `variables_earth_with_${targetBody.toLowerCase()}.csv`);
    }
  };

  const triggerDownload = (content: string, downloadName: string) => {
    const encodedUri = encodeURI(content);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', downloadName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
      {/* Header and View Selector */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('sites')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'sites'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Analog Sites (Earth vs {targetBody})</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40">
                {filteredSites.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('variables')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'variables'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Extracted Variables ({filteredVariables.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('patches')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'patches'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Satellite Patches & Visual Crops</span>
            </button>
          </div>
        </div>

        {/* Filter and Download controls */}
        {activeTab !== 'patches' && (
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === 'sites' ? "Search Earth site, crater, country..." : "Search variable or mineral..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg focus:outline-none focus:border-cyan-500"
              />
            </div>

            {activeTab === 'variables' && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg py-1.5 px-2.5 focus:outline-none focus:border-cyan-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'All Categories' : c}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer shrink-0"
              title="Export filtered records to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* Hidden file input for uploading custom PNGs to specific sites */}
      <input
        type="file"
        ref={uploadInputRef}
        onChange={handleSiteImageUpload}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />

      {/* View 1: Analog Sites Table with Side-by-Side Earth & Target Satellite Crops */}
      {activeTab === 'sites' && (
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800 text-[10px]">
              <tr>
                <th className="py-3 px-4">Earth Analog Location & Patch</th>
                <th className="py-3 px-4">Country / Region</th>
                <th className="py-3 px-4">Target {targetBody} Location & Patch</th>
                <th className="py-3 px-4">Overall Match</th>
                <th className="py-3 px-4">Mineral Match</th>
                <th className="py-3 px-4">Terrain Match</th>
                <th className="py-3 px-4">Key Analog Factor</th>
                <th className="py-3 px-4">Fidelity Status</th>
                <th className="py-3 px-4 text-center">Visual Pair</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredSites.map((site) => {
                const earthImg = getSiteImage(site, 'earth');
                const targetImg = getSiteImage(site, 'target');

                return (
                  <tr key={site.id} className="hover:bg-slate-850/50 transition">
                    {/* Column 1: Earth Location & Satellite Crop */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {/* Earth Crop Thumbnail */}
                        <div
                          onClick={() => {
                            setSelectedSiteModal(site);
                            setActiveModalView('earth');
                          }}
                          className="relative w-13 h-10 rounded-lg overflow-hidden border border-emerald-500/40 bg-slate-950 shrink-0 cursor-pointer group shadow-sm hover:border-emerald-400 transition"
                          title="Click to inspect Earth satellite patch (GLORTHO)"
                        >
                          <img
                            src={earthImg}
                            alt={site.earthLocation}
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.onerror = null;
                              target.src = getSvgFallback('EARTH CROP', 'earth', site.earthLocation);
                            }}
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40">
                            <Maximize2 className="w-3 h-3 text-emerald-300" />
                          </div>
                        </div>

                        {/* Location Details */}
                        <div>
                          <div className="font-semibold text-white flex items-center gap-1.5 leading-snug">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{site.earthLocation}</span>
                          </div>
                          <div className="text-[10px] font-mono text-emerald-400/90 flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Earth Satellite Patch</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Country / Region */}
                    <td className="py-3 px-4 text-slate-400 font-medium">{site.earthCountry}</td>

                    {/* Column 3: Target Mars / Moon Location & Satellite Crop */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {/* Target Crop Thumbnail */}
                        <div
                          onClick={() => {
                            setSelectedSiteModal(site);
                            setActiveModalView('target');
                          }}
                          className={`relative w-13 h-10 rounded-lg overflow-hidden border bg-slate-950 shrink-0 cursor-pointer group shadow-sm transition ${
                            targetBody === 'Mars'
                              ? 'border-orange-500/40 hover:border-orange-400'
                              : 'border-cyan-500/40 hover:border-cyan-400'
                          }`}
                          title={`Click to inspect ${targetBody} surface patch`}
                        >
                          <img
                            src={targetImg}
                            alt={site.targetLocation}
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.onerror = null;
                              target.src = getSvgFallback(
                                targetBody === 'Mars' ? 'MARS CROP' : 'MOON CROP',
                                targetBody === 'Mars' ? 'mars' : 'moon',
                                site.targetLocation
                              );
                            }}
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40">
                            <Maximize2
                              className={`w-3 h-3 ${targetBody === 'Mars' ? 'text-orange-300' : 'text-cyan-300'}`}
                            />
                          </div>
                        </div>

                        {/* Target Location Details */}
                        <div>
                          <div className="font-mono font-medium text-amber-300 leading-snug">
                            {site.targetLocation}
                          </div>
                          <div
                            className={`text-[10px] font-mono flex items-center gap-1 mt-0.5 ${
                              targetBody === 'Mars' ? 'text-orange-400/90' : 'text-cyan-400/90'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                targetBody === 'Mars' ? 'bg-orange-400' : 'bg-cyan-400'
                              }`}
                            />
                            <span>{targetBody === 'Mars' ? 'HiRISE Mosaic Crop' : 'LRO NAC Shade Crop'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Column 4: Overall Match */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full"
                            style={{ width: `${site.overallMatchScore}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-white text-xs">
                          {site.overallMatchScore}%
                        </span>
                      </div>
                    </td>

                    {/* Columns 5 & 6: Mineral & Terrain Match */}
                    <td className="py-3 px-4 font-mono text-slate-300">{site.mineralMatch}%</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{site.terrainMatch}%</td>

                    {/* Column 7: Key Analog Factor */}
                    <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate" title={site.keyAnalogFactor}>
                      {site.keyAnalogFactor}
                    </td>

                    {/* Column 8: Fidelity Status */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-800/50">
                        <Sparkles className="w-2.5 h-2.5" />
                        {site.status}
                      </span>
                    </td>

                    {/* Column 9: Visual Pair Compare Action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedSiteModal(site);
                          setActiveModalView('both');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 border border-slate-700 hover:border-cyan-500 transition cursor-pointer shadow-sm"
                        title="Compare Earth vs Target satellite crops side-by-side"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>Compare</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* View 2: Extracted Variables Table */}
      {activeTab === 'variables' && (
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800 text-[10px]">
              <tr>
                <th className="py-3 px-4">Variable Metric</th>
                <th className="py-3 px-4">Python Pipeline Key</th>
                <th className="py-3 px-4">Calculated Value</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Match Status</th>
                <th className="py-3 px-4">Scientific Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredVariables.map((item) => (
                <tr key={item.key} className="hover:bg-slate-850/50 transition">
                  <td className="py-3.5 px-4 font-semibold text-white">{item.name}</td>
                  <td className="py-3.5 px-4 font-mono text-cyan-400 text-[11px]">{item.key}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                    {item.value} {item.unit && <span className="text-[10px] text-slate-400 font-normal">{item.unit}</span>}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        item.status === 'optimal'
                          ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50'
                          : item.status === 'match'
                          ? 'bg-cyan-950/70 text-cyan-400 border border-cyan-800/50'
                          : item.status === 'partial'
                          ? 'bg-amber-950/70 text-amber-400 border border-amber-800/50'
                          : item.status === 'pending'
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-700/50 animate-pulse'
                          : 'bg-rose-950/70 text-rose-400 border border-rose-800/50'
                      }`}
                    >
                      {item.status === 'pending' ? 'PENDING' : item.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-sm" title={item.description}>
                    {item.description || 'Calculated from multispectral imagery and surface elevation proxies'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* View 3: Satellite Patches & Visual Crops (PNG DataGrid) */}
      {activeTab === 'patches' && (
        <PatchesDataGrid targetBody={targetBody} />
      )}

      {/* SATELLITE COMPARISON LIGHTBOX MODAL */}
      {selectedSiteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedSiteModal(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-slate-800 bg-slate-950 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60 uppercase">
                    Terrestrial Planetary Analog Pair
                  </span>
                  <span className="text-xs font-mono text-slate-400">ID: {selectedSiteModal.id}</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                  {selectedSiteModal.earthLocation} <span className="text-slate-500 font-normal">vs</span>{' '}
                  <span className={targetBody === 'Mars' ? 'text-orange-400' : 'text-cyan-400'}>
                    {selectedSiteModal.targetLocation}
                  </span>
                </h3>
              </div>

              {/* View Selector Tabs in Modal */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setActiveModalView('both')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer font-medium ${
                      activeModalView === 'both' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Side-by-Side Dual
                  </button>
                  <button
                    onClick={() => setActiveModalView('earth')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer font-medium ${
                      activeModalView === 'earth' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Earth Crop
                  </button>
                  <button
                    onClick={() => setActiveModalView('target')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer font-medium ${
                      activeModalView === 'target'
                        ? targetBody === 'Mars'
                          ? 'bg-orange-600 text-white font-semibold'
                          : 'bg-cyan-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {targetBody} Crop
                  </button>
                </div>

                <button
                  onClick={() => setSelectedSiteModal(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-5 space-y-4">
              {/* Visual Images Comparison Grid */}
              <div
                className={`grid gap-4 ${
                  activeModalView === 'both' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
                }`}
              >
                {/* Earth Satellite Patch */}
                {(activeModalView === 'both' || activeModalView === 'earth') && (
                  <div className="bg-slate-950 rounded-xl border border-emerald-500/30 overflow-hidden flex flex-col shadow-md">
                    <div className="p-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Earth: {selectedSiteModal.earthLocation}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{selectedSiteModal.earthCountry}</span>
                    </div>

                    <div className="relative aspect-video sm:aspect-[4/3] bg-slate-900 flex items-center justify-center overflow-hidden group">
                      <img
                        src={getSiteImage(selectedSiteModal, 'earth')}
                        alt={selectedSiteModal.earthLocation}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          target.src = getSvgFallback('EARTH CROP', 'earth', selectedSiteModal.earthLocation);
                        }}
                      />
                      <div className="absolute bottom-2 left-2 text-[10px] font-mono bg-black/70 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 backdrop-blur-md">
                        GLORTHO • 15 cm/px
                      </div>
                    </div>

                    {/* Upload / Replace Earth PNG */}
                    <div className="p-2.5 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 font-mono">Volcanic & Regolith Analog</span>
                      <button
                        onClick={() => {
                          setUploadTargetSite({ id: selectedSiteModal.id, type: 'earth' });
                          uploadInputRef.current?.click();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-900/60 text-slate-300 hover:text-emerald-200 text-[10px] font-semibold border border-slate-700 transition cursor-pointer"
                      >
                        <UploadCloud className="w-3 h-3" />
                        <span>Replace Earth PNG</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Target Martian / Lunar Satellite Patch */}
                {(activeModalView === 'both' || activeModalView === 'target') && (
                  <div
                    className={`bg-slate-950 rounded-xl overflow-hidden flex flex-col shadow-md border ${
                      targetBody === 'Mars' ? 'border-orange-500/30' : 'border-cyan-500/30'
                    }`}
                  >
                    <div className="p-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
                      <div
                        className={`flex items-center gap-1.5 font-bold ${
                          targetBody === 'Mars' ? 'text-orange-400' : 'text-cyan-400'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>
                          {targetBody}: {selectedSiteModal.targetLocation}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {targetBody === 'Mars' ? 'HiRISE Mosaic' : 'LRO NAC 150cm'}
                      </span>
                    </div>

                    <div className="relative aspect-video sm:aspect-[4/3] bg-slate-900 flex items-center justify-center overflow-hidden group">
                      <img
                        src={getSiteImage(selectedSiteModal, 'target')}
                        alt={selectedSiteModal.targetLocation}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          target.src = getSvgFallback(
                            targetBody === 'Mars' ? 'MARS CROP' : 'MOON CROP',
                            targetBody === 'Mars' ? 'mars' : 'moon',
                            selectedSiteModal.targetLocation
                          );
                        }}
                      />
                      <div
                        className={`absolute bottom-2 left-2 text-[10px] font-mono px-2 py-0.5 rounded border backdrop-blur-md ${
                          targetBody === 'Mars'
                            ? 'bg-black/70 text-orange-300 border-orange-500/30'
                            : 'bg-black/70 text-cyan-300 border-cyan-500/30'
                        }`}
                      >
                        {targetBody === 'Mars' ? 'HiRISE • 25 cm/px' : 'LRO NAC • 150 cm/px'}
                      </div>
                    </div>

                    {/* Upload / Replace Target PNG */}
                    <div className="p-2.5 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 font-mono">Planetary Surface Ground Truth</span>
                      <button
                        onClick={() => {
                          setUploadTargetSite({ id: selectedSiteModal.id, type: 'target' });
                          uploadInputRef.current?.click();
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700 transition cursor-pointer ${
                          targetBody === 'Mars'
                            ? 'hover:bg-orange-900/60 hover:text-orange-200'
                            : 'hover:bg-cyan-900/60 hover:text-cyan-200'
                        }`}
                      >
                        <UploadCloud className="w-3 h-3" />
                        <span>Replace {targetBody} PNG</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Scientific Analog Characterization & Metrics Bar */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Analog Factor & Composition Matching
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
                    Status: {selectedSiteModal.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedSiteModal.keyAnalogFactor}. Comparison derived from high-resolution spatial texture
                  and mineralogical proxy alignment between terrestrial and planetary surfaces.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono border-t border-slate-800/80">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Overall Match</span>
                    <span className="font-bold text-white text-sm">{selectedSiteModal.overallMatchScore}%</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Mineral Match</span>
                    <span className="font-bold text-cyan-400 text-sm">{selectedSiteModal.mineralMatch}%</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Terrain Match</span>
                    <span className="font-bold text-amber-400 text-sm">{selectedSiteModal.terrainMatch}%</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Climate Proxy</span>
                    <span className="font-bold text-emerald-400 text-sm">{selectedSiteModal.climateProxyMatch}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs font-mono text-slate-500">
              <span>NASA Space Apps Challenge • Planetary Terrestrial Analogs</span>
              <button
                onClick={() => setSelectedSiteModal(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
