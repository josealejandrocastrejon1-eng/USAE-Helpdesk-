import { USAE_CONTACT } from '../utils/helpdesk';
import { BrandLogo } from './BrandLogo';
import type { AppRoute } from './Header';

interface FooterProps {
  onNavigate: (route: AppRoute) => void;
  onOpenLegal: (type: 'privacy' | 'terms') => void;
}

export function Footer({ onNavigate, onOpenLegal }: FooterProps) {
  return (
    <footer className="bg-white border-t border-slate-200 mt-16 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          <div className="md:col-span-2">
            <BrandLogo compact />
            <p className="mt-2.5 text-sm font-medium text-slate-700">
              {USAE_CONTACT.company} · &ldquo;{USAE_CONTACT.slogan}&rdquo;
            </p>
            <p className="mt-2 text-sm text-slate-600 max-w-md leading-relaxed">
              {USAE_CONTACT.location} · Zona horaria {USAE_CONTACT.timezone} · Moneda{' '}
              {USAE_CONTACT.currency}.
            </p>
          </div>

          <div className="space-y-1.5 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Canales Oficiales</p>
            <p>{USAE_CONTACT.email}</p>
            <p className="tabular-nums">Tel / WhatsApp: {USAE_CONTACT.phones.join(' · ')}</p>
            <p className="text-xs text-slate-500 pt-1">{USAE_CONTACT.businessHoursLabel}</p>
            <p className="text-xs text-slate-500">
              Guardia 24/7 únicamente en planes Corporativo y Protección Total.
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold text-slate-900">Sitio y Documentación Legal</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-600">
              <button
                type="button"
                onClick={() => onNavigate('inicio')}
                className="text-left hover:text-slate-900 cursor-pointer"
              >
                Inicio
              </button>
              <button
                type="button"
                onClick={() => onNavigate('servicios')}
                className="text-left hover:text-slate-900 cursor-pointer"
              >
                Servicios
              </button>
              <button
                type="button"
                onClick={() => onNavigate('planes')}
                className="text-left hover:text-slate-900 cursor-pointer"
              >
                Planes y Precios
              </button>
              <button
                type="button"
                onClick={() => onNavigate('como-funciona')}
                className="text-left hover:text-slate-900 cursor-pointer"
              >
                Cómo Funciona
              </button>
              <button
                type="button"
                onClick={() => onNavigate('nosotros')}
                className="text-left hover:text-slate-900 cursor-pointer"
              >
                Nosotros
              </button>
              <button
                type="button"
                onClick={() => onNavigate('faq')}
                className="text-left hover:text-slate-900 cursor-pointer"
              >
                Preguntas Frecuentes
              </button>
              <button
                type="button"
                onClick={() => onNavigate('contacto')}
                className="text-left hover:text-slate-900 cursor-pointer"
              >
                Contacto
              </button>
              <button
                type="button"
                onClick={() => onNavigate('auth')}
                className="text-left hover:text-slate-900 cursor-pointer"
              >
                Acceso al Portal
              </button>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-xs text-slate-500">
              <button
                type="button"
                onClick={() => onOpenLegal('privacy')}
                className="underline underline-offset-4 hover:text-slate-800 cursor-pointer"
              >
                Aviso de Privacidad
              </button>
              <button
                type="button"
                onClick={() => onOpenLegal('terms')}
                className="underline underline-offset-4 hover:text-slate-800 cursor-pointer"
              >
                Términos y Condiciones
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-slate-500">
          <p>© 2026 USAE · {USAE_CONTACT.slogan}</p>
          <p>Soporte TI, Ciberseguridad, Desarrollo Web y Portal de Suscripciones MXN</p>
        </div>
      </div>
    </footer>
  );
}
