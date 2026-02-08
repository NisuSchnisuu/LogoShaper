import React, { useState } from 'react';
import { UploadPage } from './UploadPage';
import { BackgroundRemoverEditor } from './BackgroundRemoverEditor';
import { CompletionScreen } from './CompletionScreen';

interface BackgroundRemoverAppProps {
    onExit: () => void;
    onOpenAndroidEditor?: (imgSrc: string) => void;
}

type AppStep = 'upload' | 'editor' | 'completion';

export const BackgroundRemoverApp: React.FC<BackgroundRemoverAppProps> = ({ onExit, onOpenAndroidEditor }) => {
    const [step, setStep] = useState<AppStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile);
        setStep('editor');
    };

    const handleBackFromEditor = () => {
        setFile(null);
        setStep('upload');
    };

    const handleConfirm = (imgSrc: string) => {
        setResultImage(imgSrc);
        setStep('completion');
    };

    return (
        <div className="h-full w-full">
            {step === 'upload' ? (
                <UploadPage
                    onBack={onExit}
                    onFileSelect={handleFileSelect}
                />
            ) : step === 'editor' && file ? (
                <BackgroundRemoverEditor
                    file={file}
                    onBack={handleBackFromEditor}
                    onConfirm={handleConfirm}
                />
            ) : step === 'completion' && resultImage ? (
                <CompletionScreen
                    imageSrc={resultImage}
                    onBack={() => {
                        setStep('editor');
                        setResultImage(null);
                    }}
                    onOpenAndroidEditor={onOpenAndroidEditor}
                />
            ) : null}
        </div>
    );
};
