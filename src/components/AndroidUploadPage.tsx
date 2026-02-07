import React, { useState, useRef, useCallback } from 'react';

interface AndroidUploadPageProps {
    onBack: () => void;
    onContinue: (file: File) => void;
}

export const AndroidUploadPage: React.FC<AndroidUploadPageProps> = ({ onBack, onContinue }) => {
    // Foreground state
    const [fgImageUrl, setFgImageUrl] = useState<string | null>(null);
    const [fgImageFile, setFgImageFile] = useState<File | null>(null);

    // Refs for file inputs
    const fgFileInputRef = useRef<HTMLInputElement>(null);

    // Drag state
    const [fgDragActive, setFgDragActive] = useState(false);

    // Handle foreground image upload
    const handleFgImageUpload = useCallback((file: File) => {
        if (file && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setFgImageUrl(url);
            setFgImageFile(file);
        }
    }, []);

    // Drag handlers for foreground
    const handleFgDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setFgDragActive(true);
        } else if (e.type === 'dragleave') {
            setFgDragActive(false);
        }
    };

    const handleFgDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setFgDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFgImageUpload(e.dataTransfer.files[0]);
        }
    };

    // Handle continue
    const handleContinue = () => {
        if (fgImageFile) {
            onContinue(fgImageFile);
        }
    };

    // Clear foreground image
    const clearFgImage = () => {
        if (fgImageUrl) URL.revokeObjectURL(fgImageUrl);
        setFgImageUrl(null);
        setFgImageFile(null);
    };

    return (
        <div className="relative flex h-screen w-full flex-col mx-auto overflow-hidden bg-background-dark font-display md:max-w-4xl">
            {/* Header */}
            <div className="flex items-center bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between sticky top-0 z-10">
                <button
                    onClick={onBack}
                    className="text-white/70 flex size-12 shrink-0 items-center justify-start rounded-full active:opacity-50 transition-opacity cursor-pointer"
                >
                    <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
                </button>
                <h2 className="text-white text-lg font-semibold leading-tight tracking-tight flex-1 text-center pr-12">
                    Start
                </h2>
            </div>

            <div className="flex-1 flex flex-col gap-6 px-5 py-6 overflow-y-auto">
                {/* Foreground Section */}
                <section className="bg-surface-dark rounded-[24px] p-5 border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#3ddc84]/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#3ddc84] text-xl">layers</span>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold">Logo hochladen</h3>
                            <p className="text-white/40 text-xs">Wähle dein Logo für den Vordergrund</p>
                        </div>
                    </div>

                    {fgImageUrl ? (
                        <div className="relative">
                            <div className="w-full h-64 rounded-xl bg-[#25252b] border border-white/10 flex items-center justify-center overflow-hidden">
                                {/* Checkerboard background for transparency */}
                                <div
                                    className="absolute inset-0 opacity-20"
                                    style={{
                                        backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
                                        backgroundSize: '16px 16px',
                                        backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
                                    }}
                                />
                                <img
                                    src={fgImageUrl}
                                    alt="Foreground"
                                    className="max-w-[80%] max-h-[80%] object-contain relative z-10"
                                />
                            </div>
                            <button
                                onClick={clearFgImage}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>
                    ) : (
                        <div
                            className={`w-full h-64 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${fgDragActive
                                ? 'border-[#3ddc84] bg-[#3ddc84]/10'
                                : 'border-white/20 hover:border-white/40'
                                }`}
                            onClick={() => fgFileInputRef.current?.click()}
                            onDragEnter={handleFgDrag}
                            onDragLeave={handleFgDrag}
                            onDragOver={handleFgDrag}
                            onDrop={handleFgDrop}
                        >
                            <span className="material-symbols-outlined text-white/40 text-4xl">add_photo_alternate</span>
                            <span className="text-white/40 text-sm">Logo hochladen</span>
                            <span className="text-white/20 text-xs">Drag & Drop oder klicken</span>
                            <input
                                ref={fgFileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleFgImageUpload(e.target.files[0])}
                            />
                        </div>
                    )}
                </section>
            </div>

            {/* Footer Action */}
            <div className="flex-none bg-background-dark/90 backdrop-blur-xl border-t border-white/5 p-5 pb-8">
                <button
                    onClick={handleContinue}
                    disabled={!fgImageUrl}
                    className={`w-full h-14 rounded-2xl text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${fgImageUrl
                        ? 'bg-[#3ddc84] text-black shadow-lg shadow-[#3ddc84]/20 active:scale-[0.98] cursor-pointer'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                        }`}
                >
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    Weiter
                </button>
            </div>
        </div>
    );
};
