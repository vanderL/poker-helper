import { NextRequest, NextResponse } from 'next/server'
import { calculateEquity, calculateMultiWayEquity, calculateExpectedValue, benchmarkEquityCalculation, parseCardsForEquity } from '@/lib/equity'
import { validateRangeSyntax } from '@/lib/rangeParser'

// Interface para request de equity 1v1
interface EquityRequest {
  heroCards: string[] // ["A♠", "K♠"] ou ["As", "Ks"]
  villainRange: string // "QQ+, AKs, AKo"
  boardCards?: string[] // ["A♥", "K♦", "Q♠"]
  iterations?: number
  potSize?: number // Para calcular EV
  investmentRequired?: number // Para calcular EV
}

// Interface para request multiway
interface MultiWayEquityRequest {
  heroCards: string[]
  opponents: Array<{
    name: string
    range: string
  }>
  boardCards?: string[]
  iterations?: number
  potSize?: number
}

// POST - Calcular equity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Determinar tipo de cálculo baseado na presença de 'opponents'
    if (body.opponents && body.opponents.length > 0) {
      return await calculateMultiWayEquityEndpoint(body)
    } else {
      return await calculateSingleEquityEndpoint(body)
    }

  } catch (error) {
    console.error('Error in equity API:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

// GET - Status do sistema e benchmark
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'benchmark') {
      const benchmark = benchmarkEquityCalculation()
      return NextResponse.json({
        status: 'operational',
        benchmark: {
          iterationsPerSecond: benchmark.iterationsPerSecond,
          averageTimeMs: Math.round(benchmark.averageTimeMs * 100) / 100,
          testEquity: benchmark.testResults.heroEquity,
          performance: benchmark.iterationsPerSecond > 1000 ? 'excellent' : 
                      benchmark.iterationsPerSecond > 500 ? 'good' : 'needs_optimization'
        }
      })
    }

    return NextResponse.json({
      status: 'operational',
      endpoints: {
        equity: '/api/equity (POST)',
        multiway: '/api/equity (POST with opponents array)',
        benchmark: '/api/equity?action=benchmark (GET)',
        status: '/api/equity (GET)'
      },
      features: [
        'Monte Carlo simulation (10,000+ iterations)',
        'Range parsing (QQ+, AKs-ATs, etc.)',
        'Multi-way equity calculation',
        'Expected Value calculation',
        'Performance benchmarking'
      ]
    })
  } catch (error) {
    console.error('Error in equity status:', error)
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}

/**
 * Calcula equity 1v1
 */
