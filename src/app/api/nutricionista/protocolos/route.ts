import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

const itemSchema = z.object({
  productoId: z.string().uuid(),
  cantidad: z.number().int().positive(),
  instrucciones: z.string().min(1, 'Instrucciones requeridas'),
})

const protocoloSchema = z.object({
  nombre: z.string().min(3, 'Nombre requerido'),
  nombrePaciente: z.string().min(2, 'Nombre del paciente requerido'),
  emailPaciente: z.string().email().optional().or(z.literal('')),
  items: z.array(itemSchema).min(1, 'Agrega al menos un producto'),
})

async function getUsuario() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return prisma.usuario.findUnique({
    where: { email: user.email!, activo: true, rol: 'NUTRICIONISTA' },
    select: { id: true, nombre: true },
  })
}

export async function POST(request: NextRequest) {
  const usuario = await getUsuario()
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const parsed = protocoloSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { nombre, nombrePaciente, emailPaciente, items } = parsed.data

  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16)

  const protocolo = await prisma.protocolo.create({
    data: {
      nombre,
      nombre_paciente: nombrePaciente,
      email_paciente: emailPaciente || null,
      token,
      nutricionista_id: usuario.id,
      items: {
        create: items.map((item) => ({
          producto_id: item.productoId,
          cantidad: item.cantidad,
          instrucciones: item.instrucciones,
        })),
      },
    },
    include: { items: { include: { producto: true } } },
  })

  return NextResponse.json({ protocolo, token }, { status: 201 })
}

export async function GET() {
  const usuario = await getUsuario()
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const protocolos = await prisma.protocolo.findMany({
    where: { nutricionista_id: usuario.id },
    include: {
      items: { include: { producto: { select: { nombre: true } } } },
      ordenes: { select: { id: true } },
    },
    orderBy: { creado_en: 'desc' },
    take: 5,
  })

  return NextResponse.json(protocolos)
}
