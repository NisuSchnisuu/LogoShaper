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

    // Border State
    const [borderWidth, setBorderWidth] = useState<number>(0); // 0-50 px
    const [borderColor, setBorderColor] = useState<string>('#ffffff');

    // Separation of Concerns: Fill vs Effects
    type BorderFill = 'solid' | 'gradient-radial-out' | 'gradient-radial-in' | 'gradient-conic';
    const [borderFill, setBorderFill] = useState<BorderFill>('solid');

    const [isNeon, setIsNeon] = useState(false);
    const [neonIntensity, setNeonIntensity] = useState(50); // 0-100
    const [is3D, setIs3D] = useState(false);


    const PRESETS = [
        { name: 'Classic', width: 2, color: '#ffffff', fill: 'solid', neon: false, neonInt: 50, threeD: false },
        { name: 'Neon Blue', width: 4, color: '#00ffff', fill: 'solid', neon: true, neonInt: 80, threeD: false },
        { name: 'Gold 3D', width: 8, color: '#ffd700', fill: 'solid', neon: false, neonInt: 50, threeD: true },
        { name: 'Rainbow', width: 6, color: '#ff0000', fill: 'gradient-conic', neon: false, neonInt: 50, threeD: false },
        { name: 'Rain-Neon', width: 6, color: '#ff0000', fill: 'gradient-conic', neon: true, neonInt: 100, threeD: false }, // Combo demo
        { name: 'Vignette', width: 10, color: '#000000', fill: 'gradient-radial-out', neon: false, neonInt: 50, threeD: false },
    ] as const;

    const applyPreset = (preset: any) => {
        setBorderWidth(preset.width);
        setBorderColor(preset.color);
        setBorderFill(preset.fill);
        setIsNeon(preset.neon);
        if (preset.neonInt) setNeonIntensity(preset.neonInt);
        setIs3D(preset.threeD);
    };

    // Helper: Generate consistent Gradient CSS
    const getGradientCSS = (fill: BorderFill, color: string) => {
        if (fill === 'gradient-conic') {
            if (color.toLowerCase() === '#ff0000') {
                // Rainbow: Use explicit stops for smooth loop
                return `conic-gradient(from 0deg, 
                    #ff0000 0%, 
                    #ff8000 14.3%, 
                    #ffff00 28.6%, 
                    #00ff00 42.9%, 
                    #0000ff 57.1%, 
                    #4b0082 71.4%, 
                    #ee82ee 85.7%, 
                    #ff0000 100%)`;
            }
            // Custom Color Conic: Color -> White -> Color
            return `conic-gradient(from 0deg, ${color} 0%, #ffffff 50%, ${color} 100%)`;
        }
        if (fill === 'gradient-radial-out') return `radial-gradient(circle, ${color} 60%, transparent 100%)`;
        if (fill === 'gradient-radial-in') return `radial-gradient(circle, transparent 60%, ${color} 100%)`;
        return undefined;
    };


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
            ctx.clip(); // Clip inner content

            // Draw Image
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

            // Draw Border (after image)
            if (borderWidth > 0) {
                // Calculate scaled border width
                const scaledBorderWidth = borderWidth * ratio;
                ctx.lineWidth = scaledBorderWidth;

                // 1. Resolve Stroke Style (Color or Gradient)
                let strokeStyle: string | CanvasGradient = borderColor;
                const cx = canvasSize / 2;
                const cy = canvasSize / 2;

                if (borderFill === 'gradient-radial-out') {
                    const g = ctx.createRadialGradient(cx, cy, canvasSize / 2 - scaledBorderWidth, cx, cy, canvasSize / 2);
                    g.addColorStop(0, borderColor);
                    g.addColorStop(1, 'rgba(0,0,0,0)');
                    strokeStyle = g;
                } else if (borderFill === 'gradient-radial-in') {
                    const g = ctx.createRadialGradient(cx, cy, canvasSize / 2 - scaledBorderWidth, cx, cy, canvasSize / 2);
                    g.addColorStop(0, 'rgba(0,0,0,0)');
                    g.addColorStop(1, borderColor);
                    strokeStyle = g;
                } else if (borderFill === 'gradient-conic') {
                    try {
                        const g = (ctx as any).createConicGradient(0, cx, cy);
                        if (borderColor.toLowerCase() === '#ff0000') { // Rainbow preset hack
                            g.addColorStop(0, "#ff0000");
                            g.addColorStop(0.143, "#ff8000");
                            g.addColorStop(0.286, "#ffff00");
                            g.addColorStop(0.429, "#00ff00");
                            g.addColorStop(0.571, "#0000ff");
                            g.addColorStop(0.714, "#4b0082");
                            g.addColorStop(0.857, "#ee82ee");
                            g.addColorStop(1, "#ff0000");
                        } else {
                            g.addColorStop(0, borderColor);
                            g.addColorStop(0.5, 'white');
                            g.addColorStop(1, borderColor);
                        }
                        strokeStyle = g;
                    } catch (e) {
                        strokeStyle = borderColor;
                    }
                }

                ctx.strokeStyle = strokeStyle;

                // 2. Define Path (Used for both Glow and Main Stroke)
                ctx.beginPath();
                // To draw the stroke *inside* the clipped area, we need to define a path that is
                // inset by half the line width. The radius also needs to be adjusted.
                const halfBorder = scaledBorderWidth / 2;
                const borderRectX = halfBorder;
                const borderRectY = halfBorder;
                const borderRectWidth = canvasSize - scaledBorderWidth;
                const borderRectHeight = canvasSize - scaledBorderWidth;
                const borderRectRadius = Math.max(0, r - halfBorder);
                ctx.roundRect(borderRectX, borderRectY, borderRectWidth, borderRectHeight, borderRectRadius);

                // 3. Apply Neon Effect
                if (isNeon) {
                    if (borderFill.startsWith('gradient')) {
                        // Gradient Neon: Draw a blurred copy of the stroke BEHIND the main stroke
                        ctx.save();
                        const blur = (15 * ratio) * (neonIntensity / 50);
                        ctx.filter = `blur(${blur}px)`;
                        ctx.strokeStyle = strokeStyle;
                        ctx.lineWidth = scaledBorderWidth;
                        ctx.stroke();
                        ctx.restore();

                        // No standard shadow for main stroke
                        ctx.shadowBlur = 0;
                        ctx.shadowColor = 'transparent';
                    } else {
                        // Solid Neon: Use standard shadow on the main stroke
                        ctx.shadowColor = borderColor;
                        const blur = (20 * ratio) * (neonIntensity / 50);
                        ctx.shadowBlur = blur;
                    }
                } else {
                    ctx.shadowBlur = 0;
                    ctx.shadowColor = 'transparent';
                }

                // 4. Draw Main Stroke
                ctx.stroke();

                // 4. Apply 3D Bevel (Extra strokes on top)
                if (is3D) {
                    // Reset shadow
                    ctx.shadowBlur = 0;
                    ctx.shadowColor = 'transparent';

                    // Highlight (Top-Left)
                    ctx.shadowColor = 'rgba(255,255,255,0.7)';
                    ctx.shadowBlur = 2 * ratio;
                    ctx.shadowOffsetX = -2 * ratio;
                    ctx.shadowOffsetY = -2 * ratio;
                    ctx.stroke(); // Re-stroke with shadow only (source-atop not strictly needed if we just layer it)
                    // Actually stroking again draws the line again. 
                    // We want just the shadow? 
                    // Easier: Draw semi-transparent white stroke with offset? No, that shifts the border.
                    // The shadow approach works if we stroke.

                    // Shadow (Bottom-Right)
                    ctx.shadowColor = 'rgba(0,0,0,0.5)';
                    ctx.shadowOffsetX = 2 * ratio;
                    ctx.shadowOffsetY = 2 * ratio;
                    ctx.stroke();

                    // Reset for safety
                    ctx.shadowColor = 'transparent';
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                }
            }

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
                <button
                    onClick={handleDownload}
                    className="flex items-center justify-center size-10 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors cursor-pointer"
                    title="Speichern"
                >
                    <span className="material-symbols-outlined text-[20px]">check</span>
                </button>
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
                    {/* The Editing Canvas Container - Refactored for Zoom/Border */}
                    <div
                        ref={containerRef}
                        className={`relative z-10 w-72 h-72 md:w-96 md:h-96 cursor-move touch-none ${isDragging ? 'cursor-grabbing' : ''}`}
                        style={{
                            // We use padding to simulate the border "space" if needed, or better:
                            // We construct the Visual Stack:
                            // 1. Container (defines size & radius)
                            // 2. Border Layer (Absolute, simulates the border visual)
                            // 3. Image Layer (Absolute, inside, masked)
                            borderRadius: `${radius}%`,
                            boxShadow: '0 0 0 9999px rgba(10,10,12, 0.95)',
                            transform: 'translateZ(0)',
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                    >
                        {/* 1. Border Layer */}
                        <div
                            className="absolute inset-0 pointer-events-none z-20"
                            style={{
                                borderRadius: `${radius}%`,
                                // Logic:
                                // If Solid -> CSS Border.
                                // If Gradient -> CSS Background + Mask.
                                // 3D -> Inset Shadows.
                                // Neon -> Box Shadows.

                                // BORDER: Only if solid. If gradient, we use padding+mask method.
                                border: borderFill === 'solid' ? `${borderWidth}px solid ${borderColor}` : 'none',

                                // BACKGROUND (Gradient Fill)
                                background: getGradientCSS(borderFill, borderColor),

                                // NEON & 3D (Moved to separate layer)
                                // boxShadow: [ ... ].filter(Boolean).join(', '),

                                // MASK (For Gradients to look like Borders)
                                WebkitMask: borderFill.startsWith('gradient')
                                    ? `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`
                                    : undefined,
                                WebkitMaskComposite: borderFill.startsWith('gradient') ? 'xor' : undefined,
                                maskComposite: borderFill.startsWith('gradient') ? 'exclude' : undefined,
                                padding: borderFill.startsWith('gradient') ? `${borderWidth}px` : 0
                            }}
                        ></div>

                        {/* 1.1 Effect Layer: 3D Bevel (Always Box Shadow) + Solid Neon */}
                        <div
                            className="absolute inset-0 pointer-events-none z-15"
                            style={{
                                borderRadius: `${radius}%`,
                                boxShadow: [
                                    // Solid Neon uses Box Shadow
                                    (isNeon && borderFill === 'solid') ? `0 0 ${15 * (neonIntensity / 50)}px ${2 * (neonIntensity / 50)}px ${borderColor}, inset 0 0 ${15 * (neonIntensity / 50)}px ${2 * (neonIntensity / 50)}px ${borderColor}` : '',
                                    // 3D Effect always uses Box Shadow (Inset)
                                    is3D ? `inset ${borderWidth * 0.25}px ${borderWidth * 0.25}px ${borderWidth * 0.25}px rgba(255,255,255,0.5), inset -${borderWidth * 0.25}px -${borderWidth * 0.25}px ${borderWidth * 0.25}px rgba(0,0,0,0.5), ${borderWidth * 0.25}px ${borderWidth * 0.25}px ${borderWidth * 0.5}px rgba(0,0,0,0.5)` : ''
                                ].filter(Boolean).join(', '),
                            }}
                        ></div>

                        {/* 1.2 Gradient Neon Layer (Behind everything, blurred) */}
                        {(isNeon && borderFill.startsWith('gradient')) && (
                            <div
                                className="absolute inset-0 pointer-events-none z-10"
                                style={{
                                    borderRadius: `${radius}%`,
                                    background: getGradientCSS(borderFill, borderColor),
                                    filter: `blur(${15 * (neonIntensity / 50)}px)`,
                                    // MASKING: Same trick as border to make it hollow
                                    WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                                    WebkitMaskComposite: 'xor',
                                    maskComposite: 'exclude',
                                    padding: `${borderWidth}px`,
                                    opacity: 0.8,
                                }}
                            />
                        )}


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


                        {/* Image Layer - FIX FOR ZOOM CLIPPING */}
                        {/* 
                            Problem: transform translates the element. If the element is 100% size, moving it moves it out of view.
                            Solution: Use background-position on a full-size element.
                            Calculations:
                            Center is 50% 50%.
                            Offset is in pixels from center.
                            Note: background-position: center = 50% 50%.
                            If we want to move 10px right, it's calc(50% + 10px).
                        */}
                        {previewUrl && (
                            <div
                                className="absolute inset-0 z-0 bg-center bg-no-repeat pointer-events-none will-change-transform"
                                style={{
                                    borderRadius: `${radius}%`, // Clip image at radius
                                    backgroundImage: `url('${previewUrl}')`,
                                    backgroundSize: `${scale}%`,
                                    backgroundPosition: `calc(50% + ${offset.x}px) calc(50% + ${offset.y}px)`
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
                    flex-1 md:flex-none bg-[#121214] border-t border-white/5 pt-4 pb-4 flex flex-col gap-5 px-5 z-20
                    md:w-96 md:h-full md:border-l md:border-t-0 md:pt-6 md:justify-start
                    overflow-y-auto scrollbar-hide
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
                        <input
                            type="range"
                            min="50"
                            max="200"
                            value={scale}
                            onChange={(e) => setScale(Number(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
                        />
                    </div>

                    {/* Radius Slider */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.15em]">Eckenradius</label>
                            <span className="text-white text-xs font-mono bg-white/5 px-2 py-1 rounded border border-white/5">{radius.toFixed(0)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="50"
                            step="1"
                            value={radius}
                            onChange={(e) => setRadius(Number(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
                        />
                    </div>

                    {/* Presets */}
                    <div className="space-y-2 border-t border-white/5 pt-3">
                        <label className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.15em]">Presets</label>
                        <div className="grid grid-cols-3 gap-2">
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={() => applyPreset(preset)}
                                    className="px-2 py-1.5 rounded-lg bg-[#1c1c1f] border border-white/5 hover:bg-white/5 text-[9px] text-gray-300 transition-colors whitespace-nowrap truncate"
                                    title={preset.name}
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Frame Controls */}
                    <div className="space-y-4 border-t border-white/5 pt-4">
                        <div className="flex items-center justify-between">
                            <label className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.15em]">Rahmen</label>
                        </div>

                        {/* Width */}
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="text-[9px] text-gray-500 uppercase tracking-wider mb-1 block">Dicke</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="20"
                                    value={borderWidth}
                                    onChange={(e) => setBorderWidth(Number(e.target.value))}
                                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
                                />
                            </div>
                            <span className="text-white text-xs font-mono w-8 text-right">{borderWidth}px</span>
                        </div>

                        {/* Color & Effect */}
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="text-[9px] text-gray-500 uppercase tracking-wider mb-1 block">Farbe</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={borderColor}
                                        onChange={(e) => setBorderColor(e.target.value)}
                                        className="h-8 w-12 bg-transparent border border-white/10 rounded cursor-pointer p-0.5"
                                    />
                                    <span className="text-[10px] text-gray-400 font-mono uppercase">{borderColor}</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="text-[9px] text-gray-500 uppercase tracking-wider mb-1 block">Füllung</label>
                                <select
                                    value={borderFill}
                                    onChange={(e) => setBorderFill(e.target.value as any)}
                                    className="w-full bg-[#1c1c1f] text-xs text-white border border-white/10 rounded h-8 px-2 outline-none focus:border-primary"
                                >
                                    <option value="solid">Solid</option>
                                    <option value="gradient-radial-out">Verlauf (Out)</option>
                                    <option value="gradient-radial-in">Verlauf (In)</option>
                                    <option value="gradient-conic">Kreisverlauf</option>
                                </select>
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="flex items-center gap-4 mt-2">
                            <button
                                onClick={() => setIsNeon(!isNeon)}
                                className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors ${isNeon ? 'bg-primary/20 text-primary border-primary/30' : 'bg-[#1c1c1f] text-gray-500 border-white/10 hover:bg-white/5'}`}
                            >
                                Neon
                            </button>
                            <button
                                onClick={() => setIs3D(!is3D)}
                                className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors ${is3D ? 'bg-primary/20 text-primary border-primary/30' : 'bg-[#1c1c1f] text-gray-500 border-white/10 hover:bg-white/5'}`}
                            >
                                3D Effect
                            </button>
                        </div>

                        {/* Neon Intensity (Conditional) */}
                        {isNeon && (
                            <div className="mt-4 animate-in fade-in slide-in-from-top-1">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-[9px] text-gray-500 uppercase tracking-wider">Neon Intensität</label>
                                    <span className="text-white text-[10px] font-mono">{neonIntensity}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={neonIntensity}
                                    onChange={(e) => setNeonIntensity(Number(e.target.value))}
                                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 md:hidden"></div>

                    {/* Bottom padding for scrolling if needed */}
                    <div className="h-4 md:hidden"></div>
                </aside>
            </div>
        </div>
    );
};
