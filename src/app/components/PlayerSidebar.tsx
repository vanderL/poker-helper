'use client'

import { useState, useEffect } from 'react'
import AddPlayerModal from './AddPlayerModal'

interface Player {
  id: number
  name: string
  nickname?: string
  type?: string
  notes?: string
  initialNotes?: string
}

interface PlayerSidebarProps {
  onPlayerSelect: (player: Player) => void
  selectedPlayer?: Player
}

export default function PlayerSidebar({ onPlayerSelect, selectedPlayer }: PlayerSidebarProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Buscar players do banco
  const fetchPlayers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/players')
      
      if (!response.ok) {
        throw new Error('Erro ao carregar jogadores')
      }
      
      const data: Player[] = await response.json()
      
      // Converter para formato esperado
      const playersWithType = data.map((player: Player) => ({
        id: player.id,
        name: player.name,
        nickname: player.nickname,
        notes: player.initialNotes,
        type: inferPlayerType(player) // Inferir tipo dos patterns ou default
      }))
      
      setPlayers(playersWithType)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      console.error('Error fetching players:', err)
    } finally {
      setLoading(false)
    }
  }

  // Inferir tipo do player (temporário até implementar patterns)
  const inferPlayerType = (player: Player): string => {
    // Por enquanto, usar TAG como default
    // Depois vamos implementar inferência real dos patterns
    if (player.initialNotes?.toLowerCase().includes('tight')) return 'TAG'
    if (player.initialNotes?.toLowerCase().includes('fish')) return 'Fish'
    if (player.initialNotes?.toLowerCase().includes('aggressive')) return 'LAG'
    if (player.initialNotes?.toLowerCase().includes('nit')) return 'Nit'
    return 'TAG' // Default
  }

  // Carregar players no mount
  useEffect(() => {
    fetchPlayers()
  }, [])

  // Callback quando player é adicionado
  const handlePlayerAdded = () => {
    fetchPlayers() // Recarregar lista
  }

  // Callback para deletar player
  const handleDeletePlayer = async (playerId: number) => {
    if (!confirm('Tem certeza que deseja remover este jogador?')) return

    try {
      const response = await fetch(`/api/players?id=${playerId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Erro ao remover jogador')
      }

      // Recarregar lista
      fetchPlayers()
      
      // Se era o player selecionado, limpar seleção
      if (selectedPlayer?.id === playerId) {
        onPlayerSelect({} as Player)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao remover jogador')
    }
  }

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
        <div className="text-white text-sm font-semibold mb-4 border-b border-slate-600 pb-2">
          👥 Carregando jogadores...
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-700 p-3 rounded-lg animate-pulse">
              <div className="h-4 bg-slate-600 rounded mb-2"></div>
              <div className="h-3 bg-slate-600 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-slate-800 p-4 h-full">
        <div className="text-white text-sm font-semibold mb-4 border-b border-slate-600 pb-2">
          👥 Jogadores
        </div>
        <div className="bg-red-900 border border-red-600 text-red-200 p-3 rounded">
          ❌ {error}
        </div>
        <button 
          onClick={fetchPlayers}
          className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm"
        >
          🔄 Tentar Novamente
        </button>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 p-4 h-full overflow-y-auto">
      <div className="text-white text-sm font-semibold mb-4 border-b border-slate-600 pb-2">
        👥 Jogadores ({players.length})
      </div>

      {players.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-sm mb-4">
            📭 Nenhum jogador cadastrado ainda
          </div>
          <div className="text-gray-500 text-xs mb-4">
            Adicione jogadores para começar a analisar padrões
          </div>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {players.map((player) => (
            <div
              key={player.id}
              className={`
                p-3 rounded-lg cursor-pointer transition-all duration-200 group
                ${selectedPlayer?.id === player.id 
                  ? 'bg-green-700 border border-green-500' 
                  : 'bg-slate-700 hover:bg-slate-600 border border-slate-600'
                }
              `}
            >
              <div 
                onClick={() => onPlayerSelect(player)}
                className="flex-1"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">{player.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs text-white font-bold ${getTypeColor(player.type)}`}>
                      {player.type || 'Unknown'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeletePlayer(player.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 text-xs"
                      title="Remover jogador"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                {player.nickname && (
                  <div className="text-gray-300 text-xs mb-1">{player.nickname}</div>
                )}
                
                {player.notes && (
                  <div className="text-gray-400 text-xs">{player.notes}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botão Adicionar */}
      <div className="mt-4 pt-4 border-t border-slate-600">
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors"
        >
          ➕ Adicionar Jogador
        </button>
      </div>

      {/* Estatísticas */}
      {players.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-600">
          <div className="text-gray-400 text-xs">
            <div>Total: {players.length} jogadores</div>
            <div>TAG: {players.filter(p => p.type === 'TAG').length}</div>
            <div>Fish: {players.filter(p => p.type === 'Fish').length}</div>
            <div>LAG: {players.filter(p => p.type === 'LAG').length}</div>
            <div>Nit: {players.filter(p => p.type === 'Nit').length}</div>
          </div>
        </div>
      )}

      {/* Modal de Adicionar */}
      <AddPlayerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPlayerAdded={handlePlayerAdded}
      />
    </div>
  )
}