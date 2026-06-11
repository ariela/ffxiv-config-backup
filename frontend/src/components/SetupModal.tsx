// frontend/src/components/SetupModal.tsx
import { useState, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { DetectGamePath, SetBackupDirectory } from '../../wailsjs/go/main/App'

interface Props {
  onComplete: () => void
}

export function SetupModal({ onComplete }: Props) {
  const [nasPath, setNasPath] = useState('')
  const [gamePath, setGamePath] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    DetectGamePath()
      .then((p) => { if (p) setGamePath(p) })
      .catch(() => {})
  }, [])

  const canSave = nasPath.trim() !== '' && gamePath.trim() !== ''

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      await SetBackupDirectory(nasPath, gamePath)
      setTestResult({ ok: true, message: '接続テスト成功: 書き込み権限を確認しました。' })
    } catch (e: unknown) {
      setTestResult({ ok: false, message: String(e) })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await SetBackupDirectory(nasPath, gamePath)
      onComplete()
    } catch (e: unknown) {
      setTestResult({ ok: false, message: String(e) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-abyss/90 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-umbra border border-arcanum rounded-lg shadow-2xl w-[550px] overflow-hidden flex flex-col crystal-frame">
        <div className="p-4 border-b border-arcanum bg-abyss relative z-10">
          <h2 className="text-lg font-display font-bold text-gold-bright tracking-wider">初期セットアップ: バックアップ先の指定</h2>
        </div>
        <div className="p-6 space-y-5 relative z-10">
          <p className="text-sm text-mist">共有ディレクトリとゲームデータパスを指定してください。</p>
          <div>
            <label className="block text-xs font-bold text-faint uppercase tracking-wider mb-2">
              共有ディレクトリパス <span className="text-garnet">*</span>
            </label>
            <input
              type="text"
              value={nasPath}
              onChange={(e) => setNasPath(e.target.value)}
              placeholder={String.raw`\\NAS\Shared\FF14_Backups`}
              className="w-full bg-abyss border border-arcanum rounded p-3 text-parchment text-sm font-mono focus:border-crystal/70 focus:shadow-glow-crystal outline-none transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-faint uppercase tracking-wider mb-2">
              ゲームデータパス <span className="text-garnet">*</span>
            </label>
            <input
              type="text"
              value={gamePath}
              onChange={(e) => setGamePath(e.target.value)}
              placeholder={String.raw`C:\Users\...\My Games\FINAL FANTASY XIV - A Realm Reborn`}
              className="w-full bg-abyss border border-arcanum rounded p-3 text-parchment text-sm font-mono focus:border-crystal/70 focus:shadow-glow-crystal outline-none transition"
            />
            {gamePath === '' && (
              <p className="text-xs text-amber mt-1">自動検出できませんでした。手動で入力してください。</p>
            )}
          </div>
          {testResult && (
            <div className={`p-3 rounded flex items-start text-xs ${
              testResult.ok
                ? 'bg-jade/10 border border-jade/40 text-jade'
                : 'bg-garnet/10 border border-garnet/40 text-garnet'
            }`}>
              {testResult.message}
            </div>
          )}
          <button
            onClick={handleTest}
            disabled={!canSave || testing}
            className="text-sm text-crystal hover:text-crystal-bright disabled:opacity-40 transition"
          >
            {testing ? '確認中...' : '接続テスト'}
          </button>
        </div>
        <div className="p-4 border-t border-arcanum bg-abyss flex justify-end gap-3 relative z-10">
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="px-6 py-2 bg-gold hover:bg-gold-bright disabled:opacity-40 text-abyss rounded font-bold font-display uppercase tracking-wider transition shadow-glow-gold"
          >
            {saving ? '保存中...' : '設定を保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
