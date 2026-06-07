import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase'

async function verificarNutricionista() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return prisma.usuario.findUnique({
    where: { email: user.email!, activo: true, rol: 'NUTRICIONISTA' },
    select: { id: true, nombre: true },
  })
}

export async function GET() {
  const nutri = await verificarNutricionista()
  if (!nutri) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const productos = await prisma.producto.findMany({
    where: { activo: true, stock: { gt: 0 } },
    select: {
      id: true,
      nombre: true,
      marca: true,
      categoria: true,
      precio_venta: true,
      imagen_url: true,
    },
    orderBy: { nombre: 'asc' },
  })

  return NextResponse.json(productos)
}
