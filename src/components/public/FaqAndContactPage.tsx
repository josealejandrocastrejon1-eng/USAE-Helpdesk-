import { useState, type FormEvent } from 'react';
import { CheckCircle2, Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { USAE_CONTACT, type ServicePlan } from '../../utils/helpdesk';

interface FaqAndContactPageProps {
  mode: 'faq' | 'contact';
  plans: ServicePlan[];
  initialPlanCode?: string;
  onOpenLegal: (type: 'privacy' | 'terms') => void;
}

const FAQS = [
  {
    q: '¿Puedo crear un ticket sin tener un plan contratado?',
    a: 'No. Los visitantes deben registrarse, verificar su correo e iniciar sesión. Si tu cuenta está en estado SIN_PLAN o VENCIDO, puedes consultar el catálogo, tus pagos e historial previo, pero la creación de nuevos tickets está protegida hasta activar un plan vigente.',
  },
  {
    q: '¿Cómo se activan los planes con Mercado Pago o transferencia SPEI?',
    a: 'En pagos por Mercado Pago, la activación ocurre únicamente cuando nuestro backend recibe y valida la firma del webhook oficial y confirma el estado aprobado servidor-a-servidor. En transferencias SPEI, el pago queda en PAGO_EN_REVISION hasta que Administración valida el abono.',
  },
  {
    q: '¿Qué pasa cuando vence mi suscripción?',
    a: 'Tu plan cambia a estado VENCIDO automáticamente al terminar la vigencia. Conservas acceso a tu cuenta, historial de tickets y recibos de pago, pero no podrás levantar nuevos tickets hasta renovar.',
  },
  {
    q: '¿Tienen atención 24/7 en todos los planes?',
    a: 'No. La cobertura 24/7 aplica exclusivamente a los planes Plan Corporativo (INF-CORPORATIVO) y Plan Protección Total (SEC-TOTAL). Los demás planes operan en horario laboral (Lunes a Viernes 09:00–18:00 h y Sábados 09:00–14:00 h, hora Centro de México).',
  },
  {
    q: '¿Las notas internas de los técnicos son visibles para el cliente?',
    a: 'Nunca. El backend filtra estrictamente cualquier nota marcada como interna (isInternal) y los metadatos privados antes de responder al portal del cliente.',
  },
  {
    q: '¿Cómo funcionan las evidencias adjuntas y la privacidad de archivos?',
    a: 'Solo se admiten archivos seguros (PNG, JPG, WEBP, PDF, TXT, CSV, LOG, XLSX, DOCX) hasta 10 MB. Nunca se exponen en carpetas públicas; su descarga exige sesión autenticada y validación de pertenencia sobre el ticket.',
  },
  {
    q: '¿Cuáles son las reglas de cancelación y garantías?',
    a: 'Los planes mensuales indican su plazo mínimo (3, 6 o 12 meses) y requieren aviso de 30 días naturales. En Desarrollo Web (DEV-BASICO / DEV-PRO), se solicita 50% de anticipo no reembolsable y 50% contra entrega con garantía técnica de 30 o 60 días.',
  },
];

export function FaqAndContactPage({
  mode,
  plans,
  initialPlanCode,
  onOpenLegal,
}: FaqAndContactPageProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [planCode, setPlanCode] = useState(initialPlanCode || 'CUSTOM');
  const [subject, setSubject] = useState(
    initialPlanCode ? `Cotización / Consulta sobre ${initialPlanCode}` : ''
  );
  const [message, setMessage] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    const res = await apiRequest('/api/public/contact', {
      method: 'POST',
      body: {
        fullName,
        email,
        phone,
        company,
        planCode,
        subject,
        message,
        consentAccepted,
      },
    });

    setSubmitting(false);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setFullName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setSubject('');
      setMessage('');
      setConsentAccepted(false);
    }
  };

  if (mode === 'faq') {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
            Centro de Ayuda Comercial y Operativa
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900">
            Preguntas Frecuentes (FAQ)
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
            Respuestas claras sobre contratación, pagos, activación, SLA, evidencias y
            cancelaciones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FAQS.map((item) => (
            <article
              key={item.q}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-2"
            >
              <h2 className="font-display text-base font-bold text-slate-900">{item.q}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
            </article>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-5 space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
            Contacto Directo y Cotizaciones
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900">
            Hablemos de tu Infraestructura
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Solicita cotización para proyectos personalizados (CUSTOM) o resuelve dudas comerciales
            antes de contratar.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 text-sm text-slate-700">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-slate-900">Correo oficial</p>
              <p>{USAE_CONTACT.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-slate-900">Teléfonos y WhatsApp</p>
              <p className="tabular-nums">{USAE_CONTACT.phones.join(' · ')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-slate-900">Ubicación operativa</p>
              <p>{USAE_CONTACT.location}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-slate-900">Horario de atención</p>
              <p className="text-xs text-slate-600 mt-0.5">{USAE_CONTACT.businessHoursLabel}</p>
              <p className="text-xs text-slate-500 mt-1">
                Guardia 24/7 exclusiva para contratos Corporativo y Protección Total.
              </p>
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4"
      >
        <h2 className="font-display text-xl font-bold text-slate-900">
          Formulario de Contacto y Cotización
        </h2>

        {feedback && (
          <div
            role="status"
            className={`p-3.5 rounded-lg border text-sm flex items-start gap-2 ${
              feedback.ok
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {feedback.ok && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />}
            <span>{feedback.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-700">Nombre completo *</span>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej. Laura Hernández"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-700">Correo electrónico *</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contacto@empresa.mx"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-700">Teléfono / WhatsApp</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+52 55..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-700">Empresa / Razón Social</span>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Empresa S.A. de C.V."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-700">Servicio o Plan de Interés</span>
            <select
              value={planCode}
              onChange={(e) => setPlanCode(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {plans.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.code} — {p.title}
                </option>
              ))}
              <option value="GENERAL">Consulta general</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-700">Asunto *</span>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Solicitud de cotización o información"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-semibold text-slate-700">Detalle de tu requerimiento *</span>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe cuántos equipos o sucursales deseas cubrir, o los objetivos del proyecto..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </label>

        <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={consentAccepted}
            onChange={(e) => setConsentAccepted(e.target.checked)}
            className="mt-0.5 rounded border-slate-300"
          />
          <span>
            Acepto el{' '}
            <button
              type="button"
              onClick={() => onOpenLegal('privacy')}
              className="text-blue-700 underline cursor-pointer"
            >
              Aviso de Privacidad
            </button>{' '}
            y los{' '}
            <button
              type="button"
              onClick={() => onOpenLegal('terms')}
              className="text-blue-700 underline cursor-pointer"
            >
              Términos y Condiciones
            </button>{' '}
            para que USAE atienda esta solicitud comercial.
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 cursor-pointer"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          {submitting ? 'Enviando...' : 'Enviar Solicitud'}
        </button>
      </form>
    </div>
  );
}
