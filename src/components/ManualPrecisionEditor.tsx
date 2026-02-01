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
    const [gradientColor2, setGradientColor2] = useState<string>('#000000'); // New: Second Color

    // Separation of Concerns: Fill vs Effects
    type BorderFill = 'solid' | 'gradient-linear' | 'gradient-radial-out' | 'gradient-radial-in' | 'gradient-conic';
    const [borderFill, setBorderFill] = useState<BorderFill>('solid');

    // Gradient Direction for Radial/Linear
    type RadialDirection = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    const [radialDirection, setRadialDirection] = useState<RadialDirection>('center');

    const [isNeon, setIsNeon] = useState(false);
    const [neonIntensity, setNeonIntensity] = useState(50); // 0-100
    const [is3D, setIs3D] = useState(false);


    const PRESETS = [
        { name: 'Classic', width: 2, color: '#ffffff', color2: '#000000', fill: 'solid', neon: false, neonInt: 50, threeD: false },
        { name: 'Neon Blue', width: 4, color: '#00ffff', color2: '#000000', fill: 'solid', neon: true, neonInt: 80, threeD: false },
        { name: 'Gold 3D', width: 8, color: '#ffd700', color2: '#b8860b', fill: 'solid', neon: false, neonInt: 50, threeD: true },
        { name: 'Rainbow', width: 6, color: '#ff0000', color2: '#000000', fill: 'gradient-conic', neon: false, neonInt: 50, threeD: false },
        { name: 'Rain-Neon', width: 6, color: '#ff0000', color2: '#000000', fill: 'gradient-conic', neon: true, neonInt: 100, threeD: false }, // Combo demo
        { name: 'Vignette', width: 10, color: '#000000', color2: 'transparent', fill: 'gradient-radial-out', neon: false, neonInt: 50, threeD: false },
    ] as const;

    const applyPreset = (preset: any) => {
        setBorderWidth(preset.width);
        setBorderColor(preset.color);
        if (preset.color2) setGradientColor2(preset.color2);
        setBorderFill(preset.fill);
        setIsNeon(preset.neon);
        if (preset.neonInt) setNeonIntensity(preset.neonInt);
        setIs3D(preset.threeD);
    };

    // Helper: Generate consistent Gradient CSS
    const getGradientCSS = (fill: BorderFill, c1: string, c2: string, direction: RadialDirection) => {
        if (fill === 'gradient-conic') {
            if (c1.toLowerCase() === '#ff0000' && c2.toLowerCase() === '#000000') {
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
            // Custom Color Conic: Color -> Color2 -> Color
            return `conic-gradient(from 0deg, ${c1} 0%, ${c2} 50%, ${c1} 100%)`;
        }

        // Map Direction to CSS position
        let pos = 'center';
        if (direction === 'top-left') pos = 'top left';
        if (direction === 'top-right') pos = 'top right';
        if (direction === 'bottom-left') pos = 'bottom left';
        if (direction === 'bottom-right') pos = 'bottom right';

        if (fill === 'gradient-radial-out') return `radial-gradient(circle at ${pos}, ${c1} 0%, ${c2} 100%)`;
        if (fill === 'gradient-radial-in') return `radial-gradient(circle at ${pos}, ${c2} 0%, ${c1} 100%)`;
        // Added Linear
        if (fill === 'gradient-linear') return `linear-gradient(to bottom right, ${c1}, ${c2})`; // Simplified linear direction for now or reuse radial direction?
        // User asked for "Kreisverlauf auswählen kann, in welche richtung" (Radial direction).
        // For linear, usually angle. Keeping it simple or default.

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

    // Updated Export with correct Scaling & Clipping Fix
    const handleDownload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Add padding for external glow/shadows
        const padding = 100;
        const totalSize = canvasSize + (padding * 2);

        canvas.width = totalSize;
        canvas.height = totalSize;

        const img = new Image();
        img.src = previewUrl;
        img.onload = () => {
            ctx.clearRect(0, 0, totalSize, totalSize);

            // Move origin to account for padding
            ctx.translate(padding, padding);

            // 1. Draw Image (Clipped)
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

            ctx.restore(); // Removes clip!

            // 2. Draw Border & Effects (Unclipped)
            if (borderWidth > 0) {
                // Calculate scaled border width
                const scaledBorderWidth = borderWidth * ratio;
                ctx.lineWidth = scaledBorderWidth;

                // 1. Resolve Stroke Style (Color or Gradient)
                let strokeStyle: string | CanvasGradient = borderColor;
                const cx = canvasSize / 2;
                const cy = canvasSize / 2;

                if (borderFill === 'gradient-radial-out' || borderFill === 'gradient-radial-in') {
                    // Calculate center based on direction
                    let gx = cx;
                    let gy = cy;
                    if (radialDirection.includes('left')) gx = 0;
                    if (radialDirection.includes('right')) gx = canvasSize;
                    if (radialDirection.includes('top')) gy = 0;
                    if (radialDirection.includes('bottom')) gy = canvasSize;

                    // Radius should cover corners
                    const gradRadius = Math.sqrt(Math.pow(canvasSize, 2) + Math.pow(canvasSize, 2));

                    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gradRadius);
                    if (borderFill === 'gradient-radial-out') {
                        g.addColorStop(0, borderColor);
                        g.addColorStop(1, gradientColor2);
                    } else {
                        g.addColorStop(0, gradientColor2);
                        g.addColorStop(1, borderColor);
                    }
                    strokeStyle = g;
                } else if (borderFill === 'gradient-linear') {
                    const g = ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
                    g.addColorStop(0, borderColor);
                    g.addColorStop(1, gradientColor2);
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
                            g.addColorStop(0.5, gradientColor2);
                            g.addColorStop(1, borderColor);
                        }
                        strokeStyle = g;
                    } catch (e) {
                        // Fallback
                        strokeStyle = borderColor;
                    }
                }

                ctx.strokeStyle = strokeStyle;

                // 2. Define Path (Used for both Glow and Main Stroke)
                ctx.beginPath();
                // To draw the stroke *inside* the clipped area, we need to define a path that is
                // inset by half the line width. The radius also needs to be adjusted.
                // WAIT: If we draw *on* the line (stroke), half is inside, half is outside.
                // The Image is clipped to 'r'.
                // Ideally, we want the border to sit perfectly on top.
                // Canvas stroking is centered on the path.
                ctx.roundRect(0, 0, canvasSize, canvasSize, r);


                // 3. Apply Neon Effect
                if (isNeon) {
                    const blur = (20 * ratio) * (neonIntensity / 50);

                    if (borderFill.startsWith('gradient')) {
                        // For gradient neon, we need to stroke with blur first (glow)
                        ctx.save();
                        ctx.filter = `blur(${blur}px)`;
                        ctx.globalCompositeOperation = 'destination-over'; // Draw behind
                        ctx.lineWidth = scaledBorderWidth;
                        ctx.strokeStyle = strokeStyle; // Use same gradient
                        ctx.stroke();
                        ctx.restore();
                    } else {
                        ctx.shadowColor = borderColor;
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
                    // Simplified Bevel using offset strokes for robustness
                    ctx.save();
                    // We can't clip to stroke easily.
                    // Just draw thinner strokes offset.
                    ctx.lineWidth = scaledBorderWidth / 4;

                    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
                    ctx.translate(-1 * ratio, -1 * ratio);
                    ctx.stroke();

                    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                    ctx.translate(2 * ratio, 2 * ratio);
                    ctx.stroke();

                    ctx.restore();
                }
            }

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
                <main className="relative flex-1 w-full bg-background-dark flex items-center justify-center select-none overflow-hidden">
                    {/* Note: overflow-hidden is here. If we want NEON to spill out VISUALLY in the editor, we might need to remove it OR make the internal container smaller. 
                         For now, the user's primary concern might be the export or the visual containment. 
                         Let's keep it overflow-hidden for the UI layout but ensure the padding inside allows glow.
                     */}

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
                        className={`relative z-10 w-72 h-72 md:w-96 md:h-96 cursor-move touch-none ${isDragging ? 'cursor-grabbing' : ''}`}
                        style={{
                            borderRadius: `${radius}%`,
                            transform: 'translateZ(0)',
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                    >
                        {/* 0. Image Layer (Clipped) */}
                        <div
                            className="absolute inset-0 overflow-hidden pointer-events-none z-0"
                            style={{ borderRadius: `${radius}%` }}
                        >
                            {previewUrl && (
                                <div
                                    className="absolute inset-0 bg-center bg-no-repeat will-change-transform"
                                    style={{
                                        backgroundImage: `url('${previewUrl}')`,
                                        backgroundSize: `${scale}%`,
                                        backgroundPosition: `calc(50% + ${offset.x}px) calc(50% + ${offset.y}px)`
                                    }}
                                />
                            )}
                        </div>

                        {/* 1. Border Layer (Unclipped & Visuals) */}
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
                                background: getGradientCSS(borderFill, borderColor, gradientColor2, radialDirection),

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
                                    background: getGradientCSS(borderFill, borderColor, gradientColor2, radialDirection),
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
                            <div className="absolute inset-0 z-20 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30" style={{ borderRadius: `${radius}%`, overflow: 'hidden' }}>
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
                        <div className="space-y-3">
                            {/* Row 1: Fill Type & Direction */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <label className="text-[9px] text-gray-500 uppercase tracking-wider mb-1 block">Füllung</label>
                                    <select
                                        value={borderFill}
                                        onChange={(e) => setBorderFill(e.target.value as any)}
                                        className="w-full bg-[#1c1c1f] text-xs text-white border border-white/10 rounded h-8 px-2 outline-none focus:border-primary"
                                    >
                                        <option value="solid">Solid</option>
                                        <option value="gradient-linear">Verlauf</option>
                                        <option value="gradient-radial-out">Radial</option>
                                        <option value="gradient-conic">Kreis</option>
                                    </select>
                                </div>
                                {(borderFill === 'gradient-radial-out' || borderFill === 'gradient-radial-in') && (
                                    <div className="flex-1">
                                        <label className="text-[9px] text-gray-500 uppercase tracking-wider mb-1 block">Richtung</label>
                                        <select
                                            value={radialDirection}
                                            onChange={(e) => setRadialDirection(e.target.value as any)}
                                            className="w-full bg-[#1c1c1f] text-xs text-white border border-white/10 rounded h-8 px-2 outline-none focus:border-primary"
                                        >
                                            <option value="center">Mitte</option>
                                            <option value="top-left">O-L</option>
                                            <option value="top-right">O-R</option>
                                            <option value="bottom-left">U-L</option>
                                            <option value="bottom-right">U-R</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Row 2: Colors */}
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="text-[9px] text-gray-500 uppercase tracking-wider mb-1 block">Farbe 1</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={borderColor}
                                            onChange={(e) => setBorderColor(e.target.value)}
                                            className="h-8 w-full bg-transparent border border-white/10 rounded cursor-pointer p-0.5"
                                        />
                                    </div>
                                </div>
                                {borderFill.startsWith('gradient') && (
                                    <div className="flex-1">
                                        <label className="text-[9px] text-gray-500 uppercase tracking-wider mb-1 block">Farbe 2</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={gradientColor2}
                                                onChange={(e) => setGradientColor2(e.target.value)}
                                                className="h-8 w-full bg-transparent border border-white/10 rounded cursor-pointer p-0.5"
                                            />
                                        </div>
                                    </div>
                                )}
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
