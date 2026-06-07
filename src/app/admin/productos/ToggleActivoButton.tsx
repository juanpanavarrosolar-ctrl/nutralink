'use client'

import { useState } from 'react'

interface Props {
  id: string
  activo: boolean
}

export function ToggleActivoButton({ id, activo: initialActivo }: Props) {
  const [activo, setActivo] = useState(initialActivo)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const res = await fetch(`/api/admin/productos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !activo }),
    })
    if (res.ok) setActivo((v) => !v)
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
        activo ? 'bg-emerald-500' : 'bg-gray-200'
      }`}
      title={activo ? 'Desactivar' : 'Activar'}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
          activo ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
