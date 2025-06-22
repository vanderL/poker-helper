'use client'

import { useState, useEffect } from 'react'

interface Player {
  id: number
  name: string
  nickname?: string
  type?: string // 'TAG', 'LAG', 'Fish', 'Nit'
  notes?: string
}

interface PlayerSidebarProps {
  onPlayerSelect: (player: Player) => void
  selectedPlayer?: Player
}

export default function PlayerSidebar({ onPlayerSelect, selectedPlayer }: PlayerSidebarProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  // Mock data por enquanto - buscar da API
  useEffect(() => {
    // Simular carregamento da API
    setTimeout(() => {
      setPlayers([
        { id: 1, name: 'João', nickname: 'Tight João', type: 'TAG', notes: 'Só 3bet com nuts' },
        { id: 2, name: 'Pedro', nickname: 'Fish Pedro', type: 'Fish', notes: 'Call station, nunca blefa' },
        { id: 3, name: 'Maria', nickname: 'Solid Maria', type: 'TAG', notes: 'Balanced, joga bem' },
        { id: 4, name: 'Carlos', nickname: 'LAG Carlos', type: 'LAG', notes: 'Muito agressivo' },
        { id: 5, name: 'Ana', nickname: 'Ana Tight', type: 'TAG', notes: 'Fold vs pressure' },
      ])
      setLoading(false)
    }, 500)
  }, [])

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'TAG': return 'bg-green-600'
      case 'LAG': return 'bg-orange-600'
      case 'Fish': return 'bg-red-600'
      case 'Nit': return 'bg-purple-600'
      default: return 'bg-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-800 p-4 h-full">
        <div className="text-white text-sm font-semibold mb-4">👥 Carregando jogadores...</div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 p-4 h-full overflow-y-auto">
      <div className="text-white text-sm font-semibold mb-4 border-b border-slate-600 pb-2">
        👥 Jogadores ({players.length})
      </div>

      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.id}
            onClick={() => onPlayerSelect(player)}
            className={`
              p-3 rounded-lg cursor-pointer transition-all duration-200
              ${selectedPlayer?.id === player.id 
                ? 'bg-green-700 border border-green-500' 
                : 'bg-slate-700 hover:bg-slate-600 border border-slate-600'
              }
            `}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium">{player.name}</span>
              <span className={`px-2 py-1 rounded text-xs text-white font-bold ${getTypeColor(player.type)}`}>
                {player.type || 'Unknown'}
              </span>
            </div>
            
            {player.nickname && (
              <div className="text-gray-300 text-xs mb-1">{player.nickname}</div>
            )}
            
            {player.notes && (
              <div className="text-gray-400 text-xs">{player.notes}</div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-600">
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm font-medium">
          + Adicionar Jogador
        </button>
      </div>
    </div>
  )
}