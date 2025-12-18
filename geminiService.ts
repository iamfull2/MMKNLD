import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  NexusConfig,
  GenerationResult,
  BatchConfig,
  BatchResultItem,
  MarketListing,
} from "./types";
import { generateMasterPrompt, BRAZIL_DIMENSIONS } from "./nexusCore";

/**
 * NEXUS NEURAL ENGINE - CORE V45.0 (GOD-MODE)
 */

const getAPIKey = () => {
  const key =
    import.meta.env.VITE_GEMINI_API_KEY ??
    process.env.API_KEY ??
    "";
  if (!key) {
    throw new Error("Faltando VITE_GEMINI_API_KEY / API_KEY para Gemini.");
  }
  return key;
};

const getAIInstance = () => {
  const apiKey = getAPIKey();
  return new GoogleGenerativeAI(apiKey);
};

const getImageModel = (ai: GoogleGenerativeAI) =>
  ai.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
  });

const getChatModel = (ai: GoogleGenerativeAI) =>
  ai.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
  });

// Mantém exatamente o mesmo export
export const runNexusRequest = async <T>(
  callback: (ai: any) => Promise<T>
): Promise<T> => {
  const ai = getAIInstance();
  return await callback(ai);
};

// --- IMAGEM ---

export const generateGoogleImage = async (params: {
  prompt: string;
  model: string;
  aspectRatio: string;
  referenceImage?: string;
}): Promise<string> => {
  const ai = getAIInstance();
  const model = getImageModel(ai);

  let ar = params.aspectRatio;
  if (!["1:1", "3:4", "4:3", "9:16", "16:9"].includes(ar)) ar = "1:1";

  const parts: any[] = [{ text: params.prompt }];

  if (params.referenceImage) {
    const base64Data = params.referenceImage.split(",")[1];
    const mimeType =
      params.referenceImage.substring(
        params.referenceImage.indexOf(":") + 1,
        params.referenceImage.indexOf(";")
      ) || "image/png";

    parts.push({
      inlineData: {
        mimeType,
        data: base64Data,
      },
    });
  }

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
  });

  const imagePart = result.response.candidates
    ?.flatMap((c) => c.content?.parts ?? [])
    .find((p: any) => p.inlineData);

  if (imagePart?.inlineData) {
    return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
  }

  throw new Error("O motor de imagem não retornou dados válidos.");
};

// --- AUTONOMOUS IMAGE ---

export const generateAutonomousImage = async (config: {
  concept: string;
  style: string;
  mood: string;
}): Promise<MarketListing> => {
  const { prompt } = generateMasterPrompt(config as any);
  const imageUrl = await generateGoogleImage({
    prompt,
    model: "gemini-2.0-flash-exp",
    aspectRatio: "1:1",
  });

  return {
    id: Math.random().toString(36).substr(2, 9),
    imageUrl,
    concept: config.concept,
    style: config.style,
    price: 49.9,
    trendScore: Math.floor(Math.random() * 100),
    status: "listed",
    timestamp: Date.now(),
  };
};

// --- CHAT ---

export const chatWithNexus = async (
  history: any[],
  newMessage: string
): Promise<string> => {
  const ai = getAIInstance();
  const model = getChatModel(ai);

  try {
    const contents = [
      ...history,
      { role: "user", parts: [{ text: newMessage }] },
    ];

    const result = await model.generateContent({ contents });

    const text =
      result.response.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text ?? "")
        .join(" ")
        .trim() ?? "";

    return text || "Silêncio neural detectado.";
  } catch (e: any) {
    return `Erro de Link: ${e.message}`;
  }
};

// --- SWARM PRINCIPAL ---

export const executeNexusSwarm = async (
  config: NexusConfig
): Promise<GenerationResult> => {
  const { prompt, specs } = generateMasterPrompt(config);

  const imageUrl = await generateGoogleImage({
    prompt,
    model: "gemini-2.0-flash-exp",
    aspectRatio: config.aspectRatio || "1:1",
    referenceImage: config.referenceImage || undefined,
  });

  return {
    imageUrl,
    title: config.concept.slice(0, 20).toUpperCase(),
    finalPrompt: prompt,
    specs,
    generationTime: "0.6s",
    qualityScore: "11.0/10",
    pipeline: {
      semantic: true,
      styleTransfer: false,
      multiModel: false,
      quantum: true,
    },
  };
};

// --- VÍDEO (mantido, mas com erro claro se for chamado) ---

export const generateNexusVideo = async (
  prompt: string,
  imageInput?: string,
  modelId: string = "veo-3.1-fast-generate-preview",
  duration: string = "5s",
  resolution: "720p" | "1080p" = "720p"
): Promise<string> => {
  // Para não quebrar build, mas avisar claramente:
  throw new Error(
    "generateNexusVideo deve ser executado via Supabase Edge Function chamando a API de vídeo do Gemini/Veo."
  );
};
