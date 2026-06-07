'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Plus, Trash2, Check, Copy, MessageCircle,
  ChevronRight, ChevronLeft, Loader2, Package, AlertCircle,
} from 'lucide-react'
import { formatCLP } from '@/lib/utils'

interface ProductoCatalogo {
  id: string
  nombre: string
  marca: string
  categoria: string
  precio_venta: number
  imagen_url: string | null
}

interface ItemSeleccionado {
  productoId: string
  nombre: string
  marca: string
  precio_venta: number
  cantidad: number
  instrucciones: string
}

const PASOS = ['Paciente', 'Productos', 'Confirmar']
const CATEGORIA_LABEL: Record<string, string> = {
  VITAMINAS: 'Vitaminas', MINERALES: 'Minerales', PROTEINAS: 'Proteínas',
  OMEGA: 'Omega', PROBIOTICOS: 'Probióticos', OTRO: 'Otro',
}

export function CreadorProtocolo() {
  const router = useRouter()
  const [paso, setPaso] = useState(0)

  const [nombrePaciente, setNombrePaciente] = useState('')
  const [emailPaciente, setEmailPaciente] = useState('')
  const [nombreProtocolo, setNombreProtocolo] = useState('')
  const [erroresPaso1, setErroresPaso1] = useState<Record<string, string>>({})

  const [productos, setProductos] = useState<ProductoCatalogo[]>([])
  const [cargandoProductos, setCargandoProductos] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [items, setItems] = useState<ItemSeleccionado[]>([])
  const [modalProducto, setModalProducto] = useState<ProductoCatalogo | null>(null)
  const [cantidadModal, setCantidadModal] = useState(1)
  const [instruccionesModal, setInstruccionesModal] = useState('')
  const [erroresModal, setErroresModal] = useState<Record<string, string>>({})

  const [guardando, setGuardando] = useState(false)
  const [resultado, setResultado] = useState<{ token: string; link: string } | null>(null)
  const [errorServidor, setErrorServidor] = useState('')
  const [copiado, setCopiado] = useState(false)

  const cargarProductos = useCallback(async () => {
    setCargandoProductos(true)
    const res = await fetch('/api/nutricionista/productos-catalogo')
    if (res.ok) setProductos(await res.json())
    setCargandoProductos(false)
  }, [])

  useEffect(() => {
    if (paso === 1) cargarProductos()
  }, [paso, cargarProductos])

  function validarPaso1() {
    const errs: Record<string, string> = {}
    if (!nombrePaciente.trim()) errs.nombrePaciente = 'Nombre del paciente requerido'
    if (!nombreProtocolo.trim()) errs.nombreProtocolo = 'Nombre del protocolo requerido'
    if (emailPaciente && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailPaciente)) {
      errs.emailPaciente = 'Email inválido'
    }
    setErroresPaso1(errs)
    return Object.keys(errs).length === 0
  }

  function abrirModal(producto: ProductoCatalogo) {
    const existente = items.find((i) => i.productoId === producto.id)
    if (existente) {
      setCantidadModal(existente.cantidad)
      setInstruccionesModal(existente.instrucciones)
    } else {
      setCantidadModal(1)
      setInstruccionesModal('')
    }
    setErroresModal({})
    setModalProducto(producto)
  }

  function confirmarModal() {
    const errs: Record<string, string> = {}
    if (cantidadModal < 1) errs.cantidad = 'Mínimo 1 unidad'
    if (!instruccionesModal.trim()) errs.instrucciones = 'Instrucciones requeridas'
    setErroresModal(errs)
    if (Object.keys(errs).length > 0) return

    const item: ItemSeleccionado = {
      productoId: modalProducto!.id,
      nombre: modalProducto!.nombre,
      marca: modalProducto!.marca,
      precio_venta: modalProducto!.precio_venta,
      cantidad: cantidadModal,
      instrucciones: instruccionesModal.trim(),
    }

    setItems((prev) => {
      const idx = prev.findIndex((i) => i.productoId === item.productoId)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = item
        return next
      }
      return [...prev, item]
    })
    setModalProducto(null)
  }

  function eliminarItem(productoId: string) {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId))
  }

  async function guardarProtocolo() {
    setGuardando(true)
    setErrorServidor('')

    const res = await fetch('/api/nutricionista/protocolos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: nombreProtocolo,
        nombrePaciente,
        emailPaciente: emailPaciente || undefined,
        items: items.map((i) => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          instrucciones: i.instrucciones,
        })),
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      setErrorServidor(err.error ?? 'Error al guardar el protocolo.')
      setGuardando(false)
      return
    }

    const { token } = await res.json()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nutrilink.cl'
    setResultado({ token, link: `${appUrl}/paciente/${token}` })
    setGuardando(false)
  }

  async function copiarLink() {
    if (!resultado) return
    await navigator.clipboard.writeText(resultado.link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  function compartirWhatsApp() {
    if (!resultado) return
    const msg = encodeURIComponent(
      `Hola ${nombrePaciente}, te comparto tu plan de suplementación personalizado. Puedes ver los productos que te recomendé y adquirirlos directamente aquí: ${resultado.link}. Cualquier duda estoy disponible.`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const totalMes = items.reduce((acc, i) => acc + i.precio_venta * i.cantidad, 0)

  if (resultado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">¡Protocolo creado!</h2>
            <p className="text-gray-500 mb-6">El link está listo para compartir con {nombrePaciente}.</p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-5 text-left">
              <p className="text-xs text-gray-400 mb-1">Link del paciente</p>
              <p className="text-sm font-mono text-gray-700 break-all">{resultado.link}</p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={copiarLink}
                className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition ${
                  copiado
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {copiado ? <><Check size={16} /> Link copiado</> : <><Copy size={16} /> Copiar link</>}
              </button>

              <button
                onClick={compartirWhatsApp}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-medium border border-green-200 text-green-700 hover:bg-green-50 transition"
              >
                <MessageCircle size={16} />
                Compartir por WhatsApp
              </button>

              <button
                onClick={() => router.push('/nutricionista/dashboard')}
                className="text-sm text-gray-400 hover:text-gray-600 transition pt-1"
              >
                Volver al panel
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <button
            onClick={() => paso === 0 ? router.back() : setPaso(paso - 1)}
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-4 transition"
          >
            <ChevronLeft size={16} />
            {paso === 0 ? 'Cancelar' : 'Atrás'}
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo protocolo nutricional</h1>

          <div className="flex items-center gap-3 mt-5">
            {PASOS.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < paso ? 'bg-emerald-600 text-white'
                    : i === paso ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {i < paso ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-sm ${i === paso ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
                  {label}
                </span>
                {i < PASOS.length - 1 && (
                  <div className={`flex-1 h-px w-8 ${i < paso ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {paso === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-5">
            <h2 className="font-semibold text-gray-800 text-lg">Datos del paciente</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre del paciente <span className="text-red-400">*</span>
              </label>
              <input
                value={nombrePaciente}
                onChange={(e) => setNombrePaciente(e.target.value)}
                placeholder="Ej: María González"
                className={inputCls(!!erroresPaso1.nombrePaciente)}
              />
              {erroresPaso1.nombrePaciente && <Err>{erroresPaso1.nombrePaciente}</Err>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email del paciente <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="email"
                value={emailPaciente}
                onChange={(e) => setEmailPaciente(e.target.value)}
                placeholder="maria@correo.cl"
                className={inputCls(!!erroresPaso1.emailPaciente)}
              />
              {erroresPaso1.emailPaciente && <Err>{erroresPaso1.emailPaciente}</Err>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre del protocolo <span className="text-red-400">*</span>
              </label>
              <input
                value={nombreProtocolo}
                onChange={(e) => setNombreProtocolo(e.target.value)}
                placeholder="Ej: Plan vitaminas invierno - María"
                className={inputCls(!!erroresPaso1.nombreProtocolo)}
              />
              {erroresPaso1.nombreProtocolo && <Err>{erroresPaso1.nombreProtocolo}</Err>}
              <p className="text-xs text-gray-400 mt-1">Solo tú verás este nombre. Úsalo para identificar el protocolo.</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => { if (validarPaso1()) setPaso(1) }}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-xl transition"
              >
                Siguiente <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {paso === 1 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 text-lg mb-4">Selecciona los productos</h2>
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre o marca..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>

              {cargandoProductos ? (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Loader2 size={20} className="animate-spin mr-2" /> Cargando catálogo...
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {productos
                    .filter((p) =>
                      `${p.nombre} ${p.marca}`.toLowerCase().includes(busqueda.toLowerCase())
                    )
                    .map((p) => {
                      const agregado = items.some((i) => i.productoId === p.id)
                      return (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition ${
                            agregado
                              ? 'border-emerald-200 bg-emerald-50'
                              : 'border-gray-100 hover:border-emerald-200 hover:bg-gray-50'
                          }`}
                          onClick={() => abrirModal(p)}
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">{p.nombre}</p>
                            <p className="text-xs text-gray-400">{p.marca} · {CATEGORIA_LABEL[p.categoria]}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-700 tabular-nums">
                              {formatCLP(p.precio_venta)}
                            </span>
                            {agregado ? (
                              <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                <Check size={12} className="text-white" />
                              </span>
                            ) : (
                              <span className="w-6 h-6 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-emerald-400 transition">
                                <Plus size={12} className="text-gray-400" />
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  {productos.filter((p) =>
                    `${p.nombre} ${p.marca}`.toLowerCase().includes(busqueda.toLowerCase())
                  ).length === 0 && !cargandoProductos && (
                    <p className="text-center text-sm text-gray-400 py-6">
                      Sin resultados para &quot;{busqueda}&quot;
                    </p>
                  )}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Package size={16} className="text-emerald-600" />
                  Productos seleccionados ({items.length})
                </h3>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item.productoId} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.nombre}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.instrucciones}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.cantidad} u/mes · {formatCLP(item.precio_venta * item.cantidad)}/mes
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => abrirModal(productos.find((p) => p.id === item.productoId)!)}
                          className="text-xs text-gray-400 hover:text-emerald-600 px-2 py-1 transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarItem(item.productoId)}
                          className="text-gray-300 hover:text-red-400 p-1 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Total mensual</span>
                  <span className="font-bold text-gray-900 tabular-nums">{formatCLP(totalMes)}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-1">
              <button onClick={() => setPaso(0)} className="text-sm text-gray-400 hover:text-gray-700 transition">
                ← Atrás
              </button>
              <button
                onClick={() => { if (items.length > 0) setPaso(2) }}
                disabled={items.length === 0}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium px-6 py-2.5 rounded-xl transition"
              >
                Revisar protocolo <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <h2 className="font-semibold text-gray-800 text-lg mb-6">Resumen del protocolo</h2>

            <div className="space-y-4 mb-6">
              <InfoRow label="Protocolo" value={nombreProtocolo} />
              <InfoRow label="Paciente" value={nombrePaciente} />
              {emailPaciente && <InfoRow label="Email" value={emailPaciente} />}
              <InfoRow label="Productos" value={`${items.length} producto${items.length !== 1 ? 's' : ''}`} />
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Producto</th>
                    <th className="text-center px-4 py-2.5 font-medium text-gray-600">Cant.</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600">Total/mes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item) => (
                    <tr key={item.productoId}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{item.nombre}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.instrucciones}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{item.cantidad}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800 tabular-nums">
                        {formatCLP(item.precio_venta * item.cantidad)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={2} className="px-4 py-2.5 text-sm font-semibold text-gray-700">Total mensual</td>
                    <td className="px-4 py-2.5 text-right font-bold text-gray-900 tabular-nums">{formatCLP(totalMes)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {errorServidor && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm mb-4">
                <AlertCircle size={16} className="shrink-0" />
                {errorServidor}
              </div>
            )}

            <div className="flex justify-between items-center">
              <button onClick={() => setPaso(1)} className="text-sm text-gray-400 hover:text-gray-700 transition">
                ← Atrás
              </button>
              <button
                onClick={guardarProtocolo}
                disabled={guardando}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold px-7 py-3 rounded-xl transition"
              >
                {guardando ? (
                  <><Loader2 size={16} className="animate-spin" /> Generando...</>
                ) : (
                  <><Check size={16} /> Generar link para el paciente</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {modalProducto && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalProducto(null) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-semibold text-gray-900 text-lg mb-1">{modalProducto.nombre}</h3>
            <p className="text-sm text-gray-400 mb-5">{modalProducto.marca} · {formatCLP(modalProducto.precio_venta)} c/u</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cantidad por mes (unidades)</label>
                <input
                  type="number"
                  min={1}
                  value={cantidadModal}
                  onChange={(e) => setCantidadModal(Number(e.target.value))}
                  className={inputCls(!!erroresModal.cantidad)}
                />
                {erroresModal.cantidad && <Err>{erroresModal.cantidad}</Err>}
                {cantidadModal > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Total: {formatCLP(modalProducto.precio_venta * cantidadModal)}/mes
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Instrucciones de toma</label>
                <textarea
                  rows={2}
                  value={instruccionesModal}
                  onChange={(e) => setInstruccionesModal(e.target.value)}
                  placeholder="Ej: 1 cápsula en la mañana con desayuno"
                  className={inputCls(!!erroresModal.instrucciones)}
                />
                {erroresModal.instrucciones && <Err>{erroresModal.instrucciones}</Err>}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalProducto(null)}
                className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarModal}
                className="flex-1 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition"
              >
                {items.some((i) => i.productoId === modalProducto.id) ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function inputCls(error: boolean) {
  return `w-full px-4 py-2.5 text-sm rounded-lg border ${
    error ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-emerald-500'
  } text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition`
}

function Err({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-red-500 mt-1">{children}</p>
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  )
}
