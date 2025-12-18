
import React, { useState } from 'react';
import { generateWithFreepik } from '../freepikService';

const StudioPro: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [genStyle, setGenStyle] = useState('Photorealistic');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [selectedModel, setSelectedModel] = useState('flux1');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const handleImageGenerate = async () => {
        if (!prompt) return alert("Please enter a prompt");
        setIsGenerating(true);
        try {
            const url = await generateWithFreepik({
                prompt: `${prompt}, ${genStyle} style`,
                model: selectedModel as any,
                aspectRatio
            });
            setGeneratedImage(url);
        } catch (error: any) {
            console.error(error);
            alert("Generation failed: " + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] animate-in fade-in">
            {/* Sidebar Controls */}
            <div className="lg:col-span-3 bg-nexus-panel border border-nexus-border rounded-xl p-6 flex flex-col gap-6 overflow-y-auto">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">STUDIO PRO</h2>
                    <p className="text-xs text-nexus-dim font-mono">FLUX.1 / MYSTIC / GEMINI ULTRA</p>
                </div>

                <div>
                    <label className="block text-xs font-bold text-nexus-dim mb-2 uppercase">Model Engine</label>
                    <div className="space-y-2">
                        {[
                            { id: 'flux1', name: 'FLUX.1 Pro', desc: 'Best for realism & text' },
                            { id: 'mystic25', name: 'Mystic 2.5', desc: 'Artistic & Fantasy' },
                            { id: 'seedream', name: 'SeaDream', desc: 'Cinematic composition' },
                            { id: 'gemini', name: 'Gemini 2.5', desc: 'Fast & Creative' }
                        ].map(m => (
                            <div 
                                key={m.id}
                                onClick={() => setSelectedModel(m.id)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                    selectedModel === m.id 
                                    ? 'bg-nexus-accent/10 border-nexus-accent text-white' 
                                    : 'bg-nexus-bg border-nexus-border text-nexus-dim hover:border-nexus-dim'
                                }`}
                            >
                                <div className="text-sm font-bold">{m.name}</div>
                                <div className="text-[10px] opacity-70">{m.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-nexus-dim mb-2 uppercase">Prompt</label>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-3 text-sm text-white h-32 resize-none focus:border-nexus-accent outline-none placeholder:text-nexus-dim/30"
                        placeholder="Describe your masterpiece..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-nexus-dim mb-2 uppercase">Style</label>
                        <select 
                            value={genStyle} 
                            onChange={e => setGenStyle(e.target.value)}
                            className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-3 text-xs text-white outline-none"
                        >
                            <option>Photorealistic</option>
                            <option>Cinematic</option>
                            <option>3D Render</option>
                            <option>Anime</option>
                            <option>Cyberpunk</option>
                            <option>Analog Film</option>
                            <option>Oil Painting</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-nexus-dim mb-2 uppercase">Ratio</label>
                        <select 
                            value={aspectRatio} 
                            onChange={e => setAspectRatio(e.target.value)}
                            className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-3 text-xs text-white outline-none"
                        >
                            <option value="1:1">1:1 (Square)</option>
                            <option value="16:9">16:9 (Landscape)</option>
                            <option value="9:16">9:16 (Portrait)</option>
                            <option value="4:3">4:3 (Classic)</option>
                            <option value="21:9">21:9 (Ultrawide)</option>
                        </select>
                    </div>
                </div>

                <div className="mt-auto relative group w-full">
                    <button 
                        onClick={handleImageGenerate}
                        disabled={isGenerating || !prompt}
                        className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg text-white font-bold tracking-widest hover:shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>RENDERING...</span>
                            </>
                        ) : (
                            <>
                                <span>✨</span> GENERATE 8K
                            </>
                        )}
                    </button>

                    {/* Tooltip for Credits */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-nexus-panel border border-nexus-border rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                        <div className="text-[10px] font-bold text-white mb-2 pb-1 border-b border-white/10 uppercase tracking-widest">
                            Custo de Créditos
                        </div>
                        <div className="space-y-1.5 text-xs font-mono">
                            <div className="flex justify-between items-center text-nexus-dim">
                                <span>Standard</span>
                                <span className="text-nexus-accent">5 ⚡</span>
                            </div>
                            <div className="flex justify-between items-center text-nexus-dim">
                                <span>High Fidelity</span>
                                <span className="text-nexus-accent">15 ⚡</span>
                            </div>
                            <div className="flex justify-between items-center text-nexus-dim">
                                <span>Ultra 8K</span>
                                <span className="text-nexus-accent">25 ⚡</span>
                            </div>
                        </div>
                        <div className="mt-2 text-[9px] text-nexus-dim/50 italic text-center">
                            *Baseado na complexidade do modelo
                        </div>
                        {/* Triangle arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-nexus-panel"></div>
                    </div>
                </div>
            </div>

            {/* Main Preview Area */}
            <div className="lg:col-span-9 bg-nexus-panel border border-nexus-border rounded-xl p-2 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
                
                {generatedImage ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img 
                            src={generatedImage} 
                            alt="Generated" 
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                        />
                         <div className="absolute bottom-6 right-6 flex gap-4">
                             <button 
                                onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = generatedImage;
                                    a.download = `STUDIO-PRO-${Date.now()}.png`;
                                    a.click();
                                }}
                                className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-nexus-accent transition-colors shadow-xl"
                             >
                                 DOWNLOAD
                             </button>
                         </div>
                    </div>
                ) : (
                    <div className="text-center opacity-30">
                        <div className="text-8xl mb-4">💠</div>
                        <h1 className="text-4xl font-black tracking-tighter text-white">STUDIO PRO</h1>
                        <p className="font-mono mt-2 text-nexus-dim">Professional Generation Suite</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudioPro;
