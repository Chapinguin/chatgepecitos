import React, { useState } from 'react';
import type { VariableResult, PlanetaryAnalogSite, TargetBody } from '../types';
import { Search, Download, MapPin, Sparkles, SlidersHorizontal } from 'lucide-react';

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

      {/* View 1: Analog Sites Table */}
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
                <th className="py-3 px-4">Key Analog Factor</th>
                <th className="py-3 px-4">Fidelity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredSites.map((site) => (
                <tr key={site.id} className="hover:bg-slate-850/50 transition">
                  <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{site.earthLocation}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{site.earthCountry}</td>
                  <td className="py-3.5 px-4 font-mono font-medium text-amber-300">
                    {site.targetLocation}
                  </td>
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
                  <td className="py-3.5 px-4 font-mono text-slate-300">{site.mineralMatch}%</td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">{site.terrainMatch}%</td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs truncate" title={site.keyAnalogFactor}>
                    {site.keyAnalogFactor}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-800/50">
                      <Sparkles className="w-2.5 h-2.5" />
                      {site.status}
                    </span>
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
    </div>
  );
};
