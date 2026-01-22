import React, { useRef, useState } from 'react';

interface UploadPageProps {
    onBack: () => void;
    onFileSelect: (file: File) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onBack, onFileSelect }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
        }
    };

    return (
        <div className="relative flex h-full w-full max-w-md flex-col overflow-x-hidden p-6 pb-12 gap-8 bg-background-dark min-h-screen">
            {/* Header */}
            <header className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2.5">
                    <div className="bg-primary/20 p-2 rounded-xl">
                        <span className="material-symbols-outlined text-primary text-2xl block">shape_line</span>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-white">LogoShaper</h2>
                </div>
                <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                    <span className="material-symbols-outlined">menu</span>
                </button>
            </header>

            {/* Hero */}
            <section className="flex flex-col items-center text-center px-4">
                <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white mb-3">
                    Professional shapes <br /><span className="text-primary">in seconds.</span>
                </h1>
                <p className="text-gray-400 text-base max-w-[280px]">
                    Transform your square icons into stunning professional logos.
                </p>
            </section>

            {/* Upload Zone */}
            <section className="w-full">
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`group relative flex flex-col items-center justify-center gap-6 rounded-xl border border-dashed border-gray-700 bg-surface-dark px-6 py-10 transition-all hover:border-primary/50 hover:bg-[#1c1c22] ${isDragging ? 'border-primary bg-[#1c1c22] ring-2 ring-primary/20' : ''} shadow-[0_0_20px_rgba(99,102,241,0.15)]`}
                >
                    <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                        <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-center">
                        <p className="text-lg font-semibold text-white">Upload Brand Asset</p>
                        <p className="text-sm text-gray-500">Tap to browse your gallery<br />PNG, JPG or SVG</p>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 rounded-full bg-primary hover:bg-accent text-white font-bold text-sm h-12 px-10 shadow-lg shadow-primary/20 transition-all active:scale-95 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-lg">add_photo_alternate</span>
                        <span>Select Image</span>
                    </button>
                </div>
            </section>

            {/* Examples Grid */}
            <section className="flex flex-col gap-5 mt-2">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500">See the magic</h2>
                    <div className="h-px flex-1 bg-gray-800 ml-4"></div>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between rounded-xl bg-surface-dark p-5 border border-gray-800/50 shadow-xl">
                        <div className="size-16 flex items-center justify-center rounded-lg bg-gradient-to-br from-[#2DD4BF] to-[#247BA0] text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                            <span className="material-symbols-outlined text-4xl">gradient</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="material-symbols-outlined text-gray-600">arrow_forward</span>
                            <span className="text-[10px] font-medium text-gray-600 uppercase">Circle</span>
                        </div>
                        <div className="size-16 flex items-center justify-center rounded-full bg-gradient-to-br from-[#2DD4BF] to-[#247BA0] text-white border border-white/10 shadow-lg">
                            <span className="material-symbols-outlined text-4xl">gradient</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-surface-dark p-5 border border-gray-800/50 shadow-xl">
                        <div className="size-16 flex items-center justify-center rounded-lg bg-indigo-600 text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                            <span className="text-4xl font-black italic tracking-tighter">S</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="material-symbols-outlined text-gray-600">arrow_forward</span>
                            <span className="text-[10px] font-medium text-gray-600 uppercase">Squircle</span>
                        </div>
                        <div className="size-16 flex items-center justify-center rounded-[1.4rem] bg-indigo-600 text-white border border-white/10 shadow-lg">
                            <span className="text-4xl font-black italic tracking-tighter">S</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-surface-dark p-5 border border-gray-800/50 shadow-xl">
                        <div className="size-16 flex items-center justify-center rounded-lg bg-[#111] text-pink-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                            <span className="material-symbols-outlined text-4xl">flutter_dash</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="material-symbols-outlined text-gray-600">arrow_forward</span>
                            <span className="text-[10px] font-medium text-gray-600 uppercase">Icon</span>
                        </div>
                        <div className="size-16 flex items-center justify-center rounded-2xl bg-[#111] text-pink-500 border border-pink-500/20 shadow-lg">
                            <span className="material-symbols-outlined text-4xl">flutter_dash</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="mt-auto pt-8 text-center">
                <p className="text-xs text-gray-600 font-medium tracking-wide uppercase">Privacy First • No images stored</p>
            </footer>
        </div>
    );
};
