import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refreshes the Supabase session cookies on every request.
 * Auth redirects are handled by Clerk middleware (middleware.ts at project root).
 * Do NOT add Supabase-based redirects here — they will conflict with Clerk.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — keeps Supabase cookies in sync.
  // IMPORTANT: Do not add any code between createServerClient and getClaims().
  await supabase.auth.getClaims()

  // IMPORTANT: Return supabaseResponse as-is to preserve cookie state.
  return supabaseResponse
}
