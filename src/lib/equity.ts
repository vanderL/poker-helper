import { parseRange, ParsedHand } from './rangeParser'
import { evaluateHand, compareHands, Card, parseCards } from './handEvaluator'

export interface EquityCalculationInput {
  heroCards: Card[]
  villainRange: string
  boardCards?: Card[]
  iterations?: number
}

export interface MultiWayEquityInput {
  heroCards: Card[]
  opponents: Array<{
    name: string
    range: string
  }>
  boardCards?: Card[]
  iterations?: number
}

export interface EquityResult {
  heroEquity: number
  villainEquity: number
  totalIterations: number
  heroWins: number
  villainWins: number
  ties: number
  calculationTime: number
  error?: string
}

export interface MultiWayEquityResult {
  players: Record<string, {
    equity: number
    wins: number
    ties: number
  }>
  totalIterations: number
  calculationTime: number
  error?: string
}

// Deck completo de 52 cartas
const FULL_DECK: Card[] = (() => {
  const suits = ['♠', '♥', '♦', '♣']
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
  const deck: Card[] = []
  
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit })
    }
  }
  
  return deck
})()

/**
 * Calcula equity 1v1 usando Monte Carlo simulation
 */
export function calculateEquity(input: EquityCalculationInput): EquityResult {
  const startTime = performance.now()
  const iterations = input.iterations || 10000

  try {
    // Validar input
    const validation = validateEquityInput(input)
    if (validation.error) {
      return createErrorResult(validation.error, startTime)
    }

    // Parse do range do villain
    const rangeResult = parseRange(input.villainRange)
    if (rangeResult.error) {
      return createErrorResult(`Erro no range: ${rangeResult.error}`, startTime)
    }

    if (rangeResult.hands.length === 0) {
      return createErrorResult('Range do oponente está vazio', startTime)
    }

    // Gerar combinações do villain
    const villainCombinations = generateHandCombinations(rangeResult.hands)
    if (villainCombinations.length === 0) {
      return createErrorResult('Nenhuma combinação válida para o oponente', startTime)
    }

    // Cartas usadas (hero + board)
    const usedCards = [...input.heroCards, ...(input.boardCards || [])]

    // Filtrar combinações que conflitam com cartas usadas
    const validVillainCombinations = villainCombinations.filter(combo => 
      !hasCardConflict(combo, usedCards)
    )

    if (validVillainCombinations.length === 0) {
      return createErrorResult('Todas as combinações do oponente conflitam com cartas conhecidas', startTime)
    }

    // Executar simulação Monte Carlo
    let heroWins = 0
    let villainWins = 0
    let ties = 0
    let totalIterations = 0

    for (let i = 0; i < iterations; i++) {
      const result = simulateSingleHand(
        input.heroCards,
        validVillainCombinations,
        input.boardCards || [],
        usedCards
      )

      if (result) {
        totalIterations++
        if (result === 'hero') heroWins++
        else if (result === 'villain') villainWins++
        else ties++
      }
    }

    if (totalIterations === 0) {
      return createErrorResult('Nenhuma simulação válida foi possível', startTime)
    }

    const heroEquity = (heroWins + ties * 0.5) / totalIterations * 100
    const villainEquity = (villainWins + ties * 0.5) / totalIterations * 100

    return {
      heroEquity: Math.round(heroEquity * 10) / 10,
      villainEquity: Math.round(villainEquity * 10) / 10,
      totalIterations,
      heroWins,
      villainWins,
      ties,
      calculationTime: performance.now() - startTime
    }

  } catch (error) {
    return createErrorResult(
      `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      startTime
    )
  }
}

/**
 * Calcula equity multiway (3+ jogadores)
 */
export function calculateMultiWayEquity(input: MultiWayEquityInput): MultiWayEquityResult {
  const startTime = performance.now()
  const iterations = input.iterations || 10000

  try {
    // Validar input básico
    if (input.opponents.length === 0) {
      return createMultiWayErrorResult('Pelo menos um oponente é necessário', startTime)
    }

    // Parse ranges de todos os oponentes
    const opponentRanges: Array<{ name: string; combinations: Card[][] }> = []
    
    for (const opponent of input.opponents) {
      const rangeResult = parseRange(opponent.range)
      if (rangeResult.error) {
        return createMultiWayErrorResult(`Erro no range de ${opponent.name}: ${rangeResult.error}`, startTime)
      }

      const combinations = generateHandCombinations(rangeResult.hands)
      if (combinations.length === 0) {
        return createMultiWayErrorResult(`Range de ${opponent.name} não gerou combinações válidas`, startTime)
      }

      opponentRanges.push({
        name: opponent.name,
        combinations
      })
    }

    // Cartas usadas
    const usedCards = [...input.heroCards, ...(input.boardCards || [])]

    // Executar simulação
    const results: Record<string, { wins: number; ties: number }> = {
      hero: { wins: 0, ties: 0 }
    }

    for (const opponent of input.opponents) {
      results[opponent.name] = { wins: 0, ties: 0 }
    }

    let validIterations = 0

    for (let i = 0; i < iterations; i++) {
      const result = simulateMultiWayHand(
        input.heroCards,
        opponentRanges,
        input.boardCards || [],
        usedCards
      )

      if (result.length > 0) {
        validIterations++
        
        if (result.length === 1) {
          // Vencedor único
          results[result[0]].wins++
        } else {
          // Empate
          for (const winner of result) {
            results[winner].ties++
          }
        }
      }
    }

    if (validIterations === 0) {
      return createMultiWayErrorResult('Nenhuma simulação válida foi possível', startTime)
    }

    // Calcular equities
    const players: Record<string, { equity: number; wins: number; ties: number }> = {}
    
    for (const [playerName, stats] of Object.entries(results)) {
      const equity = (stats.wins + stats.ties * 0.5 / Math.max(1, stats.ties)) / validIterations * 100
      players[playerName] = {
        equity: Math.round(equity * 10) / 10,
        wins: stats.wins,
        ties: stats.ties
      }
    }

    return {
      players,
      totalIterations: validIterations,
      calculationTime: performance.now() - startTime
    }

  } catch (error) {
    return createMultiWayErrorResult(
      `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      startTime
    )
  }
}

