'use client';

import { useState, useCallback } from 'react';
import { RoomLayout, RoomLayoutElement } from '@/lib/api';
import { Trash2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Element type definitions ────────────────────────────────────────────────
const ELEMENT_TYPES: { type: RoomLayoutElement['type']; label: string; emoji: string; defaultW: number; defaultH: number }[] = [
    { type: 'seat',       label: 'Seat / Chair', emoji: '🪑', defaultW: 1, defaultH: 1 },
    { type: 'table',      label: 'Table',        emoji: '🟫', defaultW: 2, defaultH: 1 },
    { type: 'screen',     label: 'Screen',       emoji: '📺', defaultW: 3, defaultH: 1 },
    { type: 'whiteboard', label: 'Whiteboard',   emoji: '🗂️', defaultW: 2, defaultH: 1 },
    { type: 'podium',     label: 'Podium',       emoji: '🎙️', defaultW: 1, defaultH: 1 },
    { type: 'door',       label: 'Door',         emoji: '🚪', defaultW: 1, defaultH: 1 },
    { type: 'plant',      label: 'Plant',        emoji: '🌿', defaultW: 1, defaultH: 1 },
];

const EMOJI_MAP: Record<string, string> = Object.fromEntries(ELEMENT_TYPES.map(e => [e.type, e.emoji]));

const DEFAULT_ROWS = 8;
const DEFAULT_COLS = 12;

function generateId() {
    return Math.random().toString(36).slice(2, 10);
}

interface RoomLayoutBuilderProps {
    value: RoomLayout | null;
    onChange: (layout: RoomLayout | null) => void;
}

export function RoomLayoutBuilder({ value, onChange }: RoomLayoutBuilderProps) {
    const layout: RoomLayout = value || { rows: DEFAULT_ROWS, cols: DEFAULT_COLS, elements: [] };

    const [selectedTool, setSelectedTool] = useState<RoomLayoutElement['type']>('seat');
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [cellSize, setCellSize] = useState(44); // px per cell

    const updateLayout = useCallback((updater: (prev: RoomLayout) => RoomLayout) => {
        onChange(updater(layout));
    }, [layout, onChange]);

    // Place element on a grid cell
    const handleCellClick = (col: number, row: number) => {
        // Check if clicking on an existing element
        const existing = layout.elements.find(el => {
            const w = el.w ?? 1;
            const h = el.h ?? 1;
            return col >= el.x && col < el.x + w && row >= el.y && row < el.y + h;
        });

        if (existing) {
            setSelectedElementId(prev => prev === existing.id ? null : existing.id);
            return;
        }

        // Place new element
        const def = ELEMENT_TYPES.find(t => t.type === selectedTool)!;
        const newEl: RoomLayoutElement = {
            id: generateId(),
            type: selectedTool,
            x: col,
            y: row,
            w: Math.min(def.defaultW, layout.cols - col),
            h: Math.min(def.defaultH, layout.rows - row),
        };
        updateLayout(prev => ({ ...prev, elements: [...prev.elements, newEl] }));
        setSelectedElementId(newEl.id);
    };

    const deleteSelected = () => {
        if (!selectedElementId) return;
        updateLayout(prev => ({ ...prev, elements: prev.elements.filter(e => e.id !== selectedElementId) }));
        setSelectedElementId(null);
    };

    const clearAll = () => {
        updateLayout(prev => ({ ...prev, elements: [] }));
        setSelectedElementId(null);
    };

    // Grid cell background
    const cellBackground = (col: number, row: number): RoomLayoutElement | undefined => {
        return layout.elements.find(el => {
            const w = el.w ?? 1;
            const h = el.h ?? 1;
            return col >= el.x && col < el.x + w && row >= el.y && row < el.y + h;
        });
    };

    const isOriginCell = (el: RoomLayoutElement, col: number, row: number) =>
        el.x === col && el.y === row;

    return (
        <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    {ELEMENT_TYPES.map(et => (
                        <button
                            key={et.type}
                            type="button"
                            title={et.label}
                            onClick={() => setSelectedTool(et.type)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                selectedTool === et.type
                                    ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/30'
                                    : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
                            }`}
                        >
                            <span className="text-base">{et.emoji}</span>
                            <span className="hidden lg:inline">{et.label}</span>
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={() => setCellSize(s => Math.max(28, s - 8))} title="Zoom Out" className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground">
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setCellSize(s => Math.min(64, s + 8))} title="Zoom In" className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground">
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    {selectedElementId && (
                        <Button type="button" variant="ghost" size="sm" onClick={deleteSelected} className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                        </Button>
                    )}
                    <Button type="button" variant="ghost" size="sm" onClick={clearAll} className="gap-1.5 text-muted-foreground">
                        <RotateCcw className="w-3.5 h-3.5" /> Clear
                    </Button>
                </div>
            </div>

            {/* Grid Canvas */}
            <div className="overflow-auto rounded-xl border border-border bg-white dark:bg-slate-900 shadow-inner p-3">
                <div
                    className="relative grid"
                    style={{
                        gridTemplateColumns: `repeat(${layout.cols}, ${cellSize}px)`,
                        gridTemplateRows: `repeat(${layout.rows}, ${cellSize}px)`,
                        width: layout.cols * cellSize,
                        height: layout.rows * cellSize,
                    }}
                >
                    {/* Render grid cells */}
                    {Array.from({ length: layout.rows }, (_, row) =>
                        Array.from({ length: layout.cols }, (_, col) => {
                            const occupant = cellBackground(col, row);
                            const isSelected = occupant?.id === selectedElementId;
                            const isOrigin = occupant ? isOriginCell(occupant, col, row) : false;

                            return (
                                <div
                                    key={`${col}-${row}`}
                                    onClick={() => handleCellClick(col, row)}
                                    className={`
                                        border border-slate-100 dark:border-slate-800 relative flex items-center justify-center cursor-pointer
                                        transition-all duration-100 select-none text-lg
                                        ${occupant
                                            ? isSelected
                                                ? 'bg-primary/20 ring-2 ring-inset ring-primary z-10'
                                                : 'bg-primary/5 hover:bg-primary/10'
                                            : 'hover:bg-primary/5'
                                        }
                                    `}
                                    style={{ gridColumn: `${col + 1}`, gridRow: `${row + 1}` }}
                                    title={occupant ? `${occupant.type} — click to select` : `Place ${selectedTool} here`}
                                >
                                    {occupant && isOrigin && (
                                        <span className="leading-none pointer-events-none">
                                            {EMOJI_MAP[occupant.type]}
                                        </span>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-wrap">
                <span className="font-semibold">Click</span> on empty cell to place • 
                <span className="font-semibold">Click</span> placed element to select • 
                <span className="font-semibold">Delete</span> to remove selected
            </div>

            {/* Grid size controls */}
            <div className="flex items-center gap-4 pt-2 border-t border-border">
                <div className="flex items-center gap-2 text-sm">
                    <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Rows</label>
                    <input
                        type="number"
                        min={4}
                        max={20}
                        value={layout.rows}
                        onChange={e => {
                            const v = parseInt(e.target.value) || DEFAULT_ROWS;
                            updateLayout(prev => ({
                                ...prev,
                                rows: v,
                                elements: prev.elements.filter(el => el.y < v),
                            }));
                        }}
                        className="w-16 px-2 py-1 border border-border rounded-md bg-background text-foreground text-sm"
                    />
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Columns</label>
                    <input
                        type="number"
                        min={4}
                        max={24}
                        value={layout.cols}
                        onChange={e => {
                            const v = parseInt(e.target.value) || DEFAULT_COLS;
                            updateLayout(prev => ({
                                ...prev,
                                cols: v,
                                elements: prev.elements.filter(el => el.x < v),
                            }));
                        }}
                        className="w-16 px-2 py-1 border border-border rounded-md bg-background text-foreground text-sm"
                    />
                </div>
                <span className="text-xs text-muted-foreground ml-auto">
                    {layout.elements.length} element{layout.elements.length !== 1 ? 's' : ''} placed
                </span>
            </div>
        </div>
    );
}
