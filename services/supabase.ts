import { createBrowserClient as createBrowserClientSSR, createServerClient as createServerClientSSR } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client-side Supabase client (usado en componentes con "use client")
export const createBrowserClient = () => {
  return createBrowserClientSSR(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Server-side Supabase client (usado en Server Components y API Routes)
export const createServerClient = async () => {
  const cookieStore = await cookies(); // <--- AQUÍ ESTABA EL ERROR: Agregamos el await

  return createServerClientSSR(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se ignora si se llama desde un Server Component (que no puede escribir cookies)
          }
        },
      },
    }
  );
};
// Auth helpers (Validación de dominio de Phantom Pest Control)
export const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "phantompestcontrol.ca";

export function isDomainAllowed(email: string): boolean {
  return email.endsWith(`@${ALLOWED_DOMAIN}`);
}