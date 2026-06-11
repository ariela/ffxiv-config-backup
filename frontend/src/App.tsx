// frontend/src/App.tsx
import { useEffect, useState } from 'react'
import { useAppStore } from './store/useAppStore'
import { SetupModal } from './components/SetupModal'
import { Header } from './components/Header'
import { CharacterPane } from './components/CharacterPane'
import { BackupPane } from './components/BackupPane'
import { RestorePane } from './components/RestorePane'
import { CreateBackupModal } from './components/CreateBackupModal'
import { Toast } from './components/Toast'

export default function App() {
  const nasPath = useAppStore((s) => s.nasPath)
  const initApp = useAppStore((s) => s.initApp)
  const checkGameProcess = useAppStore((s) => s.checkGameProcess)
  const [showSetup, setShowSetup] = useState(false)
  const [showCreateBackup, setShowCreateBackup] = useState(false)

  useEffect(() => {
    initApp().then(() => {
      const { nasPath } = useAppStore.getState()
      if (!nasPath) setShowSetup(true)
    })
    checkGameProcess()
  }, [initApp, checkGameProcess])

  const handleSetupComplete = async () => {
    setShowSetup(false)
    await initApp()
  }

  return (
    <div className="bg-abyss text-parchment h-screen w-screen overflow-hidden flex flex-col font-sans">
      {showSetup && <SetupModal onComplete={handleSetupComplete} />}
      {showCreateBackup && <CreateBackupModal onClose={() => setShowCreateBackup(false)} />}

      <Header onSettingsClick={() => setShowSetup(true)} />

      <main className="flex-1 flex overflow-hidden">
        <CharacterPane onCreateBackup={() => setShowCreateBackup(true)} />
        <BackupPane />
        <RestorePane />
      </main>

      <Toast />
    </div>
  )
}
