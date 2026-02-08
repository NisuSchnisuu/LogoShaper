import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { AndroidProject } from '../App';

interface AndroidEditorProps {
    project: AndroidProject;
    onBack: () => void;
    onConfirm: (images: { background: string; foreground: string; composite: string }) => void;
}

// Predefined color swatches
const COLOR_SWATCHES = [
    'transparent', // Transparent option
    '#ffffff', // White
    '#000000', // Black
    '#6366f1', // Primary (Indigo)
    '#8b5cf6', // Violet
    '#3ddc84', // Android Green
    '#f43f5e', // Rose
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#0ea5e9', // Sky
    '#1c1c21', // Dark
];

export const AndroidEditor: React.FC<AndroidEditorProps> = ({ project, onBack, onConfirm }) => {
    // Canvas refs
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const bgFileInputRef = useRef<HTMLInputElement>(null);

    // Editor State
    const [scale, setScale] = useState(100);
    const [borderRadius, setBorderRadius] = useState(0); // 0-50%
    const [showSafeZone, setShowSafeZone] = useState(true);

    // Background State
    const [bgType, setBgType] = useState<'color' | 'image' | 'gradient'>(project.background.type as any); // Cast for now if App.tsx not updated
    const [bgColor, setBgColor] = useState(
        project.background.type === 'color' ? project.background.value : '#6366f1'
    );
    const [bgGradient, setBgGradient] = useState<{
        type: 'linear' | 'radial' | 'reflected';
        start: string;
        end: string;
        angle: number;
    }>({
        type: 'linear',
        start: '#6366f1',
        end: '#a855f7',
        angle: 135
    });
    const [bgImageUrl, setBgImageUrl] = useState<string | null>(
        project.background.type === 'image' ? project.background.value : null
    );

    // Foreground State
    const [fgImageUrl, setFgImageUrl] = useState<string | null>(
        project.foreground ? project.foreground.url : null
    );
    const [isRemovingBg, setIsRemovingBg] = useState(false);

    // Loaded Image Objects (for Canvas)
    const [bgImageObj, setBgImageObj] = useState<HTMLImageElement | null>(null);
    const [fgImageObj, setFgImageObj] = useState<HTMLImageElement | null>(null);

    // Helper: Create Gradient
    const createGradient = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const { type, start, end, angle } = bgGradient;
        let grad: CanvasGradient;

        if (type === 'radial') {
            const cx = width / 2;
            const cy = height / 2;
            const radius = Math.max(width, height) / 2;
            grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            grad.addColorStop(0, start);
            grad.addColorStop(1, end);
        } else {
            // Linear or Reflected
            const radian = (angle * Math.PI) / 180;
            const cx = width / 2;
            const cy = height / 2;
            const halfLen = Math.sqrt(width * width + height * height) / 2;

            const x1 = cx - Math.cos(radian) * halfLen;
            const y1 = cy - Math.sin(radian) * halfLen;
            const x2 = cx + Math.cos(radian) * halfLen;
            const y2 = cy + Math.sin(radian) * halfLen;

            grad = ctx.createLinearGradient(x1, y1, x2, y2);

            if (type === 'reflected') {
                grad.addColorStop(0, start);
                grad.addColorStop(0.5, end);
                grad.addColorStop(1, start);
            } else {
                grad.addColorStop(0, start);
                grad.addColorStop(1, end);
            }
        }
        return grad;
    };

    // Load Background Image when URL changes
    useEffect(() => {
        if (bgType === 'image' && bgImageUrl) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = bgImageUrl;
            img.onload = () => setBgImageObj(img);
        } else {
            setBgImageObj(null);
        }
    }, [bgType, bgImageUrl]);

    // Load Foreground Image when URL changes
    useEffect(() => {
        if (fgImageUrl) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = fgImageUrl;
            img.onload = () => setFgImageObj(img);
        } else {
            setFgImageObj(null);
        }
    }, [fgImageUrl]);

    // Handle Background Image Upload
    const handleBgImageUpload = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setBgImageUrl(url);
            setBgType('image');
        }
    };

    // Magic Background Removal
    const removeBackgroundColor = useCallback(async () => {
        if (!fgImageUrl) return;

        setIsRemovingBg(true);

        try {
            // Load the image with crossOrigin to allow canvas manipulation
            const img = new Image();
            img.crossOrigin = 'anonymous';

            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error(`Failed to load image`));
                img.src = fgImageUrl;
            });

            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) throw new Error('Could not get 2D context');

            // Draw image to canvas
            ctx.drawImage(img, 0, 0);

            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Sample perimeter to detect background color (handles rounded corners/transparent edges)
            let bgR = 0, bgG = 0, bgB = 0;
            let validPixels = 0;

            const addPixel = (x: number, y: number) => {
                const idx = (y * canvas.width + x) * 4;
                const alpha = data[idx + 3];
                // Only consider non-transparent pixels
                if (alpha > 10) {
                    bgR += data[idx];
                    bgG += data[idx + 1];
                    bgB += data[idx + 2];
                    validPixels++;
                }
            };

            // Scan Top and Bottom rows
            for (let x = 0; x < canvas.width; x += 10) { // Step 10 for performance
                addPixel(x, 0);
                addPixel(x, canvas.height - 1);
            }

            // Scan Left and Right columns
            for (let y = 0; y < canvas.height; y += 10) {
                addPixel(0, y);
                addPixel(canvas.width - 1, y);
            }

            // If found valid (opaque) pixels on perimeter, calculate average
            if (validPixels > 0) {
                bgR = Math.round(bgR / validPixels);
                bgG = Math.round(bgG / validPixels);
                bgB = Math.round(bgB / validPixels);

                console.log('Detected background color:', { r: bgR, g: bgG, b: bgB, validPixels });

                // Tolerance for color matching
                const tolerance = 35;
                let pixelsChanged = 0;

                // Remove background color
                for (let i = 0; i < data.length; i += 4) {
                    // Skip pixels that are already transparent
                    if (data[i + 3] === 0) continue;

                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    const diff = Math.sqrt(
                        Math.pow(r - bgR, 2) +
                        Math.pow(g - bgG, 2) +
                        Math.pow(b - bgB, 2)
                    );

                    if (diff <= tolerance) {
                        data[i + 3] = 0; // Make transparent
                        pixelsChanged++;
                    } else if (diff <= tolerance * 2) {
                        // Smooth transition
                        const alpha = ((diff - tolerance) / tolerance) * 255;
                        data[i + 3] = Math.min(255, Math.round(alpha));
                        pixelsChanged++;
                    }
                }

                console.log(`Removed background from ${pixelsChanged} pixels`);

                if (pixelsChanged > 0) {
                    // Put processed image back
                    ctx.putImageData(imageData, 0, 0);

                    // Convert to blob and update state
                    canvas.toBlob((blob) => {
                        if (blob) {
                            console.log('Created new blob url');
                            const newUrl = URL.createObjectURL(blob);
                            setFgImageUrl(newUrl);
                        }
                        setIsRemovingBg(false);
                    }, 'image/png');
                } else {
                    console.log('No pixels changed (tolerance too strict?)');
                    setIsRemovingBg(false);
                    alert('Es wurden keine Hintergrund-Pixel gefunden, die der Randfarbe entsprechen.');
                }

            } else {
                // All perimeter pixels are transparent
                console.log('All perimeter pixels are already transparent');
                setIsRemovingBg(false);
                alert('Der gesamte Randbereich ist bereits transparent. Es wurde kein entfernbarer Hintergrund gefunden.');
            }

        } catch (error) {
            console.error('Error removing background:', error);
            setIsRemovingBg(false);
            alert('Fehler beim Entfernen des Hintergrunds.');
        }
    }, [fgImageUrl]);

    // Helper: Trace rounded rect path
    const traceRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    };

    // Draw Preview
    const drawPreview = useCallback(() => {
        const canvas = previewCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = canvas.width;
        ctx.clearRect(0, 0, size, size);

        // Apply Corner Radius Clip
        ctx.save();
        if (borderRadius > 0) {
            const r = size * (borderRadius / 100);
            traceRoundedRect(ctx, 0, 0, size, size, r);
            ctx.clip();
        }

        // Draw background
        if (bgType === 'color') {
            if (bgColor === 'transparent') {
                // Draw checkerboard
                const gridSize = 20;
                for (let x = 0; x < size; x += gridSize) {
                    for (let y = 0; y < size; y += gridSize) {
                        ctx.fillStyle = (x / gridSize + y / gridSize) % 2 === 0 ? '#333333' : '#222222';
                        ctx.fillRect(x, y, gridSize, gridSize);
                    }
                }
            } else {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, size, size);
            }
        } else if (bgType === 'gradient') {
            ctx.fillStyle = createGradient(ctx, size, size);
            ctx.fillRect(0, 0, size, size);
        } else if (bgImageObj) {
            ctx.drawImage(bgImageObj, 0, 0, size, size);
        }

        // ... (Foreground drawing)
        if (fgImageObj) {
            const scaleFactor = scale / 100;
            const fgSize = size * scaleFactor;
            const offset = (size - fgSize) / 2;
            ctx.drawImage(fgImageObj, offset, offset, fgSize, fgSize);
        }

        ctx.restore();

        // Safe Zone
        // ... (existing safe zone code)
        if (showSafeZone) {
            const centerX = size / 2;
            const centerY = size / 2;
            const radius = size * 0.33;

            // Draw outer glow/shadow for contrast
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 4;

            // Draw solid black line first for contrast
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();

            // Draw white dashed line on top
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 2;
            // ctx.setLineDash([8, 6]); // Already set
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.setLineDash([]);
            ctx.shadowBlur = 0; // Reset shadow

            // Text with shadow
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
            ctx.font = `${Math.round(size * 0.025)}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('Safe Zone (66%)', centerX, size * 0.12);
            ctx.shadowBlur = 0;
        }

    }, [bgType, bgColor, bgGradient, bgImageObj, fgImageObj, scale, borderRadius, showSafeZone]);

    // Redraw on state changes
    useEffect(() => {
        drawPreview();
    }, [drawPreview]);


    // Handle Final Export (Update for Gradient)
    const handleExport = () => {
        const exportSize = 1080;
        // ... (create canvases)
        const bgCanvas = document.createElement('canvas');
        bgCanvas.width = exportSize;
        bgCanvas.height = exportSize;
        const bgCtx = bgCanvas.getContext('2d');

        const fgCanvas = document.createElement('canvas');
        fgCanvas.width = exportSize;
        fgCanvas.height = exportSize;
        const fgCtx = fgCanvas.getContext('2d');

        const compCanvas = document.createElement('canvas');
        compCanvas.width = exportSize;
        compCanvas.height = exportSize;
        const compCtx = compCanvas.getContext('2d');

        if (!bgCtx || !fgCtx || !compCtx) return;

        // 1. Render Background
        if (bgType === 'color') {
            if (bgColor !== 'transparent') {
                bgCtx.fillStyle = bgColor;
                bgCtx.fillRect(0, 0, exportSize, exportSize);
            }
        } else if (bgType === 'gradient') {
            bgCtx.fillStyle = createGradient(bgCtx, exportSize, exportSize);
            bgCtx.fillRect(0, 0, exportSize, exportSize);
        } else if (bgImageObj) {
            bgCtx.drawImage(bgImageObj, 0, 0, exportSize, exportSize);
        }

        // ... (Render Foreground)
        if (fgImageObj) {
            const scaleFactor = scale / 100;
            const fgSize = exportSize * scaleFactor;
            const offset = (exportSize - fgSize) / 2;
            fgCtx.drawImage(fgImageObj, offset, offset, fgSize, fgSize);
        }

        // 3. Render Composite
        compCtx.save();
        if (borderRadius > 0) {
            const r = exportSize * (borderRadius / 100);
            traceRoundedRect(compCtx, 0, 0, exportSize, exportSize, r);
            compCtx.clip();
        }

        // Draw Background to Composite
        if (bgType === 'color') {
            if (bgColor !== 'transparent') {
                compCtx.fillStyle = bgColor;
                compCtx.fillRect(0, 0, exportSize, exportSize);
            }
        } else if (bgType === 'gradient') {
            compCtx.fillStyle = createGradient(compCtx, exportSize, exportSize);
            compCtx.fillRect(0, 0, exportSize, exportSize);
        } else if (bgImageObj) {
            compCtx.drawImage(bgImageObj, 0, 0, exportSize, exportSize);
        }

        // Draw Foreground to Composite
        if (fgImageObj) {
            const scaleFactor = scale / 100;
            const fgSize = exportSize * scaleFactor;
            const offset = (exportSize - fgSize) / 2;
            compCtx.drawImage(fgImageObj, offset, offset, fgSize, fgSize);
        }
        compCtx.restore();

        const backgroundDataUrl = bgCanvas.toDataURL('image/png');
        const foregroundDataUrl = fgCanvas.toDataURL('image/png');
        const compositeDataUrl = compCanvas.toDataURL('image/png');

        onConfirm({
            background: backgroundDataUrl,
            foreground: foregroundDataUrl,
            composite: compositeDataUrl,
        });
    };

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col overflow-hidden bg-background-dark font-display md:max-w-7xl md:mx-auto">
            {/* ... Header ... */}
            <header className="flex-none flex items-center justify-between px-6 py-4 z-50 bg-background-dark/90 backdrop-blur-xl border-b border-white/5">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center size-10 rounded-full bg-white/5 active:bg-white/10 transition-colors cursor-pointer hover:bg-white/10"
                >
                    <span className="material-symbols-outlined text-white/70">arrow_back_ios_new</span>
                </button>
                <h2 className="text-white text-base font-semibold tracking-tight">
                    Android Editor
                </h2>
                <div className="w-10"></div>
            </header>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                {/* ... Preview Area ... */}
                <main className="flex-none h-[45vh] w-full md:flex-1 md:h-full md:w-auto flex items-center justify-center relative bg-background-dark px-4 py-8 md:px-0 order-1">
                    <div className="relative w-full max-w-[300px] md:max-w-[400px] aspect-square">
                        <div className="absolute inset-0 bg-[#3ddc84]/20 blur-[80px] rounded-full scale-100 opacity-50"></div>
                        <div className="relative w-full h-full overflow-hidden shadow-2xl border-[1px] border-white/20 transition-all duration-500 ease-out" style={{ borderRadius: `${borderRadius}%` }}>
                            <canvas
                                ref={previewCanvasRef}
                                width={400}
                                height={400}
                                className="w-full h-full"
                            />
                        </div>
                        {/* ... */}
                    </div>
                </main>

                <aside className="flex-1 overflow-y-auto w-full bg-[#1c1c1f] flex flex-col gap-6 p-6 z-40 border-t border-white/5 shadow-2xl md:flex-none md:w-96 md:h-full md:border-l md:border-t-0 md:justify-start md:overflow-y-auto order-2">

                    {/* --- BACKGROUND SECTION --- */}
                    <div className="w-full flex flex-col gap-4">
                        <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Hintergrund</span>

                        {/* Type Toggle */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setBgType('color')}
                                className={`flex-1 h-9 rounded-lg text-xs font-medium transition-all ${bgType === 'color' ? 'bg-primary text-white' : 'bg-[#25252b] text-white/50 hover:bg-white/5'}`}
                            >
                                Farbe
                            </button>
                            <button
                                onClick={() => setBgType('gradient')}
                                className={`flex-1 h-9 rounded-lg text-xs font-medium transition-all ${bgType === 'gradient' ? 'bg-primary text-white' : 'bg-[#25252b] text-white/50 hover:bg-white/5'}`}
                            >
                                Verlauf
                            </button>
                            <button
                                onClick={() => setBgType('image')}
                                className={`flex-1 h-9 rounded-lg text-xs font-medium transition-all ${bgType === 'image' ? 'bg-primary text-white' : 'bg-[#25252b] text-white/50 hover:bg-white/5'}`}
                            >
                                Bild
                            </button>
                        </div>

                        {/* Controls based on Type */}
                        {bgType === 'color' && (
                            /* ... existing color controls ... */
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-lg border-2 border-white/10 cursor-pointer relative overflow-hidden"
                                        style={{ backgroundColor: bgColor === 'transparent' ? '#000000' : bgColor }}
                                    >
                                        {bgColor !== 'transparent' && (
                                            <input
                                                type="color"
                                                value={bgColor}
                                                onChange={(e) => setBgColor(e.target.value)}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        )}
                                        {bgColor === 'transparent' && (
                                            <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMzMzMiLz48cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMzMzIi8+PC9zdmc+')] opacity-50"></div>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={bgColor === 'transparent' ? 'Transparent' : bgColor.toUpperCase()}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setBgColor(val);
                                        }}
                                        disabled={bgColor === 'transparent'}
                                        className="flex-1 h-10 bg-[#25252b] border border-white/10 rounded-lg px-3 text-white font-mono text-xs focus:outline-none focus:border-primary disabled:text-white/30"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {COLOR_SWATCHES.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setBgColor(color)}
                                            className={`w-6 h-6 rounded border-2 transition-all relative overflow-hidden ${bgColor.toLowerCase() === color.toLowerCase() ? 'border-white scale-110' : 'border-transparent hover:border-white/30'}`}
                                            style={{ backgroundColor: color === 'transparent' ? 'transparent' : color }}
                                        >
                                            {color === 'transparent' && (
                                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMzMzMiLz48cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMzMzIi8+PC9zdmc+')] opacity-50"></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {bgType === 'gradient' && (
                            <div className="space-y-4">
                                {/* Gradient Type Selection */}
                                <div className="flex gap-2 p-1 bg-black/20 rounded-lg">
                                    <button
                                        onClick={() => setBgGradient(prev => ({ ...prev, type: 'linear' }))}
                                        className={`flex-1 py-1 text-[10px] font-medium rounded-md transition-all ${bgGradient.type === 'linear' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
                                    >
                                        Linear
                                    </button>
                                    <button
                                        onClick={() => setBgGradient(prev => ({ ...prev, type: 'radial' }))}
                                        className={`flex-1 py-1 text-[10px] font-medium rounded-md transition-all ${bgGradient.type === 'radial' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
                                    >
                                        Radial
                                    </button>
                                    <button
                                        onClick={() => setBgGradient(prev => ({ ...prev, type: 'reflected' }))}
                                        className={`flex-1 py-1 text-[10px] font-medium rounded-md transition-all ${bgGradient.type === 'reflected' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
                                    >
                                        Spiegeln
                                    </button>
                                </div>

                                {/* Gradient Colors */}
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[10px] text-white/50">Start</label>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded border border-white/10 relative overflow-hidden">
                                                <input
                                                    type="color"
                                                    value={bgGradient.start}
                                                    onChange={e => setBgGradient(prev => ({ ...prev, start: e.target.value }))}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                                <div className="w-full h-full" style={{ backgroundColor: bgGradient.start }}></div>
                                            </div>
                                            <input
                                                type="text"
                                                value={bgGradient.start}
                                                onChange={e => setBgGradient(prev => ({ ...prev, start: e.target.value }))}
                                                className="w-full bg-transparent text-[10px] font-mono text-white/80 focus:text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[10px] text-white/50">Ende</label>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded border border-white/10 relative overflow-hidden">
                                                <input
                                                    type="color"
                                                    value={bgGradient.end}
                                                    onChange={e => setBgGradient(prev => ({ ...prev, end: e.target.value }))}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                                <div className="w-full h-full" style={{ backgroundColor: bgGradient.end }}></div>
                                            </div>
                                            <input
                                                type="text"
                                                value={bgGradient.end}
                                                onChange={e => setBgGradient(prev => ({ ...prev, end: e.target.value }))}
                                                className="w-full bg-transparent text-[10px] font-mono text-white/80 focus:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Angle Slider (Only for Linear/Reflected) */}
                                {bgGradient.type !== 'radial' && (
                                    <div>
                                        <div className="flex justify-between text-[10px] text-white/50 mb-2">
                                            <span>Winkel</span>
                                            <span>{bgGradient.angle}°</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0" max="360"
                                            value={bgGradient.angle}
                                            onChange={e => setBgGradient(prev => ({ ...prev, angle: parseInt(e.target.value) }))}
                                            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {bgType === 'image' && (
                            /* ... existing image upload ... */
                            <div>
                                {bgImageUrl ? (
                                    <div className="relative">
                                        <div
                                            className="w-full h-24 rounded-lg bg-cover bg-center border border-white/10"
                                            style={{ backgroundImage: `url(${bgImageUrl})` }}
                                        />
                                        <button
                                            onClick={() => setBgImageUrl(null)}
                                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        className="w-full h-24 rounded-lg border-2 border-dashed border-white/20 hover:border-white/40 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                                        onClick={() => bgFileInputRef.current?.click()}
                                    >
                                        <span className="material-symbols-outlined text-white/40 text-xl">upload</span>
                                        <span className="text-white/40 text-[10px]">Bild hochladen</span>
                                        <input
                                            ref={bgFileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => e.target.files?.[0] && handleBgImageUpload(e.target.files[0])}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Corner Radius Slider (Legacy Icon) */}
                        <div>
                            <div className="flex items-center justify-between px-1 mb-2">
                                <span className="text-white/40 text-[10px]">Eckenradius</span>
                                <span className="text-[#3ddc84] text-xs font-mono font-bold">{borderRadius}%</span>
                            </div>

                            <div className="relative h-6 w-full cursor-pointer group">
                                <input
                                    type="range"
                                    min="0"
                                    max="50"
                                    value={borderRadius}
                                    onChange={(e) => setBorderRadius(Number(e.target.value))}
                                    className="absolute w-full h-full opacity-0 z-10 cursor-pointer"
                                />
                                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                    <div
                                        className="h-full bg-[#3ddc84] rounded-full absolute top-0 left-0"
                                        style={{ width: `${(borderRadius / 50) * 100}%` }}
                                    ></div>
                                </div>
                                <div
                                    className="absolute top-1/2 size-5 bg-white rounded-full shadow border-4 border-background-dark pointer-events-none transition-transform"
                                    style={{ left: `${(borderRadius / 50) * 100}%`, transform: 'translate(-50%, -50%)' }}
                                ></div>
                            </div>
                        </div>

                    </div>

                    <div className="h-px bg-white/10 w-full"></div>

                    {/* --- FOREGROUND SECTION --- */}
                    <div className="w-full flex flex-col gap-4">
                        <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Vordergrund</span>

                        {/* Magic Remove */}
                        <button
                            onClick={removeBackgroundColor}
                            disabled={isRemovingBg}
                            className="w-full h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 text-white text-xs font-medium transition-all disabled:opacity-50"
                        >
                            {isRemovingBg ? (
                                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined text-sm text-[#3ddc84]">auto_fix_high</span>
                            )}
                            Hintergrund entfernen
                        </button>

                        {/* Scale Control */}
                        <div>
                            <div className="flex items-center justify-between px-1 mb-2">
                                <span className="text-white/40 text-[10px]">Größe</span>
                                <span className="text-[#3ddc84] text-xs font-mono font-bold">{scale}%</span>
                            </div>

                            <div className="relative h-6 w-full cursor-pointer group">
                                <input
                                    type="range"
                                    min="60"
                                    max="140"
                                    value={scale}
                                    onChange={(e) => setScale(Number(e.target.value))}
                                    className="absolute w-full h-full opacity-0 z-10 cursor-pointer"
                                />
                                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                    <div
                                        className="h-full bg-[#3ddc84] rounded-full absolute top-0 left-0"
                                        style={{ width: `${((scale - 60) / 80) * 100}%` }}
                                    ></div>
                                </div>
                                <div
                                    className="absolute top-1/2 size-5 bg-white rounded-full shadow border-4 border-background-dark pointer-events-none transition-transform"
                                    style={{ left: `${((scale - 60) / 80) * 100}%`, transform: 'translate(-50%, -50%)' }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/10 w-full"></div>

                    {/* Safe Zone Toggle */}
                    <div className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-white/50 text-base">adjust</span>
                            <span className="text-white text-xs font-medium">Safe Zone (66%)</span>
                        </div>
                        <button
                            onClick={() => setShowSafeZone(!showSafeZone)}
                            className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${showSafeZone ? 'bg-[#3ddc84]' : 'bg-white/20'
                                }`}
                        >
                            <div
                                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${showSafeZone ? 'translate-x-[18px]' : 'translate-x-0.5'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1 md:hidden"></div>

                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        className="h-14 w-full bg-[#3ddc84] hover:brightness-110 text-black text-sm font-bold uppercase tracking-wider rounded-2xl shadow-lg shadow-[#3ddc84]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-auto"
                    >
                        <span className="material-symbols-outlined text-xl">check_circle</span>
                        Exportieren
                    </button>

                </aside>
            </div>
        </div>
    );
};
