import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Aquí es donde SÍ se pasan los argumentos según la definición de la librería
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}