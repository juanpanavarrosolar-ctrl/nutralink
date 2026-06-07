'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Leaf, AlertCircle, Loader2 } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !data.user) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/auth/rol', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.user.email }),
    })

    if (!res.ok) {
      setError('Usuario no autorizado en NutriLink.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    const { rol } = await res.json()

    if (redirectTo) {
      router.push(redirectTo)
      return
    }

    if (rol === 'NUTRICIONISTA') router.push('/nutricionista/dashboard')
    else if (rol === 'ADMIN') router.push('/admin/dashboard')
    else router.push('/')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.cl"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Ingresando...
          </>
        ) : (
          'Ingresar'
        )}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-600 rounded-2xl mb-4">
            <Leaf className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">NutriLink</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Panel profesional para nutricionistas
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Iniciar sesión</h2>
          <Suspense fallback={<div className="h-48" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          ¿Problemas para ingresar? Contacta a{' '}
          <a href="mailto:soporte@nutrilink.cl" className="text-emerald-600 hover:underline">
            soporte@nutrilink.cl
          </a>
        </p>
      </div>
    </main>
  )
}
