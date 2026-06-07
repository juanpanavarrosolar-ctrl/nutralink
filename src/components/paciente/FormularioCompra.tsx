'use client'

import { useState } from 'react'
import { ShoppingCart, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { formatCLP } from '@/lib/utils'

interface Props {
  protocoloToken: string
  total: number
  nombrePacienteInicial?: string
  emailPacienteInicial?: string
}

const REGIONES_CHILE = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
  'Valparaíso', 'Metropolitana de Santiago', "O'Higgins", 'Maule',
  'Ñuble', 'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos',
  'Aysén', 'Magallanes',
]

export function FormularioCompra({
  protocoloToken, total, nombrePacienteInicial = '', emailPacienteInicial = '',
}: Props) {
  const [nombre, setNombre] = useState(nombrePacienteInicial)
  const [email, setEmail] = useState(emailPacienteInicial)
  const [telefono, setTelefono] = useState('')
  const [calle, setCalle] = useState('')
  const [numero, setNumero] = useState('')
  const [comuna, setComuna] = useState('')
  const [region, setRegion] = useState('Metropolitana de Santiago')
  const [recompra, setRecompra] = useState(false)

  const [errores, setErrores] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [errorServidor, setErrorServidor] = useState('')

  function validar() {
    const e: Record<string, string> = {}
    if (!nombre.trim()) e.nombre = 'Nombre requerido'
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email válido requerido'
    if (!telefono.trim() || telefono.replace(/\D/g, '').length < 8) e.telefono = 'Teléfono inválido'
    if (!calle.trim()) e.calle = 'Calle requerida'
    if (!numero.trim()) e.numero = 'Número requerido'
    if (!comuna.trim()) e.comuna = 'Comuna requerida'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validar()) return

    setEnviando(true)
    setErrorServidor('')

    const direccion = `${calle} ${numero}, ${comuna}, ${region}`

    const res = await fetch('/api/ordenes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        protocolo_token: protocoloToken,
        nombre_paciente: nombre,
        email,
        telefono,
        direccion,
        quiere_recompra: recompra,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setErrorServidor(data.error ?? 'Error al procesar la orden.')
      setEnviando(false)
      return
    }

    // TODO: redirigir a Flow cuando esté integrado
    alert(
      `✅ Orden #${data.orden_id.slice(0, 8).toUpperCase()} creada correctamente.\n\n` +
      `Total: ${formatCLP(data.total)}\n\n` +
      `Pago en integración — pronto podrás pagar directamente aquí con Flow.`
    )
    setEnviando(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorServidor && (
        <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{errorServidor}</span>
        </div>
      )}

      {/* Datos personales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nombre completo" error={errores.nombre}>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="María González"
            className={inputCls(!!errores.nombre)}
          />
        </Field>
        <Field label="Email" error={errores.email}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="maria@correo.cl"
            className={inputCls(!!errores.email)}
          />
        </Field>
      </div>

      <Field label="Teléfono" error={errores.telefono}>
        <input
          type="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="+56 9 1234 5678"
          className={inputCls(!!errores.telefono)}
        />
      </Field>

      {/* Dirección */}
      <p className="text-sm font-semibold text-gray-700 pt-1">Dirección de despacho</p>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Field label="Calle / Avenida" error={errores.calle}>
            <input
              value={calle}
              onChange={(e) => setCalle(e.target.value)}
              placeholder="Av. Providencia"
              className={inputCls(!!errores.calle)}
            />
          </Field>
        </div>
        <Field label="Número / Depto" error={errores.numero}>
          <input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="1234"
            className={inputCls(!!errores.numero)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Comuna" error={errores.comuna}>
          <input
            value={comuna}
            onChange={(e) => setComuna(e.target.value)}
            placeholder="Providencia"
            className={inputCls(!!errores.comuna)}
          />
        </Field>
        <Field label="Región" error={undefined}>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className={inputCls(false)}
          >
            {REGIONES_CHILE.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Recompra */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative mt-0.5">
          <input
            type="checkbox"
            checked={recompra}
            onChange={(e) => setRecompra(e.target.checked)}
            className="sr-only"
          />
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
            recompra ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 group-hover:border-emerald-400'
          }`}>
            {recompra && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
            <RefreshCw size={13} className="text-emerald-600" />
            Activar recompra mensual automática
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Recibirás tus productos cada mes sin tener que volver a comprar. Puedes cancelar cuando quieras.
          </p>
        </div>
      </label>

      {/* CTA */}
      <button
        type="submit"
        disabled={enviando}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-4 px-6 rounded-2xl transition text-base flex items-center justify-center gap-2 shadow-md shadow-emerald-200"
      >
        {enviando ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <ShoppingCart size={18} />
            Comprar mi plan — {formatCLP(total)} CLP
          </>
        )}
      </button>

      <p className="text-xs text-center text-gray-400">
        Pago seguro · Despacho a domicilio en todo Chile
      </p>
    </form>
  )
}

function Field({ label, error, children }: {
  label: string; error?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function inputCls(hasError: boolean) {
  return `w-full px-4 py-2.5 text-sm rounded-xl border ${
    hasError ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-emerald-500'
  } text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition bg-white`
}
