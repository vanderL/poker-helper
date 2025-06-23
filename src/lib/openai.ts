import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Types for poker analysis
export interface AnalysisRequest {
  heroCards: string // "AKs", "QQ", etc
  villainRange: string // "QQ+, AKs"
  playerProfile: {
    name: string
    type: 'TAG' | 'LAG' | 'Fish' | 'Nit'
    notes?: string
  }
  position?: string
  action?: string
  boardCards?: string
  potSize?: number
  context?: string
}

export interface AnalysisResponse {
  recommendation: {
    action: 'FOLD' | 'CALL' | 'RAISE' | 'ALL-IN'
    confidence: number // 0-100
    reasoning: string
  }
  education: {
    concept: string
    explanation: string
    practicalRule: string
    commonMistake: string
  }
  playerAnalysis: {
    pattern: string
    exploit: string
    confidence: string
  }
  timestamp: string
}

// Educational system prompt
const SYSTEM_PROMPT = `Você é um coach de poker EDUCATIVO e experiente.

OBJETIVO: Ensinar conceitos fundamentais para que o usuário melhore a longo prazo.

PERSONALIDADE:
- Professor paciente que explica o "porquê"
- Conecta decisões individuais com conceitos maiores
- Linguagem clara e prática em português brasileiro
- Celebra progresso e identifica padrões de melhoria

FOCO PRINCIPAL:
- Mathematical foundation + Psychological exploitation
- Ensine WHY, não apenas WHAT
- Conecte situações específicas com conceitos amplos
- Construa intuição do usuário ao longo do tempo

FORMATO DE RESPOSTA OBRIGATÓRIO: JSON estruturado
{
  "recommendation": {
    "action": "FOLD|CALL|RAISE|ALL-IN",
    "confidence": 85,
    "reasoning": "Explicação clara da decisão"
  },
  "education": {
    "concept": "Nome do conceito principal",
    "explanation": "Explicação didática do conceito",
    "practicalRule": "Regra prática aplicável",
    "commonMistake": "Erro comum que jogadores cometem"
  },
  "playerAnalysis": {
    "pattern": "Padrão observado do oponente",
    "exploit": "Como explorar este padrão",
    "confidence": "Nível de confiança na análise"
  }
}

PRINCÍPIOS:
1. Sempre ensine um conceito aplicável
2. Conecte matemática com psicologia
3. Dê regras práticas para usar no jogo
4. Identifique erros comuns para evitar
5. Mantenha linguagem acessível mas precisa`

