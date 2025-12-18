
import { NexusAgentID, NexusConfig, NexusAgent } from './types';

// --- NEXUS CONSTANTS ---

export const AVAILABLE_FONTS = [
    'Inter',
    'Montserrat',
    'Roboto Condensed',
    'Oswald',
    'Cinzel',
    'Playfair Display',
    'Anton',
    'JetBrains Mono',
    'Arial',
    'Courier New'
];

export const AI_MODELS = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', type: 'free', desc: 'Rápido & Gratuito' },
    { id: 'imagen-3.0-generate-001', name: 'Imagen 3', type: 'standard', desc: 'Alta Fidelidade Google' },
    { id: 'flux1', name: 'Flux 1.1 Pro', type: 'premium', desc: 'Fotorrealismo Extremo' },
    { id: 'mystic25', name: 'Mystic 2.5', type: 'premium', desc: 'Artístico & Criativo' },
    { id: 'seedream', name: 'SeaDream', type: 'premium', desc: 'Composição Cinematográfica' }
];

export const RENDER_MODULES: Record<string, string> = {
  cinematic: 'Unreal Engine 5.4 with Nanite and Lumen, real-time global illumination, cinematic contrast',
  product: 'Octane Render PMC kernel, complex caustics, physically-correct glass and liquid refraction',
  character: 'Arnold render with advanced subsurface scattering, realistic organic skin and soft translucency',
  abstract: 'Houdini FLIP fluid and smoke simulation, physically-accurate liquid dynamics',
  architecture: 'V-Ray 6, photorealistic global illumination, physical sun and sky system'
};

export const LIGHT_MODULES: Record<string, string> = {
  MOODDOPAMINEFLOOD: 'anamorphic blue-streak lens flares, high-contrast sci-fi highlights, neon-pop lighting',
  MOODCORTISOLSPIKE: 'Rembrandt high-contrast portrait lighting, triangular light patch, psychological tension, volumetric fog',
  MOODSEROTONINFLOW: 'bioluminescent sub-dermal glow, god rays atmospheric, diffused golden light'
};

export const CAMERA_MODULES: Record<string, string> = {
  cinematic: 'shot on Arri Alexa 65 with Panavision Anamorphic 50mm f/2.2, heroic low-angle perspective',
  product: 'shot on Hasselblad H6D-100c with 80mm f/2.8, gods eye orthographic view, perfect symmetry',
  character: 'shot on Canon EOS R5 with 85mm f/1.2, shallow depth of field, creamy bokeh background',
  abstract: 'Macro probe lens, 24mm, f/14 deep depth of field, internal refraction',
  architecture: 'Phase One XF IQ4 with 23mm tilt-shift lens, perfectly corrected perspective'
};

export const MOOD_PALETTES: Record<string, string> = {
  MOODDOPAMINEFLOOD: 'neon-pop dopamine flood palette, electric cyan, hot pink, acid yellow, high saturation',
  MOODCORTISOLSPIKE: 'dark industrial cortisol spike palette, matte black, concrete grey, alert red accents',
  MOODSEROTONINFLOW: 'ethereal solarpunk serotonin flow palette, diffused golden light, translucent greens, pearly whites'
};

export const INITIAL_AGENTS: NexusAgent[] = [
    { id: NexusAgentID.CONCEPT_PRIME, name: 'Concept Prime', role: 'Narrativa Surreal', status: 'IDLE' },
    { id: NexusAgentID.CINE_LENS, name: 'Cine Lens', role: 'Câmera & Ótica', status: 'IDLE' },
    { id: NexusAgentID.WORLD_BUILDER, name: 'World Builder', role: 'Atmosfera & Profundidade', status: 'IDLE' },
    { id: NexusAgentID.MATTER_PHYSICIST, name: 'Matter Physicist', role: 'Texturas & Física', status: 'IDLE' },
    { id: NexusAgentID.LUMEN_MASTER, name: 'Lumen Master', role: 'Iluminação Kelvin', status: 'IDLE' },
    { id: NexusAgentID.AURA_ALCHEMIST, name: 'Aura Alchemist', role: 'Milagre & Kintsugi', status: 'IDLE' },
    { id: NexusAgentID.TECH_DIRECTOR, name: 'Tech Director', role: 'Specs de Render', status: 'IDLE' },
    { id: NexusAgentID.QUALITY_PRIME, name: 'Quality Prime', role: 'Excelência 10/10', status: 'IDLE' },
];

export const generateMasterPrompt = (config: { concept: string; style: string; mood: string }): { prompt: string; specs: any } => {
    // NEXUS V2.0 ARCHITECTURE: [SUBJECT] + [STYLE] + [LIGHTING] + [CAMERA] + [TECHNICAL] + [MOOD]
    
    const subject = config.concept;
    const stylePart = `${config.style} style, Cinematic Hyper-Realism`;
    const lightingPart = LIGHT_MODULES[config.mood] || 'volumetric lighting, ray tracing simulation';
    const cameraPart = CAMERA_MODULES[config.style] || 'shot on Virtual ARRI Alexa 35mm, f/2.8, 50mm lens equivalent';
    const technicalPart = '8K, HDR, Film Grain texture, Ray tracing simulation, subsurface scattering';
    const moodPart = MOOD_PALETTES[config.mood] || 'dopamine-inducing composition';
    
    const masterPrompt = [
        subject,
        stylePart,
        lightingPart,
        cameraPart,
        technicalPart,
        moodPart,
        'award-winning composition',
        'professional color grading'
    ].join(', ');

    return {
        prompt: masterPrompt,
        specs: {
            render: RENDER_MODULES[config.style] || 'Gemini 2.5 Engine',
            lighting: lightingPart,
            camera: cameraPart,
            mood: moodPart
        }
    };
};

export const NEGATIVE_PROMPT = '--no blur, noise, artifacts, distortion, watermark, text, low quality, generic, amateur, stock photo, clipart, overexposed, underexposed, flat lighting, dull colors, poor composition, cropped, out of frame';

// --- BATCH MAPPING ---

// Supported by Gemini: "1:1", "3:4", "4:3", "9:16", "16:9"
export const BRAZIL_DIMENSIONS: Record<string, string> = {
  'Instagram Feed': '1:1',
  'Instagram Stories': '9:16',
  'Instagram Reels': '9:16',
  'Facebook Post': '1:1',
  'Facebook Cover': '16:9', // Mapped from 205:78
  'YouTube Thumbnail': '16:9',
  'YouTube Banner': '16:9',
  'LinkedIn Post': '16:9', // Mapped from 1.91:1
  'Twitter Post': '16:9',
  'TikTok': '9:16',
  'WhatsApp Status': '9:16',
  'Pinterest Pin': '3:4', // Mapped from 2:3
  'Web Banner': '16:9',
  'A4 Print': '3:4', // Mapped from 210:297
  'Coff': '16:9' // Mapped from 20x10cm (2:1)
};

export const TEMPLATE_SET_DIMENSIONS = [
    'Instagram Feed',
    'Instagram Stories', 
    'Facebook Post',
    'YouTube Thumbnail',
    'LinkedIn Post',
    'Twitter Post',
    'TikTok',
    'Pinterest Pin',
    'Web Banner'
];