import React from 'react';

interface WorkflowSelectionProps {
    onBack: () => void;
    onSelectWorkflow: (mode: 'standard' | 'android') => void;
}

export const WorkflowSelection: React.FC<WorkflowSelectionProps> = ({ onBack, onSelectWorkflow }) => {
    return (
        <div className="relative flex min-h-screen w-full flex-col mx-auto overflow-x-hidden bg-background-dark font-display md:max-w-4xl md:justify-center">
            {/* Header */}
            <div className="flex items-center bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between sticky top-0 z-10">
                <button
                    onClick={onBack}
                    className="text-white/70 flex size-12 shrink-0 items-center justify-start rounded-full active:opacity-50 transition-opacity cursor-pointer"
                >
                    <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
                </button>
                <h2 className="text-white text-lg font-semibold leading-tight tracking-tight flex-1 text-center pr-12">
                    Icon-Typ wählen
                </h2>
            </div>

            <div className="flex flex-col items-center justify-center py-8 px-6">
                {/* Icon Preview */}
                <div className="relative group mb-4">
                    <div className="relative w-32 h-32 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border-[6px] border-[#1c1c21] bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[56px]" style={{ fontVariationSettings: "'FILL' 1" }}>interests</span>
                    </div>
                </div>

                <h1 className="text-white text-2xl font-bold text-center mb-2">Willkommen bei LogoShaper</h1>
                <p className="text-center text-sm text-white/50 px-4 max-w-md">
                    Wähle den Icon-Typ, den du erstellen möchtest.
                </p>
            </div>

            {/* Workflow Selection Grid */}
            <div className="px-5 pb-8 flex-1 md:flex-initial md:w-full">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                    {/* Standard Icon Card */}
                    <div
                        onClick={() => onSelectWorkflow('standard')}
                        className="relative flex flex-col items-center justify-between p-6 rounded-[32px] bg-surface-dark border border-white/5 shadow-2xl active:scale-[0.98] transition-all duration-200 cursor-pointer overflow-hidden group hover:border-primary/30"
                    >
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 blur-3xl"></div>
                        <div className="flex flex-col items-center w-full relative z-10">
                            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
                                <span className="material-symbols-outlined text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>interests</span>
                            </div>
                            <h3 className="text-white text-lg font-bold text-center mb-2">Standard Icon</h3>
                            <p className="text-white/50 text-xs text-center leading-relaxed max-w-[180px]">
                                Ein einzelnes Bild in Circle, Squircle oder abgerundeter Form zuschneiden.
                            </p>
                        </div>
                        <div className="w-full mt-6 relative z-10">
                            <div className="w-full h-11 flex items-center justify-center rounded-2xl bg-white text-black text-sm font-bold shadow-lg group-hover:bg-primary group-hover:text-white transition-colors">
                                Auswählen
                            </div>
                        </div>
                    </div>

                    {/* Android Adaptive Icon Card */}
                    <div
                        onClick={() => onSelectWorkflow('android')}
                        className="relative flex flex-col items-center justify-between p-6 rounded-[32px] bg-surface-dark border border-white/5 shadow-2xl active:scale-[0.98] transition-all duration-200 cursor-pointer overflow-hidden group hover:border-[#3ddc84]/30"
                    >
                        <div className="absolute -top-10 -left-10 w-24 h-24 bg-[#3ddc84]/10 blur-3xl"></div>
                        <div className="flex flex-col items-center w-full relative z-10">
                            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#3ddc84] to-[#00a956] flex items-center justify-center shadow-lg shadow-[#3ddc84]/20 mb-4">
                                <span className="material-symbols-outlined text-white text-[32px]">android</span>
                            </div>
                            <h3 className="text-white text-lg font-bold text-center mb-2">Android Adaptive</h3>
                            <p className="text-white/50 text-xs text-center leading-relaxed max-w-[180px]">
                                Separate Hintergrund- und Vordergrund-Layer für Android 16+.
                            </p>
                        </div>
                        <div className="w-full mt-6 relative z-10">
                            <div className="w-full h-11 flex items-center justify-center rounded-2xl bg-[#25252b] border border-white/10 text-white text-sm font-bold group-hover:bg-[#3ddc84] group-hover:text-black group-hover:border-transparent transition-colors">
                                Auswählen
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Hint */}
            <div className="pb-10 pt-2 flex flex-col items-center gap-4 w-full px-5">
                <p className="text-center text-[11px] text-white/30 px-4">
                    Android Adaptive Icons benötigen separate Layer und unterstützen dynamische Masken.
                </p>
            </div>

            {/* Navigation Indicator */}
            <div className="flex justify-center pb-6">
                <div className="w-32 h-1.5 bg-white/10 rounded-full"></div>
            </div>
        </div>
    );
};
