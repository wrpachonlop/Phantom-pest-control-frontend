// =============================================================
// Supabase client instances for client + server components
// =============================================================

import { createClientComponentClient, createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Client-side Supabase client (browser components)
export const createBrowserClient = () => createClientComponentClient();

// Server-side Supabase client (Server Components / Route Handlers)
export const createServerClient = () =>
  createServerComponentClient({ cookies });

// Auth helpers
export const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "phantompestcontrol.ca";

export function isDomainAllowed(email: string): boolean {
  return email.endsWith(`@${ALLOWED_DOMAIN}`);
}
