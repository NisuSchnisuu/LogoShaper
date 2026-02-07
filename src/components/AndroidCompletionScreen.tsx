import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface AndroidCompletionScreenProps {
    images: {
        background: string;
        foreground: string;
        composite: string;
    };
    onBack: () => void;
}

export const AndroidCompletionScreen: React.FC<AndroidCompletionScreenProps> = ({ images, onBack }) => {
    const [fileName, setFileName] = useState('adaptive_icon');
    const [isExporting, setIsExporting] = useState(false);

    // Convert data URL to blob
    const dataUrlToBlob = (dataUrl: string): Promise<Blob> => {
        return fetch(dataUrl).then(res => res.blob());
    };

    // Handle ZIP export
    const handleExportZip = async () => {
        setIsExporting(true);

        try {
            const zip = new JSZip();

            // Convert all images to blobs
            const [bgBlob, fgBlob, compBlob] = await Promise.all([
                dataUrlToBlob(images.background),
                dataUrlToBlob(images.foreground),
                dataUrlToBlob(images.composite),
            ]);

            // Add to ZIP with Android-standard naming
            zip.file('ic_launcher_background.png', bgBlob);
            zip.file('ic_launcher_foreground.png', fgBlob);
            zip.file('preview_legacy.png', compBlob);

            // Generate and download
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `${fileName}.zip`);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    // Handle single image download
    const handleDownloadSingle = async (type: 'background' | 'foreground' | 'composite') => {
        const imageMap = {
            background: { src: images.background, name: 'ic_launcher_background.png' },
            foreground: { src: images.foreground, name: 'ic_launcher_foreground.png' },
            composite: { src: images.composite, name: 'preview_legacy.png' },
        };

        const { src, name } = imageMap[type];
        const blob = await dataUrlToBlob(src);
        saveAs(blob, name);
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background-dark text-white font-display w-full md:max-w-7xl md:mx-auto">
            <header className="flex-none flex items-center justify-between px-6 py-4 z-30 bg-background-dark/80 backdrop-blur-xl border-b border-white/5">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors text-white cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
                </button>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-center pr-10 text-white/90">Fertigstellen</h2>
            </header>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

                {/* Preview Area */}
                <main className="flex-1 flex items-center justify-center bg-background-dark overflow-hidden relative p-6">
                    {/* Checkerboard Background */}
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: 'linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)',
                            backgroundSize: '20px 20px',
                            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                        }}
                    />

                    {/* Layer Previews */}
                    <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center justify-center">
                        {/* Composite Preview (Main) */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-48 h-48 md:w-56 md:h-56 rounded-[22%] bg-[#1c1c1f] border border-white/10 shadow-2xl overflow-hidden">
                                <img src={images.composite} alt="Composite" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-white/50 text-xs font-medium">Vorschau (Composite)</span>
                        </div>

                        {/* Layer Breakdown */}
                        <div className="flex md:flex-col gap-4">
                            {/* Background Layer */}
                            <button
                                onClick={() => handleDownloadSingle('background')}
                                className="group flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <div className="w-20 h-20 rounded-xl bg-[#1c1c1f] border border-white/10 overflow-hidden relative">
                                    <img src={images.background} alt="Background" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-xl">download</span>
                                    </div>
                                </div>
                                <span className="text-white/40 text-[10px] group-hover:text-white transition-colors">Background</span>
                            </button>

                            {/* Foreground Layer */}
                            <button
                                onClick={() => handleDownloadSingle('foreground')}
                                className="group flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <div className="w-20 h-20 rounded-xl border border-white/10 overflow-hidden relative"
                                    style={{
                                        backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
                                        backgroundSize: '10px 10px',
                                        backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
                                    }}
                                >
                                    <img src={images.foreground} alt="Foreground" className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-xl">download</span>
                                    </div>
                                </div>
                                <span className="text-white/40 text-[10px] group-hover:text-white transition-colors">Foreground</span>
                            </button>
                        </div>
                    </div>
                </main>

                {/* Controls Sidebar */}
                <aside className="flex-none bg-[#121214] border-t border-white/5 pt-4 pb-8 flex flex-col gap-6 px-6 z-20 md:w-96 md:h-full md:border-l md:border-t-0 md:pt-8 md:justify-start md:overflow-y-auto">

                    {/* File Name Input */}
                    <div className="w-full">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">ZIP Dateiname</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                                className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-[#3ddc84] transition-colors"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">.zip</span>
                        </div>
                    </div>

                    {/* ZIP Contents */}
                    <div className="w-full bg-[#1c1c1f]/50 rounded-2xl p-4 border border-white/5">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-[#3ddc84] text-lg">folder_zip</span>
                            <span className="text-white text-sm font-medium">ZIP Inhalt</span>
                        </div>
                        <ul className="space-y-2 text-xs">
                            <li className="flex items-center gap-2 text-white/60">
                                <span className="material-symbols-outlined text-sm text-white/40">image</span>
                                ic_launcher_background.png
                                <span className="ml-auto text-white/30">1080×1080</span>
                            </li>
                            <li className="flex items-center gap-2 text-white/60">
                                <span className="material-symbols-outlined text-sm text-white/40">image</span>
                                ic_launcher_foreground.png
                                <span className="ml-auto text-white/30">1080×1080</span>
                            </li>
                            <li className="flex items-center gap-2 text-white/60">
                                <span className="material-symbols-outlined text-sm text-white/40">image</span>
                                preview_legacy.png
                                <span className="ml-auto text-white/30">1080×1080</span>
                            </li>
                        </ul>
                    </div>

                    {/* Info */}
                    <div className="w-full bg-[#25252b]/50 rounded-2xl p-4 border border-white/5">
                        <div className="flex gap-3">
                            <span className="material-symbols-outlined text-[#3ddc84] text-xl shrink-0">tips_and_updates</span>
                            <p className="text-white/50 text-xs leading-relaxed">
                                Platziere die Dateien in <code className="text-[#3ddc84] bg-black/30 px-1 rounded">res/mipmap-xxxhdpi/</code> deines Android-Projekts.
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 md:hidden"></div>

                    {/* Download Button */}
                    <div className="space-y-3 pb-safe mt-6 md:mt-auto">
                        <button
                            onClick={handleExportZip}
                            disabled={isExporting}
                            className={`w-full flex items-center justify-center gap-3 h-14 rounded-2xl text-sm font-bold uppercase tracking-widest shadow-xl transition-all ${isExporting
                                ? 'bg-white/20 text-white/50 cursor-wait'
                                : 'bg-[#3ddc84] text-black hover:brightness-110 active:scale-[0.98] cursor-pointer shadow-[#3ddc84]/20'
                                }`}
                        >
                            {isExporting ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                    <span>Exportiere...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">download</span>
                                    <span>Download ZIP</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={onBack}
                            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-transparent text-white/50 text-sm font-medium hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-lg">edit</span>
                            Zurück zum Editor
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
};
