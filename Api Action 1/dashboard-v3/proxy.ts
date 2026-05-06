import backendProxy from '@/backend/proxy';

export default function proxy(...args: Parameters<typeof backendProxy>) {
  return backendProxy(...args);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.docx$).*)']
};
