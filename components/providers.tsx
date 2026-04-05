"use client";
import { createClient } from "../src/lib/supabase/client"; // Importa tu utilidad, no la de la librería directamente
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,      // 30 seconds
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

// Creamos el cliente de Supabase usando el nuevo paquete SSR
  const [supabase] = useState(() =>createClient());
  return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
  );
}
