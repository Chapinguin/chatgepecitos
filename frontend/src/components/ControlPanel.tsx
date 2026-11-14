import React, { useRef, useState } from 'react';
import { FileSpreadsheet, Code2, UploadCloud, Copy, Check } from 'lucide-react';

interface ControlPanelProps {
  onCustomCSVUpload: (content: string, filename: string) => void;
  isLoading: boolean;
  totalVariables: number;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onCustomCSVUpload,
  isLoading,
  totalVariables,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const pythonSnippet = `# En tu Jupyter Notebook (.ipynb):
import pandas as pd

# Guarda tu DataFrame en la carpeta outputs:
df_resultados.to_csv("../outputs/variables.csv", index=False)
print("✅ CSV actualizado para React")`;

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
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-5">
      {/* Estado del Archivo CSV */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Fuente de Datos Activa</span>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
          CSV del Repo
        </span>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Ruta en el repositorio:</span>
          <span className="font-mono text-cyan-400 font-semibold text-[11px]">outputs/variables.csv</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Variables en memoria:</span>
          <span className="font-mono text-white font-bold">{totalVariables} métricas</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Canales/Capas:</span>
          <span className="font-mono text-purple-400 text-[11px]">outputs/layers.csv</span>
        </div>
      </div>

      {/* Subir archivo CSV alternativo */}
      <div className="space-y-2 pt-1">
        <label className="text-xs text-slate-400 flex items-center justify-between">
          <span>O cargar archivo CSV manual</span>
          <span className="text-[10px] text-slate-500">arrastra o selecciona</span>
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
          <span>Subir otro archivo .CSV</span>
        </button>
      </div>

      {/* Snippet para el equipo de Python */}
      <div className="border-t border-slate-800/60 pt-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Código Python para el Notebook</span>
          </div>
          <button
            onClick={copyCode}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition cursor-pointer"
            title="Copiar código para Jupyter"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-[10px] text-slate-300 overflow-x-auto leading-relaxed">
          <div className="text-slate-500"># Última celda de su .ipynb:</div>
          <div>import pandas as pd</div>
          <div className="text-cyan-300">df.to_csv(&quot;outputs/variables.csv&quot;, index=False)</div>
        </div>
      </div>
    </div>
  );
};
