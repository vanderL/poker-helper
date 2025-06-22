'use client'

import { useState } from 'react'

interface AIMessage {
  id: number
  type: 'analysis' | 'thinking'
  content: string
  timestamp: Date
  confidence?: number
  action?: 'FOLD' | 'CALL' | 'RAISE'
}

interface AICoachProps {
  isAnalyzing?: boolean
}

export default function AICoach({ isAnalyzing = false }: AICoachProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 1,
      type: 'analysis',
      content: 'Aguardando situação para analisar...',
      timestamp: new Date(),
      confidence: 0
    }
  ])

  // Mock de análise da IA
  const mockAnalysis: AIMessage = {
    id: Date.now(),
    type: 'analysis',
    content: `🤖 Análise: FOLD vs João

💡 Conceito: Reverse Implied Odds

João só faz 3bet com QQ+/AK (range muito tight). Sua AKo tem apenas 43% equity, e quando você acertar um A ou K, ele provavelmente tem algo melhor.

Você vai perder mais fichas quando "acerta" do que ganha quando ele fold.

📚 Regra Prática: Vs 3bet tight, fold mãos "good but not great" como AQ, AJ, KQ.

📊 Análise do João:
- Histórico: 3bet apenas 4% das mãos
- Fold vs 4bet: 0% (nunca fold nuts)
- Padrão: Só agride com monstros
- Exploit: 3bet light contra ele`,
    timestamp: new Date(),
    confidence: 85,
    action: 'FOLD'
  }

  const simulateAnalysis = () => {
    // Adicionar mensagem "pensando"
    const thinkingMessage: AIMessage = {
      id: Date.now(),
      type: 'thinking',
      content: '⚡ Analisando situação...',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, thinkingMessage])

    // Após 2 segundos, substituir por análise real
    setTimeout(() => {
      setMessages(prev => [
        ...prev.filter(m => m.type !== 'thinking'),
        mockAnalysis
      ])
    }, 2000)
  }

  return (
    <div className="bg-slate-800 p-4 h-full flex flex-col">
      <div className="text-white text-sm font-semibold mb-4 border-b border-slate-600 pb-2 flex items-center gap-2">
        🤖 IA Coach
        <button
          onClick={simulateAnalysis}
          className="ml-auto bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-xs"
        >
          Analisar Teste
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="bg-slate-700 rounded-lg p-4">
            {message.type === 'thinking' ? (
              <div className="text-yellow-400 text-sm flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                {message.content}
              </div>
            ) : (
              <div>
                {message.action && (
                  <div className={`inline-block px-3 py-1 rounded-full text-white font-bold text-sm mb-3 ${
                    message.action === 'FOLD' ? 'bg-red-600' :
                    message.action === 'CALL' ? 'bg-orange-600' : 'bg-green-600'
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

      {isAnalyzing && (
        <div className="mt-4 p-3 bg-yellow-900 border border-yellow-600 rounded text-yellow-200 text-sm">
          ⚡ IA analisando situação...
        </div>
      )}
    </div>
  )
}