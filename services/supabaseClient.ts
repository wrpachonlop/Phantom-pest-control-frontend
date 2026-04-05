import { createBrowserClient as createBrowserClientSSR } from "@supabase/ssr";
export const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "phantompestcontrol.ca";
export const createBrowserClient = () => {
  return createBrowserClientSSR(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};