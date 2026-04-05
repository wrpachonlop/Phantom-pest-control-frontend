import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Usamos el dominio fijo de la empresa
const ALLOWED_DOMAIN = "phantompestcontrol.ca";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // "next" es el parámetro opcional para redirigir después del login
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    
    // 1. Creamos el cliente SSR manual para el Route Handler
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // 2. Intercambiamos el código por una sesión real
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const email = data.session.user.email || "";

      // 3. Verificación de dominio de seguridad (Phantom Pest Control Only)
      if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        await supabase.auth.signOut();
        return NextResponse.redirect(
          `${origin}/login?error=Access+restricted+to+@${ALLOWED_DOMAIN}+accounts`
        );
      }

      // 4. Sincronización con tu backend de Go (CRM Sync)
      const accessToken = data.session.access_token;
      if (accessToken && process.env.NEXT_PUBLIC_API_URL) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me/sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              full_name: data.session.user.user_metadata?.full_name,
              avatar_url: data.session.user.user_metadata?.avatar_url,
            }),
          });
        } catch (err) {
          console.error("Failed to sync user to CRM backend:", err);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si algo falla, regresamos al login
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}