import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  CreditCard,
  FileText,
  HardDrive,
  Lock,
  Plus,
  Printer,
  ShieldAlert,
  Ticket as TicketIcon,
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import {
  canPlanCoverCategory,
  formatDateShort,
  formatDateTime,
  formatMXN,
  isSubscriptionActive,
  TICKET_CATEGORIES,
  TICKET_DEPARTMENTS,
  TICKET_PRIORITIES,
  type AuthUser,
  type EquipmentAsset,
  type MaintenanceRecord,
  type NotificationRecord,
  type PaymentMethodType,
  type PaymentRecord,
  type ServicePlan,
  type SubscriptionRecord,
  type Ticket,
  type TicketCategory,
  type TicketDepartment,
  type TicketPriority,
} from '../../utils/helpdesk';
import { BrandLogo } from '../BrandLogo';
import {
  EquipmentHealthLabel,
  TicketPriorityLabel,
  TicketStatusLabel,
} from '../StatusIndicator';

interface ClientPortalProps {
  currentUser: AuthUser;
  plans: ServicePlan[];
  initialCheckoutPlan: ServicePlan | null;
  onClearCheckoutPlan: () => void;
  onOpenTicket: (ticket: Ticket) => void;
  onRequestQuote: (plan?: ServicePlan) => void;
  onRefreshSession: () => Promise<void>;
}

type PortalTab = 'tickets' | 'plans-payments' | 'assets' | 'maintenances' | 'account';

