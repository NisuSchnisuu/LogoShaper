import React from 'react';

interface DashboardProps {
    onOpenApp?: () => void;
    onOpenBgRemover?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenApp, onOpenBgRemover }) => {
    return (
        <div className="min-h-screen w-full bg-background-dark text-white flex flex-col items-center justify-center p-6">

            <div className="w-full max-w-md flex flex-col gap-8">

                {/* Title */}
                <h1 className="text-3xl font-bold text-center tracking-tight">App Übersicht</h1>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-4">

                    {/* LogoShaper App Tile */}
                    <button
                        onClick={onOpenApp}
                        className="group relative aspect-square bg-[#1c1c1f] rounded-3xl border border-white/10 hover:border-primary/50 transition-all overflow-hidden flex flex-col items-center justify-center gap-4 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="h-16 w-16 rounded-2xl logo-gradient flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                            <span className="material-symbols-outlined text-white text-3xl">shape_line</span>
                        </div>

                        <div className="text-center z-10">
                            <h3 className="font-bold text-lg">LogoShaper</h3>
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1">Starten</p>
                        </div>
                    </button>

                    {/* Background Remover Tile */}
                    <button
                        onClick={onOpenBgRemover}
                        className="group relative aspect-square bg-[#1c1c1f] rounded-3xl border border-white/10 hover:border-purple-500/50 transition-all overflow-hidden flex flex-col items-center justify-center gap-4 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                            <span className="material-symbols-outlined text-white text-3xl">remove_selection</span>
                        </div>
                        <div className="text-center z-10">
                            <h3 className="font-bold text-lg">BG Remover</h3>
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1">Starten</p>
                        </div>
                    </button>

                </div>
            </div>
        </div>
    );
};