/**
 * Simula uma única mão 1v1
 */
function simulateSingleHand(
  heroCards: Card[],
  villainCombinations: Card[][],
  boardCards: Card[],
  usedCards: Card[]
): 'hero' | 'villain' | 'tie' | null {
  
  // Escolher mão aleatória do villain
  const villainCards = villainCombinations[Math.floor(Math.random() * villainCombinations.length)]
  
  // Verificar conflito
  if (hasCardConflict(villainCards, usedCards)) {
    return null
  }

  // Completar board se necessário
  const fullBoard = completeBoard(boardCards, [...usedCards, ...villainCards])
  if (fullBoard.length !== 5) {
    return null
  }

  // Avaliar mãos
  const heroHand = evaluateHand([...heroCards, ...fullBoard])
  const villainHand = evaluateHand([...villainCards, ...fullBoard])

  // Comparar
  const comparison = compareHands(heroHand, villainHand)
  if (comparison > 0) return 'hero'
  if (comparison < 0) return 'villain'
  return 'tie'
}

/**
 * Simula uma mão multiway
 */
function simulateMultiWayHand(
  heroCards: Card[],
  opponentRanges: Array<{ name: string; combinations: Card[][] }>,
  boardCards: Card[],
  usedCards: Card[]
): string[] {
  
  const playerHands: Array<{ name: string; cards: Card[] }> = [
    { name: 'hero', cards: heroCards }
  ]

  const currentUsedCards = [...usedCards]

  // Escolher mãos para cada oponente
  for (const opponent of opponentRanges) {
    const availableCombinations = opponent.combinations.filter(combo => 
      !hasCardConflict(combo, currentUsedCards)
    )

    if (availableCombinations.length === 0) {
      return [] // Não foi possível atribuir mãos válidas
    }

    const chosenCards = availableCombinations[Math.floor(Math.random() * availableCombinations.length)]
    playerHands.push({ name: opponent.name, cards: chosenCards })
    currentUsedCards.push(...chosenCards)
  }

  // Completar board
  const fullBoard = completeBoard(boardCards, currentUsedCards)
  if (fullBoard.length !== 5) {
    return []
  }

  // Avaliar todas as mãos
  const evaluations = playerHands.map(player => ({
    name: player.name,
    evaluation: evaluateHand([...player.cards, ...fullBoard])
  }))

  // Encontrar vencedores
  const maxValue = Math.max(...evaluations.map(e => e.evaluation.value))
  return evaluations
    .filter(e => e.evaluation.value === maxValue)
    .map(e => e.name)
}

/**
 * Gera todas as combinações de cartas possíveis para um range
 */
