import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Cpu,
  Lock,
  PhoneCall,
  Server,
  Shield,
  Sliders,
} from 'lucide-react';
import heroImage from '../../assets/images/hero_usae_portal_1794737440309.jpg';
import { formatMXN, USAE_CONTACT, type AuthUser, type ServicePlan } from '../../utils/helpdesk';
import type { AppRoute } from '../Header';

interface PublicHomeProps {
  plans: ServicePlan[];
  currentUser: AuthUser | null;
  onNavigate: (route: AppRoute) => void;
  onSelectPlanForAction: (plan: ServicePlan) => void;
}

export function PublicHome({
  plans,
  currentUser,
  onNavigate,
  onSelectPlanForAction,
}: PublicHomeProps) {
  const featuredPlans = plans.filter((p) =>
    ['INF-ESENCIAL', 'INF-EMPRESARIAL', 'INF-CORPORATIVO', 'SEC-TOTAL'].includes(p.code)
  );

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-slate-900 text-white border border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 space-y-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-300">
              USAE Helpdesk · Ciudad Nezahualcóyotl, Estado de México
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight leading-[1.12] balance-text">
              {USAE_CONTACT.slogan}
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Soporte técnico profesional, administración de infraestructura TI, ciberseguridad y
              desarrollo web corporativo con niveles de servicio (SLA P1–P4), control de activos y
              portal de atención en MXN.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('planes')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Comparar Planes MXN
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('contacto')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-100 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Solicitar Cotización
              </button>
              <button
                type="button"
                onClick={() =>
                  onNavigate(
                    currentUser
                      ? currentUser.role === 'USUARIO'
                        ? 'mi-portal'
                        : currentUser.role === 'ADMINISTRADOR'
                          ? 'administracion'
                          : 'consola-operativa'
                      : 'auth'
                  )
                }
                className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-blue-200 hover:text-white underline underline-offset-4 cursor-pointer"
              >
                <Lock className="w-4 h-4" aria-hidden="true" />
                {currentUser ? 'Ir a Mi Portal' : 'Entrar al Portal'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 h-64 sm:h-80 lg:h-full min-h-[320px] relative">
            <img
              src={heroImage}
              alt="Centro de soporte e infraestructura tecnológica USAE"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* 4 Service Pillars */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Soluciones Tecnológicas Especializadas
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Operación centralizada con inventario de equipos, mantenimiento programado y trazabilidad
              completa.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('servicios')}
            className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
          >
            Ver detalle de servicios
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <Server className="w-6 h-6 text-blue-700" aria-hidden="true" />
            <h3 className="font-display text-base font-bold text-slate-900">
              TI e Infraestructura
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Mesa de ayuda N1/N2/N3, monitoreo de red y servidores, respaldos y visitas en sitio con
              hoja de servicio.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <Shield className="w-6 h-6 text-blue-700" aria-hidden="true" />
            <h3 className="font-display text-base font-bold text-slate-900">Ciberseguridad</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Hardening UEFI/Secure Boot, control de firewall y antimalware, revisión RBAC y
              contención de incidentes.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <Code2 className="w-6 h-6 text-blue-700" aria-hidden="true" />
            <h3 className="font-display text-base font-bold text-slate-900">Desarrollo Web</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Landing pages y portales corporativos responsivos con panel administrativo, analítica y
              garantía técnica.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <Sliders className="w-6 h-6 text-blue-700" aria-hidden="true" />
            <h3 className="font-display text-base font-bold text-slate-900">
              Consultoría a Medida
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Levantamiento de requerimientos, integraciones SMTP, WhatsApp o Moodle y despliegue por
              fases bajo NDA.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Plans Preview */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Planes Corporativos en MXN
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Transparencia total en alcance, equipos cubiertos, plazos y horarios de atención.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('planes')}
            className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
          >
            Ver los 8 planes y comparativa completa
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredPlans.map((plan) => (
            <article
              key={plan.code}
              className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-slate-500">{plan.code}</span>
                  <span className="text-xs font-medium text-blue-700">
                    {plan.is24_7 ? 'Guardia 24/7' : 'Horario laboral'}
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900">{plan.title}</h3>
                <p className="font-display text-2xl font-bold text-slate-900 tabular-nums">
                  {plan.priceMXN !== null ? formatMXN(plan.priceMXN) : 'A cotización'}
                  {plan.billingPeriod === 'MENSUAL' && (
                    <span className="text-xs font-normal text-slate-500"> MXN / mes</span>
                  )}
                </p>
                <p className="text-xs text-slate-600">
                  {plan.duration} · Hasta {plan.maxEquipments} equipos
                </p>
                <ul className="space-y-1.5 pt-2 border-t border-slate-100">
                  {plan.scope.slice(0, 3).map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2
                        className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onSelectPlanForAction(plan)}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
              >
                Contratar Plan
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* How It Works Strip */}
      <section className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">
              Flujo de Contratación y Operación
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Sin sorpresas: cada suscripción se activa tras confirmar el pago y habilita el portal
              integral de tickets.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('como-funciona')}
            className="text-sm font-semibold text-blue-700 hover:text-blue-800 cursor-pointer"
          >
            Conocer el proceso completo
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Elige plan y regístrate',
              desc: 'Compara coberturas en MXN, crea tu cuenta corporativa y verifica tu correo.',
            },
            {
              step: '02',
              title: 'Pago verificable',
              desc: 'Paga vía Mercado Pago o registra tu transferencia SPEI para validación administrativa.',
            },
            {
              step: '03',
              title: 'Registra activos y tickets',
              desc: 'Da de alta tus equipos EQP y levanta tickets con folio atómico y SLA asignado.',
            },
            {
              step: '04',
              title: 'Cierre y Hoja de Servicio',
              desc: 'Recibe diagnóstico, evidencias privadas, hoja imprimible y encuesta de satisfacción.',
            },
          ].map((item) => (
            <div key={item.step} className="space-y-2">
              <span className="font-mono text-xs font-bold text-blue-700">PASO {item.step}</span>
              <h3 className="font-display text-sm font-bold text-slate-900">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Direct Support & Contact Banner */}
      <section className="bg-slate-900 text-white rounded-2xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-300 uppercase tracking-wider">
            <Cpu className="w-4 h-4" aria-hidden="true" />
            Atención Comercial y Técnica USAE
          </div>
          <h2 className="font-display text-xl font-bold">
            ¿Necesitas una arquitectura multisucursal o proyecto a medida?
          </h2>
          <p className="text-sm text-slate-300">
            {USAE_CONTACT.businessHoursLabel} · {USAE_CONTACT.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('contacto')}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" aria-hidden="true" />
            Contactar a USAE
          </button>
          <button
            type="button"
            onClick={() => onNavigate('faq')}
            className="px-4 py-2.5 text-sm font-medium text-white border border-slate-700 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            Preguntas Frecuentes
          </button>
        </div>
      </section>
    </div>
  );
}
