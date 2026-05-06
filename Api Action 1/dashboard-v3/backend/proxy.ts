import { auth } from '@/backend/auth';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/api/auth',
  '/api/save-display-name',  // PowerShell script - validado por SAVE_DISPLAY_NAME_SECRET
  '/api/sync',               // Vercel cron - validado por CRON_SECRET/SYNC_SECRET
  '/api/status'              // Health check público
];

export default auth((request) => {
  const { pathname } = request.nextUrl;

  // Permitir rotas públicas
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Rota protegida sem sessão → redirect para login
  if (!request.auth) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Usuário deve trocar senha → forçar redirect
  if ((request.auth.user as { mustChangePassword: boolean }).mustChangePassword && pathname !== '/alterar-senha') {
    return NextResponse.redirect(new URL('/alterar-senha', request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((!_next/static|_next/image|favicon.ico|.*\\.docx$).*)']
};
