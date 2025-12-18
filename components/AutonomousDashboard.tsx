import React, { useEffect, useRef, useState } from 'react';
import { ActivityLog, AutonomousMetrics, MarketListing } from '../types';
import { generateAutonomousImage } from '../geminiService';
import { supabase } from '../supabaseClient';
import { EcommerceBridge, ProductListing } from '../services/ecommerceBridge';

interface AutonomousDashboardProps {
    isActive: boolean;
}

const SOCIAL_PROMPTS = [
    { concept: "Distribuição de sopa quente e alimentos para moradores de rua, noite, acolhimento", style: "photography", mood: "MOODSEROTONINFLOW" },
    { concept: "Voluntários entregando cobertores térmicos no inverno, calor humano", style: "cinematic", mood: "MOODSEROTONINFLOW" },
    { concept: "Assistência médica humanitária em áreas vulneráveis, cuidado, saúde", style: "photography", mood: "MOODDOPAMINEFLOOD" },
    { concept: "Reconstrução de moradias dignas em comunidades, esperança, arquitetura social", style: "architecture", mood: "MOODSEROTONINFLOW" },
    { concept: "Crianças recebendo educação e refeições nutritivas, futuro brilhante", style: "cinematic", mood: "MOODDOPAMINEFLOOD" }
];

