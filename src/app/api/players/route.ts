import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Buscar todos os players ativos
export async function GET() {
  try {
    const players = await prisma.player.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(players)
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    )
  }
}

// POST - Criar novo player
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, nickname, initialNotes, type } = body

    // Validação básica
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nome é obrigatório (mínimo 2 caracteres)' },
        { status: 400 }
      )
    }

    // Verificar nome único
    const existingPlayer = await prisma.player.findFirst({
      where: {
        name: name.trim(),
        isActive: true
      }
    })

    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Já existe um jogador com este nome' },
        { status: 400 }
      )
    }

    // Criar player
    const player = await prisma.player.create({
      data: {
        name: name.trim(),
        nickname: nickname?.trim() || null,
        initialNotes: initialNotes?.trim() || null,
      }
    })

    // Se foi fornecido um tipo, criar pattern inicial
    if (type && ['TAG', 'LAG', 'Fish', 'Nit'].includes(type)) {
      await prisma.playerPattern.create({
        data: {
          playerId: player.id,
          patternType: 'player_type',
          patternValue: 1.0, // Just a marker
          confidenceScore: 50, // Initial confidence
          sampleSize: 0,
          isActive: true
        }
      })
    }

    return NextResponse.json(player, { status: 201 })
  } catch (error) {
    console.error('Error creating player:', error)
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar player
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, nickname, initialNotes } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se player existe
    const existingPlayer = await prisma.player.findUnique({
      where: { id }
    })

    if (!existingPlayer) {
      return NextResponse.json(
        { error: 'Jogador não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar player
    const updatedPlayer = await prisma.player.update({
      where: { id },
      data: {
        name: name?.trim() || existingPlayer.name,
        nickname: nickname?.trim() || existingPlayer.nickname,
        initialNotes: initialNotes?.trim() || existingPlayer.initialNotes,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedPlayer)
  } catch (error) {
    console.error('Error updating player:', error)
    return NextResponse.json(
      { error: 'Failed to update player' },
      { status: 500 }
    )
  }
}

// DELETE - Desativar player (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    // Soft delete - apenas desativar
    const player = await prisma.player.update({
      where: { id: parseInt(id) },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ message: 'Jogador desativado', player })
  } catch (error) {
    console.error('Error deactivating player:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate player' },
      { status: 500 }
    )
  }
}