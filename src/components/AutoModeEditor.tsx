import React, { useEffect, useState } from 'react';

interface AutoModeEditorProps {
    file: File;
    onBack: () => void;
    onConfirm: (imgSrc: string) => void;
}

type Shape = 'circle' | 'squircle' | 'rounded';

export const AutoModeEditor: React.FC<AutoModeEditorProps> = ({ file, onBack, onConfirm }) => {
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [scale, setScale] = useState<number>(100);
    const [shape, setShape] = useState<Shape>('circle');

    useEffect(() => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleDownload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // High resolution export
        const size = 1024;
        canvas.width = size;
        canvas.height = size;

        const img = new Image();
        img.src = previewUrl;
        img.onload = () => {
            ctx.clearRect(0, 0, size, size);

            // Create Shape Mask
            ctx.save();
            ctx.beginPath();
            const center = size / 2;
            const radius = size / 2;

            if (shape === 'circle') {
                ctx.arc(center, center, radius, 0, Math.PI * 2);
            } else if (shape === 'squircle') {
                const squircleRadius = size * 0.22; // smooth curvature
                ctx.roundRect(0, 0, size, size, [squircleRadius]);

                const iosRadius = size * 0.225;
                ctx.beginPath();
                ctx.roundRect(0, 0, size, size, iosRadius);
            } else {
                // Rounded Square - Matched to 15%
                const r = size * 0.15;
                ctx.roundRect(0, 0, size, size, r);
            }

            ctx.clip();

            // Draw Image Centered & Scaled
            const scaleFactor = scale / 100;
            const imgAspect = img.width / img.height;
            let drawWidth, drawHeight;

            if (imgAspect > 1) {
                drawHeight = size * scaleFactor;
                drawWidth = drawHeight * imgAspect;
            } else {
                drawWidth = size * scaleFactor;
                drawHeight = drawWidth / imgAspect;
            }

            const x = (size - drawWidth) / 2;
            const y = (size - drawHeight) / 2;

            ctx.drawImage(img, x, y, drawWidth, drawHeight);
            ctx.restore();

            // Confirm instead of Download
            onConfirm(canvas.toDataURL('image/png'));
        };
    };

    // Helper for UI Border Radius based on Shape
    const getBorderRadius = () => {
        switch (shape) {
            case 'circle': return '50%';
            case 'squircle': return '22%';
            case 'rounded': return '15%';
            default: return '50%';
        }
    };

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col overflow-hidden bg-background-dark font-display md:max-w-7xl md:mx-auto">
            {/* Header */}
            <header className="flex-none flex items-center justify-between px-6 py-4 z-50 bg-background-dark/90 backdrop-blur-xl border-b border-white/5">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center size-10 rounded-full bg-white/5 active:bg-white/10 transition-colors cursor-pointer hover:bg-white/10"
                >
                    <span className="material-symbols-outlined text-white/70">arrow_back_ios_new</span>
                </button>
                <h2 className="text-white text-base font-semibold tracking-tight">
                    Auto-Mode
                </h2>
                <div className="w-10"></div> {/* Spacer for balance */}
            </header>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

                {/* Canvas Area */}
                <main className="flex-1 flex items-center justify-center relative bg-background-dark px-4 py-8 md:px-0">

                    {/* Preview Area */}
                    <div className="relative w-full max-w-[300px] md:max-w-[400px] aspect-square">
                        {/* Background Glow */}
                        <div className="absolute inset-0 bg-primary/30 blur-[80px] rounded-full scale-100 opacity-50"></div>

                        {/* Mask Container */}
                        <div
                            className="relative w-full h-full overflow-hidden shadow-2xl border-[1px] border-white/20 transition-all duration-500 ease-out bg-surface-dark"
                            style={{ borderRadius: getBorderRadius() }}
                        >
                            {previewUrl && (
                                <div
                                    className="w-full h-full bg-center bg-no-repeat transition-transform duration-100 ease-linear"
                                    style={{
                                        backgroundImage: `url("${previewUrl}")`,
                                        backgroundSize: `${scale}%`,
                                    }}
                                />
                            )}
                            {/* Grid Overlay */}
                            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
                        </div>

                        {/* Center Crosshair */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                            <div className="w-px h-4 bg-white"></div>
                            <div className="h-px w-4 bg-white absolute"></div>
                        </div>
                    </div>
                </main>

                {/* Sidebar Controls (Desktop) / Bottom Sheet (Mobile) */}
                <aside className="
                    flex-none bg-[#1c1c1f] flex flex-col gap-8 p-6 z-40 border-t border-white/5 shadow-2xl
                    md:w-96 md:h-full md:border-l md:border-t-0 md:justify-center
                ">
                    {/* Scale Control */}
                    <div className="w-full flex flex-col gap-6">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Scale Adjustment</span>
                            <span className="text-primary text-xs font-mono font-bold">{scale}%</span>
                        </div>

                        <div className="relative flex h-6 w-full items-center cursor-pointer group">
                            <input
                                type="range"
                                min="50"
                                max="200"
                                value={scale}
                                onChange={(e) => setScale(Number(e.target.value))}
                                className="absolute w-full h-full opacity-0 z-10 cursor-pointer"
                            />
                            <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden relative">
                                <div
                                    className="h-full bg-primary rounded-full absolute top-0 left-0"
                                    style={{ width: `${((scale - 50) / 150) * 100}%` }}
                                ></div>
                            </div>
                            <div
                                className="absolute top-1/2 -translate-y-1/2 size-6 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)] border-4 border-background-dark pointer-events-none transition-transform"
                                style={{ left: `${((scale - 50) / 150) * 100}%`, transform: 'translate(-50%, -50%)' }}
                            ></div>
                        </div>
                    </div>

                    {/* Shape Controls */}
                    <div className="flex justify-center w-full">
                        <div className="flex items-center gap-1.5 p-1.5 bg-[#242426] rounded-[24px] shadow-lg border border-white/5 w-full justify-between max-w-xs md:max-w-none md:flex-wrap md:justify-center md:gap-4 md:bg-transparent md:border-0 md:shadow-none">
                            <button
                                onClick={() => setShape('circle')}
                                className={`relative flex flex-col items-center justify-center size-[52px] rounded-[18px] transition-all cursor-pointer ${shape === 'circle' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5 md:bg-surface-dark md:border md:border-white/10'}`}
                            >
                                <span className="material-symbols-outlined filled text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>circle</span>
                                {shape === 'circle' && <div className="absolute -bottom-1 size-1 bg-primary rounded-full"></div>}
                            </button>

                            <button
                                onClick={() => setShape('squircle')}
                                className={`relative flex flex-col items-center justify-center size-[52px] rounded-[18px] transition-all cursor-pointer ${shape === 'squircle' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5 md:bg-surface-dark md:border md:border-white/10'}`}
                            >
                                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'wght' 300" }}>crop_7_5</span>
                                {shape === 'squircle' && <div className="absolute -bottom-1 size-1 bg-primary rounded-full"></div>}
                            </button>

                            <button
                                onClick={() => setShape('rounded')}
                                className={`relative flex flex-col items-center justify-center size-[52px] rounded-[18px] transition-all cursor-pointer ${shape === 'rounded' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5 md:bg-surface-dark md:border md:border-white/10'}`}
                            >
                                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'wght' 300" }}>rounded_corner</span>
                                {shape === 'rounded' && <div className="absolute -bottom-1 size-1 bg-primary rounded-full"></div>}
                            </button>

                            <div className="w-px h-8 bg-white/5 mx-1 md:hidden"></div>

                            <button className="flex items-center justify-center size-[52px] rounded-[18px] text-white/40 hover:text-white transition-all cursor-pointer md:hidden">
                                <span className="material-symbols-outlined text-[20px]">aspect_ratio</span>
                            </button>
                        </div>
                    </div>

                    {/* Confirm Button (Moved to bottom of sidebar on desktop) */}
                    <button
                        onClick={handleDownload}
                        className="h-12 w-full bg-primary hover:brightness-110 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer mt-auto md:mt-0"
                    >
                        Bestätigen
                    </button>

                </aside>
            </div>
        </div>
    );
};
