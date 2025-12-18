
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LiveEditorService } from '../liveEditorService';
import { SceneLayer } from '../types';
import { BRAZIL_DIMENSIONS, AI_MODELS } from '../nexusCore';
import PropertiesPanel from './PropertiesPanel';
import LayerPanel from './LayerPanel'; 

declare global {
    interface Window {
        fabric: any;
    }
}

const debounce = (func: Function, wait: number) => {
    let timeout: any;
    return function(...args: any[]) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
};

const CreativeGenerator: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const replaceInputRef = useRef<HTMLInputElement>(null);
    const [fabricCanvas, setFabricCanvas] = useState<any>(null);
    
    // Tools & Settings
    const [activeTool, setActiveTool] = useState<'human' | 'logo' | 'asset' | 'mascot' | 'layers' | 'landscape'>('landscape');
    const [loading, setLoading] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
    const [aspectRatio, setAspectRatio] = useState<string>('16:9');
    
    // UI States
    const [showTools, setShowTools] = useState(true);
    const [showProps, setShowProps] = useState(true);
    const [activeRightTab, setActiveRightTab] = useState<'props' | 'layers'>('props');
    const [layers, setLayers] = useState<any[]>([]);
    const [selectedObj, setSelectedObj] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [contextMenuPos, setContextMenuPos] = useState<{top: number, left: number} | null>(null);

    const [forms, setForms] = useState({
        human: { prompt: 'Modelo futurista com jaqueta neon', style: 'Cinemático', shot: 'Retrato' },
        logo: { brand: 'Nexus', style: 'Minimalista', industry: 'Tech', color: '#00f0ff', inspiration: 'Futuristic' }, 
        asset: { type: 'Icon', desc: 'Ícone 3D espacial', style: '3D Render' },
        mascot: { role: 'Assistente', archetype: 'Robô', expression: 'Feliz' },
        landscape: { prompt: 'Paisagem ultra realista de Marte', style: 'Ultra Realista' }
    });

    // ═══════════════════════════════════════════════════════════
    // MOTOR DE RENDERIZAÇÃO (OPTIMIZED FABRIC)
    // ═══════════════════════════════════════════════════════════
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current || !window.fabric) return;

        const canvas = new window.fabric.Canvas(canvasRef.current, {
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
            backgroundColor: '#0a0a10',
            preserveObjectStacking: true,
            selection: true,
            renderOnAddRemove: false,
            enableRetinaScaling: true,
            imageSmoothingEnabled: true,
            fireRightClick: true,
            stopContextMenu: true
        });

        setFabricCanvas(canvas);

        const updateLayersList = debounce(() => {
            const objs = canvas.getObjects();
            setLayers([...objs].reverse().map(o => ({
                id: (o as any).id || (Math.random().toString(36).substr(2, 9)),
                type: o.type,
                name: o.name || o.type,
                visible: o.visible,
                locked: !!o.lockMovementX,
                ref: o
            })));
        }, 150);

        // ✅ RECURSO: ALT + CLICK DUPLICAR
        canvas.on('mouse:down', (opt: any) => {
            if (opt.e.altKey && opt.target) {
                opt.e.preventDefault();
                opt.target.clone((cloned: any) => {
                    cloned.set({
                        left: opt.target.left + 30,
                        top: opt.target.top + 30,
                        id: Math.random().toString(36).substr(2, 9)
                    });
                    canvas.add(cloned);
                    canvas.setActiveObject(cloned);
                    canvas.requestRenderAll();
                    updateLayersList();
                });
            }
        });

        const handleSelection = () => {
            const active = canvas.getActiveObject();
            if (active) {
                setSelectedObj({ ...active, type: active.type });
                const bound = active.getBoundingRect();
                setContextMenuPos({ top: Math.max(10, bound.top - 60), left: Math.max(10, bound.left) });
            } else {
                setSelectedObj(null);
                setContextMenuPos(null);
            }
        };

        canvas.on('selection:created', handleSelection);
        canvas.on('selection:updated', handleSelection);
        canvas.on('selection:cleared', () => { setSelectedObj(null); setContextMenuPos(null); });
        canvas.on('object:added', () => { canvas.requestRenderAll(); updateLayersList(); });
        canvas.on('object:removed', () => { canvas.requestRenderAll(); updateLayersList(); });
        canvas.on('object:modified', updateLayersList);

        const resizeObserver = new ResizeObserver(() => {
            if (!containerRef.current) return;
            canvas.setWidth(containerRef.current.clientWidth);
            canvas.setHeight(containerRef.current.clientHeight);
            canvas.requestRenderAll();
        });
        resizeObserver.observe(containerRef.current);

        return () => {
            canvas.dispose();
            resizeObserver.disconnect();
        };
    }, []);

    const handleDuplicate = () => {
        if (!fabricCanvas) return;
        const active = fabricCanvas.getActiveObject();
        if (active) {
            active.clone((cloned: any) => {
                cloned.set({ left: active.left + 20, top: active.top + 20, id: Math.random().toString(36).substr(2, 9) });
                fabricCanvas.add(cloned);
                fabricCanvas.setActiveObject(cloned);
                fabricCanvas.requestRenderAll();
            });
        }
    };

    const handlePropChange = (key: string, value: any) => {
        if (!fabricCanvas) return;
        const active = fabricCanvas.getActiveObject();
        if (active) {
            active.set(key, value);
            active.setCoords();
            fabricCanvas.requestRenderAll();
            setSelectedObj({ ...active, type: active.type }); 
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            let url = '';
            if (activeTool === 'landscape') {
                url = await LiveEditorService.generateLandscape(forms.landscape.prompt, forms.landscape.style, aspectRatio, selectedModel);
            } else if (activeTool === 'human') {
                url = await LiveEditorService.generateHuman(forms.human.prompt, forms.human.style, forms.human.shot, aspectRatio, selectedModel);
            }
            if (url) {
                window.fabric.Image.fromURL(url, (img: any) => {
                    img.set({ id: Math.random().toString(36).substr(2, 9), objectCaching: true });
                    img.scale(0.5);
                    fabricCanvas.add(img);
                    fabricCanvas.setActiveObject(img);
                    fabricCanvas.requestRenderAll();
                });
            }
        } catch (e: any) {
            alert(`Erro: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-full w-full border border-nexus-border rounded-xl overflow-hidden bg-nexus-bg-deep shadow-2xl relative">
            <input type="file" ref={replaceInputRef} className="hidden" accept="image/*" />

            {/* LEFT SIDEBAR */}
            <div className={`w-80 bg-nexus-panel border-r border-nexus-border flex flex-col ${showTools ? '' : 'hidden'}`}>
                <div className="p-4 border-b border-nexus-border flex justify-between items-center bg-nexus-panel sticky top-0 z-10 shrink-0">
                    <h2 className="text-sm font-black text-nexus-accent tracking-widest uppercase">⚡ NEXUS STUDIO</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                     <div>
                        <label className="text-[10px] text-nexus-dim font-mono uppercase block mb-1">CRIAR VISÃO</label>
                        <textarea 
                            className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-3 text-xs text-white h-32 outline-none focus:border-nexus-accent resize-none" 
                            value={forms.landscape.prompt}
                            onChange={e => setForms({...forms, landscape: {...forms.landscape, prompt: e.target.value}})}
                        />
                    </div>
                </div>
                <div className="p-4 border-t border-nexus-border">
                    <button onClick={handleGenerate} disabled={loading} className="w-full py-4 bg-nexus-accent text-black font-bold rounded-lg uppercase text-xs tracking-widest hover:shadow-glow transition-all">
                        {loading ? 'PROCESSANDO...' : '✨ MATERIALIZAR'}
                    </button>
                </div>
            </div>

            {/* CENTER CANVAS */}
            <div className="flex-1 relative bg-[#0a0a10] flex flex-col min-w-0 h-full">
                <div className="h-10 border-b border-nexus-border flex items-center justify-center px-4 bg-nexus-panel z-10">
                    <div className="text-[10px] text-nexus-dim font-mono uppercase tracking-[0.3em]">
                        GOD MODE: <span className="text-nexus-accent">ALT + CLICK</span> PARA DUPLICAR
                    </div>
                </div>
                <div ref={containerRef} className="flex-1 relative overflow-hidden touch-none cursor-crosshair">
                    <canvas ref={canvasRef} />
                    
                    {contextMenuPos && selectedObj && (
                        <div 
                            className="absolute z-50 flex gap-1 p-1 bg-nexus-panel/90 border border-nexus-border rounded-lg shadow-2xl animate-in zoom-in-95 duration-200 backdrop-blur-md"
                            style={{ top: contextMenuPos.top, left: contextMenuPos.left }}
                        >
                            <button onClick={handleDuplicate} className="p-2 hover:bg-white/10 rounded text-nexus-accent text-xs">📑 DUPLICAR</button>
                            <button onClick={() => { fabricCanvas.remove(fabricCanvas.getActiveObject()); fabricCanvas.discardActiveObject(); fabricCanvas.requestRenderAll(); }} className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded text-white text-xs">🗑️</button>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className={`w-72 bg-nexus-panel border-l border-nexus-border flex flex-col ${showProps ? '' : 'hidden'}`}>
                <div className="h-12 border-b border-nexus-border flex bg-nexus-bg/50 shrink-0">
                    <button onClick={() => setActiveRightTab('props')} className={`flex-1 text-[10px] font-bold uppercase transition-all ${activeRightTab === 'props' ? 'bg-nexus-panel text-nexus-accent border-b-2 border-nexus-accent' : 'text-nexus-dim'}`}>Propriedades</button>
                    <button onClick={() => setActiveRightTab('layers')} className={`flex-1 text-[10px] font-bold uppercase transition-all ${activeRightTab === 'layers' ? 'bg-nexus-panel text-nexus-secondary border-b-2 border-nexus-secondary' : 'text-nexus-dim'}`}>Camadas</button>
                </div>
                <div className="flex-1 overflow-y-auto h-full">
                    {activeRightTab === 'props' && selectedObj ? (
                        <PropertiesPanel selectedLayers={[selectedObj]} onChange={handlePropChange} />
                    ) : (
                        <div className="p-8 text-center text-nexus-dim text-xs mt-10 italic">Selecione um objeto para editar.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreativeGenerator;
