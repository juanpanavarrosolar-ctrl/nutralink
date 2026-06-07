/**
 * Webhook de confirmación de pago de Flow (Chile)
 *
 * CONFIGURACIÓN EN EL PANEL DE FLOW:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Inicia sesión en https://sandbox.flow.cl (sandbox) o https://www.flow.cl (producción).
 * 2. Ve a: Configuración → Datos de tu cuenta → URL de confirmación (urlConfirmation).
 * 3. Ingresa: https://tudominio.cl/api/flow/webhook
 * 4. Flow llamará a esta URL con POST cuando un pago se procese (exitoso, fallido o anulado).
 *
 * VERIFICACIÓN DE FIRMA (recomendado en producción):
 * Flow firma el payload con HMAC-SHA256 usando tu SECRET_KEY.
 * Para verificar: calcular hmac_sha256(secretKey, concatenación de parámetros ordenados alfabéticamente).
 * Habilitar la verificación descomentando el bloque "Verificar firma" abajo.
 *
 * ESTADOS DE FLOW (campo `status`):
 *   1 = Pendiente       → no hacer nada todavía
 *   2 = Pagado          → marcar orden como PAGADA
 *   3 = Rechazado       → marcar orden como CANCELADA
 *   4 = Anulado         → marcar orden como CANCELADA
 *
 * Flow siempre espera HTTP 200 como confirmación de recepción.
 * Si responde con otro código, reintentará el webhook hasta 3 veces.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mapa de estado Flow → EstadoOrden de NutriLink
const FLOW_STATUS_MAP: Record<number, 'PENDIENTE' | 'PAGADA' | 'CANCELADA'> = {
  1: 'PENDIENTE',
  2: 'PAGADA',
  3: 'CANCELADA',
  4: 'CANCELADA',
}

export async function POST(request: NextRequest) {
  try {
    // Flow envía el payload como application/x-www-form-urlencoded
    const formData = await request.formData()
    const token = formData.get('token')?.toString()
    const statusRaw = formData.get('status')?.toString()

    if (!token || !statusRaw) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    const flowStatus = parseInt(statusRaw, 10)
    const nuevoEstado = FLOW_STATUS_MAP[flowStatus]

    if (!nuevoEstado) {
      // Estado desconocido — acusar recibo sin cambios
      return NextResponse.json({ ok: true })
    }

    // Buscar la orden por el flow_token guardado al iniciar el pago
    const orden = await prisma.orden.findFirst({
      where: { flow_token: token },
      select: { id: true, estado: true },
    })

    if (!orden) {
      // No encontrada — igual responder 200 para que Flow no reintente
      console.warn('[flow/webhook] Orden no encontrada para token:', token)
      return NextResponse.json({ ok: true })
    }

    // Evitar regresiones de estado (ej: PAGADA → PENDIENTE)
    if (orden.estado === nuevoEstado) {
      return NextResponse.json({ ok: true })
    }

    await prisma.$transaction(async (tx) => {
      await tx.orden.update({
        where: { id: orden.id },
        data: { estado: nuevoEstado },
      })

      if (nuevoEstado === 'CANCELADA') {
        // Conservar la comisión en PENDIENTE; el admin decide si eliminar
        await tx.comision.updateMany({
          where: { orden_id: orden.id, estado: 'PENDIENTE' },
          data: { estado: 'PENDIENTE' },
        })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/flow/webhook]', error)
    // Devolver 200 de todas formas para evitar reintentos de Flow ante errores transitorios
    return NextResponse.json({ ok: true })
  }
}
