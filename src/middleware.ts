import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          }
        }
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const { pathname } = request.nextUrl

    if (!user && !pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (user && pathname === '/login') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      const role = profile?.role ?? 'employee'
      const home = role === 'admin' ? '/admin/dashboard' : role === 'supervisor' ? '/supervisor/dashboard' : '/employee/home'
      return NextResponse.redirect(new URL(home, request.url))
    }

    if (user && pathname.startsWith('/admin')) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') {
        return NextResponse.redirect(new URL('/employee/home', request.url))
      }
    }

    if (user && pathname.startsWith('/supervisor')) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (!['admin', 'supervisor'].includes(profile?.role ?? '')) {
        return NextResponse.redirect(new URL('/employee/home', request.url))
      }
    }

    return supabaseResponse
  } catch (e) {
    const { pathname } = request.nextUrl
    if (pathname.startsWith('/login') || pathname.startsWith('/auth')) return NextResponse.next()
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|models|manifest.json|sw.js|workbox|auth/callback).*)'],
}
