import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { ProductoForm } from '@/components/admin/ProductoForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarProductoPage({ params }: Props) {
  const { id } = await params

  const producto = await prisma.producto.findUnique({ where: { id } })
  if (!producto) notFound()

  return (
    <div className="p-8 max-w-3xl">
      <Link
        href="/admin/productos"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition"
      >
        <ChevronLeft size={16} />
        Volver a productos
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Editar producto</h1>
      <p className="text-sm text-gray-500 mb-8">{producto.nombre}</p>

      <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
        <ProductoForm
          productoId={producto.id}
          defaultValues={{
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            marca: producto.marca,
            categoria: producto.categoria,
            precio_costo: producto.precio_costo,
            precio_venta: producto.precio_venta,
            stock: producto.stock,
            imagen_url: producto.imagen_url ?? '',
          }}
        />
      </div>
    </div>
  )
}
