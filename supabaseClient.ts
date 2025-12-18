import { createClient } from '@supabase/supabase-js';

// Safe Environment Access (V42.0 STATIC)
const getSupabaseEnv = () => {
    let url = "";
    let key = "";

    // 1. Vite Static Replacement (Primary)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        if (import.meta.env.VITE_SUPABASE_URL) url = import.meta.env.VITE_SUPABASE_URL;
        // @ts-ignore
        if (import.meta.env.VITE_SUPABASE_ANON_KEY) key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    }

    // 2. Process Env Fallback (Secondary)
    if (!url && typeof process !== 'undefined' && process.env) {
        if (process.env.VITE_SUPABASE_URL) url = process.env.VITE_SUPABASE_URL;
        if (process.env.VITE_SUPABASE_ANON_KEY) key = process.env.VITE_SUPABASE_ANON_KEY;
    }

    return { url, key };
};

// Recuperação de Configuração Limpa
const getSupabaseConfig = () => {
    // 1. LocalStorage (User Override)
    const localUrl = localStorage.getItem('NEXUS_SUPABASE_URL');
    const localKey = localStorage.getItem('NEXUS_SUPABASE_KEY');
    
    // 2. Environment Variables
    const env = getSupabaseEnv();

    let finalUrl = localUrl || env.url || '';
    let finalKey = localKey || env.key || '';

    // Auto-Correction
    if (finalUrl.includes('dashboard/project')) {
        const parts = finalUrl.split('/');
        const projectIndex = parts.indexOf('project');
        if (projectIndex !== -1 && parts[projectIndex + 1]) {
            const projectId = parts[projectIndex + 1];
            finalUrl = `https://${projectId}.supabase.co`;
        }
    }

    if (finalUrl && !finalUrl.startsWith('http')) {
        finalUrl = `https://${finalUrl}`;
    }

    return { url: finalUrl, key: finalKey };
}

const config = getSupabaseConfig();

// Mock Client
const dummyClient = {
    from: () => ({ 
        select: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) }), 
        insert: () => Promise.resolve({ error: null }) 
    }),
    auth: {
        getSession: () => Promise.resolve({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signUp: () => Promise.resolve({ data: {}, error: { message: "Supabase não configurado" } }),
        signInWithPassword: () => Promise.resolve({ data: {}, error: { message: "Supabase não configurado" } }),
        signOut: () => Promise.resolve(),
        getUser: () => Promise.resolve({ data: { user: null } })
    },
    channel: () => ({ 
        on: () => ({ subscribe: (fn?: any) => { if(fn) fn('CLOSED'); return {}; } }) 
    }),
    removeChannel: () => {},
    functions: { invoke: () => Promise.resolve({ data: {}, error: null }) }
} as any;

export const supabase = (config.url && config.key && config.url.includes('.supabase.co')) 
    ? createClient(config.url, config.key, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        },
        realtime: {
            params: {
                eventsPerSecond: 10,
            },
        },
      })
    : dummyClient;