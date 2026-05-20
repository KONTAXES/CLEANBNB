import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', user.id)
          .single()

        if (!existing) {
          const displayName =
            user.user_metadata?.full_name ??
            user.email?.split('@')[0] ??
            'Usuario'
          await supabase.from('profiles').insert({
            id: user.id,
            display_name: displayName,
            role: 'employee',
            is_active: true,
          })
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        const role = profile?.role ?? 'employee'
        const home =
          role === 'admin' ? '/admin/dashboard' :
          role === 'supervisor' ? '/supervisor/dashboard' :
          '/employee/home'
        return NextResponse.redirect(`${origin}${home}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
