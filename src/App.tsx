import { useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { UploadPage } from './components/UploadPage'
import { ModeSelection } from './components/ModeSelection'
import { AutoModeEditor } from './components/AutoModeEditor'
import { ManualPrecisionEditor } from './components/ManualPrecisionEditor'
import { CompletionScreen } from './components/CompletionScreen'

type View = 'dashboard' | 'upload' | 'mode-selection' | 'auto-editor' | 'manual-editor' | 'completion'

function App() {
  const [view, setView] = useState<View>('dashboard')
  const [file, setFile] = useState<File | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setView('mode-selection')
  }

  const handleModeSelect = (mode: 'auto' | 'manual') => {
    console.log('Mode selected:', mode)
    if (mode === 'auto') {
      setView('auto-editor')
    } else if (mode === 'manual') {
      setView('manual-editor')
    }
  }

  const handleConfirm = (imgSrc: string) => {
    setResultImage(imgSrc)
    setView('completion')
  }

  // Temporary use to suppress unused warning
  console.log('Current file:', file);

  return (
    <div className="min-h-screen w-full bg-black text-white">
      {/* Container managed by children */}
      {view === 'dashboard' ? (
        <Dashboard onOpenApp={() => setView('upload')} />
      ) : view === 'upload' ? (
        <UploadPage
          onBack={() => setView('dashboard')}
          onFileSelect={handleFileSelect}
        />
      ) : view === 'mode-selection' ? (
        file && (
          <ModeSelection
            file={file}
            onBack={() => {
              setFile(null) // reset file when going back
              setView('upload')
            }}
            onSelectMode={handleModeSelect}
          />
        )
      ) : view === 'auto-editor' ? (
        file && (
          <AutoModeEditor
            file={file}
            onBack={() => setView('mode-selection')}
            onConfirm={handleConfirm}
          />
        )
      ) : view === 'manual-editor' ? (
        file && (
          <ManualPrecisionEditor
            file={file}
            onBack={() => setView('mode-selection')}
            onConfirm={handleConfirm}
          />
        )
      ) : (
        resultImage && (
          <CompletionScreen
            imageSrc={resultImage}
            onBack={() => setView('mode-selection')}
          />
        )
      )}
    </div>
  )
}

export default App
