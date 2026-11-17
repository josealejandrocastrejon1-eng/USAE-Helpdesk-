import { useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import type { AuthUser } from '../utils/helpdesk';
import { BrandLogo } from './BrandLogo';

export type PublicRoute =
  | 'inicio'
  | 'servicios'
  | 'planes'
  | 'como-funciona'
  | 'nosotros'
  | 'faq'
  | 'contacto'
  | 'auth';

export type PrivateRoute =
  | 'mi-portal'
  | 'ticket-detalle'
  | 'consola-operativa'
  | 'administracion';

export type AppRoute = PublicRoute | PrivateRoute;

interface HeaderProps {
  activeRoute: AppRoute;
  currentUser: AuthUser | null;
  onNavigate: (route: AppRoute) => void;
  onLogout: () => void;
}

export function Header({ activeRoute, currentUser, onNavigate, onLogout }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const publicLinks: { id: AppRoute; label: string }[] = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'servicios', label: 'Servicios' },
    { id: 'planes', label: 'Planes y Precios' },
    { id: 'como-funciona', label: 'Cómo Funciona' },
    { id: 'contacto', label: 'Contacto' },
  ];

  const getPrivateLinks = (user: AuthUser): { id: AppRoute; label: string }[] => {
    if (user.role === 'USUARIO') {
      return [
        { id: 'mi-portal', label: 'Mi Portal' },
        { id: 'planes', label: 'Planes MXN' },
        { id: 'faq', label: 'Ayuda y FAQ' },
        { id: 'contacto', label: 'Contacto' },
      ];
    }
    if (user.role === 'ADMINISTRADOR') {
      return [
        { id: 'administracion', label: 'Administración' },
        { id: 'consola-operativa', label: 'Consola Operativa' },
        { id: 'planes', label: 'Catálogo Público' },
      ];
    }
    return [
      { id: 'consola-operativa', label: user.role === 'SUPERVISOR' ? 'Supervisión' : 'Consola Técnica' },
      { id: 'planes', label: 'Planes' },
      { id: 'faq', label: 'Módulos y FAQ' },
    ];
  };

  const navLinks = currentUser ? getPrivateLinks(currentUser) : publicLinks;

  const handleGo = (route: AppRoute) => {
    onNavigate(route);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Logo + Wordmark */}
        <a
          href="#inicio"
          onClick={(e) => {
            e.preventDefault();
            handleGo(
              currentUser
                ? currentUser.role === 'ADMINISTRADOR'
                  ? 'administracion'
                  : currentUser.role === 'USUARIO'
                    ? 'mi-portal'
                    : 'consola-operativa'
                : 'inicio'
            );
          }}
          className="rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
        >
          <BrandLogo compact />
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav aria-label="Navegación principal" className="hidden lg:flex items-center gap-6">
          {navLinks.map((item) => {
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleGo(item.id)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700 cursor-pointer ${
                  isActive
                    ? 'text-slate-900 border-blue-700'
                    : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Auth / Primary CTA + Mobile drawer toggle */}
        <div className="flex items-center gap-3 shrink-0">
          {!currentUser ? (
            <>
              <button
                type="button"
                onClick={() => handleGo('auth')}
                className="hidden sm:inline-flex items-center text-sm font-medium text-slate-700 hover:text-slate-900 whitespace-nowrap px-2 py-1.5 cursor-pointer"
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => handleGo('planes')}
                className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Contratar Plan
              </button>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-xs text-slate-600 whitespace-nowrap max-w-[200px] truncate">
                <strong className="text-slate-900">{currentUser.fullName}</strong> · {currentUser.role}
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                Salir
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          <nav aria-label="Navegación móvil" className="flex flex-col space-y-1">
            {navLinks.map((item) => {
              const isActive = activeRoute === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleGo(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            {!currentUser && (
              <>
                <button
                  type="button"
                  onClick={() => handleGo('nosotros')}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Nosotros
                </button>
                <button
                  type="button"
                  onClick={() => handleGo('faq')}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Preguntas Frecuentes
                </button>
              </>
            )}
          </nav>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {!currentUser ? (
              <>
                <button
                  type="button"
                  onClick={() => handleGo('auth')}
                  className="w-full py-2.5 px-4 text-sm font-medium text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Iniciar Sesión / Registrarse
                </button>
                <button
                  type="button"
                  onClick={() => handleGo('planes')}
                  className="w-full py-2.5 px-4 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
                >
                  Contratar Plan
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full py-2.5 px-4 text-sm font-medium text-red-700 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100"
              >
                Cerrar Sesión ({currentUser.role})
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
