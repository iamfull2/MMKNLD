
export enum NexusAgentID {
    CONCEPT_PRIME = 'CONCEPT_PRIME',
    CINE_LENS = 'CINE_LENS',
    WORLD_BUILDER = 'WORLD_BUILDER',
    MATTER_PHYSICIST = 'MATTER_PHYSICIST',
    LUMEN_MASTER = 'LUMEN_MASTER',
    TYPE_FOUNDRY = 'TYPE_FOUNDRY',
    AURA_ALCHEMIST = 'AURA_ALCHEMIST',
    TECH_DIRECTOR = 'TECH_DIRECTOR',
    QUALITY_PRIME = 'QUALITY_PRIME',
    BRAND_SOUL = 'BRAND_SOUL',
    VOID_SENTINEL = 'VOID_SENTINEL'
}

export interface NexusAgent {
    id: NexusAgentID;
    name: string;
    role: string;
    status: 'IDLE' | 'ACTIVE' | 'COMPLETE';
}

export interface NexusConfig {
    concept: string;
    style: 'cinematic' | 'product' | 'character' | 'abstract' | 'architecture';
    mood: 'MOODDOPAMINEFLOOD' | 'MOODCORTISOLSPIKE' | 'MOODSEROTONINFLOW';
    aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    format?: string;
    quality: number;
    useSemantic?: boolean;
    useMultiModel?: boolean;
    referenceImage?: string | null;
    useQuantum?: boolean;
    featureMode?: 'standard' | 'thumbnail' | 'cutout' | 'floating';
    useConsciousness?: boolean;
    useClone?: boolean;
    useHyperRealism?: boolean;
    hyperRealismPreset?: string;
    cloneMode?: 'ultra' | 'fast' | 'style-only';
}

export interface GenerationResult {
    imageUrl: string;
    title?: string;
    finalPrompt: string;
    specs: {
        render: string;
        lighting: string;
        camera: string;
        mood: string;
    };
    generationTime: string;
    qualityScore: string;
    pipeline?: {
        semantic: boolean;
        styleTransfer: boolean;
        multiModel: boolean;
        quantum?: boolean;
        cutout?: boolean;
        thumbnail?: boolean;
        mockup?: boolean;
        consciousness?: boolean;
        clone?: boolean;
        hyperRealism?: boolean;
    };
}

export interface SwarmState {
    isProcessing: boolean;
    progress: number;
    activeAgent: string | null;
    logs: string[];
}

export interface BatchConfig {
    concept: string;
    style: string;
    mood: string;
    selectedDimensions: string[];
}

export interface BatchResultItem {
    id: string;
    dimensionLabel: string;
    aspectRatio: string;
    imageUrl: string;
    status: 'pending' | 'success' | 'error';
    error?: string;
    nodeId?: string;
}

// --- WORKFLOW ENGINE TYPES ---

export type WorkflowNodeType = 'text_input' | 'media_input' | 'image_generator' | 'video_generator' | 'image_upscaler' | 'ai_assistant' | 'gallery_output' | 'sticky_note';

export interface WorkflowNodeData {
    // Inputs
    label?: string;
    text?: string;
    prompt?: string;
    // Settings
    model?: string;
    aspectRatio?: string;
    resolution?: string;
    duration?: string;
    scale?: string;
    quantity?: number;
    guidance?: number;
    // Output Storage
    outputImage?: string; // URL
    outputVideo?: string; // URL
    status?: 'idle' | 'running' | 'completed' | 'error';
    errorMessage?: string;
}

export interface WorkflowNode {
    id: string;
    type: WorkflowNodeType;
    x: number;
    y: number;
    width?: number;
    height?: number;
    data: WorkflowNodeData;
    selected?: boolean;
}

export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
}

export interface FlowExecutionRequest {
    prompt: string;
    style: string;
    ratio: string;
    targetNodeId: string;
}

// ADSPOWER TYPES
export interface AdsPowerConfig {
    localApiUrl: string; // http://127.0.0.1:50325
    profileId: string;   // j8d9s...
    isConnected: boolean;
    status: 'disconnected' | 'connecting' | 'connected' | 'error';
}

// ... (Rest of existing types unchanged: MarketListing, AutonomousMetrics, etc.)
export interface MarketListing {
    id: string;
    imageUrl: string;
    concept: string;
    style: string;
    price: number;
    trendScore: number;
    status: 'listed' | 'sold';
    timestamp: number;
}

export interface AutonomousMetrics {
    totalGenerated: number;
    totalRevenue: number;
    trendAccuracy: number;
    engineStatus: 'idle' | 'running' | 'paused';
    activeTrend: string;
}

export interface ActivityLog {
    id: string;
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'sale' | 'trend';
}

export interface MemoryEntry {
    id: string;
    timestamp: string;
    concept: string;
    style: string;
    mood: string;
    imageUrl: string;
    dna: StyleDNAProfile;
    performance: {
        likes: number;
        views: number;
    };
}