function generateHandCombinations(hands: ParsedHand[]): Card[][] {
  const combinations: Card[][] = []

  for (const hand of hands) {
    if (hand.rank1 === hand.rank2) {
      // Pocket pair
      const suits = ['♠', '♥', '♦', '♣']
      for (let i = 0; i < suits.length; i++) {
        for (let j = i + 1; j < suits.length; j++) {
          combinations.push([
            { rank: hand.rank1, suit: suits[i] },
            { rank: hand.rank2, suit: suits[j] }
          ])
        }
      }
    } else if (hand.suited) {
      // Suited hand
      const suits = ['♠', '♥', '♦', '♣']
      for (const suit of suits) {
        combinations.push([
          { rank: hand.rank1, suit },
          { rank: hand.rank2, suit }
        ])
      }
    } else {
      // Offsuit hand
      const suits = ['♠', '♥', '♦', '♣']
      for (const suit1 of suits) {
        for (const suit2 of suits) {
          if (suit1 !== suit2) {
            combinations.push([
              { rank: hand.rank1, suit: suit1 },
              { rank: hand.rank2, suit: suit2 }
            ])
          }
        }
      }
    }
  }

  return combinations
}

/**
 * Verifica se há conflito entre cartas
 */
function hasCardConflict(cards1: Card[], cards2: Card[]): boolean {
  for (const card1 of cards1) {
    for (const card2 of cards2) {
      if (card1.rank === card2.rank && card1.suit === card2.suit) {
        return true
      }
    }
  }
  return false
}

/**
 * Completa o board com cartas aleatórias
 */
function completeBoard(currentBoard: Card[], usedCards: Card[]): Card[] {
  const board = [...currentBoard]
  const availableCards = FULL_DECK.filter(card => 
    !usedCards.some(used => used.rank === card.rank && used.suit === card.suit) &&
    !board.some(boardCard => boardCard.rank === card.rank && boardCard.suit === card.suit)
  )

  while (board.length < 5 && availableCards.length > 0) {
    const randomIndex = Math.floor(Math.random() * availableCards.length)
    const chosenCard = availableCards.splice(randomIndex, 1)[0]
    board.push(chosenCard)
  }

  return board
}

/**
 * Valida input da calculadora de equity
 */
function validateEquityInput(input: EquityCalculationInput): { error?: string } {
  if (!input.heroCards || input.heroCards.length !== 2) {
    return { error: 'Hero deve ter exatamente 2 cartas' }
  }

  if (!input.villainRange || input.villainRange.trim() === '') {
    return { error: 'Range do villain é obrigatório' }
  }

  if (input.boardCards && input.boardCards.length > 5) {
    return { error: 'Board não pode ter mais de 5 cartas' }
  }

  if (input.iterations && (input.iterations < 100 || input.iterations > 100000)) {
    return { error: 'Iterações devem estar entre 100 e 100,000' }
  }

  return {}
}

/**
 * Cria resultado de erro
 */
function createErrorResult(error: string, startTime: number): EquityResult {
  return {
    heroEquity: 0,
    villainEquity: 0,
    totalIterations: 0,
    heroWins: 0,
    villainWins: 0,
    ties: 0,
    calculationTime: performance.now() - startTime,
    error
  }
}

/**
 * Cria resultado de erro multiway
 */
function createMultiWayErrorResult(error: string, startTime: number): MultiWayEquityResult {
  return {
    players: {},
    totalIterations: 0,
    calculationTime: performance.now() - startTime,
    error
  }
}

/**
 * Converte string cards para Card objects (helper function)
 */
export function parseCardsForEquity(cardStrings: string[]): Card[] {
  return cardStrings.map(cardString => {
    if (cardString.length !== 2) {
      throw new Error(`Formato inválido: ${cardString}`)
    }
    
    return {
      rank: cardString[0],
      suit: cardString[1]
    }
  })
}

/**
 * Calcula Expected Value em dinheiro
 */
export function calculateExpectedValue(
  equity: number,
  potSize: number,
  investmentRequired: number
): number {
  const winnings = potSize * (equity / 100)
  return winnings - investmentRequired
}

/**
 * Benchmark da performance do sistema
 */
export function benchmarkEquityCalculation(): {
  iterationsPerSecond: number
  averageTimeMs: number
  testResults: EquityResult
} {
  const heroCards = parseCards(['A♠', 'K♠'])
  const input: EquityCalculationInput = {
    heroCards,
    villainRange: 'QQ+, AKs, AKo',
    iterations: 1000
  }

  const startTime = performance.now()
  const result = calculateEquity(input)
  const endTime = performance.now()

  const timeMs = endTime - startTime
  const iterationsPerSecond = Math.round(result.totalIterations / (timeMs / 1000))

  return {
    iterationsPerSecond,
    averageTimeMs: timeMs,
    testResults: result
  }
}