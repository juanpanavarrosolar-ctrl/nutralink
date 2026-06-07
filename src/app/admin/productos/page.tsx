import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCLP } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { ToggleActivoButton } from './ToggleActivoButton'

const CATEGORIA_LABEL: Record<string, string> = {
  VITAMINAS: 'Vitaminas',
  MINERALES: 'Minerales',
  PROTEINAS: 'Proteínas',
  OMEGA: 'Omega',
  PROBIOTICOS: 'Probióticos',
  OTRO: 'Otro',
}

export default async function ProductosPage() {
  const productos = await prisma.producto.findMany({
    orderBy: { creado_en: 'desc' },
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {productos.length} productos en el catálogo
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Plus size={16} />
          Agregar producto
        </Link>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-6 py-3 font-medium text-gray-600">Producto</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Categoría</th>
              <th className="text-right px-6 py-3 font-medium text-gray-600">P. Costo</th>
              <th className="text-right px-6 py-3 font-medium text-gray-600">P. Venta</th>
              <th className="text-right px-6 py-3 font-medium text-gray-600">Stock</th>
              <th className="text-center px-6 py-3 font-medium text-gray-600">Estado</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {productos.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{p.nombre}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.marca}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                    {CATEGORIA_LABEL[p.categoria] ?? p.categoria}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-gray-500 tabular-nums">
                  {formatCLP(p.precio_costo)}
                </td>
                <td className="px-6 py-4 text-right font-medium text-gray-900 tabular-nums">
                  {formatCLP(p.precio_venta)}
                </td>
                <td className="px-6 py-4 text-right tabular-nums">
                  <span className={p.stock <= 10 ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <ToggleActivoButton id={p.id} activo={p.activo} />
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/admin/productos/${p.id}`}
                    className="text-xs text-emerald-600 hover:underline font-medium"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {productos.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-base">Sin productos aún.</p>
            <p className="text-sm mt-1">Agrega el primero con el botón de arriba.</p>
          </div>
        )}
      </div>
    </div>
  )
}
