
import React, { useState, useEffect, useRef } from 'react';
import { CollabUser } from '../types';
import { subscribeToChat, sendChatMessage, ChatMessage } from '../services/chatService';
import { chatWithNexus } from '../geminiService';
import { supabase } from '../supabaseClient';

interface CollaborationPanelProps {
    users: CollabUser[];
    messages: string[]; 
    onSend: (msg: string) => void;
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ users, onSend }) => {
    const [input, setInput] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        fetchUser();
    }, []);
    
    useEffect(() => {
        const unsubscribe = subscribeToChat((msgs) => {
            setChatHistory(msgs);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsgText = input.trim();
        setInput('');

        await sendChatMessage({
            text: userMsgText,
            sender: 'user',
            userId: currentUser?.id || 'anon',
            userName: currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'Operative',
            userColor: '#00f0ff'
        });

        onSend(userMsgText);

        if (userMsgText.toLowerCase().includes('nexus') || userMsgText.toLowerCase().includes('ai')) {
            const history = chatHistory.slice(-10).map(msg => ({
                role: msg.sender === 'ai' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            }));

            try {
                const aiResponse = await chatWithNexus(history, userMsgText);
                await sendChatMessage({
                    text: aiResponse,
                    sender: 'ai',
                    userId: 'nexus-core',
                    userName: 'NEXUS',
                    userColor: '#7000ff'
                });
            } catch (error) {
                console.error("AI Chat Error:", error);
            }
        }
    };

    return (
        <div className="glass-panel rounded-xl p-4 flex flex-col h-full min-h-[400px]">
            <div className="flex items-center gap-2 mb-4 border-b border-nexus-border pb-4">
                <span className="w-2 h-2 rounded-full bg-nexus-success animate-pulse"></span>
                <h3 className="text-xs font-bold text-nexus-text tracking-widest font-mono">LINK NEURAL GLOBAL</h3>
                <span className="ml-auto text-[10px] text-nexus-dim bg-nexus-bg px-2 py-0.5 rounded-full">{users.length} ONLINE</span>
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {users.map(u => (
                    <div key={u.id} className="flex-shrink-0 flex items-center gap-2 bg-nexus-bg/50 px-2 py-1 rounded border border-nexus-border">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: u.color }}></div>
                        <span className="text-[10px] text-nexus-text font-mono">{u.name}</span>
                    </div>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 scrollbar-hide max-h-[300px]">
                {chatHistory.length === 0 && (
                    <div className="text-center text-nexus-dim text-xs italic mt-10">
                        Sinal silencioso. Aguardando transmissão...
                    </div>
                )}
                {chatHistory.map((msg) => (
                    <div 
                        key={msg.id || Math.random()} 
                        className={`flex flex-col ${msg.sender === 'user' && msg.userId === currentUser?.id ? 'items-end' : 'items-start'}`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-bold text-nexus-dim uppercase">{msg.userName}</span>
                            {msg.sender === 'ai' && <span className="bg-nexus-accent text-black text-[8px] px-1 rounded font-bold">IA</span>}
                        </div>
                        <div 
                            className={`text-xs font-mono p-2.5 rounded-lg max-w-[85%] break-words animate-in slide-in-from-bottom-1 ${
                                msg.sender === 'ai' 
                                ? 'bg-nexus-secondary/10 border border-nexus-secondary/30 text-nexus-text' 
                                : msg.userId === currentUser?.id
                                    ? 'bg-nexus-accent/10 border border-nexus-accent/30 text-nexus-text' 
                                    : 'bg-nexus-bg/50 border border-nexus-border text-nexus-dim'
                            }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSend} className="relative">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Transmitir para Nexus..."
                    className="w-full bg-nexus-bg border border-nexus-border rounded-lg px-4 py-3 text-xs text-nexus-text focus:border-nexus-success outline-none placeholder:text-nexus-dim"
                />
                <button 
                    type="submit"
                    disabled={!input.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-nexus-success disabled:opacity-30 hover:scale-110 transition-transform"
                >
                    ➤
                </button>
            </form>
        </div>
    );
};

export default CollaborationPanel;
