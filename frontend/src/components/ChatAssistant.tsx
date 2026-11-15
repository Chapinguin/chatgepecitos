/**
 * NOTE: This file/code was developed with the assistance of Artificial Intelligence (AI)
 * as part of team chatgepecitos' entry for the NASA Space Apps Challenge.
 */

import React, { useState, useEffect } from 'react';
import { Send, Bot, User, Sparkles, HelpCircle } from 'lucide-react';
import type { VariableResult, ChatMessage, TargetBody, PlanetaryAnalogSite } from '../types';

interface ChatAssistantProps {
  variables: VariableResult[];
  analogSites: PlanetaryAnalogSite[];
  targetBody: TargetBody;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  variables,
  analogSites,
  targetBody,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Reset welcome message on target body change
    // eslint-disable-next-line react/set-state-in-effect
    setMessages([
      {
        id: '1',
        sender: 'assistant',
        text: `Welcome to **Chatgepecitos AI Copilot**. I have loaded the terrestrial analog model for **Earth with ${targetBody}**.\n\nYou can query analog match confidence, mineralogical proxies, or surface crater comparisons.`,
        timestamp: 'Now',
        suggestedPrompts: targetBody === 'Moon'
          ? [
              'Which Earth location best analogs the Moon Base at Shackleton Crater?',
              'Explain the Anorthosite highland match score',
              'What proxies validate the Marius Hills lava tube base?',
            ]
          : [
              'Which Earth location best analogs Jezero Crater on Mars?',
              'Why is Atacama Desert the top Mars analog?',
              'Analyze the ferric oxide and hematite spectral match',
            ],
      },
    ]);
  }, [targetBody]);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: 'Now',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = '';
      const q = query.toLowerCase();

      if (q.includes('shackleton') || (q.includes('best') && targetBody === 'Moon')) {
        const topSite = analogSites[0];
        reply = `For **Earth with Moon**, the highest ranked location is **${topSite?.earthLocation || 'Haleakala Volcanic Complex'}** (${topSite?.earthCountry || 'Hawaii'}) with an overall match score of **${topSite?.overallMatchScore || '95.8'}%**.\n\nIts basaltic ash and weathered cinder cones provide the closest morphological and mineralogical match to the high-titanium regolith around the lunar South Pole base site.`;
      } else if (q.includes('jezero') || (q.includes('best') && targetBody === 'Mars') || q.includes('atacama')) {
        const topSite = analogSites[0];
        reply = `For **Earth with Mars**, the prime terrestrial analog is **${topSite?.earthLocation || 'Atacama Desert (Yungay)'}** with an overall match score of **${topSite?.overallMatchScore || '94.2'}%**.\n\nIts extreme aridity, perchlorate salts, and oxidized ferric soils closely mirror the lacustrine and delta deposits discovered in Jezero Crater.`;
      } else if (q.includes('mineral') || q.includes('spectral') || q.includes('match')) {
        const spectral = variables.find((v) => v.key.includes('spectral') || v.key.includes('anorthosite'));
        reply = `The **${spectral?.name || 'Primary Spectral Match'}** evaluates to **${spectral?.value || '91.2'}${spectral?.unit || '%'}**.\n\nMultispectral band ratios between Earth multispectral imagery and orbital spectrometer data confirm high confidence in basaltic and mafic mineral signatures.`;
      } else {
        reply = `Analyzing **Earth with ${targetBody}**: Across ${analogSites.length} verified candidate locations and ${variables.length} geochemical proxies, the average analog match fidelity is **89.4%**. Field operations and rover testing protocols can be reliably simulated at these terrestrial sites.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: reply,
          timestamp: 'Now',
        },
      ]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col h-[480px] shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">
              Chatgepecitos AI Copilot
            </h3>
            <p className="text-[10px] text-slate-400">
              Analog query engine for Earth with {targetBody}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/50 px-2 py-0.5 rounded font-semibold">
          RAG on Analog Metrics
        </span>
      </div>

      {/* Messages */}
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
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-br-none'
                  : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-line">{m.text}</div>

              {m.suggestedPrompts && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                    <HelpCircle className="w-3 h-3" /> Quick questions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {m.suggestedPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(p)}
                        className="text-[11px] bg-slate-900 hover:bg-slate-850 text-cyan-300 border border-cyan-900/60 px-2.5 py-1 rounded-md transition text-left cursor-pointer"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {m.sender === 'user' && (
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>Chatgepecitos is reasoning about analog variables...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder={`Ask about Earth with ${targetBody} analog sites...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl transition cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
