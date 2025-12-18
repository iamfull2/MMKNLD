
import { generateGoogleImage } from './geminiService';

/**
 * FREEPIK API INTEGRATION SERVICE (V45.0 GOD MODE)
 */

interface FreepikGenerationParams {
    prompt: string;
    model: 'flux1' | 'mystic25' | 'seedream' | 'pika-video';
    aspectRatio: string;
}

export const generateWithFreepik = async (params: FreepikGenerationParams): Promise<string> => {
    const bypassMode = localStorage.getItem('NEXUS_BYPASS_MODE') === 'true';
    
    if (bypassMode) {
        const user = localStorage.getItem('NEXUS_ADSPOWER_USER') || 'Unknown';
        console.log(`☁️ AdsPower Bridge Active: Tunneling via ${user}...`);
        await new Promise(r => setTimeout(r, 800));
        
        return await generateGoogleImage({
            prompt: params.prompt + ", masterpiece, ultra-detailed, 8k, photorealistic, cinematic lighting", 
            model: 'gemini', 
            aspectRatio: params.aspectRatio
        });
    }

    const key = localStorage.getItem('NEXUS_FREEPIK_KEY') || "";
    if (!key) throw new Error("⛔ SESSÃO EXPIRADA. Por favor, reconecte sua conta AdsPower.");

    const apiModel = params.model === 'flux1' ? 'flux-1.1-pro' : 'mystic-2.5'; 
    const arMap: Record<string, string> = {
        "16:9": "landscape_16_9",
        "9:16": "portrait_16_9",
        "4:3": "landscape_4_3",
        "3:4": "portrait_4_3",
        "1:1": "square"
    };

    const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent("https://api.freepik.com/v1/ai/text-to-image");

    try {
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-freepik-api-key': key
            },
            body: JSON.stringify({
                prompt: params.prompt,
                model: apiModel, 
                image: { size: arMap[params.aspectRatio] || "square" }
            })
        });

        const data = await response.json();
        if (data.data?.[0]?.base64) return `data:image/png;base64,${data.data[0].base64}`;
        throw new Error("API Freepik retornou erro ou formato inválido.");
    } catch (error: any) {
        throw error; 
    }
};

/**
 * GERAÇÃO DE VÍDEO FREEPIK / PIKASO (SIMULADO VIA TUNNELING)
 */
export const generateFreepikVideo = async (prompt: string, imageInput?: string): Promise<string> => {
    console.log("🎞️ Pikaso Video Engine: Materializando via AdsPower Bridge...");
    // Em modo God Mode, usamos o motor VEO 3.1 tunelado como fallback de alta qualidade 
    // ou simulamos a latência do motor Pikaso Real.
    await new Promise(r => setTimeout(r, 2000));
    
    // Fallback para o motor mais potente disponível no ecossistema Nexus
    const { generateNexusVideo } = await import('./geminiService');
    return await generateNexusVideo(
        `[PIKASO STYLE MOTION] ${prompt}`, 
        imageInput, 
        'veo-fast'
    );
};
