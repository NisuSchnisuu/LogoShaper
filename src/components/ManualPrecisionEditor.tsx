import React, { useEffect, useState, useRef } from 'react';

interface ManualPrecisionEditorProps {
    file: File;
    onBack: () => void;
    onConfirm: (imgSrc: string) => void;
}

export const ManualPrecisionEditor: React.FC<ManualPrecisionEditorProps> = ({ file, onBack, onConfirm }) => {
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [scale, setScale] = useState<number>(100);
    const [radius, setRadius] = useState<number>(25); // 0-50
    const [isGridActive, setIsGridActive] = useState(false);
    const [canvasSize] = useState<number>(2048); // High res output

    // Dragging State
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const offsetStartRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);



    // --- Drag Logic ---
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        offsetStartRef.current = { ...offset };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;

        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;

        let newX = offsetStartRef.current.x + dx;
        let newY = offsetStartRef.current.y + dy;

        // Snap Logic
        if (isGridActive) {
            // Define Snap Threshold (e.g., 20px)
            const threshold = 20;
            // Snap to Center (0,0)
            if (Math.abs(newX) < threshold) newX = 0;
            if (Math.abs(newY) < threshold) newY = 0;

            // Could add grid line snapping here if needed, e.g. every 50px
        }

        setOffset({ x: newX, y: newY });
    };

    const handleMouseUp = () => setIsDragging(false);
    const handleMouseLeave = () => setIsDragging(false);


    // Re-mapped export function needed the Canvas View Dimension to be accurate.
    // For this prototype, I will use a ref to store the rendered clientWidth.
    const containerRef = useRef<HTMLDivElement>(null);

    // Updated Export with correct Scaling
    const handleDownload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = canvasSize;
        canvas.height = canvasSize;

        const img = new Image();
        img.src = previewUrl;
        img.onload = () => {
            ctx.clearRect(0, 0, canvasSize, canvasSize);
            ctx.save();
            ctx.beginPath();
            const r = canvasSize * (radius / 100);
            ctx.roundRect(0, 0, canvasSize, canvasSize, r);
            ctx.clip();

            const scaleFactor = scale / 100;
            const imgAspect = img.width / img.height;
            let drawWidth, drawHeight;

            if (imgAspect > 1) {
                drawHeight = canvasSize * scaleFactor;
                drawWidth = drawHeight * imgAspect;
            } else {
                drawWidth = canvasSize * scaleFactor;
                drawHeight = drawWidth / imgAspect;
            }

            // Ratio of HighRes / ViewPort
            const viewSize = containerRef.current?.clientWidth || 384;
            const ratio = canvasSize / viewSize;

            const x = (canvasSize - drawWidth) / 2 + (offset.x * ratio);
            const y = (canvasSize - drawHeight) / 2 + (offset.y * ratio);

            ctx.drawImage(img, x, y, drawWidth, drawHeight);
            ctx.restore();
            onConfirm(canvas.toDataURL('image/png'));
        };
    };


    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background-dark text-white font-display w-full md:max-w-7xl md:mx-auto">
            {/* Header */}
            <header className="flex-none flex items-center justify-between px-6 py-4 z-30 bg-background-dark/80 backdrop-blur-xl border-b border-white/5">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center size-10 rounded-full hover:bg-white/10 transition-colors text-white cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
                </button>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-center text-white/90">Manual Precision</h2>
                <div className="w-10"></div>
            </header>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

                {/* Canvas / Main Area */}
                <main className="relative flex-1 w-full bg-background-dark overflow-hidden flex items-center justify-center select-none">

                    {/* Dark/Light Checkerboard for transparency indication behind everything */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}></div>

                    {/* Blurred BG Image for vibe */}
                    {previewUrl && (
                        <div
                            className="absolute w-[110%] h-[110%] bg-cover bg-center blur-3xl opacity-10 pointer-events-none"
                            style={{ backgroundImage: `url('${previewUrl}')` }}
                        ></div>
                    )}

                    {/* The Editing Canvas Container */}
                    <div
                        ref={containerRef}
                        className={`relative z-10 w-72 h-72 md:w-96 md:h-96 shadow-[0_0_0_9999px_rgba(10,10,12,0.9)] border border-white/20 overflow-hidden cursor-move touch-none ${isDragging ? 'cursor-grabbing' : ''}`}
                        style={{
                            borderRadius: `${radius}%`,
                            boxShadow: '0 0 0 9999px rgba(10,10,12, 0.95)'
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                    >
                        {/* Optional Grid Overlay inside canvas area only */}
                        {isGridActive && (
                            <div className="absolute inset-0 z-20 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30">
                                <div className="border-r border-b border-white"></div>
                                <div className="border-r border-b border-white"></div>
                                <div className="border-b border-white"></div>
                                <div className="border-r border-b border-white"></div>
                                <div className="border-r border-b border-white"></div>
                                <div className="border-b border-white"></div>
                                <div className="border-r border-white"></div>
                                <div className="border-r border-white"></div>
                                <div></div>
                            </div>
                        )}

                        {/* Snap Indicators (Crosshair basically) */}
                        {isGridActive && (
                            <>
                                <div className="absolute top-1/2 left-0 w-full h-px bg-primary/50 z-20 pointer-events-none"></div>
                                <div className="absolute left-1/2 top-0 h-full w-px bg-primary/50 z-20 pointer-events-none"></div>
                            </>
                        )}


                        {/* Image Layer */}
                        {previewUrl && (
                            <div
                                className="w-full h-full bg-center bg-no-repeat pointer-events-none will-change-transform"
                                style={{
                                    backgroundImage: `url('${previewUrl}')`,
                                    backgroundSize: `${scale}%`,
                                    transform: `translate(${offset.x}px, ${offset.y}px)`
                                }}
                            />
                        )}
                    </div>

                    {/* Info Badge */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-[#1c1c1f]/80 backdrop-blur-md text-[10px] font-mono text-gray-400 px-4 py-1.5 rounded-full border border-white/10 uppercase tracking-tighter whitespace-nowrap z-50 pointer-events-none">
                        Canvas: {canvasSize} x {canvasSize} <span className="mx-2 text-white/20">|</span> Scale: {scale}% <span className="mx-2 text-white/20">|</span> {Math.round(offset.x)},{Math.round(offset.y)}
                    </div>
                </main>

                {/* Sidebar / Controls Section */}
                <aside className="
                    flex-none bg-[#121214] border-t border-white/5 pt-4 pb-8 flex flex-col gap-8 px-6 z-20
                    md:w-96 md:h-full md:border-l md:border-t-0 md:pt-8 md:justify-start
                ">

                    {/* Grid Toggle */}
                    <div className="flex items-center justify-between">
                        <label className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.15em]">Hilfsmittel</label>
                        <button
                            onClick={() => setIsGridActive(prev => !prev)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${isGridActive ? 'bg-primary/20 text-primary border-primary/30' : 'bg-[#1c1c1f] text-gray-500 border-white/5 hover:bg-white/5'}`}
                        >
                            <span className="material-symbols-outlined text-[18px]">grid_4x4</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider">{isGridActive ? 'An' : 'Aus'}</span>
                        </button>
                    </div>

                    {/* Zoom Slider */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.15em]">Zoom</label>
                            <span className="text-white text-xs font-mono bg-white/5 px-2 py-1 rounded border border-white/5">{scale}%</span>
                        </div>

                        <div className="relative h-6 flex items-center cursor-pointer group">
                            <input
                                type="range"
                                min="50"
                                max="200"
                                value={scale}
                                onChange={(e) => setScale(Number(e.target.value))}
                                className="absolute w-full h-full opacity-0 z-10 cursor-pointer"
                            />
                            <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden relative w-full">
                                <div
                                    className="h-full bg-white rounded-full absolute top-0 left-0"
                                    style={{ width: `${((scale - 50) / 150) * 100}%` }}
                                ></div>
                            </div>
                            <div
                                className="absolute top-1/2 -translate-y-1/2 size-5 bg-white rounded-full shadow-lg border-2 border-[#121214] pointer-events-none transition-transform"
                                style={{ left: `${((scale - 50) / 150) * 100}%`, transform: 'translate(-50%, -50%)' }}
                            ></div>
                        </div>
                    </div>

                    {/* Radius Slider */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.15em]">Eckenradius</label>
                            <span className="text-white text-xs font-mono bg-white/5 px-2 py-1 rounded border border-white/5">{radius.toFixed(1)}%</span>
                        </div>

                        <div className="relative h-6 flex items-center cursor-pointer group">
                            <input
                                type="range"
                                min="0"
                                max="50"
                                step="0.5"
                                value={radius}
                                onChange={(e) => setRadius(Number(e.target.value))}
                                className="absolute w-full h-full opacity-0 z-10 cursor-pointer"
                            />
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-accent"
                                    style={{ width: `${(radius / 50) * 100}%` }}
                                ></div>
                            </div>

                            {/* Corrected Slider Knob Alignment */}
                            <div
                                className="absolute top-1/2 -translate-y-1/2 size-5 bg-white rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)] border-2 border-primary flex items-center justify-center pointer-events-none transition-transform"
                                style={{ left: `${(radius / 50) * 100}%`, transform: 'translate(-50%, -50%)' }}
                            >
                                <div className="w-1 bg-primary rounded-full"></div>
                            </div>
                        </div>

                        <div className="flex justify-between text-[9px] text-gray-500/60 font-medium uppercase tracking-widest pt-1">
                            <span>Square</span>
                            <span>Circle</span>
                        </div>
                    </div>

                    <div className="flex-1 md:hidden"></div>

                    {/* Confirm Button */}
                    <div className="pb-safe mt-6 md:mt-auto">
                        <button
                            onClick={handleDownload}
                            className="w-full group relative flex items-center justify-center gap-3 h-14 rounded-2xl bg-gradient-to-r from-primary to-accent text-white text-sm font-bold uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-[0.98] transition-all overflow-hidden cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="material-symbols-outlined text-[20px]">check</span>
                            <span>Bestätigen</span>
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
};
