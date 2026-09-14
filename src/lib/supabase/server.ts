import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured.");
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try {
          for (const { name, value, options } of items) cookieStore.set(name, value, options);
        } catch {
          // Server Components cannot always write cookies. The auth callback and
          // proxy perform refresh writes; reads remain valid here.
        }
      },
    },
  });
}
