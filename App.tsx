
import React, { useState, useEffect, useRef } from 'react';
import ControlPanel from './components/ControlPanel';
import ResultDisplay from './components/ResultDisplay';
import SwarmVisualizer from './components/SwarmVisualizer';
import BatchControlPanel from './components/BatchControlPanel';
import AutonomousDashboard from './components/AutonomousDashboard';
import EvolutionDashboard from './components/EvolutionDashboard';
import QuantumLab from './components/QuantumLab';
import CollaborationPanel from './components/CollaborationPanel';
import PainlessDashboard from './components/PainlessDashboard';
import ConsciousnessHUD from './components/ConsciousnessHUD';
import CheckpointDialog from './components/CheckpointDialog';
import CreativeGenerator from './components/CreativeGenerator'; 
import StudioPro from './components/StudioPro'; 
import AuthGate from './components/AuthGate';
import CustomCursor from './components/CustomCursor';
import StyleDNABuilder from './components/StyleDNABuilder';
import VideoStudio from './components/VideoStudio';
import SettingsModal from './components/SettingsModal';
import SystemDiagnostics from './components/SystemDiagnostics';

import { NexusConfig, GenerationResult, NexusAgent, BatchConfig, QuantumState, CollabUser, ConsciousnessState, FlowExecutionRequest } from './types';
import { INITIAL_AGENTS } from './nexusCore';
import { executeNexusSwarm, runNexusRequest } from './geminiService';
import { neuralMemory } from './neuralMemory';
import { SemanticEngine } from './semanticEngine';
import { MultiModelOrchestrator } from './multiModelOrchestrator';
import { StyleTransferEngine } from './styleTransfer';
import { QuantumPromptAnnealingService } from './quantumPromptAnnealingService';
import { CollaborationHub } from './collaborationHub';
import { ConsciousnessCore } from './consciousnessCore';
import { AICloneUltraV2 } from './aiCloneUltraV2';
import { HyperRealismEngine } from './hyperRealismEngine';

const NexusLogoHeader: React.FC = () => (
    <div className="relative w-8 h-8 flex items-center justify-center group cursor-pointer">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-200 via-slate-500 to-slate-800 shadow-[0_0_10px_rgba(0,240,255,0.3)] relative z-10 overflow-hidden transform transition-transform duration-700 group-hover:rotate-12">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-50"></div>
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.8)]"></div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-nexus-success rounded-full shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-1 bg-nexus-secondary rounded-full shadow-[0_0_5px_rgba(59,130,246,0.8)]"></div>
            <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-1 bg-yellow-500 rounded-full shadow-[0_0_5px_rgba(234,179,8,0.8)]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-nexus-accent rounded-full blur-[1px] z-20 animate-pulse"></div>
        </div>
        <div className="absolute inset-0 bg-nexus-accent/20 rounded-full blur-md group-hover:bg-nexus-secondary/30 transition-colors duration-1000 -z-10"></div>
    </div>
);

const MODE_TITLES: Record<string, [string, string]> = {
    'single': ['MATERIALIZAR', 'VISÃO'],
    'batch': ['FLUXO', 'NEURAL'],
    'editor': ['ESTÚDIO', 'CRIATIVO'],
    'studiopro': ['STUDIO', 'PRO'],
    'video': ['SÍNTESE', 'DE VÍDEO'],
    'autonomous': ['MOTOR', 'SOCIAL'],
    'evolution': ['EVOLUÇÃO', 'GENÉTICA'],
    'quantum': ['RECOZIMENTO', 'QUÂNTICO'],
    'painless': ['SUÍTE', 'TOOLS'],
    'style-dna': ['ARQUITETO', 'DE DNA']
};

