import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_DOMAIN = "phantompestcontrol.ca";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  console.log("--- AUTH CALLBACK START ---");
  console.log("Code present:", !!code);

  if (code) {
    const cookieStore = await cookies();
    
    // 1. Creamos una respuesta base para poder adjuntarle las cookies manualmente
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: any[]) {
            // Seteamos en el store de Next.js
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
            // ¡ESTO ES LO IMPORTANTE!: Seteamos también en la respuesta que vamos a retornar
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // 2. Intercambio de código
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const email = data.session.user.email || "";

      // 3. Verificación de dominio
      if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        await supabase.auth.signOut();
        return NextResponse.redirect(
          `${origin}/login?error=Access+restricted+to+@${ALLOWED_DOMAIN}+accounts`
        );
      }

      // 4. Sincronización con Go
      if (process.env.NEXT_PUBLIC_API_URL) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me/sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.session.access_token}`,
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

      // Retornamos la respuesta que ya trae las cookies inyectadas
      return response;
    }
  }
  console.log("Auth failed: No code or no session");
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}