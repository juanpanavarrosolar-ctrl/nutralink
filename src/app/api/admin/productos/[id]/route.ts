import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

const updateSchema = z.object({
  nombre: z.string().min(2).optional(),
  descripcion: z.string().min(10).optional(),
  marca: z.string().min(2).optional(),
  categoria: z.enum(['VITAMINAS', 'MINERALES', 'PROTEINAS', 'OMEGA', 'PROBIOTICOS', 'OTRO']).optional(),
  precio_costo: z.number().int().positive().optional(),
  precio_venta: z.number().int().positive().optional(),
  stock: z.number().int().min(0).optional(),
  imagen_url: z.string().url().optional().nullable(),
  activo: z.boolean().optional(),
})

async function verificarAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const usuario = await prisma.usuario.findUnique({
    where: { email: user.email! },
    select: { rol: true, activo: true },
  })

  if (!usuario || !usuario.activo || usuario.rol !== 'ADMIN') return null
  return usuario
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verificarAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const producto = await prisma.producto.update({
    where: { id },
    data: parsed.data,
  })

  return NextResponse.json(producto)
}
