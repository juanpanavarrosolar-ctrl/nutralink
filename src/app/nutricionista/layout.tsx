import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

export default async function NutricionistaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const usuario = await prisma.usuario.findUnique({
    where: { email: user.email! },
    select: { rol: true, activo: true },
  })

  if (!usuario || !usuario.activo || usuario.rol !== 'NUTRICIONISTA') {
    redirect('/login')
  }

  return <>{children}</>
}
