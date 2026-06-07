import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Leaf, Package, Calendar, ShieldCheck } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { formatCLP } from '@/lib/utils'
import { FormularioCompra } from '@/components/paciente/FormularioCompra'

interface Props {
  params: Promise<{ token: string }>
}

const CATEGORIA_EMOJI: Record<string, string> = {
  VITAMINAS: '💊', MINERALES: '⚡', PROTEINAS: '💪',
  OMEGA: '🐟', PROBIOTICOS: '🦠', OTRO: '🌿',
}

export default async function PacientePage({ params }: Props) {
  const { token } = await params

  const protocolo = await prisma.protocolo.findUnique({
    where: { token, activo: true },
    include: {
      nutricionista: { select: { nombre: true, especialidad: true } },
      items: {
        include: {
          producto: {
            select: {
              id: true, nombre: true, descripcion: true, marca: true,
              precio_venta: true, imagen_url: true, categoria: true,
            },
          },
        },
      },
    },
  })

  if (!protocolo) notFound()

  const total = protocolo.items.reduce(
    (acc, item) => acc + item.producto.precio_venta * item.cantidad, 0
  )

  const fechaFormateada = new Intl.DateTimeFormat('es-CL', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(protocolo.creado_en)

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-gray-50">

      {/* ─── Header ────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
            <Leaf size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">NutriLink</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-16">

        {/* ─── Hero ────────────────────────────────────────────── */}
        <section className="pt-8 pb-6 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <ShieldCheck size={13} />
            Plan de suplementación personalizado
          </div>
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">
            Recomendado por{' '}
            <span className="text-emerald-600">{protocolo.nutricionista.nombre}</span>
          </h1>
          {protocolo.nutricionista.especialidad && (
            <p className="text-sm text-gray-500 mt-1">{protocolo.nutricionista.especialidad}</p>
          )}
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mt-3">
            <Calendar size={12} />
            Creado el {fechaFormateada}
          </div>
        </section>

        {/* ─── Productos ──────────────────────────────────────────── */}
        <section className="space-y-3 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
            Tu plan · {protocolo.items.length} producto{protocolo.items.length !== 1 ? 's' : ''}
          </h2>

          {protocolo.items.map((item) => {
            const subtotal = item.producto.precio_venta * item.cantidad
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="flex gap-4 p-4">
                  <div className="shrink-0">
                    {item.producto.imagen_url ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50">
                        <Image
                          src={item.producto.imagen_url}
                          alt={item.producto.nombre}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl">
                        {CATEGORIA_EMOJI[item.producto.categoria] ?? '🌿'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm leading-tight">
                          {item.producto.nombre}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.producto.marca}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-gray-900 text-sm tabular-nums">
                          {formatCLP(subtotal)}
                        </p>
                        {item.cantidad > 1 && (
                          <p className="text-xs text-gray-400 tabular-nums">
                            {item.cantidad} × {formatCLP(item.producto.precio_venta)}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                      {item.producto.descripcion}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-50 bg-emerald-50/60 px-4 py-2.5 flex items-start gap-2">
                  <Package size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-800 font-medium">{item.instrucciones}</p>
                </div>
              </div>
            )
          })}
        </section>

        {/* ─── Resumen de precios ─────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="space-y-2.5">
            {protocolo.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600 truncate mr-4">
                  {item.producto.nombre}
                  {item.cantidad > 1 && (
                    <span className="text-gray-400"> ×{item.cantidad}</span>
                  )}
                </span>
                <span className="text-gray-700 tabular-nums shrink-0">
                  {formatCLP(item.producto.precio_venta * item.cantidad)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between items-end">
            <div>
              <p className="font-bold text-gray-900 text-base">Total mensual</p>
              <p className="text-xs text-gray-400 mt-0.5">Despacho incluido en Chile</p>
            </div>
            <p className="font-black text-2xl text-emerald-600 tabular-nums">
              {formatCLP(total)}
            </p>
          </div>

          <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-50 leading-relaxed">
            Los productos son sugeridos por tu profesional de salud. NutriLink no reemplaza la
            consulta médica. Ante cualquier duda, consulta con tu nutricionista.
          </p>
        </section>

        {/* ─── Formulario de compra ────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 text-lg mb-1">Completa tu pedido</h2>
          <p className="text-sm text-gray-500 mb-6">
            Ingresa tus datos y recibirás los productos en tu domicilio.
          </p>

          <FormularioCompra
            protocoloId={protocolo.id}
            total={total}
            nombrePacienteInicial={protocolo.nombre_paciente}
            emailPacienteInicial={protocolo.email_paciente ?? ''}
          />
        </section>
      </main>

      <footer className="text-center py-8 text-xs text-gray-300">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Leaf size={11} className="text-emerald-400" />
          <span className="font-medium text-gray-400">NutriLink</span>
        </div>
        Plataforma de suplementación nutricional profesional · Chile
      </footer>
    </div>
  )
}
