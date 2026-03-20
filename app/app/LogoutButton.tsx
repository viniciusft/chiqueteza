'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="text-gray-400 hover:text-gray-600 transition-colors"
      style={{ fontSize: 14, fontWeight: 500 }}
    >
      Sair
    </button>
  )
}
