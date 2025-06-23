import { NextRequest, NextResponse } from 'next/server'
import { analyzePokerSituation, validateAnalysisRequest, getUsageStats } from '@/lib/openai'

// POST - Analisar situação de poker
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar request
    if (!validateAnalysisRequest(body)) {
      return NextResponse.json(
        { error: 'Dados inválidos para análise' },
        { status: 400 }
      )
    }

    // Verificar campos obrigatórios
    if (!body.heroCards || !body.villainRange) {
      return NextResponse.json(
        { error: 'Cartas do herói e range do oponente são obrigatórios' },
        { status: 400 }
      )
    }

    // Realizar análise
    const analysis = await analyzePokerSituation(body)

    return NextResponse.json(analysis)

  } catch (error) {
    console.error('Error in analyze API:', error)
    
    // Fallback response para garantir que nunca quebre
    return NextResponse.json({
      recommendation: {
        action: 'FOLD',
        confidence: 50,
        reasoning: 'Erro na análise. Por favor, tente novamente.'
      },
      education: {
        concept: 'System Error',
        explanation: 'Sistema temporariamente indisponível.',
        practicalRule: 'Em caso de dúvida, jogue conservador.',
        commonMistake: 'Não tome decisões importantes sem análise adequada.'
      },
      playerAnalysis: {
        pattern: 'Análise indisponível',
        exploit: 'Use observação manual',
        confidence: 'Baixa'
      },
      timestamp: new Date().toISOString()
    })
  }
}

// GET - Status do sistema e estatísticas de uso
export async function GET() {
  try {
    const stats = getUsageStats()
    
    return NextResponse.json({
      status: 'operational',
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      usage: stats,
      endpoints: {
        analyze: '/api/analyze (POST)',
        status: '/api/analyze (GET)'
      }
    })
  } catch (error) {
    console.error('Error getting analyze status:', error)
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}