export function ClientPortal({
  currentUser,
  plans,
  initialCheckoutPlan,
  onClearCheckoutPlan,
  onOpenTicket,
  onRequestQuote,
  onRefreshSession,
}: ClientPortalProps) {
  const [tab, setTab] = useState<PortalTab>(initialCheckoutPlan ? 'plans-payments' : 'tickets');
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [subHistory, setSubHistory] = useState<SubscriptionRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [equipments, setEquipments] = useState<EquipmentAsset[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [clientDossier, setClientDossier] = useState<{
    clientId: string;
    legalName: string;
    tradeName: string;
    rfc: string;
    billingEmail: string;
    postalCode: string;
  } | null>(null);

  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Create Ticket modal/form
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [tDept, setTDept] = useState<TicketDepartment>('Infraestructura & TI');
  const [tCat, setTCat] = useState<TicketCategory>('Hardware y Diagnóstico');
  const [tPri, setTPri] = useState<TicketPriority>('MEDIA');
  const [tEqp, setTEqp] = useState('');
  const [tMode, setTMode] = useState<'REMOTO' | 'EN SITIO'>('REMOTO');
  const [tSubject, setTSubject] = useState('');
  const [tDesc, setTDesc] = useState('');

  // Checkout state
  const [checkoutPlan, setCheckoutPlan] = useState<ServicePlan | null>(initialCheckoutPlan);
  const [payMethod, setPayMethod] = useState<PaymentMethodType>('SPEI');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [speiRef, setSpeiRef] = useState('');
  const [editingSpeiPayId, setEditingSpeiPayId] = useState<string | null>(null);
  const [speiRefDraft, setSpeiRefDraft] = useState('');
  const [receiptPayment, setReceiptPayment] = useState<PaymentRecord | null>(null);

  // New Asset state
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [eqHostname, setEqHostname] = useState('');
  const [eqBrand, setEqBrand] = useState('');
  const [eqOs, setEqOs] = useState('Windows 11 Pro');

  // Account edit state
  const [accPhone, setAccPhone] = useState(currentUser.phone);
  const [accRfc, setAccRfc] = useState(currentUser.rfc || '');
  const [accBillingEmail, setAccBillingEmail] = useState(currentUser.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const loadPortalData = async () => {
    setLoading(true);
    const [accRes, payRes, tktRes, eqRes, mntRes] = await Promise.all([
      apiRequest<{
        subscription: SubscriptionRecord | null;
        subscriptionHistory: SubscriptionRecord[];
        client: typeof clientDossier;
        notifications: NotificationRecord[];
      }>('/api/account'),
      apiRequest<{ payments: PaymentRecord[] }>('/api/payments'),
      apiRequest<{ tickets: Ticket[] }>('/api/tickets'),
      apiRequest<{ equipments: EquipmentAsset[] }>('/api/assets'),
      apiRequest<{ maintenances: MaintenanceRecord[] }>('/api/maintenances'),
    ]);

    if (accRes.ok && accRes.data) {
      setSubscription(accRes.data.subscription);
      setSubHistory(accRes.data.subscriptionHistory || []);
      setClientDossier(accRes.data.client);
      setNotifications(accRes.data.notifications || []);
      if (accRes.data.client) {
        setAccRfc(accRes.data.client.rfc || '');
        setAccBillingEmail(accRes.data.client.billingEmail || currentUser.email);
      }
    }
    if (payRes.ok && payRes.data) setPayments(payRes.data.payments);
    if (tktRes.ok && tktRes.data) setTickets(tktRes.data.tickets);
    if (eqRes.ok && eqRes.data) setEquipments(eqRes.data.equipments);
    if (mntRes.ok && mntRes.data) setMaintenances(mntRes.data.maintenances);
    setLoading(false);
  };

  useEffect(() => {
    void loadPortalData();
  }, []);

  useEffect(() => {
    if (initialCheckoutPlan) {
      setCheckoutPlan(initialCheckoutPlan);
      setTab('plans-payments');
    }
  }, [initialCheckoutPlan]);

  const activePlan = plans.find((p) => p.code === subscription?.planCode) || null;
  const subIsActive = isSubscriptionActive(subscription);
  const subStatusLabel = subscription?.status || 'SIN_PLAN';

  const handleCreateTicket = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const res = await apiRequest<{ ticket: Ticket }>('/api/tickets', {
      method: 'POST',
      body: {
        department: tDept,
        category: tCat,
        priority: tPri,
        equipmentCode: tEqp || undefined,
        serviceMode: tMode,
        subject: tSubject,
        description: tDesc,
      },
    });
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok && res.data?.ticket) {
      setShowTicketModal(false);
      setTSubject('');
      setTDesc('');
      await loadPortalData();
    }
  };

  const handleCheckout = async (e: FormEvent) => {
    e.preventDefault();
    if (!checkoutPlan) return;
    setFeedback(null);
    const res = await apiRequest<{
      payment: PaymentRecord;
      mercadoPagoConfigured: boolean;
    }>('/api/checkout', {
      method: 'POST',
      body: {
        planCode: checkoutPlan.code,
        method: payMethod,
        termsAccepted,
        transferReference: speiRef,
      },
    });
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setTermsAccepted(false);
      setSpeiRef('');
      setCheckoutPlan(null);
      onClearCheckoutPlan();
      await loadPortalData();
    }
  };

  const handleSubmitSpeiRef = async (paymentId: string) => {
    setFeedback(null);
    const res = await apiRequest(`/api/payments/${paymentId}/spei-reference`, {
      method: 'POST',
      body: { transferReference: speiRefDraft },
    });
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setEditingSpeiPayId(null);
      setSpeiRefDraft('');
      await loadPortalData();
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    const res = await apiRequest(`/api/notifications/${id}/read`, {
      method: 'POST',
      body: {},
    });
    if (res.ok) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
  };

  const handleAddAsset = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const res = await apiRequest('/api/assets', {
      method: 'POST',
      body: {
        hostname: eqHostname,
        brandModel: eqBrand,
        osName: eqOs,
        assignedUser: currentUser.fullName,
      },
    });
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setEqHostname('');
      setEqBrand('');
      setShowAssetForm(false);
      await loadPortalData();
    }
  };

  const handleUpdateAccount = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const res = await apiRequest('/api/account', {
      method: 'PATCH',
      body: {
        phone: accPhone,
        rfc: accRfc,
        billingEmail: accBillingEmail,
        ...(newPassword ? { currentPassword, newPassword } : {}),
      },
    });
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setCurrentPassword('');
      setNewPassword('');
      await onRefreshSession();
      await loadPortalData();
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-slate-600">
        Cargando tu portal institucional USAE...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={receiptPayment ? 'space-y-6 print:hidden' : 'space-y-6'}>
      {/* Top Account & Subscription Status Header */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <p className="text-xs font-mono text-slate-500">
            PORTAL DEL CLIENTE · {clientDossier?.clientId || 'CUENTA'} · {currentUser.email}
          </p>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            {clientDossier?.tradeName || currentUser.fullName}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
            <span>
              Estado de plan:{' '}
              <strong className={subIsActive ? 'text-emerald-700' : 'text-amber-700'}>
                {subStatusLabel}
              </strong>
            </span>
            {subscription?.planCode && (
              <span>
                Plan: <strong className="text-slate-900">{subscription.planCode}</strong>
              </span>
            )}
            {subscription?.endsAt && (
              <span>Vigencia hasta: {formatDateShort(subscription.endsAt)}</span>
            )}
            <span>
              Equipos: {equipments.length} / {subscription?.maxEquipments ?? 0}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setTab('plans-payments')}
            className="px-4 py-2 text-sm font-semibold text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            {subIsActive ? 'Cambiar / Renovar Plan' : 'Contratar un Plan'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!subIsActive) {
                setFeedback({
                  ok: false,
                  text:
                    subStatusLabel === 'VENCIDO'
                      ? 'Tu plan venció. Renueva tu suscripción en "Planes y Pagos" para levantar nuevos tickets.'
                      : 'Necesitas un plan activo y pagado para crear tickets. Selecciona un plan abajo.',
                });
                setTab('plans-payments');
                return;
              }
              setShowTicketModal(true);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg cursor-pointer ${
              subIsActive
                ? 'bg-blue-700 text-white hover:bg-blue-800'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            {!subIsActive && <Lock className="w-4 h-4" aria-hidden="true" />}
            {subIsActive && <Plus className="w-4 h-4" aria-hidden="true" />}
            Levantar Ticket
          </button>
        </div>
      </section>

      {/* Subscription Block Explanation Banner */}
      {!subIsActive && (
        <div
          role="note"
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm text-amber-950">
              <p className="font-semibold">
                {subStatusLabel === 'VENCIDO'
                  ? 'Tu suscripción está VENCIDA'
                  : subStatusLabel === 'PAGO_EN_REVISION'
                    ? 'Tu pago SPEI está en PAGO_EN_REVISION'
                    : subStatusLabel === 'PENDIENTE_PAGO'
                      ? 'Tienes un pago PENDIENTE de confirmación'
                      : 'Cuenta sin plan activo (SIN_PLAN)'}
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                Conservas acceso completo a tu cuenta, catálogo, pagos e historial previo de
                tickets. La creación de nuevos tickets se habilitará automáticamente cuando tu pago
                sea aprobado.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTab('plans-payments')}
            className="px-4 py-2 text-xs font-semibold text-white bg-amber-700 rounded-lg hover:bg-amber-800 shrink-0 cursor-pointer"
          >
            {subStatusLabel === 'VENCIDO' ? 'Renovar Ahora' : 'Ver Opciones de Pago'}
          </button>
        </div>
      )}

      {feedback && (
        <div
          role="alert"
          className={`p-3.5 rounded-lg border text-sm flex items-start gap-2 ${
            feedback.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.ok ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Portal Sub-navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'tickets', label: `Mis Tickets (${tickets.length})`, icon: TicketIcon },
          { id: 'plans-payments', label: `Planes y Pagos (${payments.length})`, icon: CreditCard },
          { id: 'assets', label: `Mis Activos (${equipments.length})`, icon: HardDrive },
          { id: 'maintenances', label: `Mantenimientos (${maintenances.length})`, icon: Calendar },
          { id: 'account', label: 'Cuenta y Notificaciones', icon: Bell },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as PortalTab)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                active
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB: MY TICKETS */}
      {tab === 'tickets' && (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-slate-900">
              Tickets e Historial Propio
            </h2>
            {subIsActive && (
              <button
                type="button"
                onClick={() => setShowTicketModal(true)}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 cursor-pointer"
              >
                + Nuevo Ticket
              </button>
            )}
          </div>
          {tickets.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <p className="text-sm font-medium text-slate-700">Aún no tienes tickets registrados.</p>
              <p className="text-xs text-slate-500">
                {subIsActive
                  ? 'Puedes crear tu primer ticket cubierto con el botón "Levantar Ticket".'
                  : 'Contrata un plan vigente para poder levantar solicitudes de soporte.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="py-3 px-4 font-semibold">Folio</th>
                    <th className="py-3 px-4 font-semibold">Asunto</th>
                    <th className="py-3 px-4 font-semibold">Prioridad</th>
                    <th className="py-3 px-4 font-semibold">Estado</th>
                    <th className="py-3 px-4 font-semibold">Equipo</th>
                    <th className="py-3 px-4 font-semibold">Actualizado</th>
                    <th className="py-3 px-4 font-semibold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map((t) => (
                    <tr key={t.folio} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-blue-700">
                        {t.folio}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">
                        {t.subject}
                      </td>
                      <td className="py-3 px-4">
                        <TicketPriorityLabel priority={t.priority} />
                      </td>
                      <td className="py-3 px-4">
                        <TicketStatusLabel status={t.status} />
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">
                        {t.equipmentCode || '—'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {formatDateShort(t.updatedAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenTicket(t)}
                          className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB: PLANS, CHECKOUT & PAYMENTS */}
      {tab === 'plans-payments' && (
        <div className="space-y-6">
          {/* Checkout Form if plan selected or picker */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Contratar, Renovar o Cambiar Plan
                </h2>
                <p className="text-xs text-slate-600">
                  El plan se activa únicamente tras la confirmación verificable del servidor o
                  aprobación SPEI.
                </p>
              </div>
            </div>

            {!checkoutPlan ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans
                  .filter((p) => p.priceMXN !== null)
                  .map((p) => (
                    <div
                      key={p.code}
                      className="border border-slate-200 rounded-lg p-4 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <p className="font-mono text-xs text-slate-500">{p.code}</p>
                        <p className="font-display font-bold text-slate-900">{p.title}</p>
                        <p className="text-lg font-bold text-slate-900 mt-1 tabular-nums">
                          {formatMXN(p.priceMXN!)} MXN
                        </p>
                        <p className="text-xs text-slate-500">{p.slaSummary}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCheckoutPlan(p)}
                        className="w-full py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 cursor-pointer"
                      >
                        Seleccionar para Pago
                      </button>
                    </div>
                  ))}
              </div>
            ) : (
              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs text-blue-700 font-semibold">
                      {checkoutPlan.code} · Versión v{checkoutPlan.version}
                    </p>
                    <p className="font-display text-lg font-bold text-slate-900">
                      {checkoutPlan.title}
                    </p>
                    <p className="text-xs text-slate-600">
                      {checkoutPlan.duration} · {checkoutPlan.slaSummary} · Hasta{' '}
                      {checkoutPlan.maxEquipments} equipos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl font-bold text-slate-900 tabular-nums">
                      {formatMXN(checkoutPlan.priceMXN!)} MXN
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCheckoutPlan(null);
                        onClearCheckoutPlan();
                      }}
                      className="text-xs text-blue-700 underline cursor-pointer"
                    >
                      Cambiar plan
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label
                    className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 ${
                      payMethod === 'SPEI'
                        ? 'border-blue-700 bg-blue-50/40'
                        : 'border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payMethod"
                      checked={payMethod === 'SPEI'}
                      onChange={() => setPayMethod('SPEI')}
                      className="mt-1"
                    />
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-slate-900">Transferencia SPEI (Revisión Admin)</p>
                      <p className="text-slate-600">
                        Genera concepto de transferencia seguro y queda en PAGO_EN_REVISION hasta
                        validación bancaria del administrador.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 ${
                      payMethod === 'MERCADO_PAGO'
                        ? 'border-blue-700 bg-blue-50/40'
                        : 'border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payMethod"
                      checked={payMethod === 'MERCADO_PAGO'}
                      onChange={() => setPayMethod('MERCADO_PAGO')}
                      className="mt-1"
                    />
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-slate-900">Mercado Pago (Pasarela en línea)</p>
                      <p className="text-slate-600">
                        Crea preferencia oficial cuando las credenciales están configuradas y activa
                        al recibir webhook firmado.
                      </p>
                    </div>
                  </label>
                </div>

                {payMethod === 'SPEI' && (
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-slate-700">
                      Referencia o Clave de Rastreo SPEI (opcional al generar, puedes enviarla
                      después)
                    </span>
                    <input
                      type="text"
                      value={speiRef}
                      onChange={(e) => setSpeiRef(e.target.value)}
                      placeholder="Ej. SPEI-20261115-88412"
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                    />
                  </label>
                )}

                <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    Acepto las condiciones del plan: {checkoutPlan.contractTerms}{' '}
                    {checkoutPlan.cancellationRule}
                  </span>
                </label>

                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 cursor-pointer"
                >
                  Generar Orden de Pago
                </button>
              </form>
            )}
          </div>

          {/* Payment History Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-display text-base font-bold text-slate-900">
                Historial de Pagos y Órdenes ({payments.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="py-3 px-4 font-semibold">ID Pago</th>
                    <th className="py-3 px-4 font-semibold">Plan</th>
                    <th className="py-3 px-4 font-semibold">Importe</th>
                    <th className="py-3 px-4 font-semibold">Método</th>
                    <th className="py-3 px-4 font-semibold">Estado</th>
                    <th className="py-3 px-4 font-semibold">Datos / Referencia</th>
                    <th className="py-3 px-4 font-semibold text-right">Comprobante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((pay) => (
                    <tr key={pay.paymentId} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-800">
                        {pay.paymentId}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-900">
                        {pay.planCode}
                      </td>
                      <td className="py-3 px-4 tabular-nums font-semibold text-slate-900">
                        {formatMXN(pay.amountMXN)} MXN
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">{pay.method}</td>
                      <td className="py-3 px-4 text-xs font-semibold">
                        <span
                          className={
                            pay.status === 'APROBADO'
                              ? 'text-emerald-700'
                              : pay.status === 'RECHAZADO'
                                ? 'text-red-700'
                                : 'text-amber-700'
                          }
                        >
                          {pay.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {pay.method === 'SPEI' ? (
                          <div className="space-y-1">
                            <p>Banco: {pay.bankName || 'Por configurar'}</p>
                            <p className="font-mono">CLABE: {pay.clabe || 'Pendiente'}</p>
                            <p className="font-mono">Concepto: {pay.transferConcept}</p>
                            {pay.transferReference && (
                              <p className="font-mono">Ref: {pay.transferReference}</p>
                            )}
                            {pay.status !== 'APROBADO' && (
                              editingSpeiPayId === pay.paymentId ? (
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                  <input
                                    type="text"
                                    value={speiRefDraft}
                                    onChange={(e) => setSpeiRefDraft(e.target.value)}
                                    placeholder="Clave de rastreo SPEI"
                                    className="px-2 py-1 text-xs font-mono border border-slate-300 rounded w-40"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSubmitSpeiRef(pay.paymentId)}
                                    className="px-2 py-1 text-[11px] font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 cursor-pointer"
                                  >
                                    Enviar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSpeiPayId(null);
                                      setSpeiRefDraft('');
                                    }}
                                    className="px-2 py-1 text-[11px] text-slate-600 border border-slate-300 rounded cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSpeiPayId(pay.paymentId);
                                    setSpeiRefDraft(pay.transferReference || '');
                                  }}
                                  className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
                                >
                                  {pay.transferReference
                                    ? 'Actualizar referencia SPEI'
                                    : '+ Registrar referencia SPEI'}
                                </button>
                              )
                            )}
                          </div>
                        ) : (
                          <span className="font-mono">
                            {pay.mpPaymentId || pay.mpPreferenceId || 'Orden local pendiente'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setReceiptPayment(pay)}
                          className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                        >
                          Ver recibo
                        </button>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                        Aún no has generado órdenes de pago.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subscription History */}
          {subHistory.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <h3 className="font-display text-sm font-bold text-slate-900">
                Historial de Suscripciones
              </h3>
              <ul className="divide-y divide-slate-100 text-xs">
                {subHistory.map((s) => (
                  <li key={s.id} className="py-2 flex flex-wrap justify-between gap-2">
                    <span className="font-semibold text-slate-800">
                      {s.planCode} · Estado: {s.status}
                    </span>
                    <span className="text-slate-500">
                      {s.startsAt ? `${formatDateShort(s.startsAt)} — ` : ''}
                      {s.endsAt ? formatDateShort(s.endsAt) : 'Sin vigencia activa'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* TAB: MY ASSETS */}
      {tab === 'assets' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Equipos registrados en tu empresa ({equipments.length} /{' '}
              {subscription?.maxEquipments ?? 0} permitidos por tu plan).
            </p>
            <button
              type="button"
              onClick={() => setShowAssetForm((prev) => !prev)}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 cursor-pointer"
            >
              + Registrar Equipo
            </button>
          </div>

          {showAssetForm && (
            <form
              onSubmit={handleAddAsset}
              className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end"
            >
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">Hostname *</span>
                <input
                  type="text"
                  required
                  value={eqHostname}
                  onChange={(e) => setEqHostname(e.target.value)}
                  placeholder="LAPTOP-OPS01"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">Marca y Modelo *</span>
                <input
                  type="text"
                  required
                  value={eqBrand}
                  onChange={(e) => setEqBrand(e.target.value)}
                  placeholder="Lenovo ThinkPad T14"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={eqOs}
                  onChange={(e) => setEqOs(e.target.value)}
                  aria-label="Sistema Operativo"
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {equipments.map((eq) => (
              <article
                key={eq.equipmentCode}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700">
                    {eq.equipmentCode} · {eq.hostname}
                  </span>
                  <EquipmentHealthLabel status={eq.healthStatus} />
                </div>
                <p className="text-sm font-semibold text-slate-900">{eq.brandModel}</p>
                <p className="text-xs text-slate-600">
                  {eq.osName} · Usuario: {eq.assignedUser}
                </p>
                <p className="text-xs text-slate-500">
                  Antivirus: {eq.antivirusStatus} · Firewall: {eq.firewallStatus}
                </p>
              </article>
            ))}
            {equipments.length === 0 && (
              <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
                No tienes equipos registrados aún.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: MAINTENANCES */}
      {tab === 'maintenances' && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-slate-900">
            Mantenimientos Programados (Módulo 05)
          </h2>
          {maintenances.length === 0 ? (
            <p className="text-xs text-slate-500">No hay mantenimientos programados actualmente.</p>
          ) : (
            <div className="space-y-3">
              {maintenances.map((m) => (
                <div
                  key={m.id}
                  className="border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">
                      {m.id} · {m.maintenanceType} ({m.status})
                    </p>
                    <p className="text-slate-600">
                      Técnico: {m.assignedTechName} · Sede: {m.siteLocation} · Equipo:{' '}
                      {m.equipmentCode || 'General'}
                    </p>
                    <p className="text-slate-500">{m.checklistSummary}</p>
                  </div>
                  <div className="text-right shrink-0 font-mono text-slate-700">
                    {formatDateTime(m.scheduledStart)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB: ACCOUNT & NOTIFICATIONS */}
      {tab === 'account' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleUpdateAccount}
            className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <h2 className="font-display text-base font-bold text-slate-900">
              Datos de Contacto, Facturación y Contraseña
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">Teléfono</span>
                <input
                  type="tel"
                  value={accPhone}
                  onChange={(e) => setAccPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">RFC</span>
                <input
                  type="text"
                  value={accRfc}
                  onChange={(e) => setAccRfc(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                />
              </label>
              <label className="block space-y-1 sm:col-span-2">
                <span className="text-xs font-semibold text-slate-700">Correo de facturación</span>
                <input
                  type="email"
                  value={accBillingEmail}
                  onChange={(e) => setAccBillingEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">
                  Contraseña actual (para cambio)
                </span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">Nueva contraseña</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>
            </div>
            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
              Aceptación legal registrada: v{currentUser.acceptedPolicyVersion || '2026.1'} el{' '}
              {currentUser.termsAcceptedAt ? formatDateTime(currentUser.termsAcceptedAt) : '—'}.
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 cursor-pointer"
            >
              Guardar Cambios
            </button>
          </form>

          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h2 className="font-display text-base font-bold text-slate-900">
              Notificaciones del Portal ({notifications.length})
            </h2>
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500">Sin notificaciones nuevas.</p>
            ) : (
              <ul className="space-y-2.5 max-h-96 overflow-y-auto">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`p-3 rounded-lg border text-xs ${
                      n.isRead
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-blue-200 bg-blue-50/40'
                    }`}
                  >
                    <div className="flex justify-between gap-2">
                      <strong className="text-slate-900">{n.subject}</strong>
                      <span className="text-slate-400 shrink-0">{formatDateShort(n.createdAt)}</span>
                    </div>
                    <p className="text-slate-600 mt-1">{n.bodyPreview}</p>
                    <div className="flex items-center justify-between gap-2 mt-1.5">
                      <span className="text-[11px] text-slate-400">
                        Estado canal: {n.deliveryStatus}
                      </span>
                      {n.isRead ? (
                        <span className="text-[11px] text-slate-400">Leída</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMarkNotificationRead(n.id)}
                          className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
                        >
                          Marcar como leída
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CREATE TICKET */}
      {showTicketModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Levantar Ticket de Soporte"
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleCreateTicket}
            className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Nuevo Ticket de Soporte · {subscription?.planCode}
                </h2>
                <p className="text-xs text-slate-500">
                  Se generará folio atómico USAE-YYYY-XXXXXX y cálculo SLA automático.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTicketModal(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">Departamento</span>
                <select
                  value={tDept}
                  onChange={(e) => setTDept(e.target.value as TicketDepartment)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {TICKET_DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">Categoría</span>
                <select
                  value={tCat}
                  onChange={(e) => setTCat(e.target.value as TicketCategory)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {TICKET_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">Prioridad SLA</span>
                <select
                  value={tPri}
                  onChange={(e) => setTPri(e.target.value as TicketPriority)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">Equipo EQP (opcional)</span>
                <select
                  value={tEqp}
                  onChange={(e) => setTEqp(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Sin equipo específico</option>
                  {equipments.map((eq) => (
                    <option key={eq.equipmentCode} value={eq.equipmentCode}>
                      {eq.equipmentCode} — {eq.hostname}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {!canPlanCoverCategory(activePlan, tCat) && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
                <span>
                  Tu plan ({subscription?.planCode}) no cubre &ldquo;{tCat}&rdquo;. Solicita una
                  cotización para este servicio.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowTicketModal(false);
                    onRequestQuote();
                  }}
                  className="font-semibold underline shrink-0 cursor-pointer"
                >
                  Cotizar
                </button>
              </div>
            )}

            <div className="flex gap-4 text-xs">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  checked={tMode === 'REMOTO'}
                  onChange={() => setTMode('REMOTO')}
                />
                Atención Remota
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  checked={tMode === 'EN SITIO'}
                  onChange={() => setTMode('EN SITIO')}
                />
                En Sitio (sujeto a visitas del plan)
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-700">Asunto *</span>
              <input
                type="text"
                required
                value={tSubject}
                onChange={(e) => setTSubject(e.target.value)}
                placeholder="Resumen breve de la falla o solicitud"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-700">Descripción detallada *</span>
              <textarea
                rows={4}
                required
                value={tDesc}
                onChange={(e) => setTDesc(e.target.value)}
                placeholder="Detalla mensajes de error, impacto y horario disponible..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTicketModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 cursor-pointer"
              >
                Crear Ticket
              </button>
            </div>
          </form>
        </div>
      )}
      </div>

      {/* MODAL: PRINTABLE PAYMENT RECEIPT (Section 11.5: clearly notes non-CFDI receipt) */}
      {receiptPayment && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Comprobante de Pago"
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <BrandLogo compact />
              <span className="font-mono text-xs font-bold text-slate-600">
                {receiptPayment.paymentId}
              </span>
            </div>
            <div className="space-y-1.5 text-sm text-slate-700">
              <p>
                <strong>Cliente:</strong> {receiptPayment.clientCompany} ({receiptPayment.clientEmail})
              </p>
              <p>
                <strong>Plan:</strong> {receiptPayment.planCode}
              </p>
              <p>
                <strong>Importe:</strong> {formatMXN(receiptPayment.amountMXN)} MXN
              </p>
              <p>
                <strong>Método:</strong> {receiptPayment.method} · <strong>Estado:</strong>{' '}
                {receiptPayment.status}
              </p>
              <p>
                <strong>Fecha:</strong> {formatDateTime(receiptPayment.createdAt)}
              </p>
              <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                <FileText className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
                Comprobante interno de orden/pago en USAE Helpdesk. No sustituye un CFDI timbrado
                ante el SAT.
              </p>
            </div>
            <div className="flex justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 border border-slate-300 rounded-lg cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                Imprimir
              </button>
              <button
                type="button"
                onClick={() => setReceiptPayment(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
