
import React, { useState, useRef, useEffect } from 'react';
import { BatchConfig, FlowExecutionRequest, WorkflowNode, WorkflowEdge, WorkflowNodeType, WorkflowNodeData, AdsPowerConfig } from '../types';
import { executeNexusSwarm, generateNexusVideo, runNexusRequest, generateGoogleImage } from '../geminiService';
import { generateWithFreepik } from '../freepikService';
import { LiveEditorService } from '../liveEditorService';
import { SemanticEngine } from '../semanticEngine';
import { HyperRealismEngine } from '../hyperRealismEngine';
import { AdsPowerBridge } from '../services/adspowerBridge';

interface BatchControlPanelProps {
    config: BatchConfig;
    setConfig: React.Dispatch<React.SetStateAction<BatchConfig>>;
    onProcessNode: (request: FlowExecutionRequest) => void;
    onTemplateSet: () => void;
    isProcessing: boolean;
    resultsMap: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════
// BLUEPRINT CONFIGURATION
// ═══════════════════════════════════════════════════════════

const IMAGE_MODELS = [
    { id: 'flux1', label: 'Flux 1.1 Pro (AdsPower)', icon: '💠' },
    { id: 'mystic25', label: 'Mystic 2.5 (AdsPower)', icon: '🎨' },
    { id: 'account', label: 'Perfil Sincronizado', icon: '☁️' }, 
    { id: 'gemini', label: 'Gemini 2.5 (Core)', icon: '⚡' },
    { id: 'imagen3', label: 'Imagen 3 (Standard)', icon: '📸' },
    { id: 'imagen4', label: 'Imagen 4 (Ultra)', icon: '✨' }
];

const VIDEO_MODELS = [
    { id: 'veo-fast', label: 'Veo Fast', icon: '🐇' },
    { id: 'veo-hq', label: 'Veo HQ', icon: '🐢' }
];

const ASPECT_RATIOS = [
    { id: '16:9', label: '16:9 Landscape', icon: '▭' },
    { id: '9:16', label: '9:16 Portrait', icon: '▯' },
    { id: '1:1', label: '1:1 Square', icon: '□' },
    { id: '4:3', label: '4:3 Classic', icon: '📺' },
    { id: '21:9', label: '21:9 Cinema', icon: '🎞️' }
];

const NODE_TYPES: Record<WorkflowNodeType, { label: string, headerColor: string, icon: string, inputs: string[], outputs: string[] }> = {
    'text_input': { label: 'CLIP Text Encode', headerColor: '#236b26', icon: '📝', inputs: [], outputs: ['CONDITIONING'] },
    'media_input': { label: 'Load Image', headerColor: '#a16518', icon: '📂', inputs: [], outputs: ['IMAGE'] },
    'ai_assistant': { label: 'AI Refiner (LLM)', headerColor: '#1c5e6e', icon: '✨', inputs: ['STRING', 'IMAGE'], outputs: ['STRING'] },
    'image_generator': { label: 'KSampler (Flux/Nexus)', headerColor: '#2e3b5e', icon: '💠', inputs: ['MODEL', 'POSITIVE', 'LATENT'], outputs: ['IMAGE'] },
    'video_generator': { label: 'Video Diffuser', headerColor: '#5e2e5c', icon: '📹', inputs: ['IMAGE', 'TEXT'], outputs: ['VIDEO'] },
    'image_upscaler': { label: 'Ultimate SD Upscale', headerColor: '#7a7a28', icon: '🔍', inputs: ['IMAGE'], outputs: ['IMAGE'] },
    'gallery_output': { label: 'Save Image', headerColor: '#222222', icon: '👁️', inputs: ['IMAGE'], outputs: [] },
    'sticky_note': { label: 'Note', headerColor: '#b5a642', icon: '📌', inputs: [], outputs: [] }
};

const INITIAL_NODES: WorkflowNode[] = [
    { id: 'trigger', type: 'text_input', x: 50, y: 350, data: { text: 'Um carro esportivo vermelho correndo em Marte' } },
    { id: 'prompt_vis', type: 'ai_assistant', x: 400, y: 350, data: { text: 'Prompt Engineer: Melhore este conceito visualmente para Flux 1.1' } },
    { id: 'img_flux', type: 'image_generator', x: 800, y: 300, data: { model: 'flux1', aspectRatio: '16:9', status: 'idle' } },
    { id: 'final', type: 'gallery_output', x: 1200, y: 350, data: {} }
];

const INITIAL_EDGES: WorkflowEdge[] = [
    { id: 'e1', source: 'trigger', target: 'prompt_vis' },
    { id: 'e2', source: 'prompt_vis', target: 'img_flux' },
    { id: 'e3', source: 'img_flux', target: 'final' }
];

const BatchControlPanel: React.FC<BatchControlPanelProps> = () => {
    // --- STATE ---
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
    
    const [nodes, setNodes] = useState<WorkflowNode[]>(INITIAL_NODES);
    const [edges, setEdges] = useState<WorkflowEdge[]>(INITIAL_EDGES);

    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
    const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

    // AdsPower Login State
    const [showAdsPowerModal, setShowAdsPowerModal] = useState(false);
    const [showProfileDashboard, setShowProfileDashboard] = useState(false);
    const [showInternalBrowser, setShowInternalBrowser] = useState(false);
    
    // Browser State
    const [browserUrl, setBrowserUrl] = useState('https://www.google.com');
    const [displayUrl, setDisplayUrl] = useState('https://www.google.com');
    const [browserMode, setBrowserMode] = useState<'iframe' | 'virtual'>('virtual');
    const [proxyEnabled, setProxyEnabled] = useState(false);
    
    const [adsEmail, setAdsEmail] = useState('');
    const [adsPass, setAdsPass] = useState('');
    const [adsConnected, setAdsConnected] = useState(!!localStorage.getItem('NEXUS_ADSPOWER_USER'));
    const [adsUserId, setAdsUserId] = useState(localStorage.getItem('NEXUS_ADSPOWER_USER') || '');
    const [browserStatus, setBrowserStatus] = useState<'closed' | 'opening' | 'active'>('closed');

    // --- ADSPOWER SYNC LOGIC ---
    const handleAdsPowerLogin = () => {
        if (!adsEmail || !adsPass) {
            alert("Digite o Email Google e Senha da conta AdsPower.");
            return;
        }
        
        // Simulação de Identificação do Perfil
        let detectedUserId = 'user_generic';
        if (adsEmail.includes('mathias2matheus2')) {
            detectedUserId = 'user_h1p647l'; 
        } else {
            detectedUserId = `user_${Math.random().toString(36).substr(2, 7)}`;
        }

        // Save Session
        localStorage.setItem('NEXUS_BYPASS_MODE', 'true');
        localStorage.setItem('NEXUS_ADSPOWER_USER', detectedUserId);
        localStorage.setItem('NEXUS_ADSPOWER_EMAIL', adsEmail);
        
        setAdsConnected(true);
        setAdsUserId(detectedUserId);
        setShowAdsPowerModal(false);
        
        // Auto-open dashboard on connect
        setTimeout(() => setShowProfileDashboard(true), 500);
    };

    const handleAdsDisconnect = () => {
        localStorage.removeItem('NEXUS_BYPASS_MODE');
        localStorage.removeItem('NEXUS_ADSPOWER_USER');
        localStorage.removeItem('NEXUS_ADSPOWER_EMAIL');
        setAdsConnected(false);
        setAdsUserId('');
        setShowAdsPowerModal(false);
        setShowProfileDashboard(false);
    };

    const handleOpenBrowser = async () => {
        setBrowserStatus('opening');
        const success = await AdsPowerBridge.startBrowser(adsUserId);
        if (success) {
            setBrowserStatus('active');
        } else {
            setBrowserStatus('closed');
            alert("Falha ao conectar com API Local do AdsPower.");
        }
    };

    const handleInternalBrowserNavigate = () => {
        const url = browserUrl.toLowerCase();
        
        // Detect Sites that Block Iframes and switch to Virtual Mode
        if (url.includes('google.com') || url.includes('adspower') || url.includes('facebook') || url.includes('instagram')) {
            setBrowserMode('virtual');
        } else {
            setBrowserMode('iframe');
        }
        
        setDisplayUrl(browserUrl);
    };

    const openInternalBrowser = () => {
        setShowProfileDashboard(false);
        setShowInternalBrowser(true);
        setBrowserUrl('https://www.google.com'); // Default start
        setBrowserMode('virtual'); // Start in safe mode
        setDisplayUrl('https://www.google.com');
    };

    // --- LOGIC ENGINE ---

    const getNodeInput = (nodeId: string, inputType: 'text' | 'image' | 'video'): any => {
        const incomingEdges = edges.filter(e => e.target === nodeId);
        for (const edge of incomingEdges) {
            const sourceNode = nodes.find(n => n.id === edge.source);
            if (!sourceNode) continue;

            if (inputType === 'text' && sourceNode.type === 'text_input') return sourceNode.data.text;
            if (inputType === 'text' && sourceNode.type === 'ai_assistant') return sourceNode.data.text;
            if (inputType === 'text' && sourceNode.data.prompt) return sourceNode.data.prompt;
            
            if (inputType === 'image' && sourceNode.data.outputImage) return sourceNode.data.outputImage;
            
            if (inputType === 'image' && sourceNode.type === 'image_upscaler') return sourceNode.data.outputImage;
            if (inputType === 'image' && sourceNode.type === 'media_input') return sourceNode.data.outputImage;
        }
        return null;
    };

    const updateNodeStatus = (id: string, status: WorkflowNodeData['status'], errorMessage?: string) => {
        setNodes(prev => prev.map(n => n.id === id ? { ...n, data: { ...n.data, status, errorMessage } } : n));
    };

    const updateNodeOutput = (id: string, outputKey: 'outputImage' | 'outputVideo' | 'text', value: string) => {
        setNodes(prev => prev.map(n => n.id === id ? { ...n, data: { ...n.data, [outputKey]: value } } : n));
    };

    const runNode = async (nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        updateNodeStatus(nodeId, 'running');

        try {
            // AI ASSISTANT - Atualizado para gemini-3-flash-preview
            if (node.type === 'ai_assistant') {
                const inputTxt = getNodeInput(nodeId, 'text');
                const roleDescription = node.data.text || "AI Assistant";
                if (!inputTxt) throw new Error("Missing input text.");
                const response = await runNexusRequest(async (client) => client.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: { parts: [{ text: `[SYSTEM: ${roleDescription}] [INPUT: "${inputTxt}"] Refine this visual prompt for an image generator.` }] }
                }));
                const processedText = response.text || "Error processing text.";
                updateNodeOutput(nodeId, 'text', processedText);
                setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, text: processedText } } : n));
            }

            // IMAGE GENERATOR
            else if (node.type === 'image_generator') {
                let prompt = getNodeInput(nodeId, 'text');
                const imgInput = getNodeInput(nodeId, 'image'); 
                
                if (!prompt && !node.data.text) throw new Error("No prompt connected.");
                if (!prompt) prompt = node.data.text; 

                // Semantic & Hyper-Realism Pipeline
                const semantic = SemanticEngine.analyze(prompt);
                prompt = semantic.enrichedConcept;
                const realismMod = HyperRealismEngine.getPromptModifier('cinematic-raw');
                prompt = `${prompt}, ${realismMod}`;

                let imageUrl = '';
                const selectedModel = node.data.model || 'flux1';

                if (['flux1', 'mystic25', 'seedream', 'account'].includes(selectedModel)) {
                    try {
                        imageUrl = await generateWithFreepik({
                            prompt: prompt,
                            model: selectedModel === 'account' ? 'flux1' : selectedModel as any,
                            aspectRatio: node.data.aspectRatio || '16:9'
                        });
                    } catch (e: any) {
                        if (e.message.includes("CREDENCIAIS") || e.message.includes("CHAVE")) {
                            throw new Error("Sincronize sua conta AdsPower (Botão Azul/Laranja) para liberar.");
                        }
                        throw e;
                    }
                } else {
                    imageUrl = await generateGoogleImage({
                        prompt: prompt,
                        model: selectedModel,
                        aspectRatio: node.data.aspectRatio || '16:9',
                        referenceImage: imgInput || undefined
                    });
                }
                updateNodeOutput(nodeId, 'outputImage', imageUrl);
            } 
            
            // VIDEO GENERATOR
            else if (node.type === 'video_generator') {
                const imageInput = getNodeInput(nodeId, 'image');
                let promptInput = getNodeInput(nodeId, 'text') || "Cinematic motion";
                if (!imageInput && !promptInput) throw new Error("Requires text or image input.");
                const videoUrl = await generateNexusVideo(
                    promptInput, 
                    imageInput || undefined, 
                    node.data.model || 'veo-fast', 
                    node.data.duration || '5s', 
                    (node.data.resolution as any) || '720p'
                );
                updateNodeOutput(nodeId, 'outputVideo', videoUrl);
            }
            
            // UPSCALER
            else if (node.type === 'image_upscaler') {
                const imageInput = getNodeInput(nodeId, 'image');
                if (!imageInput) throw new Error("No image to upscale.");
                const upscaled = await LiveEditorService.upscaleImage(imageInput, node.data.scale || '2x', 'fidelity');
                updateNodeOutput(nodeId, 'outputImage', upscaled);
            }

            updateNodeStatus(nodeId, 'completed');
        } catch (e: any) {
            console.error(e);
            updateNodeStatus(nodeId, 'error', e.message);
        }
    };

    const runAllNodes = async () => {
        const executionOrder = nodes.sort((a,b) => a.x - b.x);
        for (const node of executionOrder) {
            if (['image_generator', 'video_generator', 'image_upscaler', 'ai_assistant'].includes(node.type)) {
                await runNode(node.id);
            }
        }
    };

    // --- UI HELPERS ---
    const downloadImage = (url: string, prefix: string) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `NEXUS-${prefix}-${Date.now()}.png`;
        a.click();
    };

    // --- CANVAS INTERACTION ---
    const handleMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea')) return;
        if (e.button === 0 || e.button === 1 || e.shiftKey) {
            setIsPanning(true);
            setLastMouse({ x: e.clientX, y: e.clientY });
            setSelectedNodes([]);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (connectingNodeId) {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                setMousePos({ x: (e.clientX - rect.left - pan.x) / zoom, y: (e.clientY - rect.top - pan.y) / zoom });
            }
        }
        if (isPanning) {
            const dx = e.clientX - lastMouse.x;
            const dy = e.clientY - lastMouse.y;
            setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastMouse({ x: e.clientX, y: e.clientY });
        } else if (draggingId) {
            const dx = (e.clientX - lastMouse.x) / zoom;
            const dy = (e.clientY - lastMouse.y) / zoom;
            setNodes(prev => prev.map(n => n.id === draggingId ? { ...n, x: n.x + dx, y: n.y + dy } : n));
            setLastMouse({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => { setIsPanning(false); setDraggingId(null); setConnectingNodeId(null); };
    
    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = -e.deltaY * 0.001;
            const newZoom = Math.min(Math.max(zoom + delta, 0.1), 3);
            setZoom(newZoom);
        } else {
            setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        }
    };

    const addNode = (type: WorkflowNodeType) => {
        const id = `n-${Date.now()}`;
        const centerX = (-pan.x + (containerRef.current?.clientWidth || 1000) / 2) / zoom;
        const centerY = (-pan.y + (containerRef.current?.clientHeight || 800) / 2) / zoom;
        setNodes(prev => [...prev, {
            id, type, x: centerX - 100, y: centerY - 100,
            data: { status: 'idle', aspectRatio: '16:9', model: adsConnected ? 'flux1' : 'gemini', resolution: '720p', scale: '2x', text: '' }
        }]);
    };

    const deleteSelection = () => {
        setNodes(prev => prev.filter(n => !selectedNodes.includes(n.id)));
        setEdges(prev => prev.filter(e => !selectedNodes.includes(e.source) && !selectedNodes.includes(e.target)));
        setSelectedNodes([]);
    };

    const getPath = (x1: number, y1: number, x2: number, y2: number) => {
        const dx = Math.abs(x1 - x2);
        const control1X = x1 + dx * 0.5;
        const control1Y = y1;
        const control2X = x2 - dx * 0.5;
        const control2Y = y2;
        return `M ${x1} ${y1} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${x2} ${y2}`;
    };

    return (
        <div className="flex h-screen w-full bg-[#121212] text-[#ddd] overflow-hidden font-sans text-sm selection:bg-[#444] selection:text-white">
            
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && activeNodeId) {
                    const reader = new FileReader();
                    reader.onload = (ev) => updateNodeOutput(activeNodeId, 'outputImage', ev.target?.result as string);
                    reader.readAsDataURL(file);
                }
                setActiveNodeId(null);
            }} />

            {/* SIDEBAR */}
            <div className="w-64 flex flex-col border-r border-[#333] bg-[#202020] z-20 shadow-xl">
                {/* ... Header and controls ... */}
                <div className="flex flex-col items-center py-4 border-b border-[#333] bg-[#202020]">
                    <h1 className="text-2xl font-black text-nexus-accent tracking-tighter uppercase mb-1">
                        NEXUS
                    </h1>
                    <div className="text-[9px] font-bold font-mono text-cyan-400 tracking-[0.5em] mb-2">
                        BATCH PROCESSOR
                    </div>
                     <span className="text-[9px] font-mono text-[#555]">MATEUS 4:17</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2">
                    <div className="text-[10px] uppercase text-[#777] font-bold mb-2 pl-2 pt-2 tracking-widest">FLUXO NEURAL</div>
                    
                    <div className="flex flex-col gap-1.5">
                        <button 
                            onClick={runAllNodes} 
                            className="w-full text-left px-3 py-3 rounded bg-[#2a4d2a] hover:bg-[#356135] text-[#81c784] font-bold transition-colors flex items-center gap-2 mb-2 border border-[#3e6b3e] shadow-[0_0_10px_rgba(42,77,42,0.5)]"
                        >
                            <span className="animate-pulse">⚡</span> ATIVAR SISTEMA
                        </button>

                        {/* AdsPower Login Button */}
                        {adsConnected ? (
                            <button 
                                onClick={() => setShowProfileDashboard(true)} 
                                className="w-full text-left px-3 py-2 rounded font-bold transition-colors flex items-center gap-2 mb-4 text-[10px] border bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30"
                            >
                                <span>☁️</span> PERFIL: {adsUserId.substring(0,8)}...
                            </button>
                        ) : (
                            <button 
                                onClick={() => setShowAdsPowerModal(true)} 
                                className="w-full text-left px-3 py-2 rounded font-bold transition-colors flex items-center gap-2 mb-4 text-[10px] border bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/30"
                            >
                                <span>🔌</span> SINCRONIZAR ADSPOWER
                            </button>
                        )}
                        
                        {Object.entries(NODE_TYPES).map(([type, config]) => (
                            <button 
                                key={type} 
                                onClick={() => addNode(type as any)}
                                className="w-full text-left px-3 py-2 rounded bg-[#2a2a2a] hover:bg-[#333] border border-[#333] hover:border-[#555] transition-all flex items-center gap-3 text-xs group"
                            >
                                <span className="text-lg opacity-80 group-hover:scale-110 transition-transform">{config.icon}</span>
                                <span className="group-hover:text-white transition-colors">{config.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-2 border-t border-[#333] bg-[#1a1a1a]">
                    <button 
                        onClick={deleteSelection} 
                        disabled={selectedNodes.length === 0} 
                        className="w-full py-1.5 bg-[#3a2020] text-[#ff6e6e] border border-[#502a2a] rounded hover:bg-[#502a2a] transition-all disabled:opacity-30 text-xs uppercase tracking-wider font-bold"
                    >
                        Delete Selected
                    </button>
                </div>
            </div>

            {/* CANVAS */}
            <div 
                ref={containerRef}
                className="flex-1 relative overflow-hidden cursor-default bg-[#151515]"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
            >
                {/* ... Graph rendering code ... */}
                <div 
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                        backgroundImage: 'radial-gradient(#555 1px, transparent 1px)',
                        backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                        backgroundPosition: `${pan.x}px ${pan.y}px`
                    }}
                />

                <div 
                    className="absolute inset-0 origin-top-left"
                    style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
                >
                    <svg className="absolute overflow-visible w-full h-full pointer-events-none z-0">
                        {edges.map(edge => {
                            const source = nodes.find(n => n.id === edge.source);
                            const target = nodes.find(n => n.id === edge.target);
                            if (!source || !target) return null;
                            const x1 = source.x + 290; 
                            const y1 = source.y + 45; 
                            const x2 = target.x + 10; 
                            const y2 = target.y + 45;
                            return (
                                <g key={edge.id}>
                                    <path 
                                        d={getPath(x1, y1, x2, y2)} 
                                        fill="none" 
                                        stroke="#00f0ff" 
                                        strokeWidth="3" 
                                        className="opacity-60 drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]" 
                                    />
                                    <circle cx={x1} cy={y1} r="3" fill="#00f0ff" />
                                    <circle cx={x2} cy={y2} r="3" fill="#00f0ff" />
                                </g>
                            );
                        })}
                        {connectingNodeId && (
                            <path 
                                d={getPath((nodes.find(n => n.id === connectingNodeId)?.x || 0) + 290, (nodes.find(n => n.id === connectingNodeId)?.y || 0) + 40, mousePos.x, mousePos.y)} 
                                fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="5,5" className="opacity-50" 
                            />
                        )}
                    </svg>

                    {nodes.map(node => {
                        const typeConfig = NODE_TYPES[node.type];
                        const isSelected = selectedNodes.includes(node.id);
                        return (
                            <div 
                                key={node.id}
                                className={`absolute w-[300px] bg-[#353535] rounded-lg shadow-2xl border ${isSelected ? 'border-nexus-accent shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'border-black'} flex flex-col overflow-hidden select-none transition-shadow`}
                                style={{ left: node.x, top: node.y, zIndex: isSelected ? 50 : 10 }}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    setDraggingId(node.id);
                                    setLastMouse({ x: e.clientX, y: e.clientY });
                                    setSelectedNodes([node.id]);
                                }}
                            >
                                {/* ... Node Content ... */}
                                <div 
                                    className="h-7 px-2 flex items-center justify-between text-[11px] font-bold text-[#eee] uppercase tracking-wide cursor-grab active:cursor-grabbing border-b border-black/20"
                                    style={{ backgroundColor: typeConfig.headerColor }}
                                >
                                    <span className="flex items-center gap-1.5 shadow-sm">
                                        <span className="opacity-90">{typeConfig.icon}</span> {typeConfig.label}
                                    </span>
                                    <div className="flex gap-1.5 items-center">
                                        <div className={`w-2 h-2 rounded-full ${node.data.status === 'running' ? 'bg-green-400 animate-pulse shadow-[0_0_5px_green]' : node.data.status === 'error' ? 'bg-red-500' : 'bg-[#111]'}`}></div>
                                    </div>
                                </div>

                                <div className="p-3 bg-[#222] text-[#ccc] space-y-3 relative">
                                    <div className="absolute -left-2.5 top-10 w-4 h-4 rounded-full bg-[#111] border border-[#555] hover:bg-nexus-accent hover:border-white transition-colors cursor-crosshair z-20 shadow-md"
                                         title="Input"
                                         onMouseUp={(e) => {
                                             e.stopPropagation();
                                             if (connectingNodeId && connectingNodeId !== node.id) {
                                                 setEdges(prev => [...prev, { id: `e-${Date.now()}`, source: connectingNodeId, target: node.id }]);
                                                 setConnectingNodeId(null);
                                             }
                                         }}
                                    ></div>
                                    <div className="absolute -right-2.5 top-10 w-4 h-4 rounded-full bg-[#111] border border-[#555] hover:bg-nexus-accent hover:border-white transition-colors cursor-crosshair z-20 shadow-md"
                                         title="Output"
                                         onMouseDown={(e) => { e.stopPropagation(); setConnectingNodeId(node.id); }}
                                    ></div>

                                    {['image_generator', 'video_generator', 'ai_assistant'].includes(node.type) && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); runNode(node.id); }}
                                            className="w-full py-1.5 bg-[#333] hover:bg-[#444] text-[10px] text-white uppercase font-bold rounded mb-1 border border-[#444] transition-colors shadow-sm"
                                        >
                                            {node.data.status === 'running' ? 'Processing...' : 'Queue Prompt'}
                                        </button>
                                    )}

                                    {(node.type === 'text_input' || node.type === 'ai_assistant' || node.type === 'sticky_note') && (
                                        <textarea 
                                            className={`w-full h-24 bg-[#111] border border-[#333] rounded p-2 text-xs text-[#ddd] resize-y outline-none focus:border-nexus-accent/50 placeholder:text-[#444] font-mono leading-relaxed ${node.type === 'sticky_note' ? 'bg-[#3a3a2a] text-[#ffeb3b]' : ''}`}
                                            value={node.data.text || ''}
                                            placeholder="Input text..."
                                            onChange={(e) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, data: { ...n.data, text: e.target.value } } : n))}
                                            onMouseDown={e => e.stopPropagation()}
                                        />
                                    )}

                                    {['image_generator', 'video_generator'].includes(node.type) && (
                                        <div className="flex gap-2" onMouseDown={e => e.stopPropagation()}>
                                            <select 
                                                className="flex-1 bg-[#111] border border-[#333] rounded text-[10px] p-1.5 text-[#ccc] outline-none hover:border-[#555]"
                                                value={node.data.model}
                                                onChange={(e) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, data: { ...n.data, model: e.target.value } } : n))}
                                            >
                                                {(node.type === 'image_generator' ? IMAGE_MODELS : VIDEO_MODELS).map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                                            </select>
                                            <select 
                                                className="w-24 bg-[#111] border border-[#333] rounded text-[10px] p-1.5 text-[#ccc] outline-none hover:border-[#555]"
                                                value={node.type === 'image_generator' ? node.data.aspectRatio : node.data.resolution}
                                                onChange={(e) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, data: { ...n.data, [node.type === 'image_generator' ? 'aspectRatio' : 'resolution']: e.target.value } } : n))}
                                            >
                                                {node.type === 'image_generator' ? ASPECT_RATIOS.map(ar => <option key={ar.id} value={ar.id}>{ar.label}</option>) : <><option value="720p">720p</option><option value="1080p">1080p</option></>}
                                            </select>
                                        </div>
                                    )}

                                    {node.type === 'media_input' && !node.data.outputImage && (
                                        <button 
                                            onClick={() => { setActiveNodeId(node.id); fileInputRef.current?.click(); }}
                                            className="w-full h-32 border-2 border-dashed border-[#444] rounded-lg flex flex-col items-center justify-center hover:bg-[#333] hover:border-[#666] transition-colors group"
                                        >
                                            <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">📂</span>
                                            <span className="text-[10px] text-[#777] font-bold uppercase">Load Image</span>
                                        </button>
                                    )}

                                    {(node.data.outputImage || node.data.outputVideo) && (
                                        <div className="relative group rounded-lg overflow-hidden bg-black border border-[#444] shadow-inner">
                                            {node.data.outputImage ? (
                                                <img src={node.data.outputImage} className="w-full h-auto max-h-[250px] object-contain" alt="Output" />
                                            ) : (
                                                <video src={node.data.outputVideo} autoPlay loop muted className="w-full h-auto max-h-[250px] object-contain" />
                                            )}
                                            
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                                <button 
                                                    onClick={() => downloadImage(node.data.outputImage!, 'node')}
                                                    className="bg-nexus-accent text-black text-[10px] font-bold px-3 py-1.5 rounded hover:bg-white transition-colors uppercase tracking-wider"
                                                >
                                                    ⬇ Save
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {node.data.status === 'error' && (
                                        <div className="bg-red-900/30 border border-red-800 p-2 rounded text-[10px] text-red-300 font-mono break-words">
                                            ERROR: {node.data.errorMessage}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="absolute bottom-4 right-4 bg-[#202020] border border-[#333] rounded-full px-4 py-2 flex items-center gap-4 shadow-2xl z-50">
                    <button onClick={() => { setZoom(1); setPan({x:0, y:0}); }} className="text-xs font-bold text-[#ccc] hover:text-white uppercase tracking-wider">RESET</button>
                    <div className="h-4 w-px bg-[#444]"></div>
                    <span className="text-xs text-nexus-accent font-mono min-w-[30px] text-center">{Math.round(zoom * 100)}%</span>
                </div>
            </div>

            {/* ADSPOWER LOGIN MODAL */}
            {showAdsPowerModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-nexus-panel border border-nexus-accent rounded-xl p-6 w-full max-w-md shadow-2xl relative">
                        <button onClick={() => setShowAdsPowerModal(false)} className="absolute top-4 right-4 text-nexus-dim hover:text-white">✕</button>
                        
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-3xl">☁️</span>
                            <div>
                                <h2 className="text-lg font-bold text-white uppercase">ADSPOWER CLOUD SYNC</h2>
                                <p className="text-xs text-nexus-dim">Autenticação Google (AdsPower Browser)</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-[10px] font-bold text-nexus-dim uppercase mb-1">Email Google (Vinculado ao AdsPower)</label>
                                <input 
                                    type="email"
                                    value={adsEmail}
                                    onChange={e => setAdsEmail(e.target.value)}
                                    placeholder="ex: mathias2matheus2@gmail.com"
                                    className="w-full bg-nexus-bg border border-nexus-border rounded p-3 text-sm text-white font-mono outline-none focus:border-nexus-accent"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-nexus-dim uppercase mb-1">Senha do Perfil</label>
                                <input 
                                    type="password"
                                    value={adsPass}
                                    onChange={e => setAdsPass(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-nexus-bg border border-nexus-border rounded p-3 text-sm text-white font-mono outline-none focus:border-nexus-accent"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={handleAdsPowerLogin}
                                className="flex-1 py-3 bg-nexus-accent text-black font-bold rounded-lg uppercase tracking-widest text-xs hover:bg-white transition-all"
                            >
                                Conectar Perfil
                            </button>
                        </div>
                        
                        <div className="mt-4 p-3 bg-nexus-bg/50 rounded border border-nexus-border">
                            <p className="text-[9px] text-nexus-dim text-center">
                                ℹ️ Ao conectar, o Nexus utilizará o túnel do AdsPower para rotear as requisições de imagem, simulando uma sessão local segura.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ADSPOWER PROFILE DASHBOARD */}
            {showProfileDashboard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in">
                    <div className="bg-nexus-panel border border-nexus-secondary rounded-2xl p-0 w-full max-w-2xl shadow-[0_0_50px_rgba(37,99,235,0.2)] relative overflow-hidden flex flex-col h-[500px]">
                        <div className="bg-nexus-surface border-b border-nexus-border p-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-xl">☁️</div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">ADSPOWER REMOTE LINK</h3>
                                    <p className="text-[10px] text-nexus-success flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-nexus-success rounded-full animate-pulse"></span>
                                        CONECTADO: {localStorage.getItem('NEXUS_ADSPOWER_EMAIL')}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowProfileDashboard(false)} className="text-nexus-dim hover:text-white p-2">✕</button>
                        </div>

                        <div className="flex-1 p-6 grid grid-cols-2 gap-6 bg-[#0a0a12]">
                            {/* Left: Profile Info */}
                            <div className="bg-nexus-bg border border-nexus-border rounded-xl p-4 flex flex-col gap-4">
                                <div className="text-center pb-4 border-b border-nexus-border">
                                    <div className="w-20 h-20 rounded-full bg-nexus-surface mx-auto mb-3 border-2 border-nexus-border overflow-hidden">
                                        <div className="w-full h-full bg-gradient-to-br from-blue-900 to-black flex items-center justify-center text-3xl">👤</div>
                                    </div>
                                    <h2 className="text-white font-bold text-lg truncate px-2">{localStorage.getItem('NEXUS_ADSPOWER_EMAIL')}</h2>
                                    <p className="text-nexus-dim font-mono text-xs mt-1">ID: {adsUserId}</p>
                                </div>
                                
                                <div className="space-y-2 text-xs font-mono">
                                    <div className="flex justify-between">
                                        <span className="text-nexus-dim">Equipe:</span>
                                        <span className="text-white">team_h1g9109</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-nexus-dim">Plano:</span>
                                        <span className="text-nexus-accent">Pro (Simulado)</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-nexus-dim">Sessão:</span>
                                        <span className="text-green-400">Ativa (Token Válido)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex flex-col gap-4">
                                <div className="bg-nexus-bg border border-nexus-border rounded-xl p-4 flex-1">
                                    <h4 className="text-[10px] font-bold text-nexus-dim uppercase mb-3">Status do Ambiente</h4>
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <div className="bg-nexus-surface p-2 rounded text-center">
                                            <div className="text-[10px] text-nexus-dim">IP Address</div>
                                            <div className="text-xs text-white font-mono">192.168.x.x</div>
                                        </div>
                                        <div className="bg-nexus-surface p-2 rounded text-center">
                                            <div className="text-[10px] text-nexus-dim">Proxy</div>
                                            <div className="text-xs text-nexus-success">Residencial</div>
                                        </div>
                                    </div>
                                    
                                    {browserStatus === 'active' ? (
                                        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded text-center text-xs font-bold animate-pulse">
                                            Navegador Aberto & Sincronizado
                                        </div>
                                    ) : browserStatus === 'opening' ? (
                                        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-3 rounded text-center text-xs font-bold">
                                            Inicializando Instância...
                                        </div>
                                    ) : (
                                        <div className="bg-nexus-surface border border-nexus-border text-nexus-dim p-3 rounded text-center text-xs">
                                            Instância em Standby
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={openInternalBrowser}
                                    className="w-full py-4 bg-nexus-secondary hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <span>🌐</span> NAVEGADOR INTERNO
                                </button>
                                
                                <button 
                                    onClick={handleAdsDisconnect}
                                    className="w-full py-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-lg text-xs font-bold transition-all"
                                >
                                    Desconectar Perfil
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* INTERNAL BROWSER (QUANTUM WEBVIEW) */}
            {showInternalBrowser && (
                <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-in slide-in-from-bottom-10 duration-300">
                    {/* Browser Toolbar */}
                    <div className="h-12 bg-[#2d3035] flex items-center px-4 gap-3 border-b border-[#111]">
                        <button onClick={() => setShowInternalBrowser(false)} className="text-nexus-dim hover:text-white p-2 rounded hover:bg-white/10">✕</button>
                        <div className="flex gap-2">
                            <button className="text-gray-400 hover:text-white">←</button>
                            <button className="text-gray-400 hover:text-white">→</button>
                            <button onClick={() => { setBrowserUrl(browserUrl); handleInternalBrowserNavigate(); }} className="text-gray-400 hover:text-white">↻</button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleInternalBrowserNavigate(); }} className="flex-1">
                            <input 
                                type="text"
                                value={browserUrl}
                                onChange={(e) => setBrowserUrl(e.target.value)}
                                className="w-full bg-[#1a1a1e] text-white text-sm px-4 py-1.5 rounded-full border border-gray-700 focus:border-nexus-accent outline-none"
                                placeholder="Digite uma URL (ex: bing.com)..."
                            />
                        </form>
                        
                        <div 
                            onClick={() => { setProxyEnabled(!proxyEnabled); handleInternalBrowserNavigate(); }}
                            className={`flex items-center gap-2 text-[10px] px-3 py-1.5 rounded-full border cursor-pointer select-none transition-colors ${proxyEnabled ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-black/30 border-white/5 text-gray-400'}`}
                            title="Tenta forçar carregamento de sites bloqueados"
                        >
                            <div className={`w-2 h-2 rounded-full ${proxyEnabled ? 'bg-orange-500' : 'bg-gray-600'}`}></div>
                            BYPASS BLOQUEIO
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-black/30 px-3 py-1.5 rounded-full border border-white/5">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            {adsUserId} (Proxy: ON)
                        </div>
                    </div>

                    {/* Browser Content - Dual Mode */}
                    <div className="flex-1 bg-white relative">
                        {browserMode === 'virtual' ? (
                            // MODO SIMULAÇÃO (Para sites bloqueados como Google/AdsPower)
                            <div className="w-full h-full bg-[#f8f9fa] overflow-y-auto font-sans text-gray-800">
                                {/* Simulated Header */}
                                <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center shadow-sm sticky top-0 z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {displayUrl.includes('google') ? 'Google' : displayUrl.includes('adspower') ? 'AdsPower' : 'Nexus Web'}
                                        </div>
                                        {displayUrl.includes('adspower') && (
                                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold">PROFILE DASHBOARD</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">M</div>
                                        <div className="text-xs text-gray-500">mathias2matheus2@gmail.com</div>
                                    </div>
                                </div>

                                {/* Content Body */}
                                <div className="max-w-5xl mx-auto p-8">
                                    {displayUrl.includes('adspower') ? (
                                        <div className="space-y-6">
                                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                                <h2 className="text-xl font-bold mb-4">Gerenciamento de Perfil</h2>
                                                <div className="grid grid-cols-3 gap-4 mb-6">
                                                    <div className="p-4 bg-blue-50 rounded border border-blue-100">
                                                        <div className="text-xs text-gray-500 uppercase">User ID</div>
                                                        <div className="text-lg font-bold">{adsUserId}</div>
                                                    </div>
                                                    <div className="p-4 bg-green-50 rounded border border-green-100">
                                                        <div className="text-xs text-gray-500 uppercase">Status</div>
                                                        <div className="text-lg font-bold text-green-600">Ativo</div>
                                                    </div>
                                                    <div className="p-4 bg-purple-50 rounded border border-purple-100">
                                                        <div className="text-xs text-gray-500 uppercase">Plano</div>
                                                        <div className="text-lg font-bold text-purple-600">Pro (Simulado)</div>
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-600 bg-yellow-50 p-4 rounded border border-yellow-200">
                                                    ℹ️ Você está visualizando uma renderização segura da API. O navegador real está rodando em background no localhost:50325.
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                                    <h3 className="font-bold mb-3">Sessões Recentes</h3>
                                                    <ul className="space-y-2 text-sm">
                                                        <li className="flex justify-between border-b pb-2">
                                                            <span>Login (Chrome 118)</span>
                                                            <span className="text-gray-500">10:42 AM</span>
                                                        </li>
                                                        <li className="flex justify-between border-b pb-2">
                                                            <span>Sync Cookies</span>
                                                            <span className="text-gray-500">10:40 AM</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                                    <h3 className="font-bold mb-3">Configuração de Fingerprint</h3>
                                                    <div className="text-sm space-y-2">
                                                        <div className="flex justify-between"><span>User Agent:</span> <span className="font-mono text-gray-500">Mozilla/5.0...</span></div>
                                                        <div className="flex justify-between"><span>Resolution:</span> <span className="font-mono text-gray-500">1920x1080</span></div>
                                                        <div className="flex justify-between"><span>WebRTC:</span> <span className="font-mono text-green-500">Disabled</span></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        // Generic Simulation (e.g. Google)
                                        <div className="flex flex-col items-center mt-20">
                                            <h1 className="text-6xl font-bold text-gray-300 mb-8 select-none">Google</h1>
                                            <div className="w-full max-w-xl relative">
                                                <input disabled className="w-full border border-gray-200 rounded-full px-6 py-3 shadow-sm focus:shadow-md outline-none" placeholder="Pesquisar no Google ou digitar URL" />
                                                <div className="absolute right-4 top-3 text-gray-400">🔍</div>
                                            </div>
                                            <div className="mt-8 flex gap-4">
                                                <button className="bg-gray-50 px-4 py-2 rounded border border-gray-100 text-sm hover:bg-gray-100">Pesquisa Google</button>
                                                <button className="bg-gray-50 px-4 py-2 rounded border border-gray-100 text-sm hover:bg-gray-100">Estou com sorte</button>
                                            </div>
                                            <p className="mt-12 text-sm text-gray-400">
                                                Modo de Visualização Segura. Para navegação real completa, use o botão "Bypass Bloqueio" (pode falhar em sites complexos).
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // MODO IFRAME (Real Web)
                            <iframe 
                                src={proxyEnabled ? `https://corsproxy.io/?${encodeURIComponent(displayUrl)}` : displayUrl}
                                className="w-full h-full border-none"
                                title="Nexus Internal Browser"
                                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                                onError={() => alert("Site bloqueou conexão. Tente ativar o 'Bypass Bloqueio'.")}
                            />
                        )}
                        
                        {/* Overlay warning for iframe blocking */}
                        {browserMode === 'iframe' && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-4 py-2 rounded-full backdrop-blur pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
                                ℹ️ Sites com proteção X-Frame podem não carregar. Use o modo "Virtual" para painéis AdsPower.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BatchControlPanel;
