
import React, { useState, useRef } from 'react';
import { generateNexusVideo } from '../geminiService';
import { generateFreepikVideo } from '../freepikService';

const VIDEO_ENGINES = [
    { id: 'veo-fast', name: 'VEO 3.1 FAST', provider: 'Google', icon: '⚡', desc: 'Sincronização neural instantânea' },
    { id: 'veo-hq', name: 'VEO 3.1 HQ', provider: 'Google', icon: '💎', desc: 'Qualidade máxima cinematográfica' },
    { id: 'pikaso-motion', name: 'PIKASO MOTION', provider: 'Freepik', icon: '🎨', desc: 'Estilo artístico e fluidez extrema' },
    { id: 'flux-motion', name: 'FLUX.1 MOTION', provider: 'AdsPower', icon: '💠', desc: 'Fotorrealismo e consistência' }
];

const VideoStudio: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [imageInput, setImageInput] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [selectedEngine, setSelectedEngine] = useState('veo-fast');
    const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
    const [loadingMsg, setLoadingMsg] = useState('Inicializando Motor...');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGenerate = async () => {
        if (!prompt && !imageInput) return alert("Por favor forneça um prompt ou uma imagem.");
        
        setIsGenerating(true);
        setVideoUrl(null);
        
        // Mensagens dinâmicas de loading
        const msgs = [
            "Conectando ao Uplink Neural...",
            "Processando Frames de Referência...",
            "Sintetizando Vetores de Movimento...",
            "Ajustando Iluminação Volumétrica...",
            "Renderizando Master Quântico...",
            "Quase pronto. Finalizando exportação..."
        ];
        let msgIdx = 0;
        const msgInterval = setInterval(() => {
            setLoadingMsg(msgs[msgIdx % msgs.length]);
            msgIdx++;
        }, 8000);

        try {
            let url = '';
            if (selectedEngine.startsWith('veo')) {
                url = await generateNexusVideo(prompt, imageInput || undefined, selectedEngine, '5s', resolution);
            } else {
                url = await generateFreepikVideo(`${selectedEngine.toUpperCase()} style: ${prompt}`, imageInput || undefined);
            }
            setVideoUrl(url);
        } catch (error: any) {
            console.error(error);
            alert(`FALHA CRÍTICA NO MOTOR: ${error.message}`);
        } finally {
            clearInterval(msgInterval);
            setIsGenerating(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setImageInput(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 h-[calc(100vh-140px)]">
            
            {/* CONTROLS SIDEBAR */}
            <div className="lg:w-[400px] flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-hide">
                <div className="bg-nexus-panel border border-nexus-border rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl group-hover:scale-110 transition-transform">📼</div>
                    
                    <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 bg-nexus-accent rounded flex items-center justify-center text-black text-sm">V32</div>
                        SÍNTESE DE VÍDEO
                    </h2>

                    {/* Engine Selector Cards */}
                    <div className="space-y-3 mb-6">
                        <label className="text-[10px] font-mono text-nexus-dim uppercase tracking-[0.2em] block mb-2">Core Engine Selector</label>
                        <div className="grid grid-cols-1 gap-2">
                            {VIDEO_ENGINES.map(engine => (
                                <button
                                    key={engine.id}
                                    onClick={() => setSelectedEngine(engine.id)}
                                    className={`p-3 rounded-xl border text-left transition-all relative group ${
                                        selectedEngine === engine.id 
                                        ? 'bg-nexus-accent/10 border-nexus-accent shadow-glow' 
                                        : 'bg-nexus-bg border-nexus-border hover:border-nexus-dim'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{engine.icon}</span>
                                        <div>
                                            <div className="text-xs font-bold text-white uppercase">{engine.name}</div>
                                            <div className="text-[9px] text-nexus-dim">{engine.desc}</div>
                                        </div>
                                        <div className={`ml-auto text-[8px] font-mono border px-1 rounded ${selectedEngine === engine.id ? 'border-nexus-accent text-nexus-accent' : 'border-nexus-border text-nexus-dim'}`}>
                                            {engine.provider}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Prompt Input */}
                    <div className="mb-6">
                        <label className="block text-[10px] font-mono text-nexus-dim mb-2 uppercase tracking-widest">Script de Movimento</label>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ex: Câmera drone orbitando um castelo de cristal no deserto de sal, pôr do sol cinematográfico..."
                            className="w-full bg-nexus-bg border border-nexus-border rounded-xl p-4 text-white focus:border-nexus-accent outline-none h-32 resize-none text-sm placeholder:text-nexus-dim/30 font-sans"
                        />
                    </div>

                    {/* Start Frame Image */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] font-mono text-nexus-dim uppercase tracking-widest">Frame de Referência</label>
                            {imageInput && <button onClick={() => setImageInput(null)} className="text-[9px] text-red-400 hover:underline">LIMPAR</button>}
                        </div>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                                relative border-2 border-dashed rounded-xl h-24 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden
                                ${imageInput ? 'border-nexus-accent bg-nexus-accent/5' : 'border-nexus-border hover:border-nexus-accent hover:bg-nexus-bg/50'}
                            `}
                        >
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                            {imageInput ? (
                                <img src={imageInput} alt="Ref" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-2">
                                    <div className="text-xl mb-1 opacity-50">🖼️</div>
                                    <div className="text-[10px] text-nexus-dim font-mono">Image-to-Video Mode</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Resolution */}
                    <div className="mb-8">
                         <label className="block text-[10px] font-mono text-nexus-dim mb-2 uppercase tracking-widest">Output Settings</label>
                         <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => setResolution('720p')}
                                className={`py-2 rounded-lg text-xs font-bold border transition-all ${resolution === '720p' ? 'bg-white text-black border-white' : 'bg-nexus-bg border-nexus-border text-nexus-dim'}`}
                            >720p HD</button>
                            <button 
                                onClick={() => setResolution('1080p')}
                                className={`py-2 rounded-lg text-xs font-bold border transition-all ${resolution === '1080p' ? 'bg-white text-black border-white' : 'bg-nexus-bg border-nexus-border text-nexus-dim'}`}
                            >1080p Ultra</button>
                         </div>
                    </div>

                    {/* ACTION */}
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || (!prompt && !imageInput)}
                        className={`
                            w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm flex justify-center items-center gap-3 transition-all relative overflow-hidden group
                            ${isGenerating 
                                ? 'bg-nexus-surface text-nexus-dim cursor-not-allowed border border-nexus-border' 
                                : 'bg-gradient-to-r from-nexus-secondary to-nexus-accent text-white hover:shadow-glow active:scale-95'}
                        `}
                    >
                        <span className="relative z-10">{isGenerating ? 'PROCESSANDO...' : '⚡ SINTETIZAR VÍDEO'}</span>
                        {!isGenerating && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>}
                    </button>
                </div>
            </div>

            {/* PREVIEW AREA */}
            <div className="flex-1 min-w-0">
                <div className="h-full bg-nexus-panel border border-nexus-border rounded-3xl p-3 relative overflow-hidden flex items-center justify-center shadow-2xl">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
                    
                    {isGenerating ? (
                        <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
                            <div className="relative">
                                <div className="w-24 h-24 border-4 border-nexus-accent border-t-transparent rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl animate-pulse">⚛️</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-black text-white tracking-[0.2em] uppercase mb-2">Nexus Rendering</h3>
                                <p className="text-xs text-nexus-accent font-mono animate-pulse">{loadingMsg}</p>
                                <p className="text-[9px] text-nexus-dim mt-4 uppercase tracking-widest">O processo de vídeo pode levar de 2 a 5 minutos.</p>
                            </div>
                        </div>
                    ) : videoUrl ? (
                        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black flex items-center justify-center group animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <video 
                                src={videoUrl} 
                                controls 
                                autoPlay 
                                loop 
                                className="max-w-full max-h-full shadow-2xl"
                            />
                            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <a 
                                    href={videoUrl} 
                                    download={`nexus-production-${Date.now()}.mp4`}
                                    className="bg-white text-black px-6 py-3 rounded-full font-bold text-xs hover:bg-nexus-accent transition-all flex items-center gap-2 shadow-xl hover:scale-110 active:scale-95"
                                >
                                    <span>⬇</span> BAIXAR MASTER MP4
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center max-w-md animate-in fade-in duration-1000">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl border border-white/10 group-hover:scale-110 transition-transform">
                                🎬
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tighter mb-4">CINE-MOTIVE STATION</h3>
                            <p className="text-sm text-nexus-dim leading-relaxed font-light">
                                Configure o Core Engine à esquerda e descreva sua visão cinematográfica. 
                                O Nexus utilizará os modelos Veo 3.1 da Google ou Pikaso da Freepik para materializar seu vídeo em alta fidelidade.
                            </p>
                            <div className="mt-8 flex justify-center gap-4">
                                <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[9px] font-bold text-nexus-dim uppercase tracking-widest">4K Upscaling Avail.</div>
                                <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[9px] font-bold text-nexus-dim uppercase tracking-widest">AI Motion Aware</div>
                            </div>
                        </div>
                    )}

                    {/* Viewport Overlay */}
                    <div className="absolute inset-0 pointer-events-none border-[30px] border-nexus-panel/40 z-10"></div>
                </div>
            </div>

        </div>
    );
};

export default VideoStudio;
