import React, { useState, useRef, useEffect } from 'react';
import { useImageGeneration } from '../hooks/useImageGeneration';
import { AVAILABLE_FONTS } from '../nexusCore';

interface PropertiesPanelProps {
    selectedLayers: any[];
    onChange: (key: string, value: any) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedLayers, onChange }) => {
    const { removeBackground, loading } = useImageGeneration();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Gradient State
    const [fillType, setFillType] = useState<'solid' | 'gradient'>('solid');
    const [gradStart, setGradStart] = useState('#00f0ff');
    const [gradEnd, setGradEnd] = useState('#7000ff');
    const [gradDirection, setGradDirection] = useState<'horizontal' | 'vertical' | 'diagonal'>('horizontal');

    if (selectedLayers.length === 0) {
        return (
            <div className="h-full bg-nexus-panel border-l border-nexus-border p-6 flex flex-col items-center justify-center text-center">
                <div className="text-4xl opacity-20 mb-4 animate-pulse">⚡</div>
                <p className="text-xs text-nexus-dim uppercase tracking-widest">Nenhuma Seleção</p>
            </div>
        );
    }

    const layer = selectedLayers[0];
    const isText = layer.type === 'text' || layer.type === 'i-text';
    const isShape = layer.type === 'rect' || layer.type === 'circle' || layer.type === 'path' || layer.type === 'triangle';

    const handleRemoveBg = async () => {
        if (layer.type !== 'image' || !layer.src) return;
        try {
            const newSrc = await removeBackground(layer.src);
            onChange('src', newSrc);
        } catch (e) {
            console.error("BG Removal Failed", e);
        }
    };

    const handleReplaceClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                onChange('src', ev.target?.result);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const applyGradient = (start: string, end: string, direction: string) => {
        let coords = { x1: 0, y1: 0, x2: 1, y2: 0 }; // Horizontal
        if (direction === 'vertical') coords = { x1: 0, y1: 0, x2: 0, y2: 1 };
        if (direction === 'diagonal') coords = { x1: 0, y1: 0, x2: 1, y2: 1 };

        // Create Fabric Gradient
        const grad = new (window as any).fabric.Gradient({
            type: 'linear',
            gradientUnits: 'percentage', // or 'pixels'
            coords: coords,
            colorStops: [
                { offset: 0, color: start },
                { offset: 1, color: end }
            ]
        });
        onChange('fill', grad);
    };

    useEffect(() => {
        // Sync fill state if object has gradient
        if (layer.fill && typeof layer.fill === 'object' && layer.fill.type === 'linear') {
            setFillType('gradient');
            // Try to extract colors (simple approximation)
            if (layer.fill.colorStops && layer.fill.colorStops.length >= 2) {
                setGradStart(layer.fill.colorStops[0].color);
                setGradEnd(layer.fill.colorStops[layer.fill.colorStops.length - 1].color);
                
                // Guess direction
                const { x2, y2 } = layer.fill.coords;
                if (x2 === 0 && y2 === 1) setGradDirection('vertical');
                else if (x2 === 1 && y2 === 1) setGradDirection('diagonal');
                else setGradDirection('horizontal');
            }
        } else if (typeof layer.fill === 'string') {
            setFillType('solid');
            setGradStart(layer.fill); // Sync start color with solid fill
        }
    }, [layer.id, layer.fill]);

    return (
        <div className="h-full bg-nexus-panel border-l border-nexus-border flex flex-col">
            <div className="p-4 border-b border-nexus-border">
                <h3 className="text-xs font-bold text-nexus-accent uppercase tracking-widest mb-1">PROPRIEDADES</h3>
                <div className="text-[10px] text-nexus-dim truncate font-mono">{layer.name || layer.type}</div>
            </div>

            <div className="p-4 space-y-6 overflow-y-auto flex-1 scrollbar-hide">
                {/* 1. OPACITY */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] text-nexus-dim font-bold uppercase">
                        <span>Opacidade</span>
                        <span className="font-mono text-white">{Math.round((layer.opacity || 1) * 100)}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" max="1" step="0.01"
                        value={layer.opacity !== undefined ? layer.opacity : 1}
                        onChange={(e) => onChange('opacity', parseFloat(e.target.value))}
                        className="w-full accent-nexus-accent h-1 bg-nexus-surface rounded-full appearance-none cursor-pointer"
                    />
                </div>

                {/* 2. TEXT PROPERTIES */}
                {isText && (
                    <div className="space-y-4 pt-4 border-t border-nexus-border/30">
                        <h4 className="text-[10px] font-bold text-nexus-secondary uppercase tracking-wider">Tipografia Master</h4>
                        
                        {/* Font Family */}
                        <div>
                            <label className="text-[9px] text-nexus-dim block mb-1 uppercase font-bold">Fonte</label>
                            <select 
                                value={layer.fontFamily}
                                onChange={(e) => onChange('fontFamily', e.target.value)}
                                className="w-full bg-nexus-surface border border-nexus-border rounded p-2 text-xs text-white outline-none focus:border-nexus-accent font-sans"
                                style={{ fontFamily: layer.fontFamily }}
                            >
                                {AVAILABLE_FONTS.map(font => (
                                    <option key={font} value={font} style={{ fontFamily: font, fontSize: '14px' }}>
                                        {font}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Content */}
                        <div>
                            <label className="text-[9px] text-nexus-dim block mb-1 uppercase font-bold">Conteúdo</label>
                            <textarea 
                                value={layer.text || ''}
                                onChange={(e) => onChange('text', e.target.value)}
                                className="w-full bg-nexus-surface border border-nexus-border rounded p-2 text-xs text-white focus:border-nexus-accent outline-none h-20 resize-none font-mono"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] text-nexus-dim block mb-1 uppercase font-bold">Peso</label>
                                <select 
                                    value={layer.fontWeight || 'normal'}
                                    onChange={(e) => onChange('fontWeight', e.target.value)}
                                    className="w-full bg-nexus-surface border border-nexus-border rounded p-2 text-xs text-white outline-none"
                                >
                                    <option value="300">Light</option>
                                    <option value="normal">Regular</option>
                                    <option value="bold">Bold</option>
                                    <option value="900">Black</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] text-nexus-dim block mb-1 uppercase font-bold">Tamanho (px)</label>
                                <input 
                                    type="number" 
                                    value={layer.fontSize}
                                    onChange={(e) => onChange('fontSize', parseInt(e.target.value))}
                                    className="w-full bg-nexus-surface border border-nexus-border rounded p-2 text-xs text-white outline-none focus:border-nexus-accent"
                                />
                            </div>
                        </div>
                        
                        {/* Spacing & Line Height */}
                        <div className="grid grid-cols-2 gap-3">
                             <div>
                                <label className="text-[9px] text-nexus-dim block mb-1 uppercase font-bold">Espaçamento</label>
                                <input 
                                    type="number" 
                                    step="10"
                                    value={layer.charSpacing || 0}
                                    onChange={(e) => onChange('charSpacing', parseInt(e.target.value))}
                                    className="w-full bg-nexus-surface border border-nexus-border rounded p-2 text-xs text-white outline-none focus:border-nexus-accent"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] text-nexus-dim block mb-1 uppercase font-bold">Altura Linha</label>
                                <input 
                                    type="number" 
                                    step="0.1"
                                    value={layer.lineHeight || 1}
                                    onChange={(e) => onChange('lineHeight', parseFloat(e.target.value))}
                                    className="w-full bg-nexus-surface border border-nexus-border rounded p-2 text-xs text-white outline-none focus:border-nexus-accent"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. COLOR & GRADIENT SYSTEM */}
                {(isText || isShape) && (
                    <div className="space-y-3 pt-4 border-t border-nexus-border/30">
                        <div className="flex justify-between items-center">
                            <h4 className="text-[10px] font-bold text-nexus-secondary uppercase tracking-wider">Preenchimento</h4>
                            <div className="flex bg-nexus-surface rounded p-0.5 border border-nexus-border">
                                <button 
                                    onClick={() => { setFillType('solid'); onChange('fill', gradStart); }}
                                    className={`px-2 py-1 text-[9px] rounded font-bold uppercase transition-all ${fillType === 'solid' ? 'bg-nexus-panel text-white shadow-sm' : 'text-nexus-dim hover:text-white'}`}
                                >Sólido</button>
                                <button 
                                    onClick={() => { setFillType('gradient'); applyGradient(gradStart, gradEnd, gradDirection); }}
                                    className={`px-2 py-1 text-[9px] rounded font-bold uppercase transition-all ${fillType === 'gradient' ? 'bg-nexus-panel text-white shadow-sm' : 'text-nexus-dim hover:text-white'}`}
                                >Degradê</button>
                            </div>
                        </div>
                        
                        {fillType === 'solid' ? (
                            <div className="flex gap-2">
                                <div className="h-9 w-9 rounded border border-nexus-border overflow-hidden shrink-0 relative">
                                    <input 
                                        type="color" 
                                        value={typeof layer.fill === 'string' ? layer.fill : gradStart}
                                        onChange={(e) => { setGradStart(e.target.value); onChange('fill', e.target.value); }}
                                        className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                                    />
                                </div>
                                <input 
                                    type="text"
                                    value={typeof layer.fill === 'string' ? layer.fill : gradStart}
                                    onChange={(e) => { setGradStart(e.target.value); onChange('fill', e.target.value); }}
                                    className="flex-1 bg-nexus-surface border border-nexus-border rounded px-3 text-xs text-white font-mono uppercase focus:border-nexus-accent outline-none"
                                    maxLength={7}
                                />
                            </div>
                        ) : (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                {/* Direction Controls */}
                                <div className="flex gap-1 justify-center pb-2">
                                    {[
                                        { id: 'horizontal', icon: '⮕' },
                                        { id: 'vertical', icon: '⬇' },
                                        { id: 'diagonal', icon: '⬂' }
                                    ].map(dir => (
                                        <button 
                                            key={dir.id}
                                            onClick={() => { setGradDirection(dir.id as any); applyGradient(gradStart, gradEnd, dir.id); }}
                                            className={`w-8 h-8 rounded flex items-center justify-center border transition-all ${gradDirection === dir.id ? 'bg-nexus-accent text-black border-nexus-accent' : 'bg-nexus-surface border-nexus-border text-nexus-dim hover:text-white'}`}
                                            title={dir.id}
                                        >
                                            {dir.icon}
                                        </button>
                                    ))}
                                </div>

                                {/* Start Color */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] text-nexus-dim w-8 font-bold uppercase">Início</span>
                                    <div className="h-8 w-8 rounded border border-nexus-border overflow-hidden shrink-0 relative">
                                        <input 
                                            type="color" 
                                            value={gradStart}
                                            onChange={(e) => { 
                                                setGradStart(e.target.value); 
                                                applyGradient(e.target.value, gradEnd, gradDirection); 
                                            }}
                                            className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                                        />
                                    </div>
                                    <input 
                                        type="text"
                                        value={gradStart}
                                        onChange={(e) => { 
                                            setGradStart(e.target.value); 
                                            applyGradient(e.target.value, gradEnd, gradDirection); 
                                        }}
                                        className="flex-1 bg-nexus-surface border border-nexus-border rounded px-2 h-8 text-xs text-white font-mono uppercase focus:border-nexus-accent outline-none"
                                        maxLength={7}
                                    />
                                </div>

                                {/* End Color */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] text-nexus-dim w-8 font-bold uppercase">Fim</span>
                                    <div className="h-8 w-8 rounded border border-nexus-border overflow-hidden shrink-0 relative">
                                        <input 
                                            type="color" 
                                            value={gradEnd}
                                            onChange={(e) => { 
                                                setGradEnd(e.target.value); 
                                                applyGradient(gradStart, e.target.value, gradDirection); 
                                            }}
                                            className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                                        />
                                    </div>
                                    <input 
                                        type="text"
                                        value={gradEnd}
                                        onChange={(e) => { 
                                            setGradEnd(e.target.value); 
                                            applyGradient(gradStart, e.target.value, gradDirection); 
                                        }}
                                        className="flex-1 bg-nexus-surface border border-nexus-border rounded px-2 h-8 text-xs text-white font-mono uppercase focus:border-nexus-accent outline-none"
                                        maxLength={7}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 4. IMAGE ACTIONS */}
                {layer.type === 'image' && (
                    <div className="space-y-3 pt-4 border-t border-nexus-border/30">
                        <h4 className="text-[10px] font-bold text-nexus-secondary uppercase tracking-wider">Ações de Imagem</h4>
                        
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                        />
                        
                        <button 
                            onClick={handleReplaceClick}
                            className="w-full py-3 bg-nexus-surface border border-nexus-border text-nexus-dim hover:text-white hover:border-nexus-accent rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 group"
                        >
                            <span className="group-hover:rotate-180 transition-transform duration-500">🔄</span> Substituir Imagem
                        </button>

                        {layer.src && (
                            <button 
                                onClick={handleRemoveBg}
                                disabled={loading}
                                className="w-full py-3 bg-nexus-bg border border-nexus-border text-white hover:border-nexus-success hover:text-nexus-success rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <span className="animate-pulse">Processando...</span>
                                ) : (
                                    <>
                                        <span>✂️</span> Remover Fundo
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PropertiesPanel;