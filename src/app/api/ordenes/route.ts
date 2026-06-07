import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ordenSchema = z.object({
  protocoloId: z.string().uuid(),
  nombrePaciente: z.string().min(2),
  emailPaciente: z.string().email(),
  telefonoPaciente: z.string().min(8).max(15),
  calle: z.string().min(3),
  numero: z.string().min(1),
  comuna: z.string().min(2),
  region: z.string().min(2),
  recompraActiva: z.boolean(),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = ordenSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { protocoloId, nombrePaciente, emailPaciente, telefonoPaciente,
    calle, numero, comuna, region, recompraActiva } = parsed.data

  const protocolo = await prisma.protocolo.findUnique({
    where: { id: protocoloId, activo: true },
    include: {
      items: {
        include: { producto: { select: { id: true, precio_venta: true, stock: true, activo: true } } },
      },
      nutricionista: { select: { id: true } },
    },
  })

  if (!protocolo) {
    return NextResponse.json({ error: 'Protocolo no encontrado o inactivo' }, { status: 404 })
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

  const direccion = `${calle} ${numero}, ${comuna}, ${region}`
  const total = protocolo.items.reduce(
    (acc, item) => acc + item.producto.precio_venta * item.cantidad, 0
  )
  const PORCENTAJE_COMISION = 10
  const montoComision = Math.round(total * (PORCENTAJE_COMISION / 100))

  const orden = await prisma.$transaction(async (tx) => {
    const nuevaOrden = await tx.orden.create({
      data: {
        protocolo_id: protocoloId,
        nombre_paciente: nombrePaciente,
        email_paciente: emailPaciente,
        telefono_paciente: telefonoPaciente,
        direccion_despacho: direccion,
        total,
        es_recompra: recompraActiva,
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

  return NextResponse.json({ ordenId: orden.id, total }, { status: 201 })
}
