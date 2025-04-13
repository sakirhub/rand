import {createMiddlewareClient} from '@supabase/auth-helpers-nextjs';
import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();

    // API route'larını atla
    if (req.nextUrl.pathname.startsWith('/api/')) {
        return res;
    }

    const supabase = createMiddlewareClient({req, res});
    await supabase.auth.getSession();
    return res;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 