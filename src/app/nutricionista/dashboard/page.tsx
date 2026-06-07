import Link from 'next/link'
import { Plus, FileText, ShoppingBag, Banknote, ChevronRight, Clock } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { formatCLP } from '@/lib/utils'
import { CopyLinkButton } from '@/components/nutricionista/CopyLinkButton'

const USUARIO_EMAIL = 'juanpa.navarro.solar@gmail.com'

export default async function DashboardPage() {
  const usuario = await prisma.usuario.findUnique({
    where: { email: USUARIO_EMAIL },
    select: { id: true, nombre: true },
  })

  if (!usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Usuario no encontrado en la base de datos.</p>
      </div>
    )
  }

  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

  const [
    totalProtocolosActivos,
    ordenesDelMes,
    comisionesDelMes,
    ultimosProtocolos,
  ] = await Promise.all([
    prisma.protocolo.count({
      where: { nutricionista_id: usuario.id, activo: true },
    }),
    prisma.orden.count({
      where: {
        protocolo: { nutricionista_id: usuario.id },
        estado: { in: ['PAGADA', 'DESPACHADA', 'ENTREGADA'] },
        creado_en: { gte: inicioMes },
      },
    }),
    prisma.comision.aggregate({
      where: { nutricionista_id: usuario.id, creado_en: { gte: inicioMes } },
      _sum: { monto: true },
    }),
    prisma.protocolo.findMany({
      where: { nutricionista_id: usuario.id },
      include: {
        items: {
          include: { producto: { select: { nombre: true, precio_venta: true } } },
        },
        ordenes: { select: { id: true } },
      },
      orderBy: { creado_en: 'desc' },
      take: 5,
    }),
  ])

  const totalComisiones = comisionesDelMes._sum.monto ?? 0
  const primerNombre = usuario.nombre.split(' ')[0]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nutrilink.cl'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">

        <div className="mb-10 flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{saludo()}, {primerNombre}</p>
            <h1 className="text-3xl font-bold text-gray-900">Tu panel</h1>
          </div>
          <Link
            href="/nutricionista/protocolos/nuevo"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-3 rounded-xl transition shadow-sm"
          >
            <Plus size={18} />
            Crear protocolo
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-10">
          <MetricCard
            icon={<FileText size={20} className="text-emerald-600" />}
            label="Protocolos activos"
            value={String(totalProtocolosActivos)}
            bg="bg-emerald-50"
          />
          <MetricCard
            icon={<ShoppingBag size={20} className="text-blue-600" />}
            label="Órdenes este mes"
            value={String(ordenesDelMes)}
            bg="bg-blue-50"
          />
          <MetricCard
            icon={<Banknote size={20} className="text-violet-600" />}
            label="Comisiones este mes"
            value={formatCLP(totalComisiones)}
            bg="bg-violet-50"
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Últimos protocolos</h2>
            <Link
              href="/nutricionista/protocolos"
              className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
            >
              Ver todos <ChevronRight size={14} />
            </Link>
          </div>

          {ultimosProtocolos.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <FileText size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-base font-medium">Aún no tienes protocolos</p>
              <p className="text-sm mt-1">Crea tu primer plan de suplementación</p>
              <Link
                href="/nutricionista/protocolos/nuevo"
                className="inline-flex items-center gap-2 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                <Plus size={14} />
                Crear protocolo
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {ultimosProtocolos.map((p) => {
                const totalMes = p.items.reduce(
                  (acc, item) => acc + item.producto.precio_venta * item.cantidad,
                  0
                )
                const link = `${appUrl}/paciente/${p.token}`
                return (
                  <li key={p.id} className="px-6 py-4 hover:bg-gray-50/60 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${p.activo ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                          <p className="font-medium text-gray-900 truncate">{p.nombre}</p>
                        </div>
                        <p className="text-sm text-gray-500 ml-4">
                          Para: <span className="text-gray-700">{p.nombre_paciente}</span>
                          {' · '}
                          {p.items.length} producto{p.items.length !== 1 ? 's' : ''}
                          {' · '}
                          <span className="font-medium text-gray-700">{formatCLP(totalMes)}/mes</span>
                        </p>
                        <p className="text-xs text-gray-400 ml-4 mt-0.5 flex items-center gap-1">
                          <Clock size={11} />
                          {formatFecha(p.creado_en)}
                          {p.ordenes.length > 0 && (
                            <span className="ml-2 text-emerald-600 font-medium">
                              · {p.ordenes.length} orden{p.ordenes.length !== 1 ? 'es' : ''}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <CopyLinkButton link={link} />
                        <Link
                          href={`/nutricionista/protocolos/${p.id}`}
                          className="text-xs text-gray-400 hover:text-emerald-600 transition font-medium px-2.5 py-1"
                        >
                          Ver
                        </Link>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, bg }: {
  icon: React.ReactNode; label: string; value: string; bg: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${bg} mb-4`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}

function saludo() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function formatFecha(date: Date) {
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(date))
}