const AutonomousDashboard: React.FC<AutonomousDashboardProps> = ({ isActive }) => {
    // Estado para Chave Pix Real (Já configurada, apenas leitura interna)
    const [pixKey] = useState<string>(localStorage.getItem('NEXUS_PIX_KEY') || 'https://nubank.com.br/cobrar/5e6hj/693b5571-c854-4edc-8958-04813e3562ce');
    
    // Estado do Checkout de Doação
    const [showCheckout, setShowCheckout] = useState(false);
    const [checkoutAmount, setCheckoutAmount] = useState<number>(0);
    const [manualDonationInput, setManualDonationInput] = useState('');

    // Estado de Vendas (E-commerce)
    const [publishingItem, setPublishingItem] = useState<MarketListing | null>(null);
    const [salePrice, setSalePrice] = useState('49.90');
    const [productType, setProductType] = useState<ProductListing['productType']>('canvas');
    const [isPublishing, setIsPublishing] = useState(false);
    
    // Estado de Configuração Shopify
    const [showShopifyConfig, setShowShopifyConfig] = useState(false);
    const [shopifyUrl, setShopifyUrl] = useState(localStorage.getItem('SHOPIFY_URL') || '');
    const [shopifyToken, setShopifyToken] = useState(localStorage.getItem('SHOPIFY_TOKEN') || '');
    
    // NOVO: Estado de Auto-Venda
    const [autoPublish, setAutoPublish] = useState(false);
    const autoPublishRef = useRef(autoPublish);

    const [metrics, setMetrics] = useState<AutonomousMetrics>({
        totalGenerated: 0,
        totalRevenue: parseFloat(localStorage.getItem('NEXUS_TOTAL_DONATED') || '0'),
        trendAccuracy: 100,
        engineStatus: 'idle',
        activeTrend: 'Aguardando Ação Social...'
    });

    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [listings, setListings] = useState<MarketListing[]>([]);
    
    const metricsRef = useRef(metrics);
    const engineRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => { metricsRef.current = metrics; }, [metrics]);
    
    // Manter a ref do autoPublish atualizada para o closure do intervalo
    useEffect(() => { autoPublishRef.current = autoPublish; }, [autoPublish]);

    const addLog = (message: string, type: ActivityLog['type'] = 'info') => {
        const newLog: ActivityLog = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            message,
            type
        };
        setLogs(prev => [newLog, ...prev].slice(0, 50));
    };

    const startCharityEngine = async () => {
        if (engineRef.current) return;
        
        addLog('❤️ Iniciando Motor de Assistência Social...', 'success');
        setMetrics(prev => ({ ...prev, engineStatus: 'running', activeTrend: 'Ação Humanitária Ativa' }));

        engineRef.current = setInterval(async () => {
            const conceptConfig = SOCIAL_PROMPTS[Math.floor(Math.random() * SOCIAL_PROMPTS.length)];
            
            addLog(`📢 Gerando campanha: ${conceptConfig.concept.substring(0, 40)}...`, 'info');
            
            try {
                const listing = await generateAutonomousImage({
                    ...conceptConfig,
                    aspectRatio: '1:1',
                    quality: 10
                } as any);
                listing.status = 'listed';
                
                setListings(prev => [listing, ...prev]);
                setMetrics(prev => ({ 
                    ...prev, 
                    totalGenerated: prev.totalGenerated + 1 
                }));
                addLog(`✨ Novo Registro Visual Adicionado à Galeria`, 'success');

                // LÓGICA DE AUTO-VENDA (BRIDGE)
                if (autoPublishRef.current) {
                    addLog(`🤖 Bridge Automática: Enviando para Loja Shopify...`, 'info');
                    
                    // Dispara a publicação sem travar o loop principal (Fire & Forget visual)
                    EcommerceBridge.publishToShopify({
                        title: `NEXUS ART #${listing.id.substring(0,4)}`,
                        description: `Arte gerada para caridade. Conceito: ${listing.concept}`,
                        price: 49.90,
                        imageUrl: listing.imageUrl,
                        tags: ['nexus', 'charity', 'ai-auto'],
                        platform: 'shopify',
                        productType: 'canvas'
                    }).then(res => {
                        if (res.success) {
                            addLog(`🛒 ITEM PUBLICADO NO SHOPIFY: ${res.url}`, 'sale');
                            EcommerceBridge.logListingToNexus({
                                ...listing,
                                platform: 'shopify',
                                price: 49.90
                            } as any, res.url || '');
                        } else {
                            addLog(`⚠️ Falha na publicação auto: ${res.error}`, 'info');
                        }
                    });
                }

            } catch (e) {
                addLog(`⚠️ Pausa na operação: ${(e as Error).message}`, 'info');
            }

        }, 12000);
    };

    const stopEngine = () => {
        if (engineRef.current) clearInterval(engineRef.current);
        engineRef.current = null;
        setMetrics(prev => ({ ...prev, engineStatus: 'paused' }));
        addLog('⏸️ Operação pausada.', 'info');
    };

    const handleSaveShopify = () => {
        localStorage.setItem('SHOPIFY_URL', shopifyUrl);
        localStorage.setItem('SHOPIFY_TOKEN', shopifyToken);
        setShowShopifyConfig(false);
        addLog('✅ Credenciais da Loja Salvas', 'success');
    };

    const initiateCheckout = () => {
        const amount = parseFloat(manualDonationInput);
        if (isNaN(amount) || amount <= 0) {
            alert("Digite um valor válido para doar.");
            return;
        }
        setCheckoutAmount(amount);
        setShowCheckout(true);
    };

    const confirmPayment = async () => {
        try {
            await supabase.from('orders').insert([{ amount: checkoutAmount, status: 'completed', payment_method: 'pix' }]);
            const newTotal = metrics.totalRevenue + checkoutAmount;
            setMetrics(prev => ({ ...prev, totalRevenue: newTotal }));
            localStorage.setItem('NEXUS_TOTAL_DONATED', newTotal.toString());
            addLog(`💰 DOAÇÃO CONFIRMADA: R$ ${checkoutAmount.toFixed(2)} entrou no Fundo!`, 'sale');
            setManualDonationInput('');
            setShowCheckout(false);
            setCheckoutAmount(0);
            alert("✅ Doação Recebida com Sucesso!");
        } catch (e) {
            alert("Erro de conexão ao processar doação.");
        }
    };

    // --- SALES LOGIC (MANUAL) ---
    const handlePublish = async () => {
        if (!publishingItem) return;
        setIsPublishing(true);

        try {
            const result = await EcommerceBridge.publishToShopify({
                title: `Arte Beneficente #${publishingItem.id}`,
                description: `Obra gerada pela Nexus AI. Todo o lucro será revertido para o Fundo Social. Conceito: ${publishingItem.concept}`,
                price: parseFloat(salePrice),
                imageUrl: publishingItem.imageUrl,
                tags: ['nexus', 'charity', 'ai-art'],
                platform: 'shopify',
                productType: productType
            });

            if (result.success) {
                addLog(`🛒 Produto Publicado na Loja! (${productType})`, 'sale');
                // Salvar log local
                await EcommerceBridge.logListingToNexus(publishingItem as any, result.url || '');
                alert(`Produto criado com sucesso!\nURL: ${result.url}`);
            }
        } catch (e: any) {
            alert("Falha na publicação: " + e.message);
        } finally {
            setIsPublishing(false);
            setPublishingItem(null);
        }
    };

    useEffect(() => {
        return () => stopEngine();
    }, []);

    if (!isActive) return null;

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-20">
            {/* Header Social Centralizado */}
            <div className="bg-gradient-to-r from-blue-900 to-nexus-panel p-1 rounded-2xl border border-nexus-border shadow-2xl">
                <div className="bg-nexus-panel rounded-xl p-8 flex flex-col items-center justify-center text-center gap-6">
                    
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">🤝</span>
                        <h2 className="text-3xl font-black text-white tracking-tighter">
                            NEXUS <span className="text-nexus-success">SERVIÇO SOCIAL</span>
                        </h2>
                    </div>
                    
                    <p className="text-nexus-dim text-sm font-mono max-w-2xl leading-relaxed">
                        Motor Autônomo de Filantropia. Gera arte, vende produtos e arrecada fundos automaticamente para pessoas em condição de vulnerabilidade.
                    </p>
                    
                    <div className="flex flex-wrap justify-center items-center gap-4 mt-2">
                        {/* Toggle Auto-Venda */}
                        <div 
                            onClick={() => setAutoPublish(!autoPublish)}
                            className={`
                                flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-all select-none
                                ${autoPublish ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-nexus-bg border-nexus-border text-nexus-dim hover:text-white'}
                            `}
                            title="Publicar automaticamente no Shopify/Printful a cada geração"
                        >
                            <div className={`w-2 h-2 rounded-full ${autoPublish ? 'bg-purple-500 animate-pulse' : 'bg-gray-600'}`}></div>
                            <span className="text-xs font-bold uppercase tracking-wider">AUTO-VENDA</span>
                        </div>

                        {metrics.engineStatus !== 'running' ? (
                            <button 
                                onClick={startCharityEngine}
                                className="bg-nexus-success/20 text-nexus-success border border-nexus-success hover:bg-nexus-success/40 px-8 py-3 rounded-lg font-bold font-mono transition-all flex items-center gap-2"
                            >
                                <span>▶</span> INICIAR MOTOR
                            </button>
                        ) : (
                            <button 
                                onClick={stopEngine}
                                className="bg-red-500/20 text-red-500 border border-red-500 hover:bg-red-500/40 px-8 py-3 rounded-lg font-bold font-mono transition-all flex items-center gap-2"
                            >
                                <span>⏸</span> PAUSAR
                            </button>
                        )}

                        <button 
                            onClick={() => setShowShopifyConfig(true)}
                            className="bg-blue-600/20 text-blue-400 border border-blue-600/50 hover:bg-blue-600/40 px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
                        >
                            <span>🛍️</span> CONFIGURAR LOJA
                        </button>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-nexus-panel p-6 rounded-xl border border-nexus-border relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 text-6xl group-hover:scale-110 transition-transform">🤲</div>
                    <div className="text-nexus-dim text-xs font-mono uppercase tracking-widest">Ações Geradas</div>
                    <div className="text-4xl font-black text-white mt-2">{metrics.totalGenerated}</div>
                </div>

                <div className="bg-nexus-panel p-6 rounded-xl border border-nexus-border relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 text-6xl group-hover:scale-110 transition-transform">🍲</div>
                    <div className="text-nexus-dim text-xs font-mono uppercase tracking-widest">Fundo de Auxílio</div>
                    <div className="text-4xl font-black text-nexus-success mt-2">
                        R$ {metrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                </div>

                {/* PAINEL DE DOAÇÃO RÁPIDA */}
                <div className="bg-nexus-panel p-6 rounded-xl border border-nexus-border relative overflow-hidden flex flex-col justify-center">
                    <div className="text-nexus-dim text-xs font-mono uppercase tracking-widest mb-2 font-bold text-nexus-accent">Doação Direta</div>
                    <div className="flex gap-2">
                        <input 
                            type="number" 
                            value={manualDonationInput}
                            onChange={e => setManualDonationInput(e.target.value)}
                            placeholder="Valor R$"
                            className="w-full bg-nexus-bg border border-nexus-border rounded px-3 py-2 text-white outline-none focus:border-nexus-success font-mono text-lg"
                        />
                        <button onClick={initiateCheckout} className="bg-nexus-success text-black font-bold px-4 rounded hover:bg-white transition-colors whitespace-nowrap text-xs uppercase tracking-wider">
                            DOAR
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Transparency Gallery */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="flex justify-between items-end border-b border-nexus-border pb-2">
                        <h3 className="text-sm font-mono text-nexus-dim uppercase tracking-widest">Galeria de Ativos</h3>
                        <span className="text-[10px] text-nexus-accent">DISPONÍVEL PARA VENDA</span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {listings.length === 0 && (
                            <div className="col-span-full h-48 flex flex-col items-center justify-center text-nexus-dim text-sm italic border-2 border-dashed border-nexus-border rounded-xl bg-nexus-bg/30">
                                <span>Aguardando geração de ativos...</span>
                            </div>
                        )}
                        {listings.map(item => (
                            <div key={item.id} className="group relative rounded-xl overflow-hidden border border-nexus-border hover:border-nexus-success transition-all duration-300">
                                <div className="aspect-square bg-black relative">
                                    <img src={item.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Charity Art" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 gap-2">
                                        <button 
                                            onClick={() => {
                                                const a = document.createElement('a');
                                                a.href = item.imageUrl;
                                                a.download = `NEXUS-SOCIAL-${Date.now()}.png`;
                                                a.click();
                                            }}
                                            className="w-full py-2 bg-white/10 backdrop-blur text-white text-[10px] rounded uppercase tracking-wider hover:bg-white/20 font-bold"
                                        >
                                            Baixar
                                        </button>
                                        <button 
                                            onClick={() => setPublishingItem(item)}
                                            className="w-full py-2 bg-nexus-success text-black font-bold text-[10px] rounded uppercase tracking-wider hover:bg-white flex items-center justify-center gap-1"
                                        >
                                            <span>🛒</span> Vender
                                        </button>
                                    </div>
                                </div>
                                <div className="p-2 bg-nexus-panel text-[10px] text-nexus-dim truncate border-t border-nexus-border">
                                    {item.concept}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Logs */}
                <div className="flex flex-col gap-6">
                    <div className="bg-nexus-panel rounded-xl border border-nexus-border p-4 h-[400px] flex flex-col">
                        <h3 className="text-sm font-mono text-nexus-dim uppercase tracking-widest mb-4">Log de Operações</h3>
                        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide">
                            {logs.map(log => (
                                <div key={log.id} className="text-xs font-mono border-l-2 border-nexus-border pl-3 py-1 animate-in slide-in-from-left-2">
                                    <span className="text-nexus-dim block text-[10px]">{log.timestamp}</span>
                                    <span className={`${log.type === 'sale' ? 'text-nexus-success font-bold' : log.type === 'success' ? 'text-nexus-accent' : 'text-gray-400'}`}>
                                        {log.message}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* SALES MODAL */}
            {publishingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md px-4 animate-in fade-in">
                    <div className="bg-nexus-panel border border-nexus-accent rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                        <button onClick={() => setPublishingItem(null)} className="absolute top-4 right-4 text-nexus-dim hover:text-white">✕</button>
                        
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-16 h-16 rounded overflow-hidden border border-nexus-border">
                                <img src={publishingItem.imageUrl} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase">Publicar Produto</h3>
                                <p className="text-xs text-nexus-dim">Shopify Bridge</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-[10px] text-nexus-dim font-bold uppercase mb-1">Tipo de Produto</label>
                                <select 
                                    value={productType}
                                    // @ts-ignore
                                    onChange={e => setProductType(e.target.value)}
                                    className="w-full bg-nexus-bg border border-nexus-border rounded p-3 text-white text-sm outline-none focus:border-nexus-accent"
                                >
                                    <option value="canvas">Quadro Decorativo (Canvas)</option>
                                    <option value="t-shirt">Camiseta Premium</option>
                                    <option value="digital">Arquivo Digital (Download)</option>
                                    <option value="nft">NFT (OpenSea)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-nexus-dim font-bold uppercase mb-1">Preço de Venda (R$)</label>
                                <input 
                                    type="number"
                                    value={salePrice}
                                    onChange={e => setSalePrice(e.target.value)}
                                    className="w-full bg-nexus-bg border border-nexus-border rounded p-3 text-white text-sm outline-none focus:border-nexus-accent"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handlePublish}
                            disabled={isPublishing}
                            className="w-full py-4 bg-nexus-success text-black font-bold rounded-xl uppercase tracking-widest hover:bg-white transition-all flex justify-center items-center gap-2"
                        >
                            {isPublishing ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                                    <span>CONECTANDO SHOPIFY...</span>
                                </>
                            ) : (
                                <>
                                    <span>🚀</span> PUBLICAR AGORA
                                </>
                            )}
                        </button>
                        <p className="text-[9px] text-nexus-dim text-center mt-3">
                            A receita será direcionada automaticamente para a conta configurada na loja.
                        </p>
                    </div>
                </div>
            )}

            {/* CHECKOUT MODAL (Donation) */}
            {showCheckout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md px-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm shadow-2xl relative text-center">
                        <button onClick={() => setShowCheckout(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold text-xl">✕</button>
                        <h3 className="text-3xl font-black text-black mt-2">R$ {checkoutAmount.toFixed(2)}</h3>
                        <p className="text-gray-500 text-xs mt-1">Doação para Nexus Serviço Social</p>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-inner my-6 inline-block">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixKey)}`} alt="Pix QR" className="w-48 h-48 mix-blend-multiply mx-auto" />
                        </div>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => window.open(pixKey, '_blank')} className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl text-sm uppercase tracking-widest hover:bg-purple-700 transition-all">PAGAR NO NUBANK</button>
                            <button onClick={confirmPayment} className="w-full py-3 bg-green-500 text-white font-bold rounded-xl text-sm uppercase tracking-widest hover:bg-green-600 transition-all">CONFIRMAR ENVIO</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Config Modal Shopify */}
            {showShopifyConfig && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 animate-in fade-in">
                    <div className="bg-nexus-panel border border-nexus-border rounded-xl p-6 w-full max-w-md shadow-2xl relative">
                        <button onClick={() => setShowShopifyConfig(false)} className="absolute top-4 right-4 text-nexus-dim hover:text-white">✕</button>
                        
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-2xl">🛍️</span>
                            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Conectar Shopify</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono text-nexus-dim mb-2 uppercase">URL da Loja</label>
                                <input 
                                    type="text" 
                                    value={shopifyUrl} 
                                    onChange={e => setShopifyUrl(e.target.value)} 
                                    className="w-full bg-nexus-bg border border-nexus-border rounded p-3 text-white focus:border-nexus-accent outline-none text-sm"
                                    placeholder="exemplo.myshopify.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-nexus-dim mb-2 uppercase">Admin Access Token</label>
                                <input 
                                    type="password" 
                                    value={shopifyToken} 
                                    onChange={e => setShopifyToken(e.target.value)} 
                                    className="w-full bg-nexus-bg border border-nexus-border rounded p-3 text-white focus:border-nexus-accent outline-none text-sm"
                                    placeholder="shpat_xxxxxxxxxxxxxxxx"
                                />
                                <p className="text-[10px] text-nexus-dim mt-2">
                                    Obtenha em Configurações &gt; Apps e canais de vendas &gt; Desenvolver apps.
                                </p>
                            </div>
                            <button onClick={handleSaveShopify} className="w-full py-3 bg-nexus-accent text-black font-bold rounded-lg hover:bg-white transition-colors uppercase tracking-wider text-xs">
                                Salvar Conexão
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AutonomousDashboard;