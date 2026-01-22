import React from 'react';

interface DashboardProps {
    onOpenApp?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenApp }) => {
    return (
        <div className="relative flex h-full min-h-screen w-full flex-col overflow-hidden bg-background-dark md:max-w-7xl md:mx-auto md:border-x md:border-white/5">
            {/* Background Glow */}
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Header */}
            <header className="pt-8 pb-6 px-6 relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-surface-light border border-gray-800 flex items-center justify-center">
                            <span className="material-symbols-outlined text-gray-400 text-sm">person</span>
                        </div>
                        <span className="text-sm text-gray-400 font-medium">Hello, Creator</span>
                    </div>
                    <button className="h-10 w-10 rounded-full bg-transparent hover:bg-white/5 flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-gray-300">notifications</span>
                    </button>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                    Deine<br />
                    <span className="text-primary">Kreativ-Werkzeuge</span>
                </h1>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-6 pb-24 overflow-y-auto z-10 flex flex-col gap-6">
                {/* Search Bar */}
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">search</span>
                    <input
                        className="w-full bg-surface-dark border border-gray-800 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="Finde ein Werkzeug..."
                        type="text"
                    />
                </div>

                {/* LogoShaper Card */}
                <div className="w-full bg-surface-dark border border-gray-800 rounded-2xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all card-glow">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10 flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                            <div className="h-14 w-14 rounded-xl logo-gradient flex items-center justify-center shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined text-white text-2xl">shape_line</span>
                            </div>
                            <span className="px-2.5 py-1 bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider rounded-full border border-primary/20">Popular</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">LogoShaper</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">Bilder perfekt in Logo-Formen zuschneiden. Professionelle Ergebnisse in Sekunden.</p>
                        </div>
                        <div className="pt-2">
                            <button
                                onClick={onOpenApp}
                                className="w-full bg-white text-black font-semibold py-3.5 px-4 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>App öffnen</span>
                                <span className="material-symbols-outlined text-sm">arrow_outward</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Coming Soon Section */}
                <div className="flex items-center gap-3 mt-2">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500">Coming Soon</h2>
                    <div className="h-px flex-1 bg-gray-800"></div>
                </div>

                {/* Coming Soon Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#121215] border border-dashed border-gray-700 rounded-2xl p-5 flex flex-col justify-between h-40 opacity-70">
                        <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center">
                            <span className="material-symbols-outlined text-gray-500">palette</span>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-300">ColorPicker</h4>
                            <p className="text-xs text-gray-600 mt-1">Extract palettes</p>
                        </div>
                    </div>
                    <div className="bg-[#121215] border border-dashed border-gray-700 rounded-2xl p-5 flex flex-col justify-between h-40 opacity-70">
                        <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center">
                            <span className="material-symbols-outlined text-gray-500">photo_size_select_large</span>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-300">AssetResizer</h4>
                            <p className="text-xs text-gray-600 mt-1">Multi-format export</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Navigator */}
            <nav className="fixed bottom-0 w-full bg-surface-dark/90 backdrop-blur-md border-t border-gray-800/50 pb-safe pt-2 px-6 z-50 pb-6 md:absolute md:max-w-full">
                <ul className="flex justify-between items-center">
                    <li>
                        <button className="flex flex-col items-center gap-1 p-2 text-primary">
                            <span className="material-symbols-outlined filled">grid_view</span>
                            <span className="text-[10px] font-medium">Hub</span>
                        </button>
                    </li>
                    <li>
                        <button className="flex flex-col items-center gap-1 p-2 text-gray-500 hover:text-gray-300 transition-colors">
                            <span className="material-symbols-outlined">explore</span>
                            <span className="text-[10px] font-medium">Discover</span>
                        </button>
                    </li>
                    <li>
                        <button className="flex flex-col items-center gap-1 p-2 text-gray-500 hover:text-gray-300 transition-colors">
                            <span className="material-symbols-outlined">folder_open</span>
                            <span className="text-[10px] font-medium">Projects</span>
                        </button>
                    </li>
                    <li>
                        <button className="flex flex-col items-center gap-1 p-2 text-gray-500 hover:text-gray-300 transition-colors">
                            <span className="material-symbols-outlined">settings</span>
                            <span className="text-[10px] font-medium">Settings</span>
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
};
