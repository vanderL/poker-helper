export interface Card {
  rank: string
  suit: string
  display: string
}

export interface Player {
  id: number
  name: string
  nickname?: string
  type?: 'TAG' | 'LAG' | 'Fish' | 'Nit'
  notes?: string
  initialNotes?: string
}

export type PlayerType = 'TAG' | 'LAG' | 'Fish' | 'Nit'

export type HandResult = 'won' | 'lost' | 'chopped'

export type OpponentAction = 'fold' | 'call' | 'raise' | 'all-in'

export interface AnalysisRequest {
  heroCards: string
  villainRange: string
  playerProfile: {
    name: string
    type: PlayerType
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
    confidence: number
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