export interface StyleDNAProfile {
    color: string;
    lighting: string;
    composition: string;
    texture: string;
    parents?: string[];
    generation?: number;
    mutated?: boolean;
    id?: number | string;
    fitness?: number;
}

export interface GenePoolCategory {
    [key: string]: any;
}

export interface SemanticAnalysis {
    emotions: string[];
    abstracts: string[];
    cultural: string | null;
    enrichedConcept: string;
}

export interface StyleReferenceAnalysis {
    colors: string[];
    brightness: string;
    contrast: string;
    promptAddition: string;
}

export interface QuantumState {
    iteration: number;
    temperature: number;
    currentEnergy: number;
    bestEnergy: number;
    currentPrompt: string;
    status: 'idle' | 'annealing' | 'collapsed';
}

export interface PromptState {
    primary: string;
    energy: number;
    temperature: number;
}

export interface AnnealingSchedule {
    initialTemperature: number;
    finalTemperature: number;
    iterations: number;
    coolingRate: number;
    reannealingProb: number;
}

export interface CollabUser {
    id: string;
    name: string;
    color: string;
    cursor: { x: number; y: number };
    isActive: boolean;
}

export interface CollabMessage {
    type: 'JOIN' | 'LEAVE' | 'CURSOR' | 'CHAT' | 'GENERATE';
    userId: string;
    payload: any;
}

export interface ThumbnailConfig {
    template: 'youtube-classic' | 'instagram-minimal' | 'explosive';
    title: string;
    mainImage?: string | null;
    floatingElements: string[];
}

export interface CutoutResult {
    originalUrl: string;
    cutoutUrl: string;
    maskUrl?: string;
    confidence: number;
}

export interface SmartLayer {
    id: string;
    type: 'image' | 'text' | 'background' | 'shape';
    name: string;
    content: string; // URL or Text
    visible: boolean;
    opacity: number;
    blendMode: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    zIndex: number;
}

export interface MockupTemplate {
    id: string;
    name: string;
    category: 'device' | 'print' | 'apparel' | 'outdoor';
    baseImage: string; // URL to the transparent mockup frame
    screenX: number;
    screenY: number;
    screenWidth: number;
    screenHeight: number;
    rotation?: number;
}

export interface ExportConfig {
    format: 'png' | 'jpeg' | 'webp';
    quality: number;
    platform?: string; // e.g., 'instagram-story'
    width?: number;
    height?: number;
}

export interface ContextDimensions {
    temporal: { timeOfDay: string; dayOfWeek: string; seasonality: string };
    userProfile: { level: string; role: string };
    behavioral: { urgency: string; experimentMode: boolean; budgetSignal: string };
    device: { type: string };
}

export interface Objective {
    weight: number;
    target: 'maximize' | 'minimize';
    score?: number;
}

export interface OptimizationObjectives {
    engagement: Objective;
    brandSafety: Objective;
    productionSpeed: Objective;
    uniqueness: Objective;
    aestheticQuality: Objective;
    [key: string]: Objective;
}

export interface CheckpointData {
    id: string;
    type: 'intent' | 'composition' | 'palette';
    title: string;
    proposal: any;
    options: any[];
}

export interface ConsciousnessState {
    isActive: boolean;
    context: ContextDimensions | null;
    currentObjectives: OptimizationObjectives | null;
    activeCheckpoint: CheckpointData | null;
    logs: string[];
}

// V37.1 ULTRA Types
export interface HyperRealismPreset {
    id: string;
    name: string;
    description: string;
    quality: number;
    settings: any;
}

// V37.2 Clone Analysis
export interface CloneAnalysisResult {
    content: string;
    style: string;
    lighting: string;
    colors: string[];
    composition: string;
    mood: string;
    technical: string;
    generatedPrompt: string;
}

// V37.5 Layered Scene
export interface SceneLayer {
    id: string;
    name: string;
    url: string;
    prompt: string;
    zIndex: number;
}

// ═══════════════════════════════════════════════════════════
// NEXUS CANVAS V2.0 TYPES
// ═══════════════════════════════════════════════════════════

export interface CanvasLayer {
    id: string;
    type: 'image' | 'text' | 'group' | 'rect' | 'circle' | 'ai-generated';
    name: string;
    visible: boolean;
    locked: boolean;
    opacity: number;
    // Canvas position
    left?: number;
    top?: number;
    // Metadata
    aiGenerated?: boolean;
    prompt?: string;
    src?: string; // For images
    text?: string; // For text
    fill?: string;
}

export interface CanvasState {
    zoom: number;
    pan: { x: number, y: number };
    selectedLayerIds: string[];
    gridVisible: boolean;
    activeTool: 'select' | 'hand' | 'text' | 'shape' | 'ai';
}

export interface AISuggestion {
    icon: string;
    title: string;
    description: string;
    action: () => void;
}
