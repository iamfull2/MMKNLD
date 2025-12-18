import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

interface LandingPageProps {
    onLogin: () => void;
    onGuest: () => void;
}

// ═══════════════════════════════════════════════════════════
// COMPONENTES VISUAIS "REACT BITS" STYLE
// ═══════════════════════════════════════════════════════════

// Hook para seguir o mouse (Spotlight Effect)
const useMousePosition = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    useEffect(() => {
        const updateMousePosition = (ev: MouseEvent) => {
            setMousePosition({ x: ev.clientX, y: ev.clientY });
        };
        window.addEventListener("mousemove", updateMousePosition);
        return () => window.removeEventListener("mousemove", updateMousePosition);
    }, []);
    return mousePosition;
};

const SpotlightCard: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseEnter = () => setOpacity(1);
    const handleMouseLeave = () => setOpacity(0);

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`relative overflow-hidden rounded-xl border border-nexus-border bg-nexus-panel transition-all duration-300 ${className}`}
        >
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(0, 240, 255, 0.1), transparent 40%)`,
                }}
            />
            <div className="relative h-full">{children}</div>
        </div>
    );
};

const NexusLogo: React.FC = () => (
    <div className="relative w-10 h-10 flex items-center justify-center group cursor-pointer perspective-1000">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-200 via-slate-500 to-slate-800 shadow-[0_0_20px_rgba(0,240,255,0.3)] relative z-10 overflow-hidden transform transition-transform duration-700 group-hover:rotate-12">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-50"></div>
            {/* Changed Red to Blue */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.8)]"></div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-nexus-success rounded-full shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-1 bg-nexus-secondary rounded-full shadow-[0_0_5px_rgba(59,130,246,0.8)]"></div>
            <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-1 bg-yellow-500 rounded-full shadow-[0_0_5px_rgba(234,179,8,0.8)]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-nexus-accent rounded-full blur-[1px] z-20 animate-pulse"></div>
        </div>
        <div className="absolute inset-0 bg-nexus-accent/20 rounded-full blur-xl group-hover:bg-nexus-secondary/30 transition-colors duration-1000 -z-10"></div>
    </div>
);

const PremiumBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-nexus-accent/5 border border-nexus-accent/20 text-[10px] uppercase tracking-widest font-mono font-bold text-nexus-accent shadow-[0_0_15px_rgba(0,240,255,0.1)]">
        <span className="w-1 h-1 rounded-full bg-nexus-accent animate-pulse"></span>
        {children}
    </span>
);

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onGuest }) => {
    const [scrolled, setScrolled] = useState(false);
    const [galleryImages, setGalleryImages] = useState<any[]>([]);
    
    // --- ADMIN / LIVE STATE ---
    const [isRendering, setIsRendering] = useState(false);
    const [isLiveActive, setIsLiveActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        
        const fetchGallery = async () => {
            try {
                // FIXED: Changed 'timestamp' to 'created_at' to match standard Supabase schema
                const { data } = await supabase
                    .from('generations')
                    .select('imageUrl, concept, style')
                    .order('created_at', { ascending: false })
                    .limit(8);

                if (data && data.length > 0) {
                    setGalleryImages(data);
                } else {
                    setGalleryImages([
                        { imageUrl: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop", concept: "Product Design", style: "3D Render" },
                        { imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1000&auto=format&fit=crop", concept: "Cyberpunk City", style: "Cinematic" },
                        { imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop", concept: "Abstract Liquid", style: "Abstract" },
                        { imageUrl: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=1000&auto=format&fit=crop", concept: "Fashion Editorial", style: "Photography" },
                    ]);
                }
            } catch (e) {
                console.error("Gallery fetch error:", e);
                // Fallback silently if table doesn't exist
            }
        };

        fetchGallery();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const openPaymentLink = (url: string) => {
        window.open(url, '_blank');
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // --- ADMIN HANDLERS ---
    const handleAdminTrigger = () => {
        // Trigger hidden file input
        fileInputRef.current?.click();
    };

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsRendering(true);
            // Simulate Rendering Process
            setTimeout(() => {
                setIsRendering(false);
                setIsLiveActive(true);
            }, 3000); // 3 seconds render simulation
        }
    };

    // --- RENDER SCREEN OVERLAY ---
    if (isRendering) {
        return (
            <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center">
                <div className="w-full max-w-4xl p-4">
                    <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden mb-8">
                        <div className="h-full bg-nexus-accent animate-[loading_2s_ease-in-out_infinite]" style={{ width: '50%' }}></div>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-nexus-secondary/20 blur-[100px] rounded-full animate-pulse"></div>
                        <h1 className="relative text-3xl md:text-5xl font-mono font-black text-white tracking-[0.5em] text-center uppercase animate-pulse">
                            RENDERIZANDO
                        </h1>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-nexus-bg-deep text-nexus-text font-sans selection:bg-nexus-accent/30 selection:text-white overflow-x-hidden relative">
            
            {/* Hidden Admin Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="video/*" 
                onChange={handleVideoUpload}
            />

            {/* Background Grid - React Bits Style */}
            <div className="fixed inset-0 z-0 pointer-events-none" style={{ 
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', 
                backgroundSize: '50px 50px',
                maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
            }}></div>

            {/* Navbar */}
            <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-nexus-bg-deep/80 backdrop-blur-xl border-b border-nexus-border/50 py-3' : 'bg-transparent border-b border-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <NexusLogo />
                        <span className="font-bold tracking-[0.2em] text-sm text-white">NEXUS</span>
                    </div>
                    
                    <div className="hidden md:flex items-center gap-1 p-1 bg-white/5 rounded-full border border-white/5 backdrop-blur-sm">
                        {['Recursos', 'Galeria', 'Planos'].map((item) => (
                            <button 
                                key={item} 
                                onClick={() => scrollToSection(item.toLowerCase())}
                                className="px-4 py-1.5 text-xs font-medium text-nexus-dim hover:text-white hover:bg-white/10 rounded-full transition-all"
                            >
                                {item}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={onLogin} className="group relative px-6 py-2 bg-nexus-text text-nexus-bg-deep rounded-full text-xs font-bold uppercase tracking-widest overflow-hidden transition-all hover:scale-105">
                            <span className="relative z-10">Entrar</span>
                            <div className="absolute inset-0 bg-nexus-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-overlay"></div>
                        </button>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="relative pt-48 pb-32 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-nexus-secondary/20 blur-[150px] pointer-events-none rounded-full animate-pulse"></div>
                
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 flex flex-col items-center">
                        <PremiumBadge>System v32.0 Quantum</PremiumBadge>
                        
                        <h1 className="mt-8 text-5xl md:text-8xl font-medium text-white tracking-tighter leading-[0.9]">
                            Design na<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">Velocidade da </span>
                            {/* "LUZ" STATUS INDICATOR */}
                            <span 
                                onClick={handleAdminTrigger}
                                className={`
                                    cursor-pointer select-none transition-all duration-300
                                    ${isLiveActive 
                                        ? 'text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.9)] animate-pulse' 
                                        : 'text-blue-600 drop-shadow-[0_0_30px_rgba(37,99,235,0.9)] animate-[pulse_0.15s_ease-in-out_infinite]'
                                    }
                                `}
                                title="Admin Upload Protocol"
                            >
                                Luz.
                            </span>
                        </h1>
                        
                        <p className="mt-8 text-lg text-nexus-dim max-w-xl mx-auto font-light leading-relaxed">
                            A fusão definitiva entre geração neural e edição profissional. <br/>
                            Fluxo contínuo. Qualidade de estúdio.
                        </p>

                        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button onClick={onLogin} className="group relative px-8 py-4 bg-nexus-text text-black rounded-full font-bold tracking-wide hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all transform hover:-translate-y-1 overflow-hidden">
                                <span className="relative z-10">Iniciar Jornada</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                            </button>
                        </div>
                    </div>

                    {/* Visual Mockup - Glassmorphism */}
                    <div className="mt-24 relative mx-auto max-w-6xl">
                        <div className="relative rounded-xl border border-white/10 bg-nexus-panel/50 backdrop-blur-xl shadow-2xl overflow-hidden aspect-[16/9] group">
                            {/* Header Mockup */}
                            <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2 bg-white/5">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                                </div>
                                <div className="mx-auto w-64 h-6 bg-black/20 rounded-md border border-white/5"></div>
                            </div>
                            
                            <div className="flex h-full">
                                {/* Sidebar Mockup */}
                                <div className="w-16 border-r border-white/5 flex flex-col items-center py-6 gap-6">
                                    {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-lg bg-white/5 border border-white/5"></div>)}
                                </div>
                                {/* Content */}
                                <div className="flex-1 flex items-center justify-center bg-nexus-bg/50 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-nexus-accent/5 to-transparent"></div>
                                    
                                    {isLiveActive ? (
                                        <div className="text-center transform transition-all duration-1000 animate-in fade-in zoom-in">
                                            {/* Cyan/Blue Glow for Active State */}
                                            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-cyan-500 blur-[60px] opacity-50 animate-pulse"></div>
                                            <h3 className="text-4xl font-mono text-white tracking-[0.2em] uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                                SISTEMA OPERACIONAL
                                            </h3>
                                            <p className="text-cyan-400 font-mono mt-2 tracking-widest text-xs">VÍDEO CARREGADO COM SUCESSO</p>
                                        </div>
                                    ) : (
                                        <div className="text-center transform transition-all duration-1000 group-hover:scale-105">
                                            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-tr from-nexus-secondary to-nexus-accent blur-[60px] opacity-50 animate-pulse"></div>
                                            <h3 className="text-2xl font-mono text-white tracking-[0.5em] uppercase">Renderizando</h3>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Glow underneath */}
                        <div className="absolute -inset-4 bg-nexus-accent/20 blur-3xl -z-10 opacity-20"></div>
                    </div>
                </div>
            </section>

            {/* FEATURES GRID - SPOTLIGHT EFFECT */}
            <section id="recursos" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { title: "Motor Neural V2", desc: "Geração de imagem com compreensão semântica profunda e iluminação volumétrica.", icon: "⚡" },
                            { title: "Editor de Fluxo", desc: "Controle nodal completo. Conecte geradores, upscalers e modificadores visualmente.", icon: "💠" },
                            { title: "Estúdio em Nuvem", desc: "Seus assets, presets e modelos personalizados sincronizados em tempo real.", icon: "☁️" },
                            { title: "Colaboração", desc: "Trabalhe em equipe no mesmo canvas infinito com cursores ao vivo.", icon: "👥" },
                            { title: "Análise de Tendência", desc: "IA autônoma que escaneia o mercado e sugere estilos virais.", icon: "📈" },
                            { title: "Exportação Pro", desc: "4K, 8K, WebP, PNG. Compressão inteligente sem perda visual.", icon: "💎" }
                        ].map((item, i) => (
                            <SpotlightCard key={i} className="group p-8">
                                <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-500">
                                    {item.icon}
                                </div>
                                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-nexus-accent transition-colors">{item.title}</h3>
                                <p className="text-sm text-nexus-dim leading-relaxed">{item.desc}</p>
                            </SpotlightCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* GALERIA INFINITA */}
            <section id="galeria" className="py-20 border-y border-white/5 bg-black/20">
                <div className="max-w-[2000px] mx-auto overflow-hidden">
                    <div className="flex gap-4 animate-[shine_20s_linear_infinite] hover:pause">
                        {[...galleryImages, ...galleryImages].map((img, i) => (
                            <div key={i} className="flex-shrink-0 w-[300px] h-[400px] rounded-xl overflow-hidden relative group border border-white/10">
                                <img src={img.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                    <p className="text-white font-mono text-xs truncate">{img.concept}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRICING */}
            <section id="planos" className="py-32 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-medium text-white mb-4">Escolha sua Potência</h2>
                        <p className="text-nexus-dim">Acesso total ao Nexus Core.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Starter */}
                        <SpotlightCard className="p-8 flex flex-col h-full">
                            <div className="mb-6">
                                <h3 className="text-nexus-dim font-mono text-xs uppercase tracking-widest mb-2">Iniciante</h3>
                                <div className="text-3xl font-bold text-white">R$ 0</div>
                            </div>
                            <ul className="space-y-4 text-sm text-nexus-dim flex-1 mb-8">
                                <li>✓ 50 Gerações/dia</li>
                                <li>✓ Editor Básico</li>
                                <li>✓ Modelos Standard</li>
                            </ul>
                            <button onClick={onLogin} className="w-full py-3 border border-white/20 rounded-lg text-white text-xs font-bold hover:bg-white hover:text-black transition-colors">COMEÇAR</button>
                        </SpotlightCard>

                        {/* Pro - Destaque */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-nexus-secondary to-nexus-accent rounded-2xl blur opacity-30 group-hover:opacity-60 transition-opacity"></div>
                            <div className="relative h-full bg-nexus-panel border border-nexus-accent/30 rounded-xl p-8 flex flex-col">
                                <div className="absolute top-0 right-0 bg-nexus-accent text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">POPULAR</div>
                                <div className="mb-6">
                                    <h3 className="text-nexus-accent font-mono text-xs uppercase tracking-widest mb-2">Pro Creator</h3>
                                    <div className="text-3xl font-bold text-white">R$ 49</div>
                                </div>
                                <ul className="space-y-4 text-sm text-white flex-1 mb-8">
                                    <li>✓ Gerações Ilimitadas</li>
                                    <li>✓ Acesso ao Fluxo V2</li>
                                    <li>✓ Upscale 8K</li>
                                    <li>✓ Prioridade na Fila</li>
                                </ul>
                                <button 
                                    onClick={() => openPaymentLink('https://nubank.com.br/cobrar/5e6hj/693b53e4-5810-408b-b1ec-d27fc0b2591f')}
                                    className="w-full py-3 bg-nexus-accent text-black rounded-lg text-xs font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all"
                                >
                                    ASSINAR PRO
                                </button>
                            </div>
                        </div>

                        {/* Studio */}
                        <SpotlightCard className="p-8 flex flex-col h-full">
                            <div className="mb-6">
                                <h3 className="text-nexus-dim font-mono text-xs uppercase tracking-widest mb-2">Estúdio</h3>
                                <div className="text-3xl font-bold text-white">R$ 99</div>
                            </div>
                            <ul className="space-y-4 text-sm text-nexus-dim flex-1 mb-8">
                                <li>✓ API Access</li>
                                <li>✓ Treinamento de Modelo</li>
                                <li>✓ Suporte Dedicado</li>
                                <li>✓ Team Seats (5)</li>
                            </ul>
                            <button 
                                onClick={() => openPaymentLink('https://nubank.com.br/cobrar/5e6hj/693b545a-4fdb-4066-8b01-c3864bfa28d7')}
                                className="w-full py-3 border border-white/20 rounded-lg text-white text-xs font-bold hover:bg-white hover:text-black transition-colors"
                            >
                                ASSINAR ESTÚDIO
                            </button>
                        </SpotlightCard>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-12 px-6 border-t border-white/5 text-center">
                <NexusLogo />
                <p className="mt-4 text-xs text-nexus-dim font-mono">NEXUS SYSTEMS INC. © 2025</p>
                <div className="mt-4 flex justify-center gap-6 text-[10px] text-nexus-dim uppercase tracking-widest">
                    <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Termos</a>
                    <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Privacidade</a>
                    <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Status</a>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;