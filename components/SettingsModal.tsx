import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const checkViteEnv = (keyName: string): boolean => {
    if (keyName === 'VITE_GEMINI_API_KEY') {
        // @ts-ignore
        return (typeof import.meta !== 'undefined' && import.meta.env && !!import.meta.env.VITE_GEMINI_API_KEY);
    }
    if (keyName === 'VITE_FREEPIK_API_KEY') {
        // @ts-ignore
        return (typeof import.meta !== 'undefined' && import.meta.env && !!import.meta.env.VITE_FREEPIK_API_KEY);
    }
    return false;
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [geminiKey, setGeminiKey] = useState('');
    const [freepikKey, setFreepikKey] = useState('');
    const [supabaseUrl, setSupabaseUrl] = useState('');
    const [supabaseKey, setSupabaseKey] = useState('');

    const hasEnvGemini = checkViteEnv('VITE_GEMINI_API_KEY');
    const hasEnvFreepik = checkViteEnv('VITE_FREEPIK_API_KEY');

    useEffect(() => {
        if (isOpen) {
            setGeminiKey(localStorage.getItem('NEXUS_GEMINI_KEY') || '');
            setFreepikKey(localStorage.getItem('NEXUS_FREEPIK_KEY') || '');
            setSupabaseUrl(localStorage.getItem('NEXUS_SUPABASE_URL') || '');
            setSupabaseKey(localStorage.getItem('NEXUS_SUPABASE_KEY') || '');
        }
    }, [isOpen]);

    const handleSave = () => {
        // Clean keys before saving
        const cleanGemini = geminiKey.trim();
        const cleanFreepik = freepikKey.trim();
        const cleanSupabaseUrl = supabaseUrl.trim();
        const cleanSupabaseKey = supabaseKey.trim();

        if (cleanGemini) localStorage.setItem('NEXUS_GEMINI_KEY', cleanGemini);
        else localStorage.removeItem('NEXUS_GEMINI_KEY');

        if (cleanFreepik) localStorage.setItem('NEXUS_FREEPIK_KEY', cleanFreepik);
        else localStorage.removeItem('NEXUS_FREEPIK_KEY');
        
        if (cleanSupabaseUrl) localStorage.setItem('NEXUS_SUPABASE_URL', cleanSupabaseUrl);
        if (cleanSupabaseKey) localStorage.setItem('NEXUS_SUPABASE_KEY', cleanSupabaseKey);

        alert("Configurações salvas e limpas. O sistema será recarregado.");
        onClose();
        window.location.reload(); 
    };

    const handleClear = () => {
        if(confirm("Isso limpará todas as chaves manuais e usará apenas o que estiver configurado no Vercel (VITE_...). Continuar?")) {
            localStorage.removeItem('NEXUS_GEMINI_KEY');
            localStorage.removeItem('NEXUS_FREEPIK_KEY');
            localStorage.removeItem('NEXUS_SUPABASE_URL');
            localStorage.removeItem('NEXUS_SUPABASE_KEY');
            setGeminiKey('');
            setFreepikKey('');
            setSupabaseUrl('');
            setSupabaseKey('');
            alert("Reset concluído. Usando variáveis de ambiente da nuvem.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-lg bg-nexus-panel border border-nexus-border rounded-2xl p-8 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-nexus-dim hover:text-white">✕</button>
                
                <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">⚙️</span>
                    <div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-widest">Configuração do Sistema</h2>
                        <p className="text-xs text-nexus-dim">Defina suas chaves API (V42.1 Stable).</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-nexus-accent uppercase">Google Gemini API Key</label>
                            {hasEnvGemini && <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20">ENV ATIVO (VITE_)</span>}
                        </div>
                        <input 
                            type="password" 
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            placeholder={hasEnvGemini ? "Usando ENV da Nuvem (Vercel)" : "Cole sua chave AIza..."}
                            className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-3 text-sm text-white focus:border-nexus-accent outline-none font-mono"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-nexus-secondary uppercase">Freepik API Key</label>
                            {hasEnvFreepik && <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20">ENV ATIVO (VITE_)</span>}
                        </div>
                        <input 
                            type="password" 
                            value={freepikKey}
                            onChange={(e) => setFreepikKey(e.target.value)}
                            placeholder={hasEnvFreepik ? "Usando ENV da Nuvem (Vercel)" : "Cole sua chave FPSX..."}
                            className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-3 text-sm text-white focus:border-nexus-secondary outline-none font-mono"
                        />
                    </div>

                    <div className="pt-4 border-t border-nexus-border">
                        <button onClick={() => { const el = document.getElementById('adv'); if(el) el.classList.toggle('hidden'); }} className="text-[10px] text-nexus-dim hover:text-white mb-2 flex items-center gap-1">
                            <span>🔧</span> Banco de Dados (Supabase)
                        </button>
                        <div id="adv" className="hidden space-y-4 mt-2 p-4 bg-nexus-bg/30 rounded-lg">
                            <input 
                                type="text" 
                                value={supabaseUrl}
                                onChange={(e) => setSupabaseUrl(e.target.value)}
                                placeholder="Supabase URL (https://cwoaokbivucpnofosooo.supabase.co)"
                                className="w-full bg-nexus-bg border border-nexus-border rounded p-2 text-xs text-white"
                            />
                            <input 
                                type="password" 
                                value={supabaseKey}
                                onChange={(e) => setSupabaseKey(e.target.value)}
                                placeholder="Supabase Anon Key"
                                className="w-full bg-nexus-bg border border-nexus-border rounded p-2 text-xs text-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <button 
                        onClick={handleSave}
                        className="flex-1 py-3 bg-nexus-accent text-black font-bold rounded-lg hover:bg-white transition-colors"
                    >
                        SALVAR
                    </button>
                    <button 
                        onClick={handleClear}
                        className="px-4 py-3 border border-red-500/30 text-red-500 font-bold rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                        LIMPAR
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;