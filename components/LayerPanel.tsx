import React, { useState } from 'react';
import { CanvasLayer } from '../types';

interface LayerPanelProps {
    layers: any[]; // Relaxed type to match fabric objects structure passing
    selectedIds: string[];
    onSelect: (id: string, multi: boolean) => void;
    onToggleVisibility: (id: string) => void;
    onToggleLock: (id: string) => void;
    onDelete: (id: string) => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onGroup: () => void;
    onUngroup: () => void;
}

const LayerPanel: React.FC<LayerPanelProps> = ({ 
    layers, 
    selectedIds, 
    onSelect, 
    onToggleVisibility, 
    onToggleLock, 
    onDelete,
    onReorder,
    onGroup,
    onUngroup
}) => {
    // layers passed here are already reversed (Top layer at index 0)
    
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // Required for Firefox
        e.dataTransfer.setData('text/plain', index.toString());
        // Set drag image transparent or custom if needed
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;
        
        // Determine position relative to item center
        if (y < height / 2) {
            setDropPosition('before');
        } else {
            setDropPosition('after');
        }
        setDragOverIndex(index);
    };

    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        let targetIndex = index;
        // Logic handled by parent reorder, usually simpler to just swap or move to index
        
        onReorder(draggedIndex, index); 
        
        setDraggedIndex(null);
        setDragOverIndex(null);
        setDropPosition(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
        setDropPosition(null);
    };

    const hasSelection = selectedIds.length > 0;
    const isMultiSelection = selectedIds.length > 1;

    return (
        <div className="flex flex-col h-full bg-nexus-panel border-r border-nexus-border">
            <div className="p-4 border-b border-nexus-border flex justify-between items-center bg-nexus-surface/50">
                <h3 className="text-xs font-bold text-nexus-dim uppercase tracking-widest">CAMADAS ({layers.length})</h3>
                <div className="flex gap-1">
                    {hasSelection && (
                        <button onClick={onUngroup} className="p-1 hover:text-white text-nexus-dim" title="Desagrupar">
                            🔓
                        </button>
                    )}
                    {isMultiSelection && (
                        <button onClick={onGroup} className="p-1 hover:text-white text-nexus-dim" title="Agrupar">
                            🔗
                        </button>
                    )}
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
                {layers.length === 0 && (
                    <div className="text-center mt-10 text-nexus-dim text-xs italic">
                        Canvas Vazio
                    </div>
                )}
                {layers.map((layer, index) => {
                    const isSelected = selectedIds.includes(layer.id);
                    const isDragged = draggedIndex === index;
                    const isOver = dragOverIndex === index;

                    // Determine border styles for drop indicator
                    let borderClass = 'border-transparent';
                    if (isOver) {
                        if (dropPosition === 'before') borderClass = 'border-t-2 border-t-nexus-accent border-b-transparent';
                        if (dropPosition === 'after') borderClass = 'border-b-2 border-b-nexus-accent border-t-transparent';
                    }

                    return (
                        <div 
                            key={layer.id || index}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => onSelect(layer.id, e.ctrlKey || e.shiftKey)}
                            className={`
                                group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border
                                ${isDragged ? 'opacity-30' : 'opacity-100'}
                                ${borderClass}
                                ${isSelected 
                                    ? 'bg-nexus-accent/10 shadow-[0_0_10px_rgba(0,240,255,0.1)]' 
                                    : 'hover:bg-white/5'}
                            `}
                        >
                            {/* Visibility Toggle */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                                className={`text-xs w-4 text-center ${layer.visible ? 'text-nexus-dim hover:text-nexus-text' : 'text-gray-600'}`}
                            >
                                {layer.visible ? '👁️' : '─'}
                            </button>

                            {/* Icon */}
                            <div className="text-sm text-nexus-text opacity-70">
                                {layer.type === 'ai-generated' && '✨'}
                                {layer.type === 'image' && '🖼️'}
                                {layer.type === 'i-text' && 'T'}
                                {layer.type === 'text' && 'T'}
                                {layer.type === 'rect' && '⬜'}
                                {layer.type === 'circle' && '⭕'}
                                {layer.type === 'group' && '🗂️'}
                            </div>

                            {/* Name */}
                            <div className="flex-1 min-w-0">
                                <div className={`text-xs font-medium truncate ${isSelected ? 'text-nexus-text' : 'text-nexus-dim group-hover:text-nexus-text'}`}>
                                    {layer.name}
                                </div>
                                {layer.aiGenerated && (
                                    <div className="text-[8px] text-nexus-accent opacity-70 truncate uppercase tracking-wider">
                                        AI Gen
                                    </div>
                                )}
                            </div>

                            {/* Lock Toggle */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggleLock(layer.id); }}
                                className={`text-xs w-4 text-center ${layer.locked ? 'text-red-400 opacity-100' : 'text-nexus-dim opacity-0 group-hover:opacity-100 hover:text-white'}`}
                            >
                                {layer.locked ? '🔒' : '🔓'}
                            </button>
                            
                            {/* Delete (Hover only) */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(layer.id); }}
                                className="text-xs w-4 text-center text-nexus-dim hover:text-red-500 opacity-0 group-hover:opacity-100"
                            >
                                ✕
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LayerPanel;