const App: React.FC = () => {
    const [mode, setMode] = useState<'single' | 'batch' | 'autonomous' | 'evolution' | 'quantum' | 'painless' | 'editor' | 'studiopro' | 'style-dna' | 'video'>('single');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [showSettings, setShowSettings] = useState(false);

    const [config, setConfig] = useState<NexusConfig>({
        concept: '',
        style: 'cinematic',
        mood: 'MOODDOPAMINEFLOOD',
        aspectRatio: '16:9',
        format: 'YouTube Thumbnail',
        quality: 10.0,
        useSemantic: true,
        useQuantum: false,
        useConsciousness: true,
        useClone: false,
        useHyperRealism: false,
        hyperRealismPreset: 'photo-studio',
        referenceImage: null
    });
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [agents, setAgents] = useState<NexusAgent[]>(INITIAL_AGENTS);
    const [swarmProgress, setSwarmProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const [batchConfig, setBatchConfig] = useState({ concept: '', style: 'cinematic', mood: 'MOODDOPAMINEFLOOD', selectedDimensions: [] });
    const [nodeResults, setNodeResults] = useState<Record<string, string>>({});

    const [quantumState, setQuantumState] = useState<QuantumState>({ iteration: 0, temperature: 0, currentEnergy: 0, bestEnergy: 0, currentPrompt: '', status: 'idle' });
    const [collabUsers, setCollabUsers] = useState<CollabUser[]>([]);
    const [collabMessages, setCollabMessages] = useState<string[]>([]);
    const [collabHub, setCollabHub] = useState<CollaborationHub | null>(null);

    const [consciousnessState, setConsciousnessState] = useState<ConsciousnessState>({ isActive: false, context: null, currentObjectives: null, activeCheckpoint: null, logs: [] });
    const consciousnessRef = useRef<ConsciousnessCore | null>(null);

    useEffect(() => {
        if (theme === 'light') document.body.classList.add('light-mode');
        else document.body.classList.remove('light-mode');
    }, [theme]);

    useEffect(() => {
        const hub = new CollaborationHub((users, msgs) => { setCollabUsers([...users]); setCollabMessages([...msgs]); });
        setCollabHub(hub);
    }, []);

    const handleGenerateSingle = async () => {
        setIsProcessing(true);
        setResult(null);
        setSwarmProgress(0);
        setAgents(INITIAL_AGENTS.map(a => ({ ...a, status: 'IDLE' })));

        try {
            let enhancedConcept = config.concept;
            
            // Orquestração de Prompt Série 3
            if (config.useClone && config.referenceImage) {
                const cloneAnalysis = await AICloneUltraV2.analyzeReference(config.referenceImage);
                enhancedConcept = AICloneUltraV2.generateClonePrompt(enhancedConcept, cloneAnalysis);
            }

            if (config.useHyperRealism && config.hyperRealismPreset) {
                enhancedConcept += `, ${HyperRealismEngine.getPromptModifier(config.hyperRealismPreset)}`;
            }

            if (config.useConsciousness) {
                consciousnessRef.current = new ConsciousnessCore(setConsciousnessState);
                const consciousnessData = await consciousnessRef.current.process(config.concept, 5 * 60 * 1000);
                enhancedConcept += `, optimized for ${consciousnessData.modules?.join(', ') || 'aesthetic perfection'}`;
            }

            if (config.useSemantic) {
                enhancedConcept = SemanticEngine.analyze(enhancedConcept).enrichedConcept;
            }

            const data = await executeNexusSwarm({ ...config, concept: enhancedConcept });
            
            setAgents(prev => prev.map(a => ({ ...a, status: 'COMPLETE' })));
            setSwarmProgress(100);
            setResult(data);
            neuralMemory.storeGeneration(config.concept, config.style, config.mood, data.imageUrl);
        } catch (error: any) {
            console.error(error);
            alert("FALHA NO SISTEMA NEXUS: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleNodeExecution = async (req: FlowExecutionRequest) => {
        setIsProcessing(true);
        try {
            const result = await executeNexusSwarm({ concept: req.prompt, style: req.style as any, mood: 'MOODDOPAMINEFLOOD', aspectRatio: req.ratio as any, quality: 10, useSemantic: true });
            setNodeResults(prev => ({ ...prev, [req.targetNodeId]: result.imageUrl }));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <CustomCursor />
            <AuthGate>
                <div className="min-h-screen font-sans selection:bg-nexus-accent selection:text-black transition-colors duration-300 overflow-x-hidden">
                    <div className="fixed inset-0 z-[-2] bg-gradient-to-br from-nexus-grad-start via-nexus-grad-mid to-nexus-grad-end"></div>

                    {consciousnessState.activeCheckpoint && (
                        <CheckpointDialog data={consciousnessState.activeCheckpoint} onResolve={(action) => consciousnessRef.current?.resolveCheckpoint(action)} />
                    )}

                    <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
                    <SystemDiagnostics />

                    <header className="fixed top-0 left-0 right-0 z-50 border-b border-nexus-border bg-nexus-bg/90 backdrop-blur-xl h-16 flex items-center justify-between px-6 shadow-md">
                        <div className="flex items-center gap-3 shrink-0">
                            <NexusLogoHeader />
                            <h1 className="font-bold text-lg tracking-wider hidden sm:block text-nexus-text">NEXUS <span className="text-nexus-accent text-xs align-top font-mono">V32.0</span></h1>
                        </div>
                        <div className="flex bg-nexus-panel border border-nexus-border rounded-lg p-1 gap-1 overflow-x-auto scrollbar-hide max-w-2xl">
                            {Object.keys(MODE_TITLES).map((m) => (
                                <button key={m} onClick={() => setMode(m as any)} className={`flex-shrink-0 px-3 py-1.5 text-[10px] font-bold rounded-md transition-all whitespace-nowrap ${mode === m ? 'bg-nexus-accent text-black shadow-glow' : 'text-nexus-dim hover:text-nexus-text hover:bg-white/5'}`}>{m.toUpperCase()}</button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono shrink-0">
                            <button onClick={() => setShowSettings(true)} className="p-2 rounded-lg bg-nexus-panel border border-nexus-border text-nexus-text hover:border-nexus-accent">⚙️</button>
                            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-lg bg-nexus-panel border border-nexus-border text-nexus-text hover:border-nexus-accent">{theme === 'dark' ? '☀️' : '🌙'}</button>
                        </div>
                    </header>

                    <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto min-h-screen">
                        {mode === 'single' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
                                    <ControlPanel config={config} setConfig={setConfig} onGenerate={handleGenerateSingle} isProcessing={isProcessing} />
                                    {isProcessing && <SwarmVisualizer agents={agents} progress={swarmProgress} />}
                                    <CollaborationPanel users={collabUsers} messages={collabMessages} onSend={(msg) => collabHub?.sendChat(msg)} />
                                </div>
                                <div className="lg:col-span-8 xl:col-span-9">
                                    <ResultDisplay result={result} />
                                </div>
                            </div>
                        )}

                        {mode === 'editor' && <div className="h-[calc(100vh-140px)]"><CreativeGenerator /></div>}
                        {mode === 'studiopro' && <StudioPro />}
                        {mode === 'video' && <VideoStudio />}
                        {mode === 'batch' && <BatchControlPanel config={batchConfig as any} setConfig={setBatchConfig as any} onProcessNode={handleNodeExecution} onTemplateSet={() => {}} isProcessing={isProcessing} resultsMap={nodeResults} />}
                        {mode === 'autonomous' && <AutonomousDashboard isActive={true} />}
                        {mode === 'evolution' && <div className="max-w-3xl mx-auto"><EvolutionDashboard onEvolveComplete={() => {}} isProcessing={isProcessing} /></div>}
                        {mode === 'quantum' && <div className="max-w-4xl mx-auto"><QuantumLab state={quantumState} standalone={true} /></div>}
                        {mode === 'painless' && <div className="max-w-4xl mx-auto"><PainlessDashboard onImageGenerated={() => {}} /></div>}
                        {mode === 'style-dna' && <div className="max-w-6xl mx-auto"><StyleDNABuilder onApply={() => {}} /></div>}
                    </main>

                    <footer className="fixed bottom-0 left-0 right-0 border-t border-nexus-border bg-nexus-bg/90 backdrop-blur text-center py-2 z-40 hidden sm:block">
                        <p className="text-[10px] font-mono text-nexus-dim uppercase tracking-widest">NEXUS LIGHT DESIGNER — GOD MODE OPERATIONAL</p>
                    </footer>
                </div>
            </AuthGate>
        </>
    );
};

export default App;