// Rate limiting cache
const requestCache = new Map<string, { response: AnalysisResponse; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const DAILY_LIMIT = 100

// Cache key generator
function getCacheKey(request: AnalysisRequest): string {
  return `${request.heroCards}-${request.villainRange}-${request.playerProfile.type}-${request.action || 'preflop'}`
}

// Check daily usage (simplified - in production use Redis)
let dailyRequestCount = 0
let lastResetDate = new Date().toDateString()

function checkRateLimit(): boolean {
  const today = new Date().toDateString()
  if (today !== lastResetDate) {
    dailyRequestCount = 0
    lastResetDate = today
  }
  
  if (dailyRequestCount >= DAILY_LIMIT) {
    return false
  }
  
  dailyRequestCount++
  return true
}

// Build context for AI
function buildContext(request: AnalysisRequest): string {
  const context = `
SITUAÇÃO ATUAL:
- Minhas cartas: ${request.heroCards}
- Range do oponente: ${request.villainRange}
- Board: ${request.boardCards || 'Pré-flop'}
- Posição: ${request.position || 'Não especificada'}
- Ação do oponente: ${request.action || 'Sem ação específica'}

PERFIL DO JOGADOR (${request.playerProfile.name}):
- Tipo: ${request.playerProfile.type}
- Notas pessoais: ${request.playerProfile.notes || 'Nenhuma nota disponível'}

CONTEXTO FINANCEIRO:
- Pot size: R$ ${request.potSize || 'Não especificado'}

${request.context || ''}

Analise esta situação e ensine o conceito mais importante aplicável aqui.
Foque em educação prática que posso usar em futuras decisões similares.`

  return context
}

// Fallback analysis for when OpenAI is unavailable
function getFallbackAnalysis(request: AnalysisRequest): AnalysisResponse {
  const isStrongHand = ['AA', 'KK', 'QQ', 'AKs', 'AKo'].some(hand => 
    request.heroCards.includes(hand.substring(0, 2))
  )
  
  return {
    recommendation: {
      action: isStrongHand ? 'RAISE' : 'FOLD',
      confidence: 75,
      reasoning: 'Análise básica baseada na força das cartas. Sistema OpenAI temporariamente indisponível.'
    },
    education: {
      concept: 'Hand Strength vs Range',
      explanation: 'A força das suas cartas deve ser avaliada relativamente ao range do oponente, não em absoluto.',
      practicalRule: 'Cartas premium (AA, KK, QQ, AK) geralmente merecem ação agressiva.',
      commonMistake: 'Supervalorizar cartas médias contra ranges tight.'
    },
    playerAnalysis: {
      pattern: `Jogador ${request.playerProfile.type} com tendências típicas do tipo`,
      exploit: 'Use ranges padrão até coletar mais dados específicos',
      confidence: 'Baixa - análise genérica'
    },
    timestamp: new Date().toISOString()
  }
}

// Main analysis function
export async function analyzePokerSituation(request: AnalysisRequest): Promise<AnalysisResponse> {
  try {
    // Check rate limiting
    if (!checkRateLimit()) {
      throw new Error('Daily API limit exceeded')
    }

    // Check cache first
    const cacheKey = getCacheKey(request)
    const cached = requestCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.response
    }

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, using fallback analysis')
      return getFallbackAnalysis(request)
    }

    // Build context and make request
    const context = buildContext(request)
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: context }
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: 'json_object' }
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('Empty response from OpenAI')
    }

    // Parse and validate response
    let analysis: AnalysisResponse
    try {
      const parsed = JSON.parse(responseText)
      analysis = {
        recommendation: parsed.recommendation,
        education: parsed.education,
        playerAnalysis: parsed.playerAnalysis,
        timestamp: new Date().toISOString()
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      return getFallbackAnalysis(request)
    }

    // Cache the response
    requestCache.set(cacheKey, { response: analysis, timestamp: Date.now() })

    return analysis

  } catch (error) {
    console.error('Error in analyzePokerSituation:', error)
    
    // Return fallback analysis on any error
    return getFallbackAnalysis(request)
  }
}

// Utility function to validate request
export function validateAnalysisRequest(request: unknown): request is AnalysisRequest {
  // Primeiro, verificar se é um objeto
  if (typeof request !== 'object' || request === null) {
    return false
  }

  // Cast para object para poder acessar propriedades
  const req = request as Record<string, unknown>

  // Verificar se heroCards existe e é string
  if (typeof req.heroCards !== 'string') {
    return false
  }

  // Verificar se villainRange existe e é string  
  if (typeof req.villainRange !== 'string') {
    return false
  }

  // Verificar se playerProfile existe e é objeto
  if (typeof req.playerProfile !== 'object' || req.playerProfile === null) {
    return false
  }

  // Cast playerProfile para poder acessar suas propriedades
  const profile = req.playerProfile as Record<string, unknown>

  // Verificar se name do player existe e é string
  if (typeof profile.name !== 'string') {
    return false
  }

  // Verificar se type é um dos valores válidos
  if (!['TAG', 'LAG', 'Fish', 'Nit'].includes(profile.type as string)) {
    return false
  }

  return true
}

// Export for usage monitoring
export function getUsageStats() {
  return {
    dailyRequestCount,
    remainingRequests: Math.max(0, DAILY_LIMIT - dailyRequestCount),
    cacheSize: requestCache.size,
    lastResetDate
  }
}