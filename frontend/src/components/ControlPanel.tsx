import React, { useRef, useState } from 'react';
import { FileSpreadsheet, Code2, UploadCloud, Copy, Check } from 'lucide-react';
import type { TargetBody } from '../types';

interface ControlPanelProps {
  onCustomCSVUpload: (content: string, filename: string) => void;
  isLoading: boolean;
  totalVariables: number;
  targetBody: TargetBody;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onCustomCSVUpload,
  isLoading,
  totalVariables,
  targetBody,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const pythonSnippet = `# In your Jupyter Notebook (.ipynb):
import pandas as pd

# Export your calculated analog match DataFrame:
target = "${targetBody.toLowerCase()}"
df_analogs.to_csv(f"outputs/earth_with_{target}_variables.csv", index=False)
print("✅ CSV updated for Chatgepecitos Frontend")`;

  const copyCode = () => {
    navigator.clipboard.writeText(pythonSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        onCustomCSVUpload(text, file.name);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-md space-y-5">
      {/* Active Mode Header */}
      <div className="flex items-center justify-between border-b border-slate-800/70 pb-3">
        <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
          <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
          <span>Active Analog Pipeline</span>
        </div>
        <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800/50 px-2 py-0.5 rounded font-semibold">
          Earth with {targetBody}
        </span>
      </div>

      {/* Target Details */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Target Body:</span>
          <span className="font-mono text-white font-bold">{targetBody}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Target Reference:</span>
          <span className="font-mono text-amber-300 text-[11px]">
            {targetBody === 'Moon' ? 'South Pole Permanent Base' : 'Jezero & Gale Craters'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Active Variable File:</span>
          <span className="font-mono text-cyan-400 text-[11px]">
            earth_with_{targetBody.toLowerCase()}_variables.csv
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Loaded Analog Metrics:</span>
          <span className="font-mono text-emerald-400 font-bold">{totalVariables} metrics</span>
        </div>
      </div>

      {/* Custom CSV Upload */}
      <div className="space-y-2 pt-1">
        <label className="text-xs text-slate-400 flex items-center justify-between">
          <span>Upload Custom Analog CSV</span>
          <span className="text-[10px] text-slate-500">drag &amp; drop</span>
        </label>
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-700 hover:border-cyan-500 hover:bg-cyan-950/20 text-slate-300 text-xs transition cursor-pointer"
        >
          <UploadCloud className="w-4 h-4 text-cyan-400" />
          <span>Import Custom .CSV</span>
        </button>
      </div>

      {/* Jupyter Python Snippet */}
      <div className="border-t border-slate-800/70 pt-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Python Export Cell (Jupyter)</span>
          </div>
          <button
            onClick={copyCode}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition cursor-pointer"
            title="Copy Python snippet"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-[10px] text-slate-300 overflow-x-auto leading-relaxed">
          <div className="text-slate-500"># Last cell in notebook:</div>
          <div>import pandas as pd</div>
          <div className="text-cyan-300">
            df.to_csv(&quot;outputs/earth_with_{targetBody.toLowerCase()}_variables.csv&quot;, index=False)
          </div>
        </div>
      </div>
    </div>
  );
};
