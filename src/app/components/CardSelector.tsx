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
}

export default function CardSelector({ onCardSelect, selectedCards }: CardSelectorProps) {
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
        className="w-12 h-16 bg-gray-600 border-2 border-dashed border-gray-400 rounded text-gray-300 hover:border-blue-400"
      >
        ?
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg max-w-2xl w-full mx-4">
            <h3 className="text-white text-lg mb-4">Selecione uma carta</h3>
            
            <div className="grid grid-cols-13 gap-1 mb-4">
              {allCards.map((card, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (!isCardSelected(card)) {
                      onCardSelect(card)
                      setIsOpen(false)
                    }
                  }}
                  disabled={isCardSelected(card)}
                  className={`
                    w-8 h-10 text-xs font-bold rounded border
                    ${isCardSelected(card) 
                      ? 'bg-gray-500 text-gray-400 cursor-not-allowed' 
                      : 'bg-white hover:bg-gray-100 cursor-pointer'
                    }
                    ${card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'}
                  `}
                >
                  {card.display}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}