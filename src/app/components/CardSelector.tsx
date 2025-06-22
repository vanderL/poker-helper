'use client'

import { useState } from 'react'

interface Card {
  rank: string
  suit: string
  display: string
}

interface CardSelectorProps {
  onCardSelect: (card: Card) => void
  selectedCards: Card[]
  isBoard?: boolean
}

export default function CardSelector({ onCardSelect, selectedCards, isBoard = false }: CardSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const suits = ['♠', '♥', '♦', '♣']
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']

  const allCards: Card[] = []
  ranks.forEach(rank => {
    suits.forEach(suit => {
      allCards.push({
        rank,
        suit,
        display: `${rank}${suit}`
      })
    })
  })

  const isCardSelected = (card: Card) => {
    return selectedCards.some(selected => 
      selected.rank === card.rank && selected.suit === card.suit
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className={`
          ${isBoard ? 'w-10 h-14' : 'w-12 h-16'} 
          bg-gray-600 border-2 border-dashed border-gray-400 rounded text-gray-300 hover:border-blue-400 text-xs
        `}
      >
        ?
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg">
                {isBoard ? '🃏 Selecione carta do Board' : '🃏 Selecione sua carta'}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            
            {/* Grid de cartas organizadas por suit */}
            <div className="space-y-4">
              {suits.map((suit) => (
                <div key={suit} className="space-y-2">
                  <div className={`
                    text-sm font-bold
                    ${suit === '♥' || suit === '♦' ? 'text-red-400' : 'text-gray-300'}
                  `}>
                    {suit} {suit === '♠' ? 'Spades' : suit === '♥' ? 'Hearts' : suit === '♦' ? 'Diamonds' : 'Clubs'}
                  </div>
                  
                  <div className="grid grid-cols-13 gap-1">
                    {ranks.map((rank) => {
                      const card = { rank, suit, display: `${rank}${suit}` }
                      const isDisabled = isCardSelected(card)
                      
                      return (
                        <button
                          key={`${rank}${suit}`}
                          onClick={() => {
                            if (!isDisabled) {
                              onCardSelect(card)
                              setIsOpen(false)
                            }
                          }}
                          disabled={isDisabled}
                          className={`
                            w-10 h-12 text-xs font-bold rounded border transition-all
                            ${isDisabled 
                              ? 'bg-gray-500 text-gray-400 cursor-not-allowed border-gray-600' 
                              : 'bg-white hover:bg-gray-100 cursor-pointer border-gray-300 hover:border-blue-400'
                            }
                            ${suit === '♥' || suit === '♦' ? 'text-red-600' : 'text-black'}
                          `}
                        >
                          {card.display}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-600">
              <div className="flex justify-between items-center">
                <div className="text-gray-400 text-sm">
                  {selectedCards.length > 0 && (
                    <span>Cartas já selecionadas: {selectedCards.length}</span>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}