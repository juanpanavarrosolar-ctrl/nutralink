'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { formatCLP } from '@/lib/utils'

const schema = z
  .object({
    nombre: z.string().min(2, 'Mínimo 2 caracteres'),
    descripcion: z.string().min(10, 'Mínimo 10 caracteres'),
    marca: z.string().min(2, 'Mínimo 2 caracteres'),
    categoria: z.enum(['VITAMINAS', 'MINERALES', 'PROTEINAS', 'OMEGA', 'PROBIOTICOS', 'OTRO']),
    precio_costo: z.number({ error: 'Ingresa un número' }).int().positive('Debe ser mayor a 0'),
    precio_venta: z.number({ error: 'Ingresa un número' }).int().positive('Debe ser mayor a 0'),
    stock: z.number({ error: 'Ingresa un número' }).int().min(0, 'No puede ser negativo'),
    imagen_url: z.string().url('URL inválida').optional().or(z.literal('')),
  })
  .refine((d) => d.precio_venta > d.precio_costo, {
    message: 'El precio de venta debe ser mayor al precio de costo',
    path: ['precio_venta'],
  })

type FormData = z.infer<typeof schema>

const CATEGORIAS = [
  { value: 'VITAMINAS', label: 'Vitaminas' },
  { value: 'MINERALES', label: 'Minerales' },
  { value: 'PROTEINAS', label: 'Proteínas' },
  { value: 'OMEGA', label: 'Omega' },
  { value: 'PROBIOTICOS', label: 'Probióticos' },
  { value: 'OTRO', label: 'Otro' },
] as const

interface Props {
  productoId?: string
  defaultValues?: Partial<FormData>
}

export function ProductoForm({ productoId, defaultValues }: Props) {
  const router = useRouter()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {
      categoria: 'VITAMINAS',
      stock: 0,
    },
  })

  const precioCosto = watch('precio_costo')
  const precioVenta = watch('precio_venta')
  const margen =
    precioCosto && precioVenta && precioVenta > precioCosto
      ? Math.round(((precioVenta - precioCosto) / precioVenta) * 100)
      : null

  async function onSubmit(data: FormData) {
    setServerError('')
    const url = productoId
      ? `/api/admin/productos/${productoId}`
      : '/api/admin/productos'
    const method = productoId ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        imagen_url: data.imagen_url || null,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      setServerError(err.error ?? 'Error al guardar el producto.')
      return
    }

    router.push('/admin/productos')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Nombre del producto" error={errors.nombre?.message}>
          <input
            {...register('nombre')}
            placeholder="Ej: Omega 3 Fish Oil 1000mg"
            className={inputClass(!!errors.nombre)}
          />
        </Field>
        <Field label="Marca" error={errors.marca?.message}>
          <input
            {...register('marca')}
            placeholder="Ej: Nordic Naturals"
            className={inputClass(!!errors.marca)}
          />
        </Field>
      </div>

      <Field label="Descripción" error={errors.descripcion?.message}>
        <textarea
          {...register('descripcion')}
          rows={3}
          placeholder="Describe el producto, sus beneficios y uso recomendado..."
          className={inputClass(!!errors.descripcion)}
        />
      </Field>

      <Field label="Categoría" error={errors.categoria?.message}>
        <select {...register('categoria')} className={inputClass(!!errors.categoria)}>
          {CATEGORIAS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Precio costo (CLP)" error={errors.precio_costo?.message}>
          <input
            {...register('precio_costo', { valueAsNumber: true })}
            type="number"
            min={0}
            placeholder="0"
            className={inputClass(!!errors.precio_costo)}
          />
        </Field>
        <Field label="Precio venta (CLP)" error={errors.precio_venta?.message}>
          <input
            {...register('precio_venta', { valueAsNumber: true })}
            type="number"
            min={0}
            placeholder="0"
            className={inputClass(!!errors.precio_venta)}
          />
        </Field>
        <Field label="Stock (unidades)" error={errors.stock?.message}>
          <input
            {...register('stock', { valueAsNumber: true })}
            type="number"
            min={0}
            placeholder="0"
            className={inputClass(!!errors.stock)}
          />
        </Field>
      </div>

      {margen !== null && (
        <div className="text-sm text-gray-500 -mt-2">
          Margen:{' '}
          <span className={`font-semibold ${margen >= 30 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {margen}%
          </span>
          {' · '}Ganancia por unidad:{' '}
          <span className="font-semibold text-gray-700">
            {formatCLP(precioVenta - precioCosto)}
          </span>
        </div>
      )}

      <Field label="URL imagen (opcional)" error={errors.imagen_url?.message}>
        <input
          {...register('imagen_url')}
          type="url"
          placeholder="https://..."
          className={inputClass(!!errors.imagen_url)}
        />
      </Field>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Guardando...
            </>
          ) : productoId ? (
            'Guardar cambios'
          ) : (
            'Crear producto'
          )}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function inputClass(hasError: boolean) {
  return `w-full px-3 py-2.5 text-sm rounded-lg border ${
    hasError ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-emerald-500'
  } text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition`
}
