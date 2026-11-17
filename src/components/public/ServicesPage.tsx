import { ArrowRight, CheckCircle2, Code2, Server, Shield, Sliders } from 'lucide-react';
import infraImage from '../../assets/images/kb_network_infra_1794737439854.jpg';
import adminImage from '../../assets/images/kb_digital_admin_1794737440027.jpg';
import type { AppRoute } from '../Header';

interface ServicesPageProps {
  onNavigate: (route: AppRoute) => void;
}

export function ServicesPage({ onNavigate }: ServicesPageProps) {
  const services = [
    {
      icon: Server,
      title: 'TI e Infraestructura Corporativa',
      subtitle: 'Planes Esencial, Empresarial y Corporativo',
      bullets: [
        'Mesa de ayuda remota N1/N2/N3 con folios atómicos USAE-YYYY-XXXXXX',
        'Monitoreo de rendimiento (Perfmon, latencia de disco, pagefile, controladores)',
        'Administración de servidores Windows / Linux y respaldos programados',
        'Visitas presenciales en sitio con Hoja de Servicio imprimible (según plan)',
      ],
    },
    {
      icon: Shield,
      title: 'Ciberseguridad y Hardening',
      subtitle: 'Planes Seguridad Básico y Protección Total',
      bullets: [
        'Validación de UEFI, Secure Boot, UAC, VBS y firmas digitales de controladores',
        'Verificación continua de antimalware y firewall corporativo',
        'Revisión de privilegios RBAC, escaneo mensual y contención P1 24/7 en Protección Total',
        'Manejo confidencial de evidencias y expedientes bajo NDA',
      ],
    },
    {
      icon: Code2,
      title: 'Desarrollo Web Corporativo',
      subtitle: 'Planes Básico y Profesional',
      bullets: [
        'Landing pages y sitios corporativos de hasta 8 secciones con diseño responsive',
        'Integración con WhatsApp Business, formularios seguros y Google Analytics',
        'Panel administrativo, SEO técnico básico y capacitación de entrega',
        'Esquema 50% anticipo / 50% contra entrega con garantía técnica de 30 o 60 días',
      ],
    },
    {
      icon: Sliders,
      title: 'Consultoría e Integraciones a Medida',
      subtitle: 'Servicio CUSTOM bajo cotización formal',
      bullets: [
        'Levantamiento técnico de requerimientos y arquitectura dedicada',
        'Integración SMTP/IMAP, Google Workspace/Drive, Moodle o automatización de flujos',
        'Implementación por fases con entregables verificables',
        'Soporte y capacitación operativa personalizada para tu equipo',
      ],
    },
  ];

  return (
    <div className="space-y-10">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col lg:flex-row gap-8 items-center">
        <div className="space-y-4 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
            Portafolio de Servicios USAE
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900 balance-text">
            Infraestructura confiable, seguridad verificable y soporte trazable
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Cada servicio opera bajo alcances contractuales claros, horario publicado y niveles de
            respuesta medibles. Los planes Corporativo y Protección Total ofrecen cobertura 24/7;
            el resto opera en horario laboral de la Ciudad de México.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('planes')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 cursor-pointer"
            >
              Ver Planes y Precios
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('contacto')}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Solicitar Cotización Personalizada
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full lg:w-96 shrink-0">
          <img
            src={infraImage}
            alt="Infraestructura de red y servidores"
            className="w-full h-44 object-cover rounded-xl border border-slate-200"
          />
          <img
            src={adminImage}
            alt="Administración digital y mesa de ayuda"
            className="w-full h-44 object-cover rounded-xl border border-slate-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((svc) => {
          const Icon = svc.icon;
          return (
            <article
              key={svc.title}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700 shrink-0">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">{svc.title}</h2>
                  <p className="text-xs font-medium text-slate-500">{svc.subtitle}</p>
                </div>
              </div>
              <ul className="space-y-2 pt-2 border-t border-slate-100">
                {svc.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
