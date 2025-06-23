'use client'

import { useState } from 'react'
import { Card, Player, HandResult, OpponentAction } from '@/types/shared'
import CardSelector from './components/CardSelector'
import PlayerSidebar from './components/PlayerSidebar'
import AICoach from './components/AICoach'

export default function Home() {
  const [selectedCards, setSelectedCards] = useState<Card[]>([])
  const [boardCards, setBoardCards] = useState<Card[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<Player>()
  const [villainRange, setVillainRange] = useState('QQ+, AK')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [equity, setEquity] = useState<{ hero: number, villain: number } | null>(null)

  // Sistema de Input de Ações
  const [opponentAction, setOpponentAction] = useState<OpponentAction | ''>('')
  const [betSize, setBetSize] = useState<number>(0)
  const [potSize, setPotSize] = useState<number>(25)
  const [handResult, setHandResult] = useState<HandResult | null>(null)
  const [showedCards, setShowedCards] = useState<Card[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Todas as cartas usadas (hero + board + showed)
  const usedCards = [...selectedCards, ...boardCards, ...showedCards]

  // Opções tipadas para ações
  const actionOptions: Array<{
    action: OpponentAction
    label: string
    color: string
  }> = [
    { action: 'fold', label: '❌ FOLD', color: 'bg-red-600' },
    { action: 'call', label: '✅ CALL', color: 'bg-blue-600' },
    { action: 'raise', label: '⬆️ RAISE', color: 'bg-orange-600' },
    { action: 'all-in', label: '🔥 ALL-IN', color: 'bg-purple-600' }
  ]

  // Opções tipadas para resultados
  const resultOptions: Array<{
    result: HandResult
    label: string
    color: string
  }> = [
    { result: 'won', label: '🏆 GANHEI', color: 'bg-green-600' },
    { result: 'lost', label: '💸 PERDI', color: 'bg-red-600' },
    { result: 'chopped', label: '🤝 EMPATE', color: 'bg-yellow-600' }
  ]

  const handleCardSelect = (card: Card) => {
    if (selectedCards.length < 2) {
      setSelectedCards([...selectedCards, card])
    }
  }

  const handleBoardCardSelect = (card: Card) => {
    if (boardCards.length < 5) {
      setBoardCards([...boardCards, card])
    }
  }

  const clearCards = () => {
    setSelectedCards([])
  }

  const clearBoard = () => {
    setBoardCards([])
  }

  const clearAllCards = () => {
    setSelectedCards([])
    setBoardCards([])
  }

  const clearHandData = () => {
    setOpponentAction('')
    setBetSize(0)
    setPotSize(25)
    setHandResult(null)
    setShowedCards([])
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
      // Mock equity baseado no tipo do player e board
      let heroEquity = 50
      
      // Ajustar equity baseado no board
      const boardSize = boardCards.length
      if (boardSize >= 3) {
        // Com flop, equity fica mais definida
        if (selectedPlayer.type === 'Nit') {
          heroEquity = Math.random() * 35 + 20 // 20-55%
        } else if (selectedPlayer.type === 'Fish') {
          heroEquity = Math.random() * 35 + 50 // 50-85%
        } else {
          heroEquity = Math.random() * 50 + 30 // 30-80%
        }
      } else {
        // Pré-flop equity
        if (selectedPlayer.type === 'Nit') {
          heroEquity = Math.random() * 30 + 25 // 25-55%
        } else if (selectedPlayer.type === 'Fish') {
          heroEquity = Math.random() * 30 + 55 // 55-85%
        } else {
          heroEquity = Math.random() * 40 + 40 // 40-80%
        }
      }
      
      setEquity({
        hero: Math.round(heroEquity * 10) / 10,
        villain: Math.round((100 - heroEquity) * 10) / 10
      })
      setIsAnalyzing(false)
    }, 1500)
  }

  const saveHandAction = async () => {
    if (!selectedPlayer || !opponentAction || !handResult) return

    setIsSaving(true)
    
    // Mock save - simular API call
    setTimeout(() => {
      const handData = {
        heroCards: selectedCards.map(card => card.display).join(''),
        boardCards: boardCards.map(card => card.display).join(''),
        playerId: selectedPlayer.id,
        playerName: selectedPlayer.name,
        playerRange: villainRange,
        opponentAction,
        betSize: betSize || 0,
        potSize,
        showedCards: showedCards.map(card => card.display).join(''),
        result: handResult,
        equity,
        timestamp: new Date().toISOString()
      }
      
      console.log('🎯 Mão Salva:', handData)
      
      // Limpar para próxima mão
      clearAllCards()
      clearHandData()
      setEquity(null)
      setIsSaving(false)
      
      // Feedback visual
      alert('✅ Mão salva! Pronto para próxima.')
    }, 800)
  }

  const getBoardStage = () => {
    if (boardCards.length === 0) return 'Pré-flop'
    if (boardCards.length === 3) return 'Flop'
    if (boardCards.length === 4) return 'Turn'
    if (boardCards.length === 5) return 'River'
    return `Board (${boardCards.length}/5)`
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
              <div className="flex gap-2 items-center">
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
                        selectedCards={usedCards}
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

            {/* Board Cards */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-300 text-sm">
                  Board ({getBoardStage()}):
                </label>
                {boardCards.length > 0 && (
                  <button
                    onClick={clearBoard}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                  >
                    Limpar Board
                  </button>
                )}
              </div>
              
              <div className="flex gap-2 items-center">
                {[0, 1, 2, 3, 4].map((index) => (
                  <div key={index} className="relative">
                    {boardCards[index] ? (
                      <div className={`
                        w-10 h-14 bg-white border border-gray-400 rounded flex items-center justify-center font-bold text-xs
                        ${boardCards[index].suit === '♥' || boardCards[index].suit === '♦' ? 'text-red-600' : 'text-black'}
                        ${index === 2 ? 'mr-2' : ''}
                        ${index === 3 ? 'mr-2' : ''}
                      `}>
                        {boardCards[index].display}
                      </div>
                    ) : (
                      <div className={`
                        ${index === 2 ? 'mr-2' : ''}
                        ${index === 3 ? 'mr-2' : ''}
                      `}>
                        <CardSelector 
                          onCardSelect={handleBoardCardSelect}
                          selectedCards={usedCards}
                          isBoard={true}
                        />
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Labels das streets */}
                <div className="ml-4 text-xs text-gray-400">
                  <div>Flop: 3 cartas</div>
                  <div>Turn: 4ª carta</div>
                  <div>River: 5ª carta</div>
                </div>
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

            {/* Botões de Ação */}
            <div className="flex gap-3">
              <button
                onClick={calculateEquity}
                disabled={selectedCards.length !== 2 || !selectedPlayer || isAnalyzing}
                className={`
                  flex-1 py-3 rounded font-medium
                  ${selectedCards.length === 2 && selectedPlayer && !isAnalyzing
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {isAnalyzing ? 'Calculando...' : 'Calcular Equity + IA'}
              </button>
              
              {(selectedCards.length > 0 || boardCards.length > 0) && (
                <button
                  onClick={clearAllCards}
                  className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
                >
                  🗑️ Limpar Tudo
                </button>
              )}
            </div>
          </div>

          {/* Equity Display - Individual */}
          {equity && (
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-semibold">📊 Equity Calculator (1v1)</h3>
                <div className="text-gray-400 text-sm">
                  {getBoardStage()} • vs {selectedPlayer?.name}
                </div>
              </div>
              
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
              
              {/* Board Display */}
              {boardCards.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <div className="text-gray-400 text-sm mb-2">Board atual:</div>
                  <div className="flex gap-1">
                    {boardCards.map((card, index) => (
                      <span 
                        key={index}
                        className={`
                          px-2 py-1 text-xs font-bold rounded
                          ${card.suit === '♥' || card.suit === '♦' ? 'bg-red-900 text-red-200' : 'bg-gray-900 text-gray-200'}
                        `}
                      >
                        {card.display}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Equity Calculator - Mesa Completa */}
          {equity && (
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-semibold">🎲 Equity Calculator (Mesa)</h3>
                <div className="text-gray-400 text-sm">
                  Multi-way • {getBoardStage()}
                </div>
              </div>

              {/* Mesa Equity - Principais */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-4 bg-slate-700 rounded">
                  <div className="text-green-400 font-bold text-3xl">42.3%</div>
                  <div className="text-gray-300 text-sm">Você</div>
                  <div className="text-green-300 text-xs">EV: +R$ 19.04</div>
                </div>
                <div className="text-center p-4 bg-slate-700 rounded">
                  <div className="text-red-400 font-bold text-3xl">57.7%</div>
                  <div className="text-gray-300 text-sm">Campo</div>
                  <div className="text-red-300 text-xs">EV Total: R$ 25.96</div>
                </div>
              </div>

              {/* Breakdown Individual */}
              <div className="space-y-2 mb-4">
                <div className="text-gray-300 text-sm font-semibold mb-2">Breakdown Individual:</div>
                
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-300 text-sm">João (TAG)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-700 rounded-full h-2">
                      <div className="bg-orange-400 h-2 rounded-full" style={{width: '18.7%'}}></div>
                    </div>
                    <span className="text-orange-400 text-sm font-bold">18.7%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-300 text-sm">Pedro (Fish)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-700 rounded-full h-2">
                      <div className="bg-orange-400 h-2 rounded-full" style={{width: '15.1%'}}></div>
                    </div>
                    <span className="text-orange-400 text-sm font-bold">15.1%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-300 text-sm">Maria (TAG)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-700 rounded-full h-2">
                      <div className="bg-orange-400 h-2 rounded-full" style={{width: '12.8%'}}></div>
                    </div>
                    <span className="text-orange-400 text-sm font-bold">12.8%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-300 text-sm">Carlos (LAG)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-700 rounded-full h-2">
                      <div className="bg-orange-400 h-2 rounded-full" style={{width: '11.1%'}}></div>
                    </div>
                    <span className="text-orange-400 text-sm font-bold">11.1%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1 opacity-50">
                  <span className="text-gray-400 text-sm">Ana (Fold)</span>
                  <span className="text-gray-500 text-sm">0%</span>
                </div>
              </div>

              {/* Pot Information */}
              <div className="bg-slate-700 rounded p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Pot Total:</span>
                  <span className="text-white font-bold">R$ 45.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Sua Expected Value:</span>
                  <span className="text-green-400 font-bold">+R$ 19.04</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Profit vs Investimento:</span>
                  <span className="text-green-400 font-bold">+R$ 4.04</span>
                </div>
              </div>

              {/* Players Ativos Toggle */}
              <div className="mt-4 pt-4 border-t border-gray-600">
                <div className="text-gray-400 text-xs mb-2">Players ativos na mão:</div>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-1 bg-green-700 text-green-200 text-xs rounded">Você</span>
                  <span className="px-2 py-1 bg-blue-700 text-blue-200 text-xs rounded">João</span>
                  <span className="px-2 py-1 bg-red-700 text-red-200 text-xs rounded">Pedro</span>
                  <span className="px-2 py-1 bg-blue-700 text-blue-200 text-xs rounded">Maria</span>
                  <span className="px-2 py-1 bg-orange-700 text-orange-200 text-xs rounded">Carlos</span>
                  <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded opacity-50">Ana (fold)</span>
                </div>
              </div>
            </div>
          )}

          {/* Sistema de Input de Ações - Após Equity */}
          {equity && (
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-white text-lg font-semibold mb-4">⚡ Registrar Ação (15-30s)</h3>
              
              {/* Ação do Oponente */}
              <div className="mb-4">
                <label className="text-gray-300 text-sm block mb-2">
                  Ação do {selectedPlayer?.name}:
                </label>
                
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {actionOptions.map(({action, label, color}) => (
                    <button
                      key={action}
                      onClick={() => setOpponentAction(action)}
                      className={`py-3 rounded font-medium transition-all ${
                        opponentAction === action 
                          ? `${color} text-white shadow-lg scale-105` 
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Bet Size (se raise/all-in) */}
                {(opponentAction === 'raise' || opponentAction === 'all-in') && (
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-gray-400 text-xs block mb-1">Bet Size (R$):</label>
                      <input
                        type="number"
                        placeholder="15"
                        value={betSize || ''}
                        onChange={(e) => setBetSize(Number(e.target.value))}
                        className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600 focus:border-orange-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs block mb-1">Pot Size (R$):</label>
                      <input
                        type="number"
                        placeholder="25"
                        value={potSize || ''}
                        onChange={(e) => setPotSize(Number(e.target.value))}
                        className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600 focus:border-orange-400 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Resultado da Mão */}
              {opponentAction && (
                <div className="mb-4">
                  <label className="text-gray-300 text-sm block mb-2">Resultado da Mão:</label>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {resultOptions.map(({result, label, color}) => (
                      <button
                        key={result}
                        onClick={() => setHandResult(result)}
                        className={`py-3 rounded font-medium transition-all ${
                          handResult === result 
                            ? `${color} text-white shadow-lg scale-105` 
                            : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cartas Mostradas (Opcional) */}
              {handResult && handResult !== 'chopped' && (
                <div className="mb-4">
                  <label className="text-gray-300 text-sm block mb-2">
                    {selectedPlayer?.name} mostrou cartas? (opcional)
                  </label>
                  
                  <div className="flex gap-2 items-center">
                    {[0, 1].map((index) => (
                      <div key={index}>
                        {showedCards[index] ? (
                          <div className={`
                            w-10 h-14 bg-white border rounded flex items-center justify-center font-bold text-xs
                            ${showedCards[index].suit === '♥' || showedCards[index].suit === '♦' ? 'text-red-600' : 'text-black'}
                          `}>
                            {showedCards[index].display}
                          </div>
                        ) : (
                          <CardSelector 
                            onCardSelect={(card) => {
                              if (showedCards.length < 2) {
                                setShowedCards([...showedCards, card])
                              }
                            }}
                            selectedCards={usedCards}
                            isBoard={true}
                          />
                        )}
                      </div>
                    ))}
                    
                    {showedCards.length > 0 && (
                      <button
                        onClick={() => setShowedCards([])}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                      >
                        Limpar
                      </button>
                    )}
                    
                    {showedCards.length === 0 && (
                      <span className="text-gray-500 text-xs">Clique para adicionar cartas mostradas</span>
                    )}
                  </div>
                </div>
              )}

              {/* Botão Salvar */}
              {handResult && (
                <div className="flex gap-3">
                  <button
                    onClick={saveHandAction}
                    disabled={isSaving}
                    className={`
                      flex-1 py-4 rounded font-bold text-lg transition-all
                      ${isSaving 
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:scale-105'
                      }
                    `}
                  >
                    {isSaving ? '💾 Salvando...' : '💾 SALVAR MÃO & PRÓXIMA'}
                  </button>
                  
                  <button
                    onClick={clearHandData}
                    className="px-4 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium"
                    title="Limpar dados da ação"
                  >
                    🗑️
                  </button>
                </div>
              )}

              {/* Status Info */}
              <div className="mt-4 pt-3 border-t border-gray-600">
                <div className="text-gray-400 text-xs">
                  {!opponentAction && "1️⃣ Selecione ação do oponente"}
                  {opponentAction && !handResult && "2️⃣ Selecione resultado da mão"}
                  {handResult && "3️⃣ Pronto! Pode salvar"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Coach */}
        <div className="lg:col-span-1 bg-slate-800">
          <AICoach 
            isAnalyzing={isAnalyzing}
            selectedPlayer={selectedPlayer}
            heroCards={selectedCards}
            villainRange={villainRange}
            boardCards={boardCards}
            potSize={potSize}
            position="Button"
            action={opponentAction || undefined}
          />
        </div>
      </div>
    </div>
  )
}