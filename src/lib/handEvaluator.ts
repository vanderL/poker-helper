export interface Card {
  rank: string
  suit: string
}

export enum HandRank {
  HIGH_CARD = 1,
  PAIR = 2,
  TWO_PAIR = 3,
  THREE_OF_A_KIND = 4,
  STRAIGHT = 5,
  FLUSH = 6,
  FULL_HOUSE = 7,
  FOUR_OF_A_KIND = 8,
  STRAIGHT_FLUSH = 9,
  ROYAL_FLUSH = 10
}

export interface HandEvaluation {
  rank: HandRank
  value: number // Valor numérico para comparação (maior = melhor)
  description: string
  kickers: number[] // Cartas de desempate
}

// Valores numéricos dos ranks
const RANK_VALUES: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
}

// Mapeamento reverso para descrições
const VALUE_NAMES: Record<number, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: 'T',
  11: 'J', 12: 'Q', 13: 'K', 14: 'A'
}

/**
 * Avalia a melhor mão de 5 cartas possível a partir de 5-7 cartas
 */
export function evaluateHand(cards: Card[]): HandEvaluation {
  if (cards.length < 5) {
    throw new Error('Mínimo 5 cartas necessárias para avaliação')
  }

  if (cards.length === 5) {
    return evaluateFiveCards(cards)
  }

  // Para 6 ou 7 cartas, encontrar a melhor combinação de 5
  return findBestFiveCardHand(cards)
}

/**
 * Encontra a melhor mão de 5 cartas dentre 6 ou 7 cartas
 */
function findBestFiveCardHand(cards: Card[]): HandEvaluation {
  const allCombinations = getCombinations(cards, 5)
  let bestHand: HandEvaluation | null = null

  for (const combination of allCombinations) {
    const evaluation = evaluateFiveCards(combination)
    
    if (!bestHand || compareHands(evaluation, bestHand) > 0) {
      bestHand = evaluation
    }
  }

  return bestHand!
}

/**
 * Gera todas as combinações de K elementos de um array
 */
function getCombinations<T>(array: T[], k: number): T[][] {
  if (k === 0) return [[]]
  if (k > array.length) return []
  
  const result: T[][] = []
  
  for (let i = 0; i <= array.length - k; i++) {
    const first = array[i]
    const rest = array.slice(i + 1)
    const combinations = getCombinations(rest, k - 1)
    
    for (const combination of combinations) {
      result.push([first, ...combination])
    }
  }
  
  return result
}

/**
 * Avalia exatamente 5 cartas
 */
function evaluateFiveCards(cards: Card[]): HandEvaluation {
  if (cards.length !== 5) {
    throw new Error('Função deve receber exatamente 5 cartas')
  }

  // Converter para valores numéricos e ordenar
  const ranks = cards.map(card => RANK_VALUES[card.rank]).sort((a, b) => b - a)
  const suits = cards.map(card => card.suit)

  // Contar frequências dos ranks
  const rankCounts = new Map<number, number>()
  for (const rank of ranks) {
    rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1)
  }

  // Ordenar por frequência e depois por valor
  const countGroups = Array.from(rankCounts.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1] // Por frequência primeiro
      return b[0] - a[0] // Por valor depois
    })

  const isFlush = new Set(suits).size === 1
  const isStraight = checkStraight(ranks)

  // Royal Flush
  if (isFlush && isStraight && ranks[0] === 14) {
    return {
      rank: HandRank.ROYAL_FLUSH,
      value: 10000000,
      description: 'Royal Flush',
      kickers: []
    }
  }

  // Straight Flush
  if (isFlush && isStraight) {
    return {
      rank: HandRank.STRAIGHT_FLUSH,
      value: 9000000 + ranks[0],
      description: `Straight Flush, ${VALUE_NAMES[ranks[0]]} high`,
      kickers: [ranks[0]]
    }
  }

  // Four of a Kind
  if (countGroups[0][1] === 4) {
    const fourKind = countGroups[0][0]
    const kicker = countGroups[1][0]
    return {
      rank: HandRank.FOUR_OF_A_KIND,
      value: 8000000 + fourKind * 100 + kicker,
      description: `Four ${VALUE_NAMES[fourKind]}s`,
      kickers: [fourKind, kicker]
    }
  }

  // Full House
  if (countGroups[0][1] === 3 && countGroups[1][1] === 2) {
    const threeKind = countGroups[0][0]
    const pair = countGroups[1][0]
    return {
      rank: HandRank.FULL_HOUSE,
      value: 7000000 + threeKind * 100 + pair,
      description: `Full House, ${VALUE_NAMES[threeKind]}s over ${VALUE_NAMES[pair]}s`,
      kickers: [threeKind, pair]
    }
  }

  // Flush
  if (isFlush) {
    const flushValue = ranks.reduce((sum, rank, index) => sum + rank * Math.pow(100, 4 - index), 0)
    return {
      rank: HandRank.FLUSH,
      value: 6000000 + flushValue,
      description: `Flush, ${VALUE_NAMES[ranks[0]]} high`,
      kickers: [...ranks]
    }
  }

  // Straight
  if (isStraight) {
    return {
      rank: HandRank.STRAIGHT,
      value: 5000000 + ranks[0],
      description: `Straight, ${VALUE_NAMES[ranks[0]]} high`,
      kickers: [ranks[0]]
    }
  }

  // Three of a Kind
  if (countGroups[0][1] === 3) {
    const threeKind = countGroups[0][0]
    const kickers = countGroups.slice(1).map(g => g[0])
    const kickerValue = kickers.reduce((sum, kicker, index) => sum + kicker * Math.pow(100, 1 - index), 0)
    return {
      rank: HandRank.THREE_OF_A_KIND,
      value: 4000000 + threeKind * 10000 + kickerValue,
      description: `Three ${VALUE_NAMES[threeKind]}s`,
      kickers: [threeKind, ...kickers]
    }
  }

  // Two Pair
  if (countGroups[0][1] === 2 && countGroups[1][1] === 2) {
    const highPair = countGroups[0][0]
    const lowPair = countGroups[1][0]
    const kicker = countGroups[2][0]
    return {
      rank: HandRank.TWO_PAIR,
      value: 3000000 + highPair * 10000 + lowPair * 100 + kicker,
      description: `Two Pair, ${VALUE_NAMES[highPair]}s and ${VALUE_NAMES[lowPair]}s`,
      kickers: [highPair, lowPair, kicker]
    }
  }

  // Pair
  if (countGroups[0][1] === 2) {
    const pair = countGroups[0][0]
    const kickers = countGroups.slice(1).map(g => g[0])
    const kickerValue = kickers.reduce((sum, kicker, index) => sum + kicker * Math.pow(100, 2 - index), 0)
    return {
      rank: HandRank.PAIR,
      value: 2000000 + pair * 1000000 + kickerValue,
      description: `Pair of ${VALUE_NAMES[pair]}s`,
      kickers: [pair, ...kickers]
    }
  }

  // High Card
  const highCardValue = ranks.reduce((sum, rank, index) => sum + rank * Math.pow(100, 4 - index), 0)
  return {
    rank: HandRank.HIGH_CARD,
    value: 1000000 + highCardValue,
    description: `${VALUE_NAMES[ranks[0]]} high`,
    kickers: [...ranks]
  }
}

