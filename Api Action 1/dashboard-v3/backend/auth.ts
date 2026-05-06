import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { getDb } from '@/backend/db/mongodb';
import { ensureBootstrapData } from '@/backend/db/bootstrap';

export type UserRole = 'ADMIN' | 'GERENTE' | 'GESTOR_BASE' | 'MANUTENCAO';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials.email || !credentials.password) return null;

        try {
          await ensureBootstrapData();
          const db = await getDb();
          const user = await db.collection('users').findOne({
            email: String(credentials.email).toLowerCase().trim(),
            isActive: true
          });

          if (!user) return null;

          const passwordMatch = await compare(String(credentials.password), String(user.passwordHash));
          if (!passwordMatch) return null;

          return {
            id: String(user._id),
            name: String(user.name),
            email: String(user.email),
            role: String(user.role) as UserRole,
            mustChangePassword: Boolean(user.mustChangePassword),
            baseId: user.baseId ? String(user.baseId) : null,
            baseName: user.baseName ? String(user.baseName) : null,
          };
        } catch {
          return null;
        }
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as { role: string }).role;
        token.mustChangePassword = (user as unknown as { mustChangePassword: boolean }).mustChangePassword;
        token.baseId = (user as unknown as { baseId: string | null }).baseId ?? null;
        token.baseName = (user as unknown as { baseName: string | null }).baseName ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as unknown as { role: string }).role = token.role as string;
        (session.user as unknown as { mustChangePassword: boolean }).mustChangePassword = token.mustChangePassword as boolean;
        (session.user as unknown as { baseId: string | null }).baseId = token.baseId as string | null;
        (session.user as unknown as { baseName: string | null }).baseName = token.baseName as string | null;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login'
  },
  session: { strategy: 'jwt' }
});
