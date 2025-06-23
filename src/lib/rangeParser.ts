export interface ParsedHand {
  rank1: string
  rank2: string
  suited: boolean
}

export interface RangeResult {
  hands: ParsedHand[]
  totalCombos: number
  error?: string
}

// Ordem dos ranks do mais forte para o mais fraco
const RANK_ORDER = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']
const RANK_VALUES: Record<string, number> = {
  'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10,
  '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
}

/**
 * Converte notação de range para array de mãos específicas
 * Suporta: QQ+, AKs, AKo, AKs-ATs, 99-77, etc.
 */
export function parseRange(rangeString: string): RangeResult {
  try {
    if (!rangeString || rangeString.trim() === '') {
      return { hands: [], totalCombos: 0, error: 'Range vazio' }
    }

    const hands: ParsedHand[] = []
    const ranges = rangeString.split(',').map(r => r.trim())

    for (const range of ranges) {
      if (!range) continue

      const rangeHands = parseIndividualRange(range)
      if (rangeHands.error) {
        return { hands: [], totalCombos: 0, error: rangeHands.error }
      }
      hands.push(...rangeHands.hands)
    }

    // Remover duplicatas
    const uniqueHands = removeDuplicateHands(hands)
    const totalCombos = calculateCombinations(uniqueHands)

    return {
      hands: uniqueHands,
      totalCombos,
    }
  } catch (error) {
    return {
      hands: [],
      totalCombos: 0,
      error: `Erro ao parsear range: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }
  }
}

/**
 * Parse individual range component (QQ+, AKs, AKs-ATs, etc.)
 */
function parseIndividualRange(range: string): RangeResult {
  // Pocket pairs with + (QQ+, 99+)
  if (/^([AKQJT98765432])\1\+$/.test(range)) {
    return parsePocketPairsPlus(range)
  }

  // Pocket pair range (QQ-99, AA-JJ)
  if (/^([AKQJT98765432])\1-([AKQJT98765432])\2$/.test(range)) {
    return parsePocketPairRange(range)
  }

  // Single pocket pair (QQ, AA)
  if (/^([AKQJT98765432])\1$/.test(range)) {
    const rank = range[0]
    return {
      hands: [{ rank1: rank, rank2: rank, suited: false }],
      totalCombos: 6 // 6 combinations for any pocket pair
    }
  }

  // Suited hands with + (AKs+, ATs+)
  if (/^([AKQJT98765432])([AKQJT98765432])s\+$/.test(range)) {
    return parseSuitedHandsPlus(range)
  }

  // Offsuit hands with + (AKo+, ATo+)
  if (/^([AKQJT98765432])([AKQJT98765432])o\+$/.test(range)) {
    return parseOffsuitHandsPlus(range)
  }

  // Suited range (AKs-ATs, KQs-K9s)
  if (/^([AKQJT98765432])([AKQJT98765432])s-([AKQJT98765432])([AKQJT98765432])s$/.test(range)) {
    return parseSuitedRange(range)
  }

  // Offsuit range (AKo-ATo, KQo-K9o)
  if (/^([AKQJT98765432])([AKQJT98765432])o-([AKQJT98765432])([AKQJT98765432])o$/.test(range)) {
    return parseOffsuitRange(range)
  }

  // Single suited hand (AKs, QJs)
  if (/^([AKQJT98765432])([AKQJT98765432])s$/.test(range)) {
    const rank1 = range[0]
    const rank2 = range[1]
    if (rank1 === rank2) {
      return { hands: [], totalCombos: 0, error: `Pocket pair não pode ser suited: ${range}` }
    }
    return {
      hands: [{ rank1, rank2, suited: true }],
      totalCombos: 4 // 4 suited combinations
    }
  }

  // Single offsuit hand (AKo, QJo)
  if (/^([AKQJT98765432])([AKQJT98765432])o$/.test(range)) {
    const rank1 = range[0]
    const rank2 = range[1]
    if (rank1 === rank2) {
      return { hands: [], totalCombos: 0, error: `Pocket pair não pode ser offsuit: ${range}` }
    }
    return {
      hands: [{ rank1, rank2, suited: false }],
      totalCombos: 12 // 12 offsuit combinations
    }
  }

  // Generic two-card hand (AK, QJ) - includes both suited and offsuit
  if (/^([AKQJT98765432])([AKQJT98765432])$/.test(range)) {
    const rank1 = range[0]
    const rank2 = range[1]
    if (rank1 === rank2) {
      // It's a pocket pair
      return {
        hands: [{ rank1, rank2, suited: false }],
        totalCombos: 6
      }
    }
    // Both suited and offsuit
    return {
      hands: [
        { rank1, rank2, suited: true },
        { rank1, rank2, suited: false }
      ],
      totalCombos: 16 // 4 suited + 12 offsuit
    }
  }

  return { hands: [], totalCombos: 0, error: `Formato de range inválido: ${range}` }
}

/**
 * Parse pocket pairs with + (QQ+, 99+)
 */
function parsePocketPairsPlus(range: string): RangeResult {
  const rank = range[0]
  const startValue = RANK_VALUES[rank]
  const hands: ParsedHand[] = []

  for (const checkRank of RANK_ORDER) {
    if (RANK_VALUES[checkRank] >= startValue) {
      hands.push({ rank1: checkRank, rank2: checkRank, suited: false })
    }
  }

  return {
    hands,
    totalCombos: hands.length * 6
  }
}

/**
 * Parse pocket pair range (QQ-99)
 */
function parsePocketPairRange(range: string): RangeResult {
  const [startPair, endPair] = range.split('-')
  const startRank = startPair[0]
  const endRank = endPair[0]
  const startValue = RANK_VALUES[startRank]
  const endValue = RANK_VALUES[endRank]

  if (startValue < endValue) {
    return { hands: [], totalCombos: 0, error: `Range inválido: ${range} (ordem incorreta)` }
  }

  const hands: ParsedHand[] = []
  for (const rank of RANK_ORDER) {
    const rankValue = RANK_VALUES[rank]
    if (rankValue <= startValue && rankValue >= endValue) {
      hands.push({ rank1: rank, rank2: rank, suited: false })
    }
  }

  return {
    hands,
    totalCombos: hands.length * 6
  }
}

/**
 * Parse suited hands with + (AKs+)
 */
function parseSuitedHandsPlus(range: string): RangeResult {
  const baseHand = range.slice(0, -2) // Remove 's+'
  const rank1 = baseHand[0]
  const rank2 = baseHand[1]
  const rank1Value = RANK_VALUES[rank1]
  const rank2Value = RANK_VALUES[rank2]

  if (rank1Value <= rank2Value) {
    return { hands: [], totalCombos: 0, error: `Range suited+ inválido: ${range}` }
  }

  const hands: ParsedHand[] = []
  for (const checkRank of RANK_ORDER) {
    const checkValue = RANK_VALUES[checkRank]
    if (checkValue <= rank1Value && checkValue >= rank2Value) {
      hands.push({ rank1, rank2: checkRank, suited: true })
    }
  }

  return {
    hands,
    totalCombos: hands.length * 4
  }
}

/**
 * Parse offsuit hands with + (AKo+)
 */
function parseOffsuitHandsPlus(range: string): RangeResult {
  const baseHand = range.slice(0, -2) // Remove 'o+'
  const rank1 = baseHand[0]
  const rank2 = baseHand[1]
  const rank1Value = RANK_VALUES[rank1]
  const rank2Value = RANK_VALUES[rank2]

  if (rank1Value <= rank2Value) {
    return { hands: [], totalCombos: 0, error: `Range offsuit+ inválido: ${range}` }
  }

  const hands: ParsedHand[] = []
  for (const checkRank of RANK_ORDER) {
    const checkValue = RANK_VALUES[checkRank]
    if (checkValue <= rank1Value && checkValue >= rank2Value) {
      hands.push({ rank1, rank2: checkRank, suited: false })
    }
  }

  return {
    hands,
    totalCombos: hands.length * 12
  }
}

/**
 * Parse suited range (AKs-ATs)
 */
function parseSuitedRange(range: string): RangeResult {
  const [startHand, endHand] = range.split('-')
  const rank1 = startHand[0]
  const startRank2 = startHand[1]
  const endRank2 = endHand[1]
  const startValue = RANK_VALUES[startRank2]
  const endValue = RANK_VALUES[endRank2]

  if (startValue < endValue) {
    return { hands: [], totalCombos: 0, error: `Range suited inválido: ${range}` }
  }

  const hands: ParsedHand[] = []
  for (const checkRank of RANK_ORDER) {
    const checkValue = RANK_VALUES[checkRank]
    if (checkValue <= startValue && checkValue >= endValue) {
      hands.push({ rank1, rank2: checkRank, suited: true })
    }
  }

  return {
    hands,
    totalCombos: hands.length * 4
  }
}

/**
 * Parse offsuit range (AKo-ATo)
 */
function parseOffsuitRange(range: string): RangeResult {
  const [startHand, endHand] = range.split('-')
  const rank1 = startHand[0]
  const startRank2 = startHand[1]
  const endRank2 = endHand[1]
  const startValue = RANK_VALUES[startRank2]
  const endValue = RANK_VALUES[endRank2]

  if (startValue < endValue) {
    return { hands: [], totalCombos: 0, error: `Range offsuit inválido: ${range}` }
  }

  const hands: ParsedHand[] = []
  for (const checkRank of RANK_ORDER) {
    const checkValue = RANK_VALUES[checkRank]
    if (checkValue <= startValue && checkValue >= endValue) {
      hands.push({ rank1, rank2: checkRank, suited: false })
    }
  }

  return {
    hands,
    totalCombos: hands.length * 12
  }
}

/**
 * Remove mãos duplicadas do array
 */
function removeDuplicateHands(hands: ParsedHand[]): ParsedHand[] {
  const seen = new Set<string>()
  return hands.filter(hand => {
    const key = `${hand.rank1}${hand.rank2}${hand.suited ? 's' : 'o'}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Calcula número total de combinações
 */
function calculateCombinations(hands: ParsedHand[]): number {
  return hands.reduce((total, hand) => {
    if (hand.rank1 === hand.rank2) {
      // Pocket pair: 6 combinations
      return total + 6
    } else if (hand.suited) {
      // Suited: 4 combinations
      return total + 4
    } else {
      // Offsuit: 12 combinations
      return total + 12
    }
  }, 0)
}

/**
 * Validate range syntax before parsing
 */
export function validateRangeSyntax(rangeString: string): { valid: boolean; error?: string } {
  if (!rangeString || rangeString.trim() === '') {
    return { valid: false, error: 'Range não pode estar vazio' }
  }

  // Check for valid characters
  const validChars = /^[AKQJT98765432sos\+\-,\s]+$/
  if (!validChars.test(rangeString)) {
    return { valid: false, error: 'Range contém caracteres inválidos' }
  }

  // Try to parse and check for errors
  const result = parseRange(rangeString)
  if (result.error) {
    return { valid: false, error: result.error }
  }

  return { valid: true }
}

/**
 * Get example ranges for UI help
 */
export function getExampleRanges(): Record<string, string> {
  return {
    'Premium': 'QQ+, AKs, AKo',
    'TAG': '88+, ATs+, AJo+, KQs',
    'LAG': '22+, A2s+, A9o+, K5s+, Q9s+',
    'Fish': '22+, A2s+, A2o+, K2s+, Q2s+, J7s+',
    'Nit': 'QQ+, AKs, AKo',
    'Tight': 'TT+, AQs+, AKo',
    'Loose': '22+, A2s+, A7o+, K7s+, Q8s+, J9s+, T9s'
  }
}