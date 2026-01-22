import React, { useEffect, useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface CompletionScreenProps {
    imageSrc: string;
    onBack: () => void;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({ imageSrc, onBack }) => {
    const [fileName, setFileName] = useState('logo');
    const [compressionQuality, setCompressionQuality] = useState(0.8); // 0 to 1
    const [estimatedSize, setEstimatedSize] = useState<string>('0 KB');
    const [originalSize, setOriginalSize] = useState<string>('0 KB');
    const [format, setFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');

    // Calculate sizes
    useEffect(() => {
        const calculateSize = async () => {
            // Get original size (approximate from base64/blob)
            const response = await fetch(imageSrc);
            const blob = await response.blob();
            setOriginalSize((blob.size / 1024).toFixed(2) + ' KB');

            // Get compressed size
            const img = new Image();
            img.src = imageSrc;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob(
                        (compressedBlob) => {
                            if (compressedBlob) {
                                setEstimatedSize((compressedBlob.size / 1024).toFixed(2) + ' KB');
                            }
                        },
                        format,
                        compressionQuality
                    );
                }
            };
        };
        calculateSize();
    }, [imageSrc, compressionQuality, format]);

    const handleDownloadNormal = () => {
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const ext = format.split('/')[1];
                        saveAs(blob, `${fileName}.${ext}`);
                    }
                }, format, compressionQuality);
            }
        };
    };

    const handleDownloadAppSet = async () => {
        const zip = new JSZip();

        // Function to resize and blob
        const resize = (size: number): Promise<Blob> => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = imageSrc;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, size, size);
                        canvas.toBlob((blob) => {
                            if (blob) resolve(blob);
                        }, 'image/png'); // App icons should be PNG
                    }
                };
            });
        };

        const blob512 = await resize(512);
        const blob192 = await resize(192);

        zip.file(`${fileName}-512x512.png`, blob512);
        zip.file(`${fileName}-192x192.png`, blob192);

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `${fileName}-AppIcons.zip`);
    };

    const getExtension = () => format.split('/')[1];

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background-dark text-white font-display max-w-md mx-auto relative border-x border-white/5">
            <header className="flex items-center justify-between px-4 py-3 z-30 relative bg-background-dark/80 backdrop-blur-xl border-b border-white/5">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors text-white cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
                </button>
                <h2 className="text-sm font-semibold uppercase tracking-widest flex-1 text-center pr-10 text-white/90">Fertigstellen</h2>
            </header>

            <main className="flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center gap-8">
                {/* Preview */}
                <div className="relative w-64 h-64 bg-[#1c1c1f] rounded-3xl border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 0.5px, transparent 0.5px)', backgroundSize: '12px 12px' }}></div>
                    <img src={imageSrc} alt="Final Logo" className="w-[80%] h-[80%] object-contain drop-shadow-lg" />
                </div>

                {/* File Name Input */}
                <div className="w-full">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Dateiname</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-primary transition-colors"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">.{getExtension()}</span>
                    </div>
                </div>

                {/* Format Selection */}
                <div className="w-full">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Format</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['image/png', 'image/jpeg', 'image/webp'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFormat(f)}
                                className={`h-10 rounded-lg text-xs font-bold uppercase transition-all border ${format === f
                                        ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                                        : 'bg-[#1c1c1f] border-white/5 text-gray-400 hover:bg-white/5'
                                    }`}
                            >
                                {f.split('/')[1]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Compression */}
                <div className="w-full space-y-4 p-4 rounded-xl bg-[#1c1c1f]/50 border border-white/5">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kompression</label>
                        <span className="text-primary text-xs font-mono font-bold">{Math.round(compressionQuality * 100)}% Quality</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={compressionQuality}
                        onChange={(e) => setCompressionQuality(parseFloat(e.target.value))}
                        className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        disabled={format === 'image/png'}
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                        {format === 'image/png' ? (
                            <span className="col-span-2 text-center w-full text-yellow-500/80">PNG unterstützt keine Kompressionsstufen</span>
                        ) : (
                            <>
                                <span>Est: <span className="text-white">{estimatedSize}</span></span>
                                {originalSize !== '0 KB' && <span>(Orig: {originalSize})</span>}
                            </>
                        )}
                    </div>
                </div>
            </main>

            <footer className="p-6 bg-background-dark border-t border-white/5 space-y-3">
                <button
                    onClick={handleDownloadNormal}
                    className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl bg-white text-black text-sm font-bold uppercase tracking-widest shadow-xl hover:bg-gray-200 transition-colors cursor-pointer"
                >
                    <span className="material-symbols-outlined">download</span>
                    <span>Download ({getExtension().toUpperCase()})</span>
                </button>
                <button
                    onClick={handleDownloadAppSet}
                    className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl bg-[#1c1c1f] text-white border border-white/10 text-sm font-bold uppercase tracking-widest hover:bg-white/5 transition-colors cursor-pointer"
                >
                    <span className="material-symbols-outlined">layers</span>
                    <span>Download App-Set</span>
                </button>
            </footer>
        </div>
    );
};
