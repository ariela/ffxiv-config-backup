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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-[550px] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-800 bg-gray-950">
          <h2 className="text-lg font-bold text-gray-100">初期セットアップ: バックアップ先の指定</h2>
        </div>
        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-300">共有ディレクトリとゲームデータパスを指定してください。</p>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              共有ディレクトリパス <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nasPath}
              onChange={(e) => setNasPath(e.target.value)}
              placeholder={String.raw`\\NAS\Shared\FF14_Backups`}
              className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-gray-200 text-sm font-mono focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              ゲームデータパス <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={gamePath}
              onChange={(e) => setGamePath(e.target.value)}
              placeholder={String.raw`C:\Users\...\My Games\FINAL FANTASY XIV - A Realm Reborn`}
              className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-gray-200 text-sm font-mono focus:border-blue-500 outline-none"
            />
            {gamePath === '' && (
              <p className="text-xs text-yellow-400 mt-1">自動検出できませんでした。手動で入力してください。</p>
            )}
          </div>
          {testResult && (
            <div className={`p-3 rounded flex items-start text-xs ${
              testResult.ok
                ? 'bg-green-900/20 border border-green-800/50 text-green-400'
                : 'bg-red-900/20 border border-red-800/50 text-red-400'
            }`}>
              {testResult.message}
            </div>
          )}
          <button
            onClick={handleTest}
            disabled={!canSave || testing}
            className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-40"
          >
            {testing ? '確認中...' : '接続テスト'}
          </button>
        </div>
        <div className="p-4 border-t border-gray-800 bg-gray-950 flex justify-end gap-3">
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded font-bold transition"
          >
            {saving ? '保存中...' : '設定を保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
