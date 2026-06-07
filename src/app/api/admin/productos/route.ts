import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { z } from 'zod'

const productoSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  descripcion: z.string().min(10, 'Descripción muy corta'),
  marca: z.string().min(2, 'Marca requerida'),
  categoria: z.enum(['VITAMINAS', 'MINERALES', 'PROTEINAS', 'OMEGA', 'PROBIOTICOS', 'OTRO']),
  precio_costo: z.number().int().positive('Precio costo debe ser positivo'),
  precio_venta: z.number().int().positive('Precio venta debe ser positivo'),
  stock: z.number().int().min(0, 'Stock no puede ser negativo'),
  imagen_url: z.string().url().optional().nullable(),
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

export async function GET() {
  const admin = await verificarAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const productos = await prisma.producto.findMany({
    orderBy: { creado_en: 'desc' },
  })

  return NextResponse.json(productos)
}

export async function POST(request: NextRequest) {
  const admin = await verificarAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const parsed = productoSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const producto = await prisma.producto.create({ data: parsed.data })
  return NextResponse.json(producto, { status: 201 })
}
