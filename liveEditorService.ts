import { PerfectCutoutEngine } from "./perfectCutout";
import { runNexusRequest, generateGoogleImage } from "./geminiService";
import { generateWithFreepik } from "./freepikService"; // <-- INTEGRAÇÃO OFICIAL
import { SceneLayer } from "./types";

/**
 * LIVE EDITOR SERVICE – 2025 FINAL VERSION
 * Gemini = gratuito (sempre disponível)
 * Freepik = premium (somente quando VITE_FREEPIK_API_KEY estiver ativa)
 */

export class LiveEditorService {

    // Detecta se usuário tem plano pago Freepik
    private static hasFreepik(): boolean {
        try {
            const key = localStorage.getItem("NEXUS_FREEPIK_KEY");
            if (key?.length > 5) return true;

            // @ts-ignore
            if (import.meta?.env?.VITE_FREEPIK_API_KEY) return true;

            return false;
        } catch {
            return false;
        }
    }

    /* ============================================================
       1 — PROMPT BOOSTER
    ============================================================ */
    private static enhancePrompt(prompt: string, ctx: string = ""): string {
        return `
            ${prompt}.
            ${ctx}.
            masterpiece, ultra detailed, professional lighting,
            --no text --no watermark --no distortions
        `;
    }

    /* ============================================================
       2 — GEMINI IMAGE WRAPPER (GRATUITO)
    ============================================================ */
    private static async gemini(prompt: string, ar: string): Promise<string> {
        return await generateGoogleImage({
            prompt,
            aspectRatio: ar,
            model: 'gemini'
        });
    }

    /* ============================================================
       3 — FREEPIK WRAPPER (PAGO)
    ============================================================ */
    private static async freepik(prompt: string, ar: string, model: "flux1" | "mystic25" | "seedream"): Promise<string> {
        return await generateWithFreepik({
            prompt,
            model,
            aspectRatio: ar
        });
    }

    /* ============================================================
       4 — Função universal: imageEngine()
       Decide AUTOMATICAMENTE entre Freepik (pago) e Gemini (grátis)
    ============================================================ */
    private static async imageEngine(prompt: string, ar: string, premiumModel?: string): Promise<string> {
        
        // Se o usuário NÃO tem Freepik → usa Gemini sempre
        if (!this.hasFreepik()) {
            return await this.gemini(prompt, ar);
        }

        // Se tem Freepik mas NÃO pediu modelo → usa Gemini mesmo assim (evita custo para funções normais)
        if (!premiumModel) {
            return await this.gemini(prompt, ar);
        }

        // Se pediu modelo específico → tenta Freepik
        try {
            return await this.freepik(prompt, ar, premiumModel as any);
        } catch {
            console.warn("⚠ Freepik falhou → fallback Gemini");
            return await this.gemini(prompt, ar);
        }
    }

    /* ============================================================
       5 — PROMPT BUILDERS (igual antes)
    ============================================================ */
    private static async buildTitlePrompt(text: string, style: string, size: string, background: string, description: string): Promise<string> {
        const p = `
            3D Typography of "${text}". Style ${style}.
            Extra: ${description}. Background: white for cutout.
        `;
        return this.enhancePrompt(p, "Typography");
    }

    private static async buildLogoPrompt(brand: string, style: string, industry: string, color: string, inspiration: string): Promise<string> {
        const p = `
            Clean vector logo for "${brand}".
            Industry: ${industry}. Style: ${style}.
            Color: ${color}. ${inspiration}
        `;
        return this.enhancePrompt(p, "Logo Design");
    }

    private static async buildAssetPrompt(type: string, description: string, style: string): Promise<string> {
        const p = `
            UI Asset: ${type}. ${description}. Style ${style}.
            Isolated white background.
        `;
        return this.enhancePrompt(p, "UI Asset");
    }

    private static async buildMascotPrompt(role: string, archetype: string, expression: string): Promise<string> {
        const p = `
            3D Mascot. Role: ${role}. Archetype ${archetype}.
            Expression: ${expression}. Neon blue.
            Pixar-like render.
        `;
        return this.enhancePrompt(p, "Mascot");
    }

    /* ============================================================
       6 — PÚBLICO: Title / Logo / Asset / Mascot / Landscape / Human
    ============================================================ */

    static async generateTitle(text: string, style: string, size: string, bg: string, desc: string, ar = "16:9"): Promise<string> {
        const prompt = await this.buildTitlePrompt(text, style, size, bg, desc);
        let img = await this.imageEngine(prompt, ar);

        if (bg === "transparent")
            img = await PerfectCutoutEngine.process(img, 25);

        return img;
    }

    static async generateLogo(brand: string, style: string, industry: string, color: string, insp: string, ar = "1:1", premiumModel?: string): Promise<string> {
        const prompt = await this.buildLogoPrompt(brand, style, industry, color, insp);

        let img = await this.imageEngine(prompt, ar, premiumModel);
        return await PerfectCutoutEngine.process(img, 20);
    }

    static async generateAsset(type: string, desc: string, style: string, ar = "1:1", premiumModel?: string): Promise<string> {
        const prompt = await this.buildAssetPrompt(type, desc, style);

        let img = await this.imageEngine(prompt, ar, premiumModel);
        return await PerfectCutoutEngine.process(img, 25);
    }

    static async generateMascot(role: string, arc: string, exp: string, ar = "1:1", premiumModel?: string): Promise<string> {
        const prompt = await this.buildMascotPrompt(role, arc, exp);

        let img = await this.imageEngine(prompt, ar, premiumModel);
        return await PerfectCutoutEngine.process(img, 20);
    }

    static async generateLandscape(prompt: string, style: string, ar = "16:9", premiumModel?: string): Promise<string> {
        const p = this.enhancePrompt(`${prompt}, ${style} style landscape`, "Landscape Photo");
        return await this.imageEngine(p, ar, premiumModel);
    }

    static async generateHuman(prompt: string, style: string, shot: string, ar = "16:9", premiumModel?: string): Promise<string> {
        const p = this.enhancePrompt(`${shot} of ${prompt}. Style: ${style}`, "Human Portrait");
        return await this.imageEngine(p, ar, premiumModel);
    }

    /* ============================================================
       7 — Layered Scene
    ============================================================ */
    static async generateLayeredScene(prompt: string, style: string, ar = "16:9"): Promise<SceneLayer[]> {
        const layers: SceneLayer[] = [];

        const defs = [
            { n: "Background", c: false, z: 0, d: "background environment" },
            { n: "Subject", c: true, z: 10, d: "main character or object" },
            { n: "Foreground", c: true, z: 20, d: "particles, glow, overlay" },
        ];

        for (const L of defs) {
            const p = this.enhancePrompt(`${prompt}, ${L.d}, ${style}`, "Layer");

            let img = await this.imageEngine(p, ar);

            if (L.c) img = await PerfectCutoutEngine.process(img, 20);

            layers.push({
                id: crypto.randomUUID(),
                name: L.n,
                prompt: p,
                url: img,
                zIndex: L.z
            });
        }

        return layers.sort((a, b) => a.zIndex - b.zIndex);
    }

    /* ============================================================
       8 — Utilities
    ============================================================ */
    static async upscaleImage(image: string, scale: string, mode: string): Promise<string> {
        return await generateGoogleImage({
            prompt: "Upscale, high resolution, enhance details, 8k",
            model: 'gemini',
            aspectRatio: '1:1',
            referenceImage: image
        });
    }
}