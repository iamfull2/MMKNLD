
import React, { useRef, useState } from 'react';
import { NexusConfig } from '../types';
import { HYPER_REALISM_PRESETS } from '../hyperRealismEngine';
import { BRAZIL_DIMENSIONS } from '../nexusCore';

interface ControlPanelProps {
    config: NexusConfig;
    setConfig: React.Dispatch<React.SetStateAction<NexusConfig>>;
    onGenerate: () => void;
    isProcessing: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ config, setConfig, onGenerate, isProcessing }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    const handleChange = (key: keyof NexusConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const processFile = (file: File) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('Formato não suportado. Use JPG, PNG ou WEBP.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Arquivo muito grande. O limite é 5MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            handleChange('referenceImage', event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        e.target.value = '';
    };

    const ModuleToggle = ({ active, label, onClick, colorClass, icon }: any) => (
        <button 
            onClick={!isProcessing ? onClick : undefined}
            className={`
                relative p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 touch-manipulation
                ${active 
                    ? `bg-${colorClass}-500/10 border-${colorClass}-500 shadow-[0_0_15px_rgba(0,0,0,0.2)]` 
                    : `bg-nexus-panel border-nexus-border hover:border-${colorClass}-500/50`}
                ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
            `}
        >
            <span className={`text-xl transition-transform ${active ? 'scale-110' : 'grayscale text-nexus-dim'}`}>{icon}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wide ${active ? `text-${colorClass}-400` : 'text-nexus-dim'}`}>
                {label}
            </span>
        </button>
    );

    return (
        <div className="glass-panel rounded-2xl flex flex-col shadow-2xl shadow-nexus-accent/5 relative ring-1 ring-white/5 overflow-hidden">
            {/* V37.2 Background Watermark - Hidden on mobile */}
            <div className="absolute -top-4 -right-4 opacity-[0.03] pointer-events-none select-none overflow-hidden z-0 hidden sm:block">
                <span className="text-[120px] font-black font-mono text-nexus-text">V37.2</span>
            </div>

            <div className="p-4 sm:p-6 flex flex-col gap-6 relative z-10 flex-1">
                {/* Concept Input */}
                <div className="space-y-2">
                    <label className="flex justify-between items-baseline">
                        <span className="text-xs font-mono text-nexus-accent tracking-widest uppercase font-bold">Injetor de Conceito</span>
                        <span className="text-[10px] text-nexus-dim font-mono">{config.concept.length} CHARS</span>
                    </label>
                    <div className="relative group">
                        <textarea
                            value={config.concept}
                            onChange={(e) => handleChange('concept', e.target.value)}
                            placeholder="Descreva sua visão (ex: Um gato cyberpunk em uma cidade neon...)"
                            className="w-full bg-nexus-bg/50 border border-nexus-border rounded-xl p-4 text-nexus-text focus:border-nexus-accent focus:bg-nexus-bg focus:ring-1 focus:ring-nexus-accent/50 outline-none transition-all resize-none h-32 font-sans text-sm placeholder:text-nexus-dim/50"
                            disabled={isProcessing}
                        />
                        <div className="absolute bottom-2 right-2 text-[10px] text-nexus-dim/50 pointer-events-none group-focus-within:text-nexus-accent/50">
                            IA-PRONTA
                        </div>
                    </div>
                </div>

                 {/* Singularity Modules Grid */}
                 <div>
                    <label className="block text-xs font-mono text-nexus-dim mb-3 uppercase tracking-widest">Módulos de Singularidade</label>
                    <div className="grid grid-cols-4 gap-2">
                        <ModuleToggle label="Clone" active={config.useClone} onClick={() => handleChange('useClone', !config.useClone)} colorClass="pink" icon="📸" />
                        <ModuleToggle label="Real" active={config.useHyperRealism} onClick={() => handleChange('useHyperRealism', !config.useHyperRealism)} colorClass="orange" icon="👁️" />
                        <ModuleToggle label="Mind" active={config.useConsciousness} onClick={() => handleChange('useConsciousness', !config.useConsciousness)} colorClass="red" icon="🧠" />
                        <ModuleToggle label="Quantum" active={config.useQuantum} onClick={() => handleChange('useQuantum', !config.useQuantum)} colorClass="green" icon="⚛️" />
                    </div>
                </div>

                {/* Hyper-Realism Settings (Conditional) */}
                {config.useHyperRealism && (
                    <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3 animate-in slide-in-from-top-2">
                        <label className="block text-[10px] font-mono text-orange-400 mb-2 uppercase font-bold">Preset Hiper-Realismo</label>
                        <select
                            value={config.hyperRealismPreset || 'photo-studio'}
                            onChange={(e) => handleChange('hyperRealismPreset', e.target.value)}
                            className="w-full bg-nexus-bg border border-orange-500/30 rounded-lg p-2 text-xs text-nexus-text focus:border-orange-500 outline-none"
                            disabled={isProcessing}
                        >
                            {Object.values(HYPER_REALISM_PRESETS).map(preset => (
                                <option key={preset.id} value={preset.id}>{preset.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Dimensions Grid - Mobile Optimized */}
                <div>
                    <label className="block text-xs font-mono text-nexus-dim mb-3 uppercase tracking-widest flex justify-between items-center">
                        <span>Dimensão / Formato</span>
                        <span className="text-nexus-accent text-[10px] font-bold">{config.format || 'Personalizado'} ({config.aspectRatio})</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto scrollbar-hide pr-1 border border-nexus-border/50 rounded-xl p-2 bg-nexus-bg/30">
                        {Object.entries(BRAZIL_DIMENSIONS).map(([label, ratio]) => (
                            <button
                                key={label}
                                onClick={() => { handleChange('aspectRatio', ratio); handleChange('format', label); }}
                                className={`
                                    relative p-2 rounded-lg text-left transition-all duration-200 border flex flex-col gap-1 active:scale-95 touch-manipulation
                                    ${config.format === label ? 'bg-nexus-accent/10 border-nexus-accent shadow-glow z-10' : 'bg-nexus-panel border-nexus-border hover:border-nexus-dim'}
                                `}
                                disabled={isProcessing}
                            >
                                <span className={`text-[10px] font-bold uppercase truncate ${config.format === label ? 'text-nexus-accent' : 'text-nexus-text'}`}>{label}</span>
                                <span className="text-[9px] font-mono text-nexus-dim">{ratio}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reference Image Upload */}
                <div>
                    <label className="flex justify-between items-center mb-2">
                        <span className={`text-xs font-mono uppercase tracking-widest font-bold ${config.useClone ? 'text-pink-500 animate-pulse' : 'text-nexus-dim'}`}>
                            {config.useClone ? 'Fonte do Clone' : 'Referência'}
                        </span>
                    </label>
                    
                    <div 
                        className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all active:scale-[0.98] overflow-hidden ${config.referenceImage ? 'border-nexus-accent bg-nexus-accent/5' : 'border-nexus-border hover:border-nexus-accent'}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        
                        {config.referenceImage ? (
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg overflow-hidden border border-nexus-border bg-black shrink-0">
                                    <img src={config.referenceImage} alt="Ref" className="w-full h-full object-cover" />
                                </div>
                                <div className="text-left min-w-0 flex-1">
                                    <div className="text-xs font-bold text-nexus-accent truncate">Imagem Carregada</div>
                                    <div className="text-[10px] text-nexus-dim">Toque para trocar</div>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleChange('referenceImage', null); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-nexus-surface text-nexus-dim">✕</button>
                            </div>
                        ) : (
                            <div className="py-2">
                                <div className="text-2xl mb-1">📸</div>
                                <div className="text-xs font-bold text-nexus-dim">Carregar Imagem</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Core Settings */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-nexus-dim uppercase font-bold">Estética</label>
                        <select
                            value={config.style}
                            onChange={(e) => handleChange('style', e.target.value)}
                            className="w-full bg-nexus-panel border border-nexus-border rounded-lg p-3 text-xs text-nexus-text focus:border-nexus-secondary outline-none appearance-none"
                            disabled={isProcessing}
                        >
                            <option value="cinematic">Cinemático</option>
                            <option value="product">Produto</option>
                            <option value="character">Personagem</option>
                            <option value="abstract">Abstrato</option>
                            <option value="architecture">Arquitetura</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-nexus-dim uppercase font-bold">Atmosfera</label>
                        <select
                            value={config.mood}
                            onChange={(e) => handleChange('mood', e.target.value)}
                            className="w-full bg-nexus-panel border border-nexus-border rounded-lg p-3 text-xs text-nexus-text focus:border-nexus-secondary outline-none appearance-none"
                            disabled={isProcessing}
                        >
                            <option value="MOODDOPAMINEFLOOD">Neon Pop</option>
                            <option value="MOODCORTISOLSPIKE">Sombrio</option>
                            <option value="MOODSEROTONINFLOW">Etéreo</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <div className="p-4 border-t border-nexus-border bg-nexus-panel/50 backdrop-blur">
                <button
                    onClick={onGenerate}
                    disabled={isProcessing || (!config.concept && !config.referenceImage)}
                    className={`
                        w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-sm transition-all relative overflow-hidden group
                        ${isProcessing 
                            ? 'bg-nexus-surface text-nexus-dim cursor-not-allowed' 
                            : 'bg-gradient-to-r from-nexus-secondary to-nexus-accent text-white hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] active:scale-[0.98]'}
                    `}
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {isProcessing ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                                <span>PROCESSANDO...</span>
                            </>
                        ) : (
                            <>
                                <span>⚡</span> MATERIALIZAR
                            </>
                        )}
                    </span>
                    {!isProcessing && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>}
                </button>
            </div>
        </div>
    );
};

export default ControlPanel;
