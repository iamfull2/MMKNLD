
import { MemoryEntry, StyleDNAProfile } from "./types";
import { supabase } from "./supabaseClient";

const STORAGE_KEY = 'nexus_neural_memory_v34';

export class NeuralMemoryBank {
    memories: MemoryEntry[] = [];
    private useSupabase = true;

    constructor() {
        // Initial load from local storage for instant UI
        this.loadLocal();
        // Then try to fetch fresh data from cloud
        this.loadCloud();
    }

    private loadLocal() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                this.memories = JSON.parse(data);
            }
        } catch (e) {
            console.warn("Failed to load local memory (Cache cleared)", e);
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    private async loadCloud() {
        if (!this.useSupabase) return;
        
        try {
            const { data, error } = await supabase
                .from('generations')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                // Silent fail for offline/no-table mode
                return;
            }
            
            if (data && data.length > 0) {
                const cloudMemories: MemoryEntry[] = data.map((d: any) => ({
                    id: d.id,
                    timestamp: d.created_at || d.timestamp,
                    concept: d.concept,
                    style: d.style,
                    mood: d.mood,
                    imageUrl: d.imageUrl || d.imageurl, 
                    dna: d.dna || {},
                    performance: d.performance || { likes: 0, views: 0 }
                }));

                // Merge: prioritize cloud, keep local if not in cloud
                // Simple strategy: just use cloud for consistency in this version
                this.memories = cloudMemories;
                this.saveLocal(); 
            }
        } catch (e) {
            console.warn("Supabase connection error (Ignored):", e);
        }
    }

    private saveLocal() {
        try {
            // Try saving full list (limited to 20 items to save space)
            const safeList = this.memories.slice(0, 20);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(safeList));
        } catch (e: any) {
            // QUOTA EXCEEDED HANDLER
            if (e.name === 'QuotaExceededError' || e.code === 22 || e.message.includes('quota')) {
                console.warn("⚠️ LocalStorage Quota Exceeded. Compressing memory...");
                try {
                    // Plan B: Keep only last 3 items with images
                    const pruned = this.memories.slice(0, 3);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
                } catch (e2) {
                    // Plan C: Nuke images, keep only metadata for last 20
                    console.warn("⚠️ Memory critical. Dropping local images.");
                    const metadataOnly = this.memories.slice(0, 20).map(m => ({
                        ...m, 
                        imageUrl: '' // Remove base64 string to save space
                    }));
                    try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(metadataOnly));
                    } catch (e3) {
                        // Plan D: Clear all
                        localStorage.removeItem(STORAGE_KEY);
                    }
                }
            }
        }
    }

    async storeGeneration(concept: string, style: string, mood: string, imageUrl: string) {
        const dna: StyleDNAProfile = {
            color: mood === 'MOODDOPAMINEFLOOD' ? 'neonCyberpunk' : mood === 'MOODSEROTONINFLOW' ? 'pastelDreamy' : 'darkIndustrial',
            lighting: style === 'cinematic' ? 'volumetricDramatic' : 'softNatural',
            composition: 'ruleOfThirds',
            texture: style === 'product' ? 'hyperRealistic' : 'illustrated',
            generation: 0
        };

        const timestamp = new Date().toISOString();

        const entry: MemoryEntry = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: timestamp,
            concept,
            style,
            mood,
            imageUrl,
            dna,
            performance: { likes: 0, views: 1 }
        };

        this.memories.unshift(entry);
        
        // Hard cap in-memory array to 30 to prevent RAM bloat
        if (this.memories.length > 30) this.memories = this.memories.slice(0, 30);
        
        this.saveLocal();

        if (this.useSupabase) {
            try {
                // Async save to cloud - fire and forget
                supabase.from('generations').insert([{
                    ...entry,
                    "imageUrl": imageUrl,
                    "created_at": timestamp
                }]).then(({ error }) => {
                    if (error && (error.message.includes('column') || error.code === '42703')) {
                        // Retry lowercase fallback
                        supabase.from('generations').insert([{
                            id: entry.id,
                            created_at: timestamp,
                            concept: entry.concept,
                            style: entry.style,
                            mood: entry.mood,
                            imageurl: imageUrl,
                            dna: entry.dna,
                            performance: entry.performance
                        }] as any);
                    }
                });
            } catch (e) {
                // Ignore cloud save errors
            }
        }
        
        return entry;
    }

    getRecentMemories(limit = 10) {
        return this.memories.slice(0, limit);
    }

    getStats() {
        return {
            totalGenerations: this.memories.length,
            topStyle: this.getTopMetric('style'),
            topMood: this.getTopMetric('mood')
        };
    }

    private getTopMetric(key: keyof MemoryEntry) {
        if (this.memories.length === 0) return 'N/A';
        const counts: Record<string, number> = {};
        this.memories.forEach(m => {
            const val = String(m[key]);
            counts[val] = (counts[val] || 0) + 1;
        });
        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    }
}

export const neuralMemory = new NeuralMemoryBank();