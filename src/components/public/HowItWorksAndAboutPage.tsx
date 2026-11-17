import { ArrowRight, Building2, CheckCircle2, MapPin, ShieldCheck } from 'lucide-react';
import { USAE_CONTACT } from '../../utils/helpdesk';
import { BrandLogo } from '../BrandLogo';
import type { AppRoute } from '../Header';

interface HowItWorksProps {
  mode: 'how-it-works' | 'about';
  onNavigate: (route: AppRoute) => void;
}

export function HowItWorksAndAboutPage({ mode, onNavigate }: HowItWorksProps) {
  if (mode === 'about') {
    return (
      <div className="space-y-10">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-5">
          <BrandLogo />
          <h1 className="font-display text-3xl font-bold text-slate-900">
            Sobre USAE — {USAE_CONTACT.slogan}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
            USAE es una organización especializada en infraestructura tecnológica, soporte técnico
            empresarial, ciberseguridad y desarrollo web, con base operativa en{' '}
            <strong className="text-slate-900">{USAE_CONTACT.location}</strong>. Nuestro sistema{' '}
            {USAE_CONTACT.systemName} centraliza la atención de incidencias, control de inventario
            técnico (EQP), programación de mantenimientos y cumplimiento de acuerdos de nivel de
            servicio (SLA).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
              <MapPin className="w-5 h-5 text-blue-700" aria-hidden="true" />
              <h2 className="font-display text-sm font-bold text-slate-900">Sede Operativa</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {USAE_CONTACT.location}. Atención remota nacional y cobertura presencial programada
                en Zona Metropolitana del Valle de México.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
              <Building2 className="w-5 h-5 text-blue-700" aria-hidden="true" />
              <h2 className="font-display text-sm font-bold text-slate-900">
                Modelo Operativo Dual
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dirección Comercial B2B y Dirección Técnica N1/N2/N3 integradas con bitácoras de
                auditoría, expedientes corporativos y contratos SLA.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
              <ShieldCheck className="w-5 h-5 text-blue-700" aria-hidden="true" />
              <h2 className="font-display text-sm font-bold text-slate-900">
                Confidencialidad y Seguridad
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Resguardo de información técnica y fiscal bajo acuerdos de confidencialidad (NDA),
                control de acceso por roles (RBAC) y trazabilidad completa.
              </p>
            </div>
          </div>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('planes')}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 cursor-pointer"
            >
              Ver Planes y Precios
            </button>
            <button
              type="button"
              onClick={() => onNavigate('contacto')}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Contactar al Equipo
            </button>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    {
      num: '01',
      title: 'Selección de Plan en Catálogo Público',
      desc: 'Consulta sin iniciar sesión los 8 planes en MXN, límites de equipos, horarios y garantías.',
    },
    {
      num: '02',
      title: 'Registro y Verificación de Correo',
      desc: 'Crea tu cuenta corporativa aceptando el Aviso de Privacidad y Términos. Tu cuenta inicia en estado SIN_PLAN.',
    },
    {
      num: '03',
      title: 'Pago Verificable (Mercado Pago o SPEI)',
      desc: 'Genera tu orden de pago desde tu portal autenticado. Nunca se activa un plan sin confirmación autorizada del servidor o validación SPEI.',
    },
    {
      num: '04',
      title: 'Activación y Alta de Activos EQP',
      desc: 'Al aprobarse el pago, tu suscripción pasa a ACTIVO con fechas de vigencia y puedes registrar tus equipos cubiertos.',
    },
    {
      num: '05',
      title: 'Creación y Seguimiento de Tickets SLA',
      desc: 'Levanta tickets en las categorías cubiertas por tu plan. El sistema genera folio atómico USAE-YYYY-XXXXXX y calcula tu SLA.',
    },
    {
      num: '06',
      title: 'Resolución, Evidencias y Hoja de Servicio',
      desc: 'Consulta avances públicos y evidencias privadas, confirma el cierre, califica (1–5) e imprime la Hoja de Servicio en sitio.',
    },
  ];

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
          Operación Paso a Paso
        </p>
        <h1 className="font-display text-3xl font-bold text-slate-900">
          Cómo Funciona USAE Helpdesk
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
          Proceso transparente desde la selección del servicio hasta el cierre certificado de cada
          ticket.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {steps.map((s) => (
          <div key={s.num} className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <span className="font-mono text-xs font-bold text-blue-700">ETAPA {s.num}</span>
            <h2 className="font-display text-lg font-bold text-slate-900">{s.title}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 text-white rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-display text-base font-bold">
              ¿Listo para comenzar? El registro es gratuito y sin cargos automáticos.
            </p>
            <p className="text-xs text-slate-300 mt-0.5">
              Puedes explorar tu portal y contratar un plan cuando tu empresa lo apruebe.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('auth')}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-lg hover:bg-slate-100 shrink-0 cursor-pointer"
        >
          Crear Cuenta / Entrar
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
