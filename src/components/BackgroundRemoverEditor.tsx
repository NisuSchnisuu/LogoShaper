import React, { useState, useEffect, useRef } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { processMagicEraser } from '../utils/imageProcessing';
import type { EraserLayer } from '../utils/imageProcessing';

interface BackgroundRemoverEditorProps {
    file: File;
    onBack: () => void;
    onConfirm: (imgSrc: string) => void;
}

type EditorMode = 'magic' | 'ai';

export const BackgroundRemoverEditor: React.FC<BackgroundRemoverEditorProps> = ({ file, onBack, onConfirm }) => {
    const [mode, setMode] = useState<EditorMode>('magic');
    const [imageUrl] = useState<string>(URL.createObjectURL(file));
    const [isProcessing, setIsProcessing] = useState(false);

    // Canvas Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);

    // Multi-Layer State
    const [layers, setLayers] = useState<EraserLayer[]>([
        { id: '1', color: null, tolerance: 20, feather: 2, transparency: 100, isActive: true }
    ]);
    const [activeLayerId, setActiveLayerId] = useState<string>('1');
    const [globalChoke, setGlobalChoke] = useState<number>(0);

    // Initialize Canvas with Image
    useEffect(() => {
        const loadCanvas = async () => {
            if (!canvasRef.current) return;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            const img = new Image();
            img.src = imageUrl;
            await new Promise((resolve) => { img.onload = resolve; });

            // Set canvas size (visual size is controlled by CSS, internal by standard resolution or image size)
            // For editing, it's best to keep original resolution but display scaled.
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw original
            ctx.drawImage(img, 0, 0);

            // Save original data for non-destructive editing
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            setOriginalImageData(data);
        };

        loadCanvas();
    }, [imageUrl]);

    // Apply Magic Eraser Effect (Multi-Layer)
    useEffect(() => {
        if (!canvasRef.current || !originalImageData) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clone original data to avoid mutating state
        const inputData = new ImageData(
            new Uint8ClampedArray(originalImageData.data),
            originalImageData.width,
            originalImageData.height
        );

        const processed = processMagicEraser(inputData, {
            layers: layers,
            choke: globalChoke
        });

        ctx.putImageData(processed, 0, 0);

    }, [layers, globalChoke, originalImageData]);

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (mode !== 'magic') return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // Picking from Original Data
        if (originalImageData) {
            const idx = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
            if (idx >= 0 && idx < originalImageData.data.length - 4) {
                const r = originalImageData.data[idx];
                const g = originalImageData.data[idx + 1];
                const b = originalImageData.data[idx + 2];

                const newColor = { r, g, b };

                // Update active layer with new color
                setLayers(prev => prev.map(layer =>
                    layer.id === activeLayerId ? { ...layer, color: newColor } : layer
                ));
            }
        }
    };

    const updateActiveLayer = (key: keyof EraserLayer, value: any) => {
        setLayers(prev => prev.map(layer =>
            layer.id === activeLayerId ? { ...layer, [key]: value } : layer
        ));
    };

    const addLayer = () => {
        const newId = Date.now().toString();
        setLayers(prev => [
            ...prev,
            { id: newId, color: null, tolerance: 20, feather: 2, transparency: 100, isActive: true }
        ]);
        setActiveLayerId(newId);
    };

    const removeLayer = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (layers.length === 1) {
            // Don't remove last one, just reset it
            setLayers([{ id: '1', color: null, tolerance: 20, feather: 2, transparency: 100, isActive: true }]);
            setActiveLayerId('1');
            return;
        }

        const newLayers = layers.filter(l => l.id !== id);
        setLayers(newLayers);
        if (activeLayerId === id) {
            setActiveLayerId(newLayers[newLayers.length - 1].id);
        }
    };

    const handleConfirmClick = () => {
        if (canvasRef.current) {
            const dataUrl = canvasRef.current.toDataURL('image/png');
            onConfirm(dataUrl);
        } else {
            onConfirm(imageUrl);
        }
    };

    const handleAiRemove = async () => {
        setIsProcessing(true);
        try {
            const blob = await removeBackground(imageUrl);
            const url = URL.createObjectURL(blob);

            // Draw result onto canvas
            const img = new Image();
            img.src = url;
            await new Promise((resolve) => { img.onload = resolve; });

            if (canvasRef.current) {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    // Update originalImageData so Magic Eraser can work on top OR preventing mixed modes?
                    // If we want Magic Eraser to refine AI result, we should update originalImageData.
                    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    setOriginalImageData(data);

                    // Reset Magic Eraser layers for new base
                    setLayers([{ id: '1', color: null, tolerance: 20, feather: 2, transparency: 100, isActive: true }]);
                    setActiveLayerId('1');
                }
            }
        } catch (error) {
            console.error("AI Removal failed:", error);
            alert("AI Removal failed. Check reference console.");
        } finally {
            setIsProcessing(false);
        }
    };

    const activeLayer = layers.find(l => l.id === activeLayerId) || layers[0];

    return (
        <div className="flex h-screen w-full flex-col bg-[#09090b] text-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-[#09090b] px-4 py-3 z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-semibold">Background Remover</h1>
                </div>
                <button
                    onClick={handleConfirmClick}
                    className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                    Fertig
                </button>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar / Tools */}
                <div className="w-80 flex-shrink-0 border-r border-white/10 bg-[#0c0c0e] flex flex-col z-40">

                    {/* Mode Switcher */}
                    <div className="p-4 border-b border-white/10">
                        <div className="bg-white/5 p-1 rounded-xl flex gap-1">
                            <button
                                onClick={() => setMode('magic')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'magic' ? 'bg-[#25252b] text-white shadow-sm' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                            >
                                <span className="material-symbols-outlined text-lg">ink_eraser</span>
                                Magic
                            </button>
                            <button
                                onClick={() => setMode('ai')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'ai' ? 'bg-[#25252b] text-white shadow-sm' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                            >
                                <span className="material-symbols-outlined text-lg">auto_awesome</span>
                                AI Auto
                            </button>
                        </div>
                    </div>

                    {/* Tool Settings */}
                    <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                        {mode === 'magic' ? (
                            <div className="space-y-6">
                                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm">
                                    <h3 className="font-bold mb-1 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">touch_app</span>
                                        Farbe wählen
                                    </h3>
                                    <p className="opacity-80 text-xs">Klicke in das Bild, um die zu entfernende Farbe auszuwählen.</p>
                                </div>

                                {/* Layer Management */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold text-white/70 px-1">Farben / Layer</h3>
                                    <div className="flex items-center gap-2 overflow-x-auto p-3 scrollbar-none">
                                        {layers.map(layer => (
                                            <div
                                                key={layer.id}
                                                onClick={() => setActiveLayerId(layer.id)}
                                                className={`relative w-12 h-12 flex-shrink-0 rounded-lg border-2 cursor-pointer transition-all ${activeLayerId === layer.id ? 'border-primary scale-110 shadow-lg shadow-black/50 z-10' : 'border-white/10 opacity-70 hover:opacity-100 hover:scale-105'}`}
                                                style={{
                                                    backgroundColor: layer.color ? `rgb(${layer.color.r}, ${layer.color.g}, ${layer.color.b})` : '#333',
                                                    backgroundImage: !layer.color ? 'linear-gradient(45deg, #444 25%, transparent 25%, transparent 75%, #444 75%, #444), linear-gradient(-45deg, #444 25%, transparent 25%, transparent 75%, #444 75%, #444)' : 'none',
                                                    backgroundSize: !layer.color ? '8px 8px' : 'auto'
                                                }}
                                            >
                                                {!layer.color && (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-white/30 text-xs font-bold">?</span>
                                                    </div>
                                                )}

                                                {/* Remove Button (only show on hover or active?) */}
                                                {(activeLayerId === layer.id || layers.length > 1) && (
                                                    <button
                                                        onClick={(e) => removeLayer(layer.id, e)}
                                                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow-sm hover:bg-red-600 border border-[#0c0c0e]"
                                                    >
                                                        <span className="material-symbols-outlined text-[10px]">close</span>
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        {/* Add Button */}
                                        <button
                                            onClick={addLayer}
                                            className="w-12 h-12 flex-shrink-0 rounded-lg border border-dashed border-white/30 flex items-center justify-center text-white/50 hover:text-white hover:border-white/60 transition-colors"
                                        >
                                            <span className="material-symbols-outlined">add</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Active Layer Details */}
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-white">Aktiver Layer</p>
                                        <p className="text-xs text-white/50 font-mono">
                                            {activeLayer.color ? `R:${activeLayer.color.r} G:${activeLayer.color.g} B:${activeLayer.color.b}` : 'Keine Farbe gewählt'}
                                        </p>
                                    </div>
                                </div>

                                {/* Sliders */}
                                <div className="space-y-4">
                                    {/* Transparency Slider */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-white/70">Transparenz</span>
                                            <span className="text-white font-mono">{activeLayer.transparency}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0" max="100"
                                            value={activeLayer.transparency}
                                            onChange={(e) => updateActiveLayer('transparency', parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                                        />
                                    </div>

                                    {/* Tolerance Slider */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-white/70">Toleranz</span>
                                            <span className="text-white font-mono">{activeLayer.tolerance}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0" max="100"
                                            value={activeLayer.tolerance}
                                            onChange={(e) => updateActiveLayer('tolerance', parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                                        />
                                    </div>

                                    {/* Feather Slider */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-white/70">Weiche Kante</span>
                                            <span className="text-white font-mono">{activeLayer.feather}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0" max="20"
                                            value={activeLayer.feather}
                                            onChange={(e) => updateActiveLayer('feather', parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                                        />
                                    </div>

                                    {/* Divider */}
                                    <div className="w-full h-px bg-white/10 my-4" />

                                    {/* Choke Slider (Global) */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-purple-300/90">Masken-Korrektur (Global)</span>
                                            <span className="text-white font-mono">{globalChoke}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0" max="20"
                                            value={globalChoke}
                                            onChange={(e) => setGlobalChoke(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200 text-sm">
                                    <h3 className="font-semibold mb-1 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">auto_awesome</span>
                                        AI Removal
                                    </h3>
                                    <p className="opacity-80">Entfernt den Hintergrund automatisch mit künstlicher Intelligenz.</p>
                                </div>
                                <button
                                    onClick={handleAiRemove}
                                    disabled={isProcessing}
                                    className={`w-full py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all ${isProcessing ? 'bg-white/5 cursor-wait' : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:shadow-lg hover:shadow-purple-500/20'}`}
                                >
                                    {isProcessing ? (
                                        <>
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            Bearbeite...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined">play_arrow</span>
                                            Start AI Removal
                                        </>
                                    )}
                                </button>

                                {/* Choke Slider for AI Mode */}
                                <div className="space-y-2 pt-4 border-t border-white/10">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-white/70">Masken-Korrektur (Choke)</span>
                                        <span className="text-white font-mono">{globalChoke}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="20"
                                        value={globalChoke}
                                        onChange={(e) => setGlobalChoke(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                                    />
                                    <p className="text-[10px] text-white/40">Kanten verkleinern, um Reste zu entfernen.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 bg-[#18181b] relative flex items-center justify-center overflow-hidden p-8">
                    {/* Checkerboard Background for Transparency */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                            backgroundImage: `
                                linear-gradient(45deg, #333 25%, transparent 25%),
                                linear-gradient(-45deg, #333 25%, transparent 25%),
                                linear-gradient(45deg, transparent 75%, #333 75%),
                                linear-gradient(-45deg, transparent 75%, #333 75%)
                            `,
                            backgroundSize: '20px 20px',
                            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                        }}
                    />

                    {/* Editor Canvas */}
                    <div className="relative shadow-2xl rounded-lg overflow-hidden border border-white/5 bg-transparent">
                        <canvas
                            ref={canvasRef}
                            onClick={handleCanvasClick}
                            className="max-h-[80vh] max-w-full object-contain cursor-crosshair"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
