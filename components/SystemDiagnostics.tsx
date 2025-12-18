import React, { useEffect, useState } from 'react';

const checkEnv = (keyName: string): boolean => {
    // 1. Vite Import Meta
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[keyName]) return true;
    
    // 2. Process Env
    if (typeof process !== 'undefined' && process.env && process.env[keyName]) return true;

    return false;
};

const SystemDiagnostics: React.FC = () => {
    const [status, setStatus] = useState({
        gemini: false,
        freepik: false,
        supabase: false
    });
    const [minimized, setMinimized] = useState(true);

    useEffect(() => {
        const hasGemini = checkEnv('VITE_GEMINI_API_KEY') || checkEnv('API_KEY') || checkEnv('GOOGLE_API_KEY') || !!localStorage.getItem('NEXUS_GEMINI_KEY');
        const hasFreepik = checkEnv('VITE_FREEPIK_API_KEY') || !!localStorage.getItem('NEXUS_FREEPIK_KEY');
        const hasSupabase = checkEnv('VITE_SUPABASE_URL') || !!localStorage.getItem('NEXUS_SUPABASE_URL');

        setStatus({
            gemini: hasGemini,
            freepik: hasFreepik,
            supabase: hasSupabase
        });
    }, []);

    if (minimized) {
        const allGood = status.gemini; // Critical
        return (
            <div 
                onClick={() => setMinimized(false)}
                className={`fixed bottom-2 right-2 z-[9999] px-2 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all border ${
                    allGood 
                    ? 'bg-nexus-success/10 border-nexus-success/30 text-nexus-success hover:bg-nexus-success/20' 
                    : 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
                }`}
                title="Clique para diagnóstico do sistema"
            >
                {allGood ? 'SYSTEM ONLINE' : 'SYSTEM ALERT'}
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-[9999] bg-nexus-panel border border-nexus-border rounded-lg shadow-2xl p-4 w-64 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Status do Sistema</h4>
                <button onClick={() => setMinimized(true)} className="text-nexus-dim hover:text-white">✕</button>
            </div>
            
            <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-nexus-dim">Gemini API</span>
                    <span className={status.gemini ? 'text-nexus-success' : 'text-red-500 font-bold'}>
                        {status.gemini ? 'CONECTADO' : 'MISSING'}
                    </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-nexus-dim">Freepik API</span>
                    <span className={status.freepik ? 'text-nexus-success' : 'text-orange-500'}>
                        {status.freepik ? 'CONECTADO' : 'MISSING'}
                    </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-nexus-dim">Supabase</span>
                    <span className={status.supabase ? 'text-nexus-success' : 'text-nexus-dim'}>
                        {status.supabase ? 'CONECTADO' : 'OFFLINE'}
                    </span>
                </div>
            </div>
            
            {!status.gemini && (
                <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-[10px] text-red-300">
                    ⚠️ Configure <strong>VITE_GEMINI_API_KEY</strong> ou <strong>API_KEY</strong> na Vercel.
                </div>
            )}
        </div>
    );
};

export default SystemDiagnostics;