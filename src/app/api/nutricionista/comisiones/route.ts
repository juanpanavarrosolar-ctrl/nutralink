import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Verificar sesión
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const nutricionista = await prisma.usuario.findUnique({
      where: { email: user.email, activo: true },
      select: { id: true, rol: true },
    })

    if (!nutricionista || nutricionista.rol !== 'NUTRICIONISTA') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const comisiones = await prisma.comision.findMany({
      where: { nutricionista_id: nutricionista.id },
      orderBy: { creado_en: 'desc' },
      select: {
        id: true,
        monto: true,
        porcentaje: true,
        estado: true,
        creado_en: true,
        orden: {
          select: {
            id: true,
            total: true,
            nombre_paciente: true,
            estado: true,
            creado_en: true,
          },
        },
      },
    })

    // Agrupar por mes (YYYY-MM)
    const porMes: Record<
      string,
      { mes: string; pendiente: number; pagada: number; items: typeof comisiones }
    > = {}

    for (const c of comisiones) {
      const clave = c.creado_en.toISOString().slice(0, 7) // "2025-06"
      if (!porMes[clave]) {
        porMes[clave] = { mes: clave, pendiente: 0, pagada: 0, items: [] }
      }
      porMes[clave].items.push(c)
      if (c.estado === 'PENDIENTE') porMes[clave].pendiente += c.monto
      else porMes[clave].pagada += c.monto
    }

    const meses = Object.values(porMes).sort((a, b) => b.mes.localeCompare(a.mes))

    const totalPendiente = comisiones
      .filter((c) => c.estado === 'PENDIENTE')
      .reduce((sum, c) => sum + c.monto, 0)

    const totalPagado = comisiones
      .filter((c) => c.estado === 'PAGADA')
      .reduce((sum, c) => sum + c.monto, 0)

    return NextResponse.json({ totalPendiente, totalPagado, meses })
  } catch (error) {
    console.error('[GET /api/nutricionista/comisiones]', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