async function calculateSingleEquityEndpoint(body: EquityRequest) {
  // Validação do input
  const validation = validateEquityRequest(body)
  if (validation.error) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    )
  }

  try {
    // Parse das cartas
    const heroCards = parseCardsForEquity(body.heroCards)
    const boardCards = body.boardCards ? parseCardsForEquity(body.boardCards) : undefined

    // Cálculo da equity
    const result = calculateEquity({
      heroCards,
      villainRange: body.villainRange,
      boardCards,
      iterations: body.iterations || 10000
    })

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Calcular EV se valores fornecidos
    let expectedValue
    if (body.potSize && body.investmentRequired !== undefined) {
      expectedValue = {
        hero: calculateExpectedValue(result.heroEquity, body.potSize, body.investmentRequired),
        villain: calculateExpectedValue(result.villainEquity, body.potSize, body.investmentRequired)
      }
    }

    return NextResponse.json({
      type: '1v1',
      equity: {
        hero: result.heroEquity,
        villain: result.villainEquity
      },
      details: {
        heroWins: result.heroWins,
        villainWins: result.villainWins,
        ties: result.ties,
        totalIterations: result.totalIterations,
        calculationTime: Math.round(result.calculationTime * 100) / 100
      },
      expectedValue,
      performance: {
        iterationsPerSecond: Math.round(result.totalIterations / (result.calculationTime / 1000)),
        fast: result.calculationTime < 1000
      }
    })

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erro no cálculo de equity',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

/**
 * Calcula equity multiway
 */
async function calculateMultiWayEquityEndpoint(body: MultiWayEquityRequest) {
  // Validação do input
  const validation = validateMultiWayRequest(body)
  if (validation.error) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    )
  }

  try {
    // Parse das cartas
    const heroCards = parseCardsForEquity(body.heroCards)
    const boardCards = body.boardCards ? parseCardsForEquity(body.boardCards) : undefined

    // Validar ranges dos oponentes
    for (const opponent of body.opponents) {
      const rangeValidation = validateRangeSyntax(opponent.range)
      if (!rangeValidation.valid) {
        return NextResponse.json(
          { error: `Range inválido para ${opponent.name}: ${rangeValidation.error}` },
          { status: 400 }
        )
      }
    }

    // Cálculo da equity
    const result = calculateMultiWayEquity({
      heroCards,
      opponents: body.opponents,
      boardCards,
      iterations: body.iterations || 10000
    })

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Calcular EV se pot size fornecido
    let expectedValues: Record<string, number> | undefined
    if (body.potSize) {
      expectedValues = {}
      for (const [playerName, stats] of Object.entries(result.players)) {
        expectedValues[playerName] = stats.equity * body.potSize / 100
      }
    }

    return NextResponse.json({
      type: 'multiway',
      players: result.players,
      details: {
        totalIterations: result.totalIterations,
        calculationTime: Math.round(result.calculationTime * 100) / 100,
        playerCount: Object.keys(result.players).length
      },
      expectedValues,
      performance: {
        iterationsPerSecond: Math.round(result.totalIterations / (result.calculationTime / 1000)),
        fast: result.calculationTime < 2000
      }
    })

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erro no cálculo multiway',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

/**
 * Valida request de equity 1v1
 */
function validateEquityRequest(body: EquityRequest): { error?: string } {
  if (!body.heroCards || !Array.isArray(body.heroCards) || body.heroCards.length !== 2) {
    return { error: 'heroCards deve ser um array com exatamente 2 cartas' }
  }

  if (!body.villainRange || typeof body.villainRange !== 'string' || body.villainRange.trim() === '') {
    return { error: 'villainRange é obrigatório e deve ser uma string não vazia' }
  }

  if (body.boardCards && (!Array.isArray(body.boardCards) || body.boardCards.length > 5)) {
    return { error: 'boardCards deve ser um array com no máximo 5 cartas' }
  }

  if (body.iterations && (typeof body.iterations !== 'number' || body.iterations < 100 || body.iterations > 100000)) {
    return { error: 'iterations deve ser um número entre 100 e 100,000' }
  }

  if (body.potSize && (typeof body.potSize !== 'number' || body.potSize <= 0)) {
    return { error: 'potSize deve ser um número positivo' }
  }

  if (body.investmentRequired !== undefined && (typeof body.investmentRequired !== 'number' || body.investmentRequired < 0)) {
    return { error: 'investmentRequired deve ser um número não negativo' }
  }

  // Validar formato das cartas
  const allCards = [...body.heroCards, ...(body.boardCards || [])]
  for (const card of allCards) {
    if (typeof card !== 'string' || card.length !== 2) {
      return { error: `Formato de carta inválido: ${card}. Use formato como "A♠" ou "As"` }
    }

    const rank = card[0]
    const suit = card[1]
    
    if (!'23456789TJQKA'.includes(rank)) {
      return { error: `Rank inválido: ${rank}` }
    }

    if (!'♠♥♦♣shdc'.includes(suit)) {
      return { error: `Suit inválido: ${suit}` }
    }
  }

  // Verificar cartas duplicadas
  const cardSet = new Set(allCards.map(card => card[0] + (card[1] === 's' ? '♠' : card[1] === 'h' ? '♥' : card[1] === 'd' ? '♦' : card[1] === 'c' ? '♣' : card[1])))
  if (cardSet.size !== allCards.length) {
    return { error: 'Cartas duplicadas detectadas' }
  }

  // Validar sintaxe do range
  const rangeValidation = validateRangeSyntax(body.villainRange)
  if (!rangeValidation.valid) {
    return { error: `Range inválido: ${rangeValidation.error}` }
  }

  return {}
}

/**
 * Valida request multiway
 */
function validateMultiWayRequest(body: MultiWayEquityRequest): { error?: string } {
  if (!body.heroCards || !Array.isArray(body.heroCards) || body.heroCards.length !== 2) {
    return { error: 'heroCards deve ser um array com exatamente 2 cartas' }
  }

  if (!body.opponents || !Array.isArray(body.opponents) || body.opponents.length === 0) {
    return { error: 'opponents deve ser um array não vazio' }
  }

  if (body.opponents.length > 8) {
    return { error: 'Máximo 8 oponentes suportados' }
  }

  // Validar cada oponente
  for (const opponent of body.opponents) {
    if (!opponent.name || typeof opponent.name !== 'string' || opponent.name.trim() === '') {
      return { error: 'Cada oponente deve ter um nome válido' }
    }

    if (!opponent.range || typeof opponent.range !== 'string' || opponent.range.trim() === '') {
      return { error: `Oponente ${opponent.name} deve ter um range válido` }
    }
  }

  // Verificar nomes únicos
  const names = body.opponents.map(o => o.name.toLowerCase())
  if (new Set(names).size !== names.length) {
    return { error: 'Nomes dos oponentes devem ser únicos' }
  }

  // Validações similares ao 1v1 para cartas e iterações
  const singleValidation = validateEquityRequest({
    heroCards: body.heroCards,
    villainRange: 'AA', // dummy range para validação básica
    boardCards: body.boardCards,
    iterations: body.iterations
  })

  if (singleValidation.error && !singleValidation.error.includes('Range inválido')) {
    return singleValidation
  }

  return {}
}