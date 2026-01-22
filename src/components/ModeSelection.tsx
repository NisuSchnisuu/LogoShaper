import React, { useEffect, useState } from 'react';

interface ModeSelectionProps {
    file: File;
    onBack: () => void;
    onSelectMode: (mode: 'auto' | 'manual') => void;
}

export const ModeSelection: React.FC<ModeSelectionProps> = ({ file, onBack, onSelectMode }) => {
    const [previewUrl, setPreviewUrl] = useState<string>('');

    useEffect(() => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [file]);

    return (
        <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto overflow-x-hidden bg-background-dark font-display">
            {/* Header */}
            <div className="flex items-center bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between sticky top-0 z-10">
                <button
                    onClick={onBack}
                    className="text-white/70 flex size-12 shrink-0 items-center justify-start rounded-full active:opacity-50 transition-opacity cursor-pointer"
                >
                    <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
                </button>
                <h2 className="text-white text-lg font-semibold leading-tight tracking-tight flex-1 text-center pr-12">
                    Modus wählen
                </h2>
            </div>

            <div className="flex flex-col items-center justify-center py-8 px-6">
                {/* Image Preview Card */}
                <div className="relative group">
                    <div className="relative w-52 h-52 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border-[6px] border-[#1c1c21] bg-[#1c1c21] transition-transform duration-500">
                        {previewUrl && (
                            <div
                                className="w-full h-full bg-cover bg-center"
                                style={{ backgroundImage: `url("${previewUrl}")` }}
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-accent text-white text-[11px] font-bold px-4 py-1.5 rounded-full shadow-xl border border-white/10 whitespace-nowrap flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        BEREIT ZUM FORMEN
                    </div>
                </div>

                <p className="mt-10 text-center text-sm text-white/50 px-4">
                    Wähle die beste Methode für deinen perfekten Logo-Zuschnitt.
                </p>
            </div>

            {/* Mode Selection Grid */}
            <div className="px-5 pb-8 flex-1">
                <div className="grid grid-cols-2 gap-4 h-full items-stretch">
                    {/* Magic Auto Card */}
                    <div
                        onClick={() => onSelectMode('auto')}
                        className="relative flex flex-col items-center justify-between p-5 rounded-[32px] bg-surface-dark border border-white/5 shadow-2xl active:scale-95 transition-all duration-200 cursor-pointer overflow-hidden group hover:border-primary/30"
                    >
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 blur-3xl"></div>
                        <div className="flex flex-col items-center w-full relative z-10">
                            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-accent-violet flex items-center justify-center shadow-lg shadow-primary/20 mb-5">
                                <span className="material-symbols-outlined text-white text-[32px]">auto_fix_high</span>
                            </div>
                            <h3 className="text-white text-base font-bold text-center mb-2">Magic Auto</h3>
                            <p className="text-white/50 text-[11px] text-center leading-relaxed">
                                KI erkennt das Motiv automatisch. Schnell und präzise.
                            </p>
                        </div>
                        <div className="w-full mt-6 relative z-10">
                            <div className="w-full h-10 flex items-center justify-center rounded-2xl bg-white text-black text-xs font-bold shadow-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                Starten
                            </div>
                        </div>
                    </div>

                    {/* Manual Card */}
                    <div
                        onClick={() => onSelectMode('manual')}
                        className="relative flex flex-col items-center justify-between p-5 rounded-[32px] bg-surface-dark border border-white/5 shadow-2xl active:scale-95 transition-all duration-200 cursor-pointer overflow-hidden group hover:border-white/20"
                    >
                        <div className="flex flex-col items-center w-full relative z-10">
                            <div className="w-16 h-16 rounded-3xl bg-[#25252b] border border-white/5 flex items-center justify-center mb-5 text-white/80">
                                <span className="material-symbols-outlined text-[32px]">tune</span>
                            </div>
                            <h3 className="text-white text-base font-bold text-center mb-2">Manuell</h3>
                            <p className="text-white/50 text-[11px] text-center leading-relaxed">
                                Volle Kontrolle über Radius, Zoom und Positionierung.
                            </p>
                        </div>
                        <div className="w-full mt-6 relative z-10">
                            <div className="w-full h-10 flex items-center justify-center rounded-2xl bg-[#25252b] border border-white/10 text-white text-xs font-bold group-hover:bg-white group-hover:text-black transition-colors">
                                Anpassen
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Action */}
            <div className="pb-10 pt-2 flex flex-col items-center gap-4 w-full px-5">
                <button
                    onClick={onBack}
                    className="w-full py-4 text-white/40 text-sm font-medium active:text-white transition-colors flex items-center justify-center gap-2 border-t border-white/5 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-xl">upload_file</span>
                    Anderes Bild wählen
                </button>
            </div>

            {/* Navigation Indicator */}
            <div className="flex justify-center pb-6">
                <div className="w-32 h-1.5 bg-white/10 rounded-full"></div>
            </div>
        </div>
    );
};
