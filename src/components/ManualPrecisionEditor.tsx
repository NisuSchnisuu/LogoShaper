import React, { useEffect, useState } from 'react';

interface ManualPrecisionEditorProps {
    file: File;
    onBack: () => void;
    onConfirm: (imgSrc: string) => void;
}

export const ManualPrecisionEditor: React.FC<ManualPrecisionEditorProps> = ({ file, onBack, onConfirm }) => {
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [scale, setScale] = useState<number>(100);
    const [radius, setRadius] = useState<number>(25); // 0-50
    const [background, setBackground] = useState<'transparent' | 'grid'>('transparent');
    const [canvasSize] = useState<number>(2048); // High res output

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

        canvas.width = canvasSize;
        canvas.height = canvasSize;

        const img = new Image();
        img.src = previewUrl;
        img.onload = () => {
            ctx.clearRect(0, 0, canvasSize, canvasSize);

            ctx.save();
            ctx.beginPath();
            // Radius calculation: radius state is percent. Canvas radius = size * (radius / 100)
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

            const x = (canvasSize - drawWidth) / 2;
            const y = (canvasSize - drawHeight) / 2;

            ctx.drawImage(img, x, y, drawWidth, drawHeight);
            ctx.restore();

            // Confirm instead of download
            onConfirm(canvas.toDataURL('image/png'));
        };
    };

    const handleZoomIn = () => setScale(prev => Math.min(prev + 10, 200));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 10, 50));

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background-dark text-white font-display max-w-md mx-auto relative border-x border-white/5">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 z-30 relative bg-background-dark/80 backdrop-blur-xl border-b border-white/5">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors text-white cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
                </button>
                <h2 className="text-sm font-semibold uppercase tracking-widest flex-1 text-center pr-10 text-white/90">Manual Precision</h2>
            </header>

            {/* Canvas / Main Area */}
            <main className="relative flex-1 w-full bg-background-dark overflow-hidden flex items-center justify-center">
                {/* Grid Background */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                {/* Blurred BG Image for vibe */}
                {previewUrl && (
                    <div
                        className="absolute w-[110%] h-[110%] bg-cover bg-center blur-2xl opacity-20"
                        style={{ backgroundImage: `url('${previewUrl}')` }}
                    ></div>
                )}

                {/* The Editing Canvas */}
                <div
                    className="relative z-10 w-72 h-72 shadow-[0_0_0_9999px_rgba(10,10,12,0.85)] border border-white/20 transition-all duration-300 ease-out overflow-hidden"
                    style={{
                        borderRadius: `${radius}%`,
                        backgroundColor: background === 'grid' ? '#1c1c1f' : 'transparent' // simplified grid logic
                    }}
                >
                    {background === 'grid' && (
                        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 0.5px, transparent 0.5px)', backgroundSize: '12px 12px' }}></div>
                    )}

                    {previewUrl && (
                        <div
                            className="w-full h-full bg-center bg-no-repeat transition-all duration-100 ease-linear"
                            style={{
                                backgroundImage: `url('${previewUrl}')`,
                                backgroundSize: `${scale}%`
                            }}
                        />
                    )}

                    {/* Guidelines Overlay (Grid) */}
                    <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-40">
                        <div className="border-r border-b border-white/20"></div>
                        <div className="border-r border-b border-white/20"></div>
                        <div className="border-b border-white/20"></div>
                        <div className="border-r border-b border-white/20"></div>
                        <div className="border-r border-b border-white/20"></div>
                        <div className="border-b border-white/20"></div>
                        <div className="border-r border-white/20"></div>
                        <div className="border-r border-white/20"></div>
                        <div></div>
                    </div>

                    {/* Coreners Indicators */}
                    <div className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-primary"></div>
                    <div className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-primary"></div>
                    <div className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-primary"></div>
                    <div className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-primary"></div>
                </div>

                {/* Info Badge */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-[#1c1c1f]/80 backdrop-blur-md text-[10px] font-mono text-gray-400 px-4 py-1.5 rounded-full border border-white/10 uppercase tracking-tighter whitespace-nowrap">
                    Canvas: {canvasSize} x {canvasSize} <span className="mx-2 text-white/20">|</span> Scale: {scale}%
                </div>
            </main>

            {/* Controls Section */}
            <section className="relative z-20 bg-[#121214] border-t border-white/5 pt-4 pb-8 flex flex-col gap-6 px-6">

                {/* Top Controls Row */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={handleZoomOut}
                            className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#1c1c1f] text-gray-400 hover:bg-white/10 transition-all cursor-pointer"
                        >
                            <span className="material-symbols-outlined">zoom_out</span>
                        </button>
                        <button
                            onClick={handleZoomIn}
                            className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#1c1c1f] text-gray-400 hover:bg-white/10 transition-all cursor-pointer"
                        >
                            <span className="material-symbols-outlined">zoom_in</span>
                        </button>
                    </div>
                    <button
                        onClick={() => setBackground(prev => prev === 'transparent' ? 'grid' : 'transparent')}
                        className={`flex items-center gap-3 px-4 h-12 rounded-xl border transition-all cursor-pointer ${background === 'grid' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-[#1c1c1f] text-gray-400 border-transparent hover:bg-white/10'}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">grid_view</span>
                        <span className="text-xs font-bold uppercase tracking-wider">{background === 'grid' ? 'Grid' : 'Clean'}</span>
                    </button>
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
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-accent"
                                style={{ width: `${(radius / 50) * 100}%` }}
                            ></div>
                        </div>

                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)] border-2 border-primary flex items-center justify-center pointer-events-none transition-transform"
                            style={{ left: `${(radius / 50) * 100}%`, transform: 'translate(-50%, -50%)' }}
                        >
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        </div>
                    </div>

                    <div className="flex justify-between text-[9px] text-gray-500/60 font-medium uppercase tracking-widest pt-1">
                        <span>Square</span>
                        <span>Circle</span>
                    </div>
                </div>

                {/* Download Button */}
                <div className="pb-safe">
                    <button
                        onClick={handleDownload}
                        className="w-full group relative flex items-center justify-center gap-3 h-14 rounded-2xl bg-gradient-to-r from-primary to-accent text-white text-sm font-bold uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-[0.98] transition-all overflow-hidden cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="material-symbols-outlined text-[20px]">check</span>
                        <span>Bestätigen</span>
                    </button>
                </div>
            </section>
        </div>
    );
};
