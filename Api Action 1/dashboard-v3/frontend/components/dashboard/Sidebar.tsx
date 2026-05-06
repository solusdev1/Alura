'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const ADMIN_ITEMS = [
  { label: 'Bases', href: '/dashboard/admin/bases' },
  { label: 'Usuários', href: '/dashboard/admin/usuarios' }
];

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 7l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 12h10a4 4 0 0 1 4 4v1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SidebarSection({
  title,
  items,
  pathname
}: {
  title: string;
  items: Array<{ label: string; href: string; exact?: boolean }>;
  pathname: string;
}) {
  return (
    <>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
        {title}
      </p>

      <div className="space-y-1.5">
        {items.map(item => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-2xl px-4 py-3 text-lg transition-colors ${
                isActive
                  ? 'bg-slate-200/90 font-semibold text-slate-950 shadow-sm dark:bg-white/10 dark:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </>
  );
}

export default function Sidebar({ userName, userRole }: { userName: string; userRole: string }) {
  const pathname = usePathname();
  const isAdmin = userRole === 'ADMIN';
  const isMaintenance = userRole === 'MANUTENCAO';
  const [darkMode, setDarkMode] = useState(true);
  const navItems = isMaintenance
     ? [
        { label: 'Dashboard', href: '/dashboard', exact: true },
        { label: 'Equipamentos', href: '/dashboard/equipamentos' },
        { label: 'Movimentações', href: '/dashboard/movimentacoes' }
      ]
    : [
        { label: 'Dashboard', href: '/dashboard', exact: true },
        { label: 'Equipamentos', href: '/dashboard/equipamentos' },
        { label: 'Movimentações', href: '/dashboard/movimentacoes' },
        { label: 'Solicitações', href: '/dashboard/solicitacoes' },
        { label: 'Relatórios', href: '/dashboard/relatorios' },
        { label: 'Termos', href: '/dashboard/termos' }
      ];

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('themeMode') : null;
    const initialDark = saved !== 'light';
    setDarkMode(initialDark);
    document.documentElement.classList.toggle('dark', initialDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);

    if (typeof window !== 'undefined') {
      localStorage.setItem('themeMode', darkMode ? 'dark' : 'light');
      window.dispatchEvent(new CustomEvent('theme-change', { detail: { dark: darkMode } }));
    }
  }, [darkMode]);

  const roleLabel = userRole === 'ADMIN'
     ? 'ADMINISTRADOR GLOBAL'
    : userRole === 'GERENTE'
      ? 'GERENTE'
      : userRole === 'MANUTENCAO'
        ? 'CENTRAL DE MANUTENCAO'
        : 'GESTOR DE BASE';

  return (
    <aside className="w-full shrink-0 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-[#090d14] lg:h-screen lg:w-80 lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <div className="flex min-h-full flex-col gap-3 p-3 sm:p-4">
        <div className="rounded-[30px] border border-slate-200 bg-white px-7 py-7 text-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:border-slate-700/60 dark:bg-[#131a2d] dark:text-white">
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-semibold tracking-[0.35em] text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            TI CONTROLE
          </span>

          <h1 className="mt-6 text-[28px] font-bold leading-tight text-slate-950 dark:text-white">
            Centro de
            <br />
            comando
          </h1>

          <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">
            Operação, aprovação e auditoria em um shell único para a rotina de inventário.
          </p>

          <div className="mt-8 border-t border-slate-200 pt-8 dark:border-white/10">
            <SidebarSection title="Principal" items={navItems} pathname={pathname} />

            {isAdmin ? (
              <div className="mt-7">
                <SidebarSection title="Administração" items={ADMIN_ITEMS} pathname={pathname} />
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 text-slate-900 shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#20283c] dark:text-white lg:mt-auto">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-semibold text-slate-700 dark:bg-white/10 dark:text-white">
              {userName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-slate-950 dark:text-white">{userName}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.35em] text-slate-500 dark:text-slate-300">{roleLabel}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setDarkMode(prev => !prev)}
              className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:border-[#40507a] dark:bg-[#18233d] dark:text-slate-200 dark:hover:bg-[#1c2947] dark:hover:text-white"
              aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
              <span>{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 dark:border-[#40507a] dark:bg-[#18233d] dark:text-slate-200 dark:hover:bg-[#1c2947] dark:hover:text-white"
            >
              <ArrowIcon />
              <span>Sair do Sistema</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
