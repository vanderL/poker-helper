'use client'

import { useState } from 'react'

interface AIMessage {
  id: number
  type: 'analysis' | 'thinking' | 'error'
  content: string
  timestamp: Date
  confidence?: number
  action?: 'FOLD' | 'CALL' | 'RAISE' | 'ALL-IN'
  education?: {
    concept: string
    explanation: string
    practicalRule: string
    commonMistake: string
  }
  playerAnalysis?: {
    pattern: string
    exploit: string
    confidence: string
  }
}

interface Player {
  id: number
  name: string
  type?: 'TAG' | 'LAG' | 'Fish' | 'Nit'
  notes?: string
  initialNotes?: string
}

interface Card {
  rank: string
  suit: string
  display: string
}

interface AICoachProps {
  isAnalyzing?: boolean
  selectedPlayer?: Player
  heroCards?: Card[]
  villainRange?: string
  boardCards?: Card[]
  position?: string
  action?: string
  potSize?: number
}

export default function AICoach({ 
  isAnalyzing = false,
  selectedPlayer,
  heroCards = [],
  villainRange = '',
  boardCards = [],
  position,
  action,
  potSize
}: AICoachProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 1,
      type: 'analysis',
      content: 'Selecione suas cartas e um oponente para começar a análise...',
      timestamp: new Date(),
      confidence: 0
    }
  ])

  const [isLoading, setIsLoading] = useState(false)

  // Converter cartas para string format
  const formatCards = (cards: Card[]): string => {
    if (cards.length === 0) return ''
    if (cards.length === 1) return cards[0].display
    if (cards.length === 2) {
      const [card1, card2] = cards
      // Determinar se é suited ou offsuit
      const suited = card1.suit === card2.suit ? 's' : 'o'
      // Ordenar por rank strength (A > K > Q > ... > 2)
      const rankOrder = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']
      const rank1Index = rankOrder.indexOf(card1.rank)
      const rank2Index = rankOrder.indexOf(card2.rank)
      
      if (rank1Index <= rank2Index) {
        return `${card1.rank}${card2.rank}${suited}`
      } else {
        return `${card2.rank}${card1.rank}${suited}`
      }
    }
    return cards.map(c => c.display).join('')
  }

  // Análise real via API
  const analyzeWithAPI = async () => {
    if (!selectedPlayer || heroCards.length !== 2) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        content: '❌ Para analisar, você precisa:\n• Selecionar um oponente\n• Escolher suas 2 cartas\n• Definir o range do oponente',
        timestamp: new Date()
      }])
      return
    }

    setIsLoading(true)

    // Adicionar mensagem "pensando"
    const thinkingMessage: AIMessage = {
      id: Date.now(),
      type: 'thinking',
      content: '🧠 IA analisando padrões e calculando exploits...',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, thinkingMessage])

    try {
      const requestData = {
        heroCards: formatCards(heroCards),
        villainRange: villainRange || 'QQ+, AKs, AKo',
        playerProfile: {
          name: selectedPlayer.name,
          type: selectedPlayer.type || 'TAG',
          notes: selectedPlayer.notes || selectedPlayer.initialNotes
        },
        position: position || 'Button',
        action: action || 'Raise',
        boardCards: formatCards(boardCards),
        potSize: potSize || 45,
        context: `Análise em tempo real contra ${selectedPlayer.name} (${selectedPlayer.type})`
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`)
      }

      const analysis = await response.json()

      // Criar mensagem de análise estruturada
      const analysisMessage: AIMessage = {
        id: Date.now(),
        type: 'analysis',
        content: buildAnalysisContent(analysis),
        timestamp: new Date(),
        confidence: analysis.recommendation?.confidence || 75,
        action: analysis.recommendation?.action || 'FOLD',
        education: analysis.education,
        playerAnalysis: analysis.playerAnalysis
      }

      // Remover mensagem "pensando" e adicionar análise
      setMessages(prev => [
        ...prev.filter(m => m.type !== 'thinking'),
        analysisMessage
      ])

    } catch (error) {
      console.error('Erro na análise:', error)
      
      // Mensagem de erro amigável
      const errorMessage: AIMessage = {
        id: Date.now(),
        type: 'error',
        content: `❌ Erro na análise: ${error instanceof Error ? error.message : 'Erro desconhecido'}\n\n🔄 Usando análise básica como fallback...`,
        timestamp: new Date()
      }

      setMessages(prev => [
        ...prev.filter(m => m.type !== 'thinking'),
        errorMessage
      ])

      // Fallback para análise básica
      setTimeout(() => {
        const fallbackAnalysis = createFallbackAnalysis()
        setMessages(prev => [...prev, fallbackAnalysis])
      }, 1000)

    } finally {
      setIsLoading(false)
    }
  }

  // Interface para resposta da API
  interface AnalysisAPIResponse {
    recommendation?: {
      action: 'FOLD' | 'CALL' | 'RAISE' | 'ALL-IN'
      confidence: number
      reasoning: string
    }
    education?: {
      concept: string
      explanation: string
      practicalRule: string
      commonMistake: string
    }
    playerAnalysis?: {
      pattern: string
      exploit: string
      confidence: string
    }
    timestamp: string
  }

  // Construir conteúdo da análise
  const buildAnalysisContent = (analysis: AnalysisAPIResponse): string => {
    let content = `🤖 Análise: ${analysis.recommendation?.action || 'FOLD'} vs ${selectedPlayer?.name}\n\n`
    
    if (analysis.education?.concept) {
      content += `💡 Conceito: ${analysis.education.concept}\n\n`
    }
    
    if (analysis.recommendation?.reasoning) {
      content += `${analysis.recommendation.reasoning}\n\n`
    }
    
    if (analysis.education?.explanation) {
      content += `📚 Explicação: ${analysis.education.explanation}\n\n`
    }
    
    if (analysis.education?.practicalRule) {
      content += `⚡ Regra Prática: ${analysis.education.practicalRule}\n\n`
    }
    
    if (analysis.playerAnalysis?.pattern) {
      content += `📊 Análise do ${selectedPlayer?.name}:\n`
      content += `• Padrão: ${analysis.playerAnalysis.pattern}\n`
      if (analysis.playerAnalysis.exploit) {
        content += `• Exploit: ${analysis.playerAnalysis.exploit}\n`
      }
      if (analysis.playerAnalysis.confidence) {
        content += `• Confiança: ${analysis.playerAnalysis.confidence}\n`
      }
    }
    
    if (analysis.education?.commonMistake) {
      content += `\n❌ Erro Comum: ${analysis.education.commonMistake}`
    }
    
    return content
  }

  // Análise fallback
  const createFallbackAnalysis = (): AIMessage => {
    const isStrongHand = ['AA', 'KK', 'QQ', 'AK'].some(hand => 
      formatCards(heroCards).startsWith(hand.substring(0, 2))
    )

    return {
      id: Date.now(),
      type: 'analysis',
      content: `🤖 Análise Básica vs ${selectedPlayer?.name}\n\n💡 Conceito: Hand Strength Analysis\n\n${isStrongHand ? 'Mão premium detectada. Geralmente merece ação agressiva.' : 'Mão não-premium. Avalie cuidadosamente vs range do oponente.'}\n\n📚 Regra Prática: ${selectedPlayer?.type === 'TAG' ? 'Vs jogador tight, seja mais seletivo' : 'Vs jogador loose, value bet mais thin'}\n\n📊 Análise do ${selectedPlayer?.name}:\n• Tipo: ${selectedPlayer?.type || 'Unknown'}\n• Exploit: ${selectedPlayer?.type === 'Fish' ? 'Value bet mais frequentemente' : 'Respeite aggression dele'}`,
      timestamp: new Date(),
      confidence: 60,
      action: isStrongHand ? 'RAISE' : 'FOLD'
    }
  }

  // Limpar chat
  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: 'analysis',
        content: 'Chat limpo. Pronto para nova análise!',
        timestamp: new Date(),
        confidence: 0
      }
    ])
  }

  return (
    <div className="bg-slate-800 p-4 h-full flex flex-col">
      <div className="text-white text-sm font-semibold mb-4 border-b border-slate-600 pb-2 flex items-center gap-2">
        🤖 IA Coach
        <div className="ml-auto flex gap-2">
          <button
            onClick={clearChat}
            className="bg-gray-600 hover:bg-gray-700 text-white py-1 px-2 rounded text-xs"
            title="Limpar chat"
          >
            🗑️
          </button>
          <button
            onClick={analyzeWithAPI}
            disabled={isLoading || heroCards.length !== 2 || !selectedPlayer}
            className={`py-1 px-3 rounded text-xs font-medium ${
              isLoading || heroCards.length !== 2 || !selectedPlayer
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? '⏳ Analisando...' : '🧠 Analisar Situação'}
          </button>
        </div>
      </div>

      {/* Status da situação */}
      <div className="mb-4 p-3 bg-slate-700 rounded text-sm">
        <div className="text-gray-300">
          <div>👤 Oponente: {selectedPlayer?.name || 'Nenhum selecionado'}</div>
          <div>🃏 Suas cartas: {heroCards.length === 2 ? formatCards(heroCards) : 'Selecione 2 cartas'}</div>
          <div>📊 Range oponente: {villainRange || 'Não definido'}</div>
          {boardCards.length > 0 && (
            <div>🎯 Board: {formatCards(boardCards)}</div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="bg-slate-700 rounded-lg p-4">
            {message.type === 'thinking' ? (
              <div className="text-yellow-400 text-sm flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                {message.content}
              </div>
            ) : message.type === 'error' ? (
              <div className="text-red-400 text-sm">
                {message.content}
              </div>
            ) : (
              <div>
                {message.action && (
                  <div className={`inline-block px-3 py-1 rounded-full text-white font-bold text-sm mb-3 ${
                    message.action === 'FOLD' ? 'bg-red-600' :
                    message.action === 'CALL' ? 'bg-orange-600' : 
                    message.action === 'ALL-IN' ? 'bg-purple-600' :
                    'bg-green-600'
                  }`}>
                    {message.action}
                    {message.confidence && (
                      <span className="ml-2 opacity-90">{message.confidence}%</span>
                    )}
                  </div>
                )}
                
                <div className="text-gray-300 text-sm whitespace-pre-line leading-relaxed">
                  {message.content}
                </div>
                
                <div className="text-gray-500 text-xs mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {(isAnalyzing || isLoading) && (
        <div className="mt-4 p-3 bg-yellow-900 border border-yellow-600 rounded text-yellow-200 text-sm">
          ⚡ IA analisando situação...
        </div>
      )}
    </div>
  )
}