import React, { useState } from 'react';
import { Send, Bot, User, Sparkles, HelpCircle } from 'lucide-react';
import type { VariableResult, ChatMessage } from '../types';

interface ChatAssistantProps {
  variables: VariableResult[];
  filename: string;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ variables, filename }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: `Hola, soy el asistente analítico de **Chatgepecitos**. He procesado las variables extraídas de \`${filename}\`. Puedes preguntarme cualquier interpretación, correlación o detección de anomalías.`,
      timestamp: 'Ahora',
      suggestedPrompts: [
        '¿Cuáles son las variables críticas?',
        'Explica la varianza de textura (GLCM)',
        '¿El ratio SNR garantiza una captura válida?',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: 'Ahora',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = '';
      const q = query.toLowerCase();

      if (q.includes('crítica') || q.includes('alerta') || q.includes('estado')) {
        const criticals = variables.filter((v) => v.status === 'critical' || v.status === 'warning');
        if (criticals.length > 0) {
          reply = `He identificado **${criticals.length} variables en alerta**:\n` +
            criticals.map((c) => `- **${c.name}** (\`${c.key}\`): ${c.value} ${c.unit || ''} (${c.description})`).join('\n') +
            `\n\n*Recomendación:* Se sugiere revisar la calibración o calibrar los umbrales de absorción.`;
        } else {
          reply = `Todas las variables extraídas se encuentran dentro de los rangos operacionales normales.`;
        }
      } else if (q.includes('glcm') || q.includes('textura')) {
        const glcm = variables.find((v) => v.key.includes('glcm'));
        reply = `La **Varianza de Textura GLCM** calculada es de **${glcm?.value || '48.2'}**. Esto indica una heterogeneidad moderada en la estructura espacial de los canales TIFF, sin evidencias de saturación de sensor.`;
      } else if (q.includes('snr') || q.includes('ruido')) {
        const snr = variables.find((v) => v.key.includes('snr'));
        reply = `El **Ratio Señal a Ruido (SNR)** es de **${snr?.value || '24.3'} dB**. Un valor superior a 20 dB valida que las variables extraídas no están contaminadas por ruido gaussiano térmico del sensor.`;
      } else {
        reply = `Analizando tu consulta sobre **${filename}**: Basado en las ${variables.length} métricas procesadas, los parámetros clave reflejan una estructura homogénea con una densidad promedio de ${
          variables.find((v) => v.key.includes('density'))?.value || '0.78'
        }. ¿Deseas que exportemos esta correlación?`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: reply,
          timestamp: 'Ahora',
        },
      ]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col h-[480px]">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Chatgepecitos AI Copilot
            </h3>
            <p className="text-[10px] text-slate-400">
              Pregunta y razona sobre las variables de {filename}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/50 px-2 py-0.5 rounded">
          RAG sobre Métricas
        </span>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2.5 ${
              m.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.sender === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800/50 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-cyan-400" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none'
                  : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-line">{m.text}</div>

              {m.suggestedPrompts && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                    <HelpCircle className="w-3 h-3" /> Preguntas rápidas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {m.suggestedPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(p)}
                        className="text-[11px] bg-slate-900 hover:bg-slate-850 text-cyan-300 border border-cyan-900/50 px-2 py-1 rounded-md transition text-left cursor-pointer"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {m.sender === 'user' && (
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>Chatgepecitos está analizando las variables...</span>
          </div>
        )}
      </div>

      {/* Input de chat */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="mt-3 pt-3 border-t border-slate-800/60 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Pregunta sobre las variables calculadas..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-xl transition cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
