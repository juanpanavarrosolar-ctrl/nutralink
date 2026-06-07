import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { email } = await request.json()

  if (user.email !== email) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email },
    select: { rol: true, activo: true, nombre: true },
  })

  if (!usuario || !usuario.activo) {
    return NextResponse.json({ error: 'Usuario no autorizado' }, { status: 403 })
  }

  return NextResponse.json({ rol: usuario.rol, nombre: usuario.nombre })
}
