'use client'

import { logout } from '@/lib/auth'
import { LogOut } from 'lucide-react'

interface LogoutButtonProps {
  variant?: 'icon' | 'full'
}

export function LogoutButton({ variant = 'full' }: LogoutButtonProps) {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
      >
        <LogOut size={16} />
        {variant === 'full' && <span>Cerrar sesión</span>}
      </button>
    </form>
  )
}
