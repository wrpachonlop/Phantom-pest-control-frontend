import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_DOMAIN } from "@/services/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${error.message}`);
    }

    // Domain check: only allow @phantompestcontrol.ca
    const email = data.session?.user?.email || "";
    if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=Access+restricted+to+@${ALLOWED_DOMAIN}+accounts`
      );
    }

    // Sync user profile to our users table via the backend
    const accessToken = data.session?.access_token;
    if (accessToken) {
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
      } catch {
        // Non-fatal: user can still access the app
        console.error("Failed to sync user to CRM database");
      }
    }

    return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
  }

  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
