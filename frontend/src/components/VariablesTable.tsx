import React, { useState, useEffect } from 'react';
import type { VariableResult, PlanetaryAnalogSite, TargetBody } from '../types';
import {
  Search,
  Download,
  MapPin,
  Sparkles,
  SlidersHorizontal,
  X,
  Layers,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ExternalLink,
  Globe
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'sites' | 'variables'>('sites');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSiteModal, setSelectedSiteModal] = useState<PlanetaryAnalogSite | null>(null);
  const [activeModalView, setActiveModalView] = useState<'both' | 'earth' | 'target'>('both');
  const [earthViewMode, setEarthViewMode] = useState<'crop' | 'satellite'>('crop');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [fullscreenImage, setFullscreenImage] = useState<{
    url?: string;
    title: string;
    subtitle: string;
    badge: string;
    body: 'earth' | 'mars' | 'moon';
    fallbackLabel: string;
    location: string;
  } | null>(null);
  const [fullscreenZoom, setFullscreenZoom] = useState<number>(1);

  const getSatelliteEmbedUrl = (site: PlanetaryAnalogSite | null) => {
    if (!site?.googleMapsUrl) return null;
    const match = site.googleMapsUrl.match(/q=([-\d.]+),([-\d.]+)/);
    if (match) {
      const [, lat, lon] = match;
      return `https://maps.google.com/maps?q=${lat},${lon}&t=k&z=16&ie=UTF8&iwloc=&output=embed`;
    }
    return null;
  };

  // Reset zoom when switching active site
  useEffect(() => {
    setZoomLevel(1);
    setFullscreenZoom(1);
  }, [selectedSiteModal]);

  // Close fullscreen or modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fullscreenImage) {
          setFullscreenImage(null);
          setFullscreenZoom(1);
        } else {
          setSelectedSiteModal(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImage]);

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

  const currentIndex = selectedSiteModal
    ? filteredSites.findIndex((s) => s.id === selectedSiteModal.id)
    : -1;

  const handlePrevSite = () => {
    if (filteredSites.length === 0) return;
    if (currentIndex > 0) {
      setSelectedSiteModal(filteredSites[currentIndex - 1]);
    } else {
      setSelectedSiteModal(filteredSites[filteredSites.length - 1]);
    }
  };

  const handleNextSite = () => {
    if (filteredSites.length === 0) return;
    if (currentIndex >= 0 && currentIndex < filteredSites.length - 1) {
      setSelectedSiteModal(filteredSites[currentIndex + 1]);
    } else {
      setSelectedSiteModal(filteredSites[0]);
    }
  };

  const getSiteImage = (site: PlanetaryAnalogSite, type: 'earth' | 'target') => {
    return type === 'earth' ? site.earthImageUrl : site.targetImageUrl;
  };

  const getSvgFallback = (label: string, body: 'earth' | 'mars' | 'moon', location: string) => {
    const color = body === 'earth' ? '%2310b981' : body === 'mars' ? '%23f97316' : '%2338bdf8';
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="110" viewBox="0 0 160 110"><rect width="160" height="110" fill="%230b1120"/><circle cx="80" cy="50" r="26" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5"/><circle cx="80" cy="50" r="12" fill="none" stroke="${color}" stroke-width="1" opacity="0.7"/><path d="M40 50 H120 M80 20 V80" stroke="${color}" stroke-width="0.8" opacity="0.3"/><text x="80" y="54" font-family="monospace" font-size="8" fill="${color}" text-anchor="middle" font-weight="bold">${label.toUpperCase()}</text><text x="80" y="98" font-family="monospace" font-size="7" fill="%2394a3b8" text-anchor="middle">${location.substring(0, 16)}</text></svg>`;
  };

  const exportCSV = () => {
    if (activeTab === 'sites') {
      const headers = ['ID', 'Earth Location', 'Country', 'Target Location', 'Target Body', 'Overall Match Score (%)', 'Mineral Match', 'Terrain Match', 'Climate Proxy Match', 'Key Analog Factor', 'Coordinates', 'Google Maps Link', 'Status'];
      const rows = filteredSites.map((s) => [
        `"${s.id}"`,
        `"${s.earthLocation}"`,
        `"${s.earthCountry}"`,
        `"${s.targetLocation}"`,
        `"${s.targetBody}"`,
        `"${s.overallMatchScore}"`,
        `"${s.mineralMatch ?? ''}"`,
        `"${s.terrainMatch ?? ''}"`,
        `"${s.climateProxyMatch ?? ''}"`,
        `"${s.keyAnalogFactor}"`,
        `"${s.earthCoordinates ?? ''}"`,
        `"${s.googleMapsUrl ?? ''}"`,
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
          </div>
        </div>

        {/* Filter and Download controls */}
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
      </div>

      {/* View 1: Analog Sites Table with Highlighted Comparison Action */}
      {activeTab === 'sites' && (
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800 text-[10px]">
              <tr>
                <th className="py-3 px-4">Earth Analog Location</th>
                <th className="py-3 px-4">Country / Region</th>
                <th className="py-3 px-4">Target {targetBody} Location</th>
                <th className="py-3 px-4">Overall Match</th>
                <th className="py-3 px-4">Mineral Match</th>
                <th className="py-3 px-4">Terrain Match</th>
                <th className="py-3 px-4">Climate Proxy Match</th>
                <th className="py-3 px-4">Key Analog Factor</th>
                <th className="py-3 px-4">Fidelity Status</th>
                <th className="py-3 px-4 text-center">Analog Comparison</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredSites.map((site) => (
                <tr
                  key={site.id}
                  onClick={() => {
                    setSelectedSiteModal(site);
                    setActiveModalView('both');
                  }}
                  className="hover:bg-slate-800/40 transition cursor-pointer group"
                >
                  {/* Column 1: Earth Location */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm group-hover:border-emerald-400 transition">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-white text-sm font-bold block group-hover:text-cyan-300 transition leading-snug">
                          {site.earthLocation}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono text-emerald-400/90">Terrestrial Reference</span>
                          {site.googleMapsUrl && (
                            <>
                              <span className="text-slate-600 text-[10px]">•</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSiteModal(site);
                                  setEarthViewMode('satellite');
                                  setActiveModalView('both');
                                }}
                                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-0.5 hover:underline cursor-pointer"
                                title="Open interactive satellite terrain preview"
                              >
                                <Globe className="w-2.5 h-2.5 text-cyan-400" />
                                <span>Satellite</span>
                              </button>
                              <span className="text-slate-600 text-[10px]">•</span>
                              <a
                                href={site.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] font-mono text-slate-400 hover:text-slate-300 inline-flex items-center gap-0.5 hover:underline"
                                title="Open exact coordinates in Google Maps (new tab)"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span>Maps</span>
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Country / Region */}
                  <td className="py-3.5 px-4 text-slate-300 font-medium">{site.earthCountry}</td>

                  {/* Column 3: Target Mars / Moon Location */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-sm transition ${
                          targetBody === 'Mars'
                            ? 'bg-orange-950/80 border-orange-500/40 text-orange-400 group-hover:border-orange-400'
                            : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-400 group-hover:border-cyan-400'
                        }`}
                      >
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-mono font-bold text-amber-300 text-sm block leading-snug">
                          {site.targetLocation}
                        </span>
                        <span
                          className={`text-[10px] font-mono ${
                            targetBody === 'Mars' ? 'text-orange-400/80' : 'text-cyan-400/80'
                          }`}
                        >
                          {targetBody === 'Mars' ? 'HiRISE Mosaic Target' : 'LRO NAC Shaded Target'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Column 4: Overall Match */}
                  <td className="py-3.5 px-4">
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
                  {/* Columns 5, 6, 7: Mineral, Terrain & Climate Proxy Match */}
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {site.mineralMatch === null ? '—' : `${site.mineralMatch}%`}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {site.terrainMatch === null ? '—' : `${site.terrainMatch}%`}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {site.climateProxyMatch === null ? '—' : `${site.climateProxyMatch}%`}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs truncate" title={site.keyAnalogFactor}>
                    {site.keyAnalogFactor}
                  </td>

                  {/* Column 8: Fidelity Status */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-800/50">
                      <Sparkles className="w-2.5 h-2.5" />
                      {site.status}
                    </span>
                  </td>

                  {/* Column 9: HIGH-IMPACT ANALOG COMPARISON ACTION */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSiteModal(site);
                        setActiveModalView('both');
                      }}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold shadow-lg transition-all duration-200 cursor-pointer group/btn ${
                        targetBody === 'Mars'
                          ? 'bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white hover:brightness-110 shadow-orange-950/50 border border-orange-400/50 hover:scale-[1.03]'
                          : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-500 text-white hover:brightness-110 shadow-cyan-950/50 border border-cyan-400/50 hover:scale-[1.03]'
                      }`}
                      title="Open Side-by-Side Satellite & Terrain Comparison"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 group-hover/btn:rotate-180 transition-transform duration-300" />
                      <span>Compare Analog</span>
                      <Sparkles className="w-3 h-3 text-amber-200 animate-pulse" />
                    </button>
                  </td>
                </tr>
              ))}
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
      {/* SATELLITE COMPARISON LIGHTBOX MODAL */}
      {selectedSiteModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedSiteModal(null)}
        >
          <div
            className="bg-slate-900 border border-slate-750 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[82vh] my-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header (Sticky & Never Obscured) */}
            <div className="sticky top-0 z-30 flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/95 backdrop-blur gap-3 shrink-0">
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

              {/* View Selector Tabs, Site Switcher & Close in Modal */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {/* Prev / Next Candidate Site Quick Switcher */}
                {filteredSites.length > 1 && (
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                    <button
                      onClick={handlePrevSite}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                      title="Previous Candidate Site"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-mono text-slate-400 px-1 font-semibold">
                      {currentIndex + 1}/{filteredSites.length}
                    </span>
                    <button
                      onClick={handleNextSite}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                      title="Next Candidate Site"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* View Mode Selector */}
                <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setActiveModalView('both')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer font-medium ${
                      activeModalView === 'both' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Side-by-Side
                  </button>
                  <button
                    onClick={() => setActiveModalView('earth')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer font-medium ${
                      activeModalView === 'earth' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Earth
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
                    {targetBody}
                  </button>
                </div>

                {/* Interactive Zoom Controls */}
                <div className="hidden sm:flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs font-mono">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(1, Number((z - 0.5).toFixed(1))))}
                    disabled={zoomLevel <= 1}
                    className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                    title="Zoom Out (-)"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-bold text-cyan-400 px-1 min-w-[28px] text-center">{zoomLevel}x</span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(2.5, Number((z + 0.5).toFixed(1))))}
                    disabled={zoomLevel >= 2.5}
                    className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                    title="Zoom In (+)"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => setSelectedSiteModal(null)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-rose-300 bg-slate-850 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-800/60 transition cursor-pointer shrink-0"
                  title="Close Inspector (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-4 sm:p-5 space-y-3.5">
              {/* DUAL / SINGLE SATELLITE IMAGE CARDS */}
              <div
                className={`grid gap-3 ${
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
                      <div className="flex items-center gap-2">
                        {/* Toggle Patch Crop vs Satellite Terrain */}
                        {getSatelliteEmbedUrl(selectedSiteModal) && (
                          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEarthViewMode('crop');
                              }}
                              className={`px-2 py-0.5 rounded transition cursor-pointer font-medium ${
                                earthViewMode === 'crop'
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Patch Crop
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEarthViewMode('satellite');
                              }}
                              className={`px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1 font-medium ${
                                earthViewMode === 'satellite'
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                              title="Interactive satellite terrain imagery"
                            >
                              <Globe className="w-2.5 h-2.5" />
                              <span>Satellite Terrain</span>
                            </button>
                          </div>
                        )}
                        <span className="hidden lg:inline text-[10px] font-mono text-slate-400">{selectedSiteModal.earthCountry}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFullscreenZoom(1);
                            setFullscreenImage({
                              url: getSiteImage(selectedSiteModal, 'earth'),
                              title: `Earth: ${selectedSiteModal.earthLocation}`,
                              subtitle: `${selectedSiteModal.earthCountry} • GLORTHO Terrestrial Sensor`,
                              badge: 'Earth Surface',
                              body: 'earth',
                              fallbackLabel: 'EARTH CROP',
                              location: selectedSiteModal.earthLocation,
                            });
                          }}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-600/50 transition flex items-center gap-1 text-[10px] font-mono cursor-pointer"
                          title="Open Fullscreen View"
                        >
                          <Maximize2 className="w-3 h-3 text-emerald-400" />
                          <span className="hidden sm:inline">Fullscreen</span>
                        </button>
                      </div>
                    </div>

                    {earthViewMode === 'satellite' && getSatelliteEmbedUrl(selectedSiteModal) ? (
                      <div className="relative h-48 sm:h-56 bg-slate-950 w-full overflow-hidden">
                        <iframe
                          title={`Satellite Terrain: ${selectedSiteModal.earthLocation}`}
                          src={getSatelliteEmbedUrl(selectedSiteModal)!}
                          className="w-full h-full border-0"
                          loading="lazy"
                        />
                        <div className="absolute top-2 left-2 text-[10px] font-mono bg-black/85 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40 backdrop-blur-md pointer-events-none flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Satellite Terrain View • True Topography</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="relative h-48 sm:h-56 bg-slate-950 flex items-center justify-center overflow-hidden group cursor-zoom-in"
                        onClick={() => setZoomLevel((z) => (z === 1 ? 2 : 1))}
                        title="Click to toggle 2x optical zoom"
                      >
                        <img
                          src={getSiteImage(selectedSiteModal, 'earth') || getSvgFallback('EARTH CROP', 'earth', selectedSiteModal.earthLocation)}
                          alt={selectedSiteModal.earthLocation}
                          className="w-full h-full object-cover transition-transform duration-300 ease-out"
                          style={{
                            transform: `scale(${zoomLevel})`,
                            transformOrigin: 'center center',
                          }}
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.onerror = null;
                            target.src = getSvgFallback('EARTH CROP', 'earth', selectedSiteModal.earthLocation);
                          }}
                        />
                        <div className="absolute bottom-2 left-2 text-[10px] font-mono bg-black/75 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 backdrop-blur-md pointer-events-none">
                          GLORTHO • 15 cm/px
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFullscreenZoom(1);
                            setFullscreenImage({
                              url: getSiteImage(selectedSiteModal, 'earth'),
                              title: `Earth: ${selectedSiteModal.earthLocation}`,
                              subtitle: `${selectedSiteModal.earthCountry} • GLORTHO Terrestrial Sensor`,
                              badge: 'Earth Surface',
                              body: 'earth',
                              fallbackLabel: 'EARTH CROP',
                              location: selectedSiteModal.earthLocation,
                            });
                          }}
                          className="absolute top-2 right-2 px-2 py-1 rounded bg-black/75 hover:bg-emerald-950/90 text-slate-300 hover:text-emerald-200 border border-slate-700 hover:border-emerald-500/60 shadow-lg backdrop-blur-md transition flex items-center gap-1.5 text-[10px] font-mono cursor-pointer"
                          title="View Fullscreen"
                        >
                          <Maximize2 className="w-3 h-3 text-emerald-400" />
                          <span>Fullscreen</span>
                        </button>
                      </div>
                    )}

                    {/* Earth Card Footer */}
                    <div className="p-2.5 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">
                          {selectedSiteModal.earthCoordinates || 'Terrestrial Morphology Context'}
                        </span>
                        {selectedSiteModal.googleMapsUrl && (
                          <a
                            href={selectedSiteModal.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 hover:underline"
                            title="Open exact coordinates in Google Maps"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Maps</span>
                          </a>
                        )}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 font-semibold">
                        Earth Surface
                      </span>
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
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400">
                          {targetBody === 'Mars' ? 'HiRISE Mosaic' : 'LRO NAC 150cm'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFullscreenZoom(1);
                            setFullscreenImage({
                              url: getSiteImage(selectedSiteModal, 'target'),
                              title: `${targetBody}: ${selectedSiteModal.targetLocation}`,
                              subtitle: `${targetBody === 'Mars' ? 'HiRISE 25 cm/px' : 'LRO NAC 150 cm/px'} • Orbital Ground Truth`,
                              badge: `${targetBody} Surface`,
                              body: targetBody === 'Mars' ? 'mars' : 'moon',
                              fallbackLabel: targetBody === 'Mars' ? 'MARS CROP' : 'MOON CROP',
                              location: selectedSiteModal.targetLocation,
                            });
                          }}
                          className={`px-2 py-0.5 rounded bg-slate-800 transition flex items-center gap-1 text-[10px] font-mono cursor-pointer border border-slate-700 ${
                            targetBody === 'Mars'
                              ? 'hover:bg-orange-950 text-slate-300 hover:text-orange-300 hover:border-orange-600/50'
                              : 'hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 hover:border-cyan-600/50'
                          }`}
                          title="Open Fullscreen View"
                        >
                          <Maximize2 className={`w-3 h-3 ${targetBody === 'Mars' ? 'text-orange-400' : 'text-cyan-400'}`} />
                          <span className="hidden sm:inline">Fullscreen</span>
                        </button>
                      </div>
                    </div>

                    <div
                      className="relative h-48 sm:h-56 bg-slate-950 flex items-center justify-center overflow-hidden group cursor-zoom-in"
                      onClick={() => setZoomLevel((z) => (z === 1 ? 2 : 1))}
                      title="Click to toggle 2x optical zoom"
                    >
                      <img
                        src={
                          getSiteImage(selectedSiteModal, 'target') ||
                          getSvgFallback(
                            targetBody === 'Mars' ? 'MARS CROP' : 'MOON CROP',
                            targetBody === 'Mars' ? 'mars' : 'moon',
                            selectedSiteModal.targetLocation
                          )
                        }
                        alt={selectedSiteModal.targetLocation}
                        className="w-full h-full object-cover transition-transform duration-300 ease-out"
                        style={{
                          transform: `scale(${zoomLevel})`,
                          transformOrigin: 'center center',
                        }}
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
                        className={`absolute bottom-2 left-2 text-[10px] font-mono px-2 py-0.5 rounded border backdrop-blur-md pointer-events-none ${
                          targetBody === 'Mars'
                            ? 'bg-black/75 text-orange-300 border-orange-500/30'
                            : 'bg-black/75 text-cyan-300 border-cyan-500/30'
                        }`}
                      >
                        {targetBody === 'Mars' ? 'HiRISE • 25 cm/px' : 'LRO NAC • 150 cm/px'}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFullscreenZoom(1);
                          setFullscreenImage({
                            url: getSiteImage(selectedSiteModal, 'target'),
                            title: `${targetBody}: ${selectedSiteModal.targetLocation}`,
                            subtitle: `${targetBody === 'Mars' ? 'HiRISE 25 cm/px' : 'LRO NAC 150 cm/px'} • Orbital Ground Truth`,
                            badge: `${targetBody} Surface`,
                            body: targetBody === 'Mars' ? 'mars' : 'moon',
                            fallbackLabel: targetBody === 'Mars' ? 'MARS CROP' : 'MOON CROP',
                            location: selectedSiteModal.targetLocation,
                          });
                        }}
                        className={`absolute top-2 right-2 px-2 py-1 rounded bg-black/75 shadow-lg backdrop-blur-md transition flex items-center gap-1.5 text-[10px] font-mono cursor-pointer border ${
                          targetBody === 'Mars'
                            ? 'hover:bg-orange-950/90 text-slate-300 hover:text-orange-200 border-slate-700 hover:border-orange-500/60'
                            : 'hover:bg-cyan-950/90 text-slate-300 hover:text-cyan-200 border-slate-700 hover:border-cyan-500/60'
                        }`}
                        title="View Fullscreen"
                      >
                        <Maximize2 className={`w-3 h-3 ${targetBody === 'Mars' ? 'text-orange-400' : 'text-cyan-400'}`} />
                        <span>Fullscreen</span>
                      </button>
                    </div>

                    {/* Target Card Footer */}
                    <div className="p-2.5 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                      <span className="text-[11px] text-slate-400">Orbital Ground Truth</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                          targetBody === 'Mars'
                            ? 'bg-orange-950 text-orange-400 border-orange-800/40'
                            : 'bg-cyan-950 text-cyan-400 border-cyan-800/40'
                        }`}
                      >
                        {targetBody} Surface
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Scientific Analog Characterization & Metrics Bar */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Analog Factor & Composition Matching
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
                    Status: {selectedSiteModal.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedSiteModal.keyAnalogFactor}. Comparison derived from high-resolution spatial texture
                  and mineralogical proxy alignment between terrestrial and planetary surfaces.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs font-mono border-t border-slate-800/80">
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Overall Match</span>
                    <span className="font-bold text-white text-xs sm:text-sm">{selectedSiteModal.overallMatchScore}%</span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Mineral Match</span>
                    <span className="font-bold text-cyan-400 text-xs sm:text-sm">
                      {selectedSiteModal.mineralMatch !== null ? `${selectedSiteModal.mineralMatch}%` : '—'}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Terrain Match</span>
                    <span className="font-bold text-amber-400 text-xs sm:text-sm">
                      {selectedSiteModal.terrainMatch !== null ? `${selectedSiteModal.terrainMatch}%` : '—'}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Climate Proxy</span>
                    <span className="font-bold text-emerald-400 text-xs sm:text-sm">
                      {selectedSiteModal.climateProxyMatch !== null ? `${selectedSiteModal.climateProxyMatch}%` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs font-mono text-slate-500 shrink-0">
              <span className="truncate max-w-[260px] sm:max-w-none">NASA Space Apps Challenge • Planetary Terrestrial Analogs</span>
              <button
                onClick={() => setSelectedSiteModal(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High-Resolution Fullscreen Lightbox Overlay */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex flex-col p-4 sm:p-6 animate-fadeIn select-none"
          onClick={() => {
            setFullscreenImage(null);
            setFullscreenZoom(1);
          }}
        >
          {/* Top Bar */}
          <div
            className="flex items-center justify-between gap-4 pb-3 sm:pb-4 border-b border-slate-800 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg border ${
                  fullscreenImage.body === 'earth'
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                    : fullscreenImage.body === 'mars'
                    ? 'bg-orange-950/60 text-orange-400 border-orange-800/60'
                    : 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60'
                }`}
              >
                {fullscreenImage.body === 'earth' ? (
                  <MapPin className="w-5 h-5" />
                ) : (
                  <Layers className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    {fullscreenImage.title}
                  </h3>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                      fullscreenImage.body === 'earth'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60'
                        : fullscreenImage.body === 'mars'
                        ? 'bg-orange-950 text-orange-300 border-orange-700/60'
                        : 'bg-cyan-950 text-cyan-300 border-cyan-700/60'
                    }`}
                  >
                    {fullscreenImage.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {fullscreenImage.subtitle}
                </p>
              </div>
            </div>

            {/* Right Controls: Zoom & Close */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 font-mono text-xs">
                <button
                  onClick={() => setFullscreenZoom((z) => Math.max(1, Number((z - 0.5).toFixed(1))))}
                  disabled={fullscreenZoom <= 1}
                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-cyan-400 px-2 min-w-[36px] text-center">
                  {fullscreenZoom}x
                </span>
                <button
                  onClick={() => setFullscreenZoom((z) => Math.min(3.5, Number((z + 0.5).toFixed(1))))}
                  disabled={fullscreenZoom >= 3.5}
                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => {
                  setFullscreenImage(null);
                  setFullscreenZoom(1);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-800/60 transition flex items-center gap-1.5 cursor-pointer shadow-lg"
                title="Close Fullscreen (Esc)"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close Fullscreen</span>
              </button>
            </div>
          </div>

          {/* Fullscreen Image Content Area */}
          <div
            className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={fullscreenImage.url || getSvgFallback(fullscreenImage.fallbackLabel, fullscreenImage.body, fullscreenImage.location)}
              alt={fullscreenImage.title}
              className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800 transition-transform duration-200 cursor-zoom-in"
              style={{
                transform: `scale(${fullscreenZoom})`,
                transformOrigin: 'center center',
              }}
              onClick={() =>
                setFullscreenZoom((z) => (z === 1 ? 2 : z === 2 ? 3 : 1))
              }
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = getSvgFallback(
                  fullscreenImage.fallbackLabel,
                  fullscreenImage.body,
                  fullscreenImage.location
                );
              }}
            />

            <div className="absolute bottom-4 left-6 text-[11px] font-mono bg-black/85 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800 backdrop-blur-md pointer-events-none hidden sm:block">
              Click image to cycle zoom levels (1x → 2x → 3x) • Drag or scroll to inspect
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
