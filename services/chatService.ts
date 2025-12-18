
import { supabase } from '../supabaseClient';

export interface ChatMessage {
    id?: string;
    text: string;
    sender: 'user' | 'ai' | 'system';
    timestamp: any;
    userId: string;
    userName?: string;
    userColor?: string;
}

// Mapeador seguro para lidar com variações de casing do Postgres (userId vs userid)
const mapMessage = (d: any): ChatMessage => ({
    id: d.id,
    text: d.text || "...",
    sender: d.sender,
    timestamp: d.created_at,
    // Verifica ambas as versões (camelCase e lowercase) para compatibilidade máxima
    userId: d.userId || d.userid || 'anon',
    userName: d.userName || d.username || 'Agente',
    userColor: d.userColor || d.usercolor || '#00f0ff'
});

export const subscribeToChat = (callback: (messages: ChatMessage[]) => void) => {
    // Initial Load
    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('nexus_chat')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (error) {
                console.warn("Nexus Chat Offline (Tabela não encontrada ou erro de permissão):", error.message);
                return;
            }

            if (data) {
                // Mapeia e inverte para ordem cronológica correta na UI
                const mapped = data.map(mapMessage).reverse();
                callback(mapped);
            }
        } catch (e) {
            console.warn("Erro ao buscar mensagens:", e);
        }
    };

    fetchMessages();

    // Realtime Subscription
    const channel = supabase
        .channel('nexus_chat_global')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'nexus_chat' }, (payload) => {
            // Recarrega para garantir sincronia
            fetchMessages(); 
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('✅ Nexus Chat: Conectado ao Supabase');
            }
        });

    return () => {
        supabase.removeChannel(channel);
    };
};

export const sendChatMessage = async (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    try {
        // Tenta enviar com aspas para forçar CamelCase (compatível com o SQL gerado)
        const payload = {
            text: msg.text,
            sender: msg.sender,
            "userId": msg.userId,
            "userName": msg.userName,
            "userColor": msg.userColor,
            created_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('nexus_chat')
            .insert([payload]);
            
        if (error) {
            console.error("Erro primário ao enviar (tentando fallback):", error.message);
            
            // Fallback: Tentar enviar com chaves lowercase se falhar (caso o banco tenha sido criado sem aspas)
            if (error.message.includes('column') || error.code === '42703') {
                 await supabase.from('nexus_chat').insert([{
                    text: msg.text,
                    sender: msg.sender,
                    userid: msg.userId,
                    username: msg.userName,
                    usercolor: msg.userColor
                 }]);
            }
        }
    } catch (e) {
        console.error("Erro crítico no envio:", e);
    }
};
