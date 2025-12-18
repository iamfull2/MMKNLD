
import React from 'react';
import { GenerationResult } from '../types';

interface ResultDisplayProps {
    result: GenerationResult | null;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
    if (!result) {
        return (
            <div className="h-full min-h-[400px] md:min-h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-nexus-border rounded-2xl bg-nexus-panel/30 animate-in fade-in duration-700">
                <div className="text-6xl mb-4 opacity-20 animate-float text-nexus-dim">⚡</div>
                <h3 className="text-xl font-bold text-nexus-dim mb-2">Aguardando Entrada Quântica</h3>
                <p className="text-nexus-dim text-sm max-w-xs text-center">Configure os parâmetros principais e ative o enxame para materializar sua visão.</p>
            </div>
        );
    }

    const shareToTwitter = () => {
        const text = `Created with NEXUS V32.0 QUANTUM: ${result.title || 'AI Art'}`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    };

    const shareToFacebook = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
    };

    const shareToInstagram = () => {
        const a = document.createElement('a');
        a.href = result.imageUrl;
        a.download = `NEXUS-IG-${Date.now()}.png`;
        a.click();
        alert("Imagem baixada! Pronta para postar no Instagram.");
    };

    const shareToPinterest = () => {
        const url = encodeURIComponent(window.location.href);
        const description = encodeURIComponent(`NEXUS Art: ${result.title || 'Generated Image'}`);
        // Try to use image URL if not base64, otherwise Pinterest will try to scrape
        let mediaParam = '';
        if (!result.imageUrl.startsWith('data:')) {
            mediaParam = `&media=${encodeURIComponent(result.imageUrl)}`;
        }
        window.open(`https://pinterest.com/pin/create/button/?url=${url}&description=${description}${mediaParam}`, '_blank');
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Title Generator Ultra Display */}
            {result.title && (
                <div className="text-center py-4 relative group cursor-pointer" onClick={() => navigator.clipboard.writeText(result.title || '')}>
                    <div className="absolute top-0 right-0 left-0 bottom-0 bg-nexus-accent/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="text-[10px] font-mono text-nexus-dim uppercase tracking-[0.3em] mb-2 group-hover:text-nexus-accent transition-colors">Título Gerado</div>
                    <h2 className="relative z-10 text-3xl md:text-5xl font-black uppercase tracking-tighter nexus-gradient-text drop-shadow-2xl leading-tight hover:scale-[1.01] transition-transform duration-300">
                        {result.title}
                    </h2>
                     <div className="h-0.5 w-0 group-hover:w-24 mx-auto bg-nexus-accent mt-2 transition-all duration-500 ease-out"></div>
                     <div className="text-[10px] text-nexus-accent opacity-0 group-hover:opacity-100 transition-opacity mt-2">CLIQUE PARA COPIAR</div>
                </div>
            )}

            {/* Image Section */}
            <div className="relative group rounded-2xl overflow-hidden border border-nexus-border shadow-2xl shadow-black/50 interactive-card">
                <img 
                    src={result.imageUrl} 
                    alt="Nexus Generation" 
                    className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Hover Overlay with Actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-4 w-full translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <button 
                            onClick={() => {
                                const a = document.createElement('a');
                                a.href = result.imageUrl;
                                a.download = `NEXUS-V37-${Date.now()}.png`;
                                a.click();
                            }}
                            className="bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-nexus-accent hover:shadow-[0_0_20px_rgba(0,240,255,0.6)] transition-all shadow-lg flex items-center gap-2 transform hover:scale-105 active:scale-95"
                        >
                            <span className="text-lg">⬇</span> Baixar Asset 8K
                        </button>

                        <div className="flex gap-2">
                            <button onClick={shareToTwitter} className="p-3 rounded-full bg-black/60 text-white hover:bg-[#1DA1F2] hover:text-white transition-all border border-white/10 hover:border-transparent hover:scale-110 hover:shadow-[#1DA1F2]/50 shadow-lg" title="Compartilhar no Twitter">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            </button>
                            <button onClick={shareToFacebook} className="p-3 rounded-full bg-black/60 text-white hover:bg-[#4267B2] hover:text-white transition-all border border-white/10 hover:border-transparent hover:scale-110 hover:shadow-[#4267B2]/50 shadow-lg" title="Compartilhar no Facebook">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            </button>
                            <button onClick={shareToInstagram} className="p-3 rounded-full bg-black/60 text-white hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white transition-all border border-white/10 hover:border-transparent hover:scale-110 hover:shadow-[#bc1888]/50 shadow-lg" title="Postar no Instagram">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                            </button>
                            <button onClick={shareToPinterest} className="p-3 rounded-full bg-black/60 text-white hover:bg-[#E60023] hover:text-white transition-all border border-white/10 hover:border-transparent hover:scale-110 hover:shadow-[#E60023]/50 shadow-lg" title="Salvar no Pinterest">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.195.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.65 0-5.789 2.738-5.789 5.57 0 1.103.425 2.286.956 2.922.105.126.12.236.089.363-.097.403-.316 1.281-.359 1.461-.057.238-.188.288-.433.174-1.616-.752-2.627-3.111-2.627-5.008 0-4.08 2.969-7.823 8.565-7.823 4.496 0 7.99 3.206 7.99 7.487 0 4.469-2.815 8.064-6.722 8.064-1.312 0-2.545-.681-2.968-1.485 0 0-.651 2.477-.809 3.083-.291 1.119-1.077 2.518-1.604 3.376 1.205.358 2.48.552 3.805.552 6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

             {/* V37 Pipeline Indicators */}
             {result.pipeline && (
                <div className="flex gap-2 justify-center flex-wrap">
                    {result.pipeline.semantic && (
                        <span className="text-[10px] font-mono bg-nexus-secondary/20 text-nexus-secondary px-2 py-1 rounded border border-nexus-secondary/30 hover:bg-nexus-secondary/30 transition-colors cursor-help" title="Análise Semântica Ativada">L7: SEMÂNTICO</span>
                    )}
                    {result.pipeline.multiModel && (
                        <span className="text-[10px] font-mono bg-nexus-accent/20 text-nexus-accent px-2 py-1 rounded border border-nexus-accent/30 hover:bg-nexus-accent/30 transition-colors cursor-help" title="Orquestração Multi-Modelo Ativada">L6: MULTI-MODELO</span>
                    )}
                    {result.pipeline.consciousness && (
                        <span className="text-[10px] font-mono bg-red-500/20 text-red-500 px-2 py-1 rounded border border-red-500/30 hover:bg-red-500/30 transition-colors cursor-help" title="Módulo de Consciência Ativo">CONSCIÊNCIA</span>
                    )}
                    {result.pipeline.clone && (
                        <span className="text-[10px] font-mono bg-pink-500/20 text-pink-500 px-2 py-1 rounded border border-pink-500/30 hover:bg-pink-500/30 transition-colors cursor-help" title="Clonagem de Estilo Ativa">CLONE IA V2</span>
                    )}
                    {result.pipeline.hyperRealism && (
                        <span className="text-[10px] font-mono bg-orange-500/20 text-orange-500 px-2 py-1 rounded border border-orange-500/30 hover:bg-orange-500/30 transition-colors cursor-help" title="Hiper-Realismo Ativado">HIPER-REALISMO</span>
                    )}
                </div>
            )}

            {/* Technical Breakdown Section */}
            <div className="glass-panel rounded-xl p-6 hover:border-nexus-accent/30 transition-colors duration-500">
                <div className="flex items-center gap-2 mb-6 border-b border-nexus-border pb-4">
                    <span className="text-lg">⚙️</span>
                    <h3 className="text-nexus-accent font-mono text-sm tracking-widest font-bold">FICHA TÉCNICA</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 text-sm">
                    <div className="bg-nexus-bg/50 p-4 rounded-lg border border-nexus-border/50 hover:border-nexus-accent/50 hover:bg-nexus-bg hover:shadow-lg transition-all duration-300 group">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-nexus-secondary group-hover:scale-110 transition-transform">🖥️</span>
                            <span className="text-nexus-dim text-xs font-mono tracking-wider group-hover:text-nexus-text">MOTOR DE RENDER</span>
                        </div>
                        <p className="text-nexus-text font-mono text-xs leading-relaxed opacity-80 group-hover:opacity-100">{result.specs.render}</p>
                    </div>

                    <div className="bg-nexus-bg/50 p-4 rounded-lg border border-nexus-border/50 hover:border-nexus-accent/50 hover:bg-nexus-bg hover:shadow-lg transition-all duration-300 group">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-nexus-secondary group-hover:scale-110 transition-transform">💡</span>
                            <span className="text-nexus-dim text-xs font-mono tracking-wider group-hover:text-nexus-text">FÍSICA DA LUZ</span>
                        </div>
                        <p className="text-nexus-text font-mono text-xs leading-relaxed opacity-80 group-hover:opacity-100">{result.specs.lighting}</p>
                    </div>

                    <div className="bg-nexus-bg/50 p-4 rounded-lg border border-nexus-border/50 hover:border-nexus-accent/50 hover:bg-nexus-bg hover:shadow-lg transition-all duration-300 group">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-nexus-secondary group-hover:scale-110 transition-transform">📷</span>
                            <span className="text-nexus-dim text-xs font-mono tracking-wider group-hover:text-nexus-text">ÓTICA DE CÂMERA</span>
                        </div>
                        <p className="text-nexus-text font-mono text-xs leading-relaxed opacity-80 group-hover:opacity-100">{result.specs.camera}</p>
                    </div>

                    <div className="bg-nexus-bg/50 p-4 rounded-lg border border-nexus-border/50 hover:border-nexus-accent/50 hover:bg-nexus-bg hover:shadow-lg transition-all duration-300 group">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-nexus-secondary group-hover:scale-110 transition-transform">🧠</span>
                            <span className="text-nexus-dim text-xs font-mono tracking-wider group-hover:text-nexus-text">NEURO-ESTÉTICA</span>
                        </div>
                        <p className="text-nexus-text font-mono text-xs leading-relaxed opacity-80 group-hover:opacity-100">{result.specs.mood}</p>
                    </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-nexus-border">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-nexus-dim">📝</span>
                        <span className="text-nexus-dim block text-xs font-mono tracking-wider">PROMPT MESTRE</span>
                    </div>
                    <div className="relative group">
                        <p className="text-xs text-nexus-text leading-relaxed font-mono break-words bg-nexus-surface p-4 rounded-lg border border-nexus-border/50 group-hover:border-nexus-accent/30 group-hover:bg-nexus-bg transition-colors">
                            {result.finalPrompt}
                        </p>
                        <button 
                            onClick={() => navigator.clipboard.writeText(result.finalPrompt)}
                            className="absolute top-2 right-2 text-[10px] bg-nexus-dim/20 hover:bg-nexus-accent hover:text-black text-nexus-dim px-3 py-1.5 rounded transition-all opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0"
                        >
                            COPIAR
                        </button>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-nexus-border/50">
                     <div className="flex items-center gap-2">
                        <span className="text-xs text-nexus-dim font-mono">TEMPO DE GER.:</span>
                        <span className="text-xs font-mono text-nexus-text">{result.generationTime}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-xs text-nexus-dim font-mono">PONTUAÇÃO QUALIDADE:</span>
                        <span className="text-xs font-mono font-bold text-nexus-success tracking-wider border border-nexus-success/30 bg-nexus-success/10 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(0,255,157,0.1)]">
                            {result.qualityScore}
                        </span>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ResultDisplay;
