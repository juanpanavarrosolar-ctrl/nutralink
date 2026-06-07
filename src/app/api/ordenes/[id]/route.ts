import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Props {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const { id } = await params

    const orden = await prisma.orden.findUnique({
      where: { id },
      select: {
        id: true,
        estado: true,
        total: true,
        nombre_paciente: true,
        email_paciente: true,
        direccion_despacho: true,
        es_recompra: true,
        creado_en: true,
        items: {
          select: {
            cantidad: true,
            precio_unitario: true,
            producto: { select: { nombre: true, marca: true } },
          },
        },
      },
    })

    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    return NextResponse.json(orden)
  } catch (error) {
    console.error('[GET /api/ordenes/[id]]', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