/**
 * Verifica se 5 cartas formam uma sequência
 */
function checkStraight(ranks: number[]): boolean {
  // Straight normal
  for (let i = 0; i < 4; i++) {
    if (ranks[i] - ranks[i + 1] !== 1) {
      break
    }
    if (i === 3) return true // Chegou ao final, é straight
  }

  // Straight A-2-3-4-5 (wheel)
  if (ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2) {
    return true
  }

  return false
}

/**
 * Compara duas avaliações de mão
 * @returns Positivo se hand1 > hand2, negativo se hand1 < hand2, 0 se iguais
 */
export function compareHands(hand1: HandEvaluation, hand2: HandEvaluation): number {
  return hand1.value - hand2.value
}

/**
 * Determina o vencedor entre múltiplas mãos
 */
export function determineWinner(hands: HandEvaluation[]): number[] {
  if (hands.length === 0) return []

  const maxValue = Math.max(...hands.map(h => h.value))
  return hands
    .map((hand, index) => ({ hand, index }))
    .filter(({ hand }) => hand.value === maxValue)
    .map(({ index }) => index)
}

/**
 * Converte string de carta para objeto Card
 */
export function parseCard(cardString: string): Card {
  if (cardString.length !== 2) {
    throw new Error(`Formato de carta inválido: ${cardString}`)
  }

  const rank = cardString[0]
  const suit = cardString[1]

  if (!RANK_VALUES[rank]) {
    throw new Error(`Rank inválido: ${rank}`)
  }

  if (!['♠', '♥', '♦', '♣', 's', 'h', 'd', 'c'].includes(suit)) {
    throw new Error(`Suit inválido: ${suit}`)
  }

  // Normalizar suits
  const normalizedSuit = suit === 's' ? '♠' : suit === 'h' ? '♥' : suit === 'd' ? '♦' : suit === 'c' ? '♣' : suit

  return { rank, suit: normalizedSuit }
}

/**
 * Converte array de strings para array de Cards
 */
export function parseCards(cardStrings: string[]): Card[] {
  return cardStrings.map(parseCard)
}

/**
 * Gera descrição amigável da avaliação
 */
export function getHandDescription(evaluation: HandEvaluation): string {
  return evaluation.description
}

/**
 * Verifica se uma mão bate outra
 */
export function doesHandWin(hand1: Card[], hand2: Card[]): boolean {
  const eval1 = evaluateHand(hand1)
  const eval2 = evaluateHand(hand2)
  return compareHands(eval1, eval2) > 0
}

/**
 * Função utilitária para debugging
 */
export function debugHandEvaluation(cards: Card[]): void {
  const evaluation = evaluateHand(cards)
  console.log(`Cards: ${cards.map(c => c.rank + c.suit).join(' ')}`)
  console.log(`Hand: ${evaluation.description}`)
  console.log(`Rank: ${HandRank[evaluation.rank]}`)
  console.log(`Value: ${evaluation.value}`)
  console.log(`Kickers: ${evaluation.kickers.map(k => VALUE_NAMES[k]).join(', ')}`)
}