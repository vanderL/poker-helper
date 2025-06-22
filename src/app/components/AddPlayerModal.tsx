'use client'

import { useState } from 'react'


interface AddPlayerModalProps {
  isOpen: boolean
  onClose: () => void
  onPlayerAdded: () => void
}

export default function AddPlayerModal({ isOpen, onClose, onPlayerAdded }: AddPlayerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    initialNotes: '',
    type: 'TAG'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar jogador')
      }

      // Sucesso - resetar form e fechar modal
      setFormData({ name: '', nickname: '', initialNotes: '', type: 'TAG' })
      onPlayerAdded()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({ name: '', nickname: '', initialNotes: '', type: 'TAG' })
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-6 rounded-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold">➕ Adicionar Jogador</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Nome * (obrigatório)
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-700 text-white p-3 rounded border border-slate-600 focus:border-blue-400 outline-none"
              placeholder="Ex: João, Pedro, Maria"
              required
              minLength={2}
              maxLength={50}
            />
          </div>

          {/* Apelido */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Apelido (opcional)
            </label>
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => setFormData({...formData, nickname: e.target.value})}
              className="w-full bg-slate-700 text-white p-3 rounded border border-slate-600 focus:border-blue-400 outline-none"
              placeholder="Ex: Tight João, Fish Pedro"
              maxLength={20}
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Tipo de Jogador
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full bg-slate-700 text-white p-3 rounded border border-slate-600 focus:border-blue-400 outline-none"
            >
              <option value="TAG">TAG (Tight-Aggressive)</option>
              <option value="LAG">LAG (Loose-Aggressive)</option>
              <option value="Fish">Fish (Loose-Passive)</option>
              <option value="Nit">Nit (Tight-Passive)</option>
            </select>
          </div>

          {/* Notas Iniciais */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Notas Iniciais (opcional)
            </label>
            <textarea
              value={formData.initialNotes}
              onChange={(e) => setFormData({...formData, initialNotes: e.target.value})}
              className="w-full bg-slate-700 text-white p-3 rounded border border-slate-600 focus:border-blue-400 outline-none"
              placeholder="Ex: Só 3bet com nuts, nunca blefa river, tilt fácil"
              rows={3}
              maxLength={200}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900 border border-red-600 text-red-200 p-3 rounded">
              ❌ {error}
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              className={`
                flex-1 py-3 rounded font-medium
                ${isSubmitting || !formData.name.trim()
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }
              `}
            >
              {isSubmitting ? '⏳ Salvando...' : '✅ Adicionar'}
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="mt-4 pt-4 border-t border-gray-600">
          <div className="text-gray-400 text-xs">
            💡 Dica: O sistema vai aprender automaticamente os padrões deste jogador conforme você usar.
          </div>
        </div>
      </div>
    </div>
  )
}