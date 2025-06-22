'use client'

import { useState } from 'react'
import CardSelector from './components/CardSelector'
import PlayerSidebar from './components/PlayerSidebar'
import AICoach from './components/AICoach'

interface Card {
  rank: string
  suit: string
  display: string
}

interface Player {
  id: number
  name: string
  nickname?: string
  type?: string
  notes?: string
}

export default function Home() {
  const [selectedCards, setSelectedCards] = useState<Card[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<Player>()
  const [villainRange, setVillainRange] = useState('QQ+, AK')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [equity, setEquity] = useState<{ hero: number, villain: number } | null>(null)

  const handleCardSelect = (card: Card) => {
    if (selectedCards.length < 2) {
      setSelectedCards([...selectedCards, card])
    }
  }

  const clearCards = () => {
    setSelectedCards([])
  }

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player)
    
    // Auto-carregar range baseado no tipo do player
    switch (player.type) {
      case 'TAG':
        setVillainRange('88+, ATs+, AJo+, KQs')
        break
      case 'LAG':
        setVillainRange('22+, A2s+, A9o+, K5s+, Q9s+')
        break
      case 'Fish':
        setVillainRange('22+, A2s+, A2o+, K2s+, Q2s+, J7s+')
        break
      case 'Nit':
        setVillainRange('QQ+, AKs, AKo')
        break
      default:
        setVillainRange('22+, A9s+, ATo+')
    }
  }

  const calculateEquity = () => {
    if (selectedCards.length !== 2 || !selectedPlayer) return

    setIsAnalyzing(true)
    
    // Mock calculation - simular delay da API
    setTimeout(() => {
      // Mock equity baseado no tipo do player
      let heroEquity = 50
      
      if (selectedPlayer.type === 'Nit') {
        heroEquity = Math.random() * 30 + 25 // 25-55%
      } else if (selectedPlayer.type === 'Fish') {
        heroEquity = Math.random() * 30 + 55 // 55-85%
      } else {
        heroEquity = Math.random() * 40 + 40 // 40-80%
      }
      
      setEquity({
        hero: Math.round(heroEquity * 10) / 10,
        villain: Math.round((100 - heroEquity) * 10) / 10
      })
      setIsAnalyzing(false)
    }, 1500)
  }

  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 p-4 border-b border-slate-600">
        <div className="flex justify-between items-center">
          <h1 className="text-blue-400 text-xl font-bold">🃏 PokerHelper</h1>
          <div className="text-gray-400 text-sm">
            Session: 2h 15m | Resultado: <span className="text-green-400">+R$ 45</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-1">
        {/* Player Sidebar */}
        <div className="lg:col-span-1 bg-slate-800">
          <PlayerSidebar 
            onPlayerSelect={handlePlayerSelect}
            selectedPlayer={selectedPlayer}
          />
        </div>

        {/* Game Area */}
        <div className="lg:col-span-2 bg-slate-900 p-6 flex flex-col gap-6">
          {/* Situação Atual */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-white text-lg font-semibold mb-4">Situação Atual</h2>
            
            {/* Minhas Cartas */}
            <div className="mb-4">
              <label className="text-gray-300 text-sm block mb-2">Minha Mão - Clique para selecionar:</label>
              <div className="flex gap-2">
                {[0, 1].map((index) => (
                  <div key={index} className="relative">
                    {selectedCards[index] ? (
                      <div className={`
                        w-12 h-16 bg-white border-2 border-blue-400 rounded flex items-center justify-center font-bold text-sm
                        ${selectedCards[index].suit === '♥' || selectedCards[index].suit === '♦' ? 'text-red-600' : 'text-black'}
                      `}>
                        {selectedCards[index].display}
                      </div>
                    ) : (
                      <CardSelector 
                        onCardSelect={handleCardSelect}
                        selectedCards={selectedCards}
                      />
                    )}
                  </div>
                ))}
                {selectedCards.length > 0 && (
                  <button
                    onClick={clearCards}
                    className="ml-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Range do Oponente */}
            <div className="mb-4">
              <label className="text-gray-300 text-sm block mb-2">
                Range do {selectedPlayer?.name || 'Oponente'}:
              </label>
              <input
                type="text"
                value={villainRange}
                onChange={(e) => setVillainRange(e.target.value)}
                className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600 focus:border-blue-400 outline-none"
                placeholder="Ex: QQ+, AKs-ATs, AKo"
              />
            </div>

            {/* Botão Calcular */}
            <button
              onClick={calculateEquity}
              disabled={selectedCards.length !== 2 || !selectedPlayer || isAnalyzing}
              className={`
                w-full py-3 rounded font-medium
                ${selectedCards.length === 2 && selectedPlayer && !isAnalyzing
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isAnalyzing ? 'Calculando...' : 'Calcular Equity + IA'}
            </button>
          </div>

          {/* Equity Display */}
          {equity && (
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-white text-lg font-semibold mb-4">📊 Equity Calculator</h3>
              
              <div className="flex justify-between mb-4">
                <div className="text-center">
                  <div className="text-green-400 font-bold text-2xl">{equity.hero}%</div>
                  <div className="text-gray-300 text-sm">Você</div>
                </div>
                <div className="text-center">
                  <div className="text-red-400 font-bold text-2xl">{equity.villain}%</div>
                  <div className="text-gray-300 text-sm">{selectedPlayer?.name}</div>
                </div>
              </div>

              <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
                <div 
                  className="bg-green-400 h-full flex items-center justify-center text-white text-xs font-bold transition-all duration-500"
                  style={{ width: `${equity.hero}%` }}
                >
                  {equity.hero > 30 && `${equity.hero}%`}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Coach */}
        <div className="lg:col-span-1 bg-slate-800">
          <AICoach isAnalyzing={isAnalyzing} />
        </div>
      </div>
    </div>
  )
}