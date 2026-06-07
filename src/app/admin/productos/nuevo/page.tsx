import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ProductoForm } from '@/components/admin/ProductoForm'

export default function NuevoProductoPage() {
  return (
    <div className="p-8 max-w-3xl">
      <Link
        href="/admin/productos"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition"
      >
        <ChevronLeft size={16} />
        Volver a productos
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Nuevo producto</h1>

      <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
        <ProductoForm />
      </div>
    </div>
  )
}
