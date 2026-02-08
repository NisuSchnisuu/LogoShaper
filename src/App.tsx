import { useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { UploadPage } from './components/UploadPage'
import { ModeSelection } from './components/ModeSelection'
import { AutoModeEditor } from './components/AutoModeEditor'
import { ManualPrecisionEditor } from './components/ManualPrecisionEditor'
import { CompletionScreen } from './components/CompletionScreen'
import { WorkflowSelection } from './components/WorkflowSelection'
import { AndroidUploadPage } from './components/AndroidUploadPage'
import { AndroidEditor } from './components/AndroidEditor'
import { AndroidCompletionScreen } from './components/AndroidCompletionScreen'
import { BackgroundRemoverApp } from './components/BackgroundRemoverApp'

// Workflow mode types
type WorkflowMode = 'standard' | 'android'

// Android project types
interface AndroidBackground {
  type: 'color' | 'image'
  value: string // hex color or object URL
  file?: File   // only for image type
}

interface AndroidForeground {
  url: string
  file: File
}

export interface AndroidProject {
  background: AndroidBackground
  foreground: AndroidForeground | null
  monochrome?: AndroidForeground | null
}

// View types
type View =
  | 'dashboard'
  | 'bg-remover'
  | 'workflow-selection'
  | 'upload'
  | 'android-upload'
  | 'mode-selection'
  | 'auto-editor'
  | 'manual-editor'
  | 'android-editor'
  | 'completion'
  | 'android-completion'

function App() {
  const [view, setView] = useState<View>('dashboard')
  const [_workflowMode, setWorkflowMode] = useState<WorkflowMode | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)

  // Android-specific state
  const [androidProject, setAndroidProject] = useState<AndroidProject | null>(null)
  const [androidResultImages, setAndroidResultImages] = useState<{
    background: string
    foreground: string
    composite: string
  } | null>(null)

  // Standard mode handlers
  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setView('mode-selection')
  }

  const handleModeSelect = (mode: 'auto' | 'manual') => {
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

  // Workflow selection handler
  const handleWorkflowSelect = (mode: WorkflowMode) => {
    setWorkflowMode(mode)
    if (mode === 'standard') {
      setView('upload')
    } else {
      setView('android-upload')
    }
  }

  // Android mode handlers
  const handleAndroidProjectUpdate = (file: File) => {
    // Create default project with white background
    const project: AndroidProject = {
      background: { type: 'color', value: '#ffffff' },
      foreground: { url: URL.createObjectURL(file), file },
    }
    setAndroidProject(project)
    setView('android-editor')
  }

  const handleAndroidConfirm = (images: { background: string; foreground: string; composite: string }) => {
    setAndroidResultImages(images)
    setView('android-completion')
  }

  // Reset handlers
  const resetToWorkflowSelection = () => {
    setWorkflowMode(null)
    setFile(null)
    setAndroidProject(null)
    setResultImage(null)
    setAndroidResultImages(null)
    setView('workflow-selection')
  }

  return (
    <div className="min-h-screen w-full bg-black text-white">
      {view === 'dashboard' ? (
        <Dashboard
          onOpenApp={() => setView('workflow-selection')}
          onOpenBgRemover={() => setView('bg-remover')}
        />
      ) : view === 'bg-remover' ? (
        <BackgroundRemoverApp onExit={() => setView('dashboard')} />
      ) : view === 'workflow-selection' ? (
        <WorkflowSelection
          onBack={() => setView('dashboard')}
          onSelectWorkflow={handleWorkflowSelect}
        />
      ) : view === 'upload' ? (
        <UploadPage
          onBack={resetToWorkflowSelection}
          onFileSelect={handleFileSelect}
        />
      ) : view === 'android-upload' ? (
        <AndroidUploadPage
          onBack={resetToWorkflowSelection}
          onContinue={handleAndroidProjectUpdate}
        />
      ) : view === 'mode-selection' ? (
        file && (
          <ModeSelection
            file={file}
            onBack={() => {
              setFile(null)
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
      ) : view === 'android-editor' ? (
        androidProject && (
          <AndroidEditor
            project={androidProject}
            onBack={() => setView('android-upload')}
            onConfirm={handleAndroidConfirm}
          />
        )
      ) : view === 'android-completion' ? (
        androidResultImages && (
          <AndroidCompletionScreen
            images={androidResultImages}
            onBack={() => setView('android-editor')}
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
