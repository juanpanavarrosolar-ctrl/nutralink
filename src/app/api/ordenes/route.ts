import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ordenSchema = z.object({
  protocolo_token: z.string().min(1),
  nombre_paciente: z.string().min(2),
  email: z.string().email(),
  telefono: z.string().min(8).max(20),
  direccion: z.string().min(5),
  quiere_recompra: z.boolean(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = ordenSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { protocolo_token, nombre_paciente, email, telefono, direccion, quiere_recompra } =
      parsed.data

    const protocolo = await prisma.protocolo.findUnique({
      where: { token: protocolo_token, activo: true },
      include: {
        items: {
          include: {
            producto: { select: { id: true, precio_venta: true, stock: true, activo: true } },
          },
        },
        nutricionista: { select: { id: true } },
      },
    })

    if (!protocolo) {
      return NextResponse.json(
        { error: 'Protocolo no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const sinStock = protocolo.items.filter(
      (item) => !item.producto.activo || item.producto.stock < item.cantidad
    )
    if (sinStock.length > 0) {
      return NextResponse.json(
        { error: 'Algunos productos no tienen stock suficiente. Contacta a tu nutricionista.' },
        { status: 409 }
      )
    }

    const total = protocolo.items.reduce(
      (acc, item) => acc + item.producto.precio_venta * item.cantidad,
      0
    )
    const PORCENTAJE_COMISION = 10
    const montoComision = Math.round(total * (PORCENTAJE_COMISION / 100))

    const orden = await prisma.$transaction(async (tx) => {
      const nuevaOrden = await tx.orden.create({
        data: {
          protocolo_id: protocolo.id,
          nombre_paciente,
          email_paciente: email,
          telefono_paciente: telefono,
          direccion_despacho: direccion,
          total,
          es_recompra: quiere_recompra,
          estado: 'PENDIENTE',
          items: {
            create: protocolo.items.map((item) => ({
              producto_id: item.producto.id,
              cantidad: item.cantidad,
              precio_unitario: item.producto.precio_venta,
            })),
          },
        },
      })

      await tx.comision.create({
        data: {
          orden_id: nuevaOrden.id,
          nutricionista_id: protocolo.nutricionista.id,
          monto: montoComision,
          porcentaje: PORCENTAJE_COMISION,
          estado: 'PENDIENTE',
        },
      })

      return nuevaOrden
    })

    return NextResponse.json(
      { orden_id: orden.id, total, mensaje: 'Orden creada' },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/ordenes]', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
