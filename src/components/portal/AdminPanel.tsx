import { useEffect, useState, type FormEvent } from 'react';
import {
  Activity,
  Building2,
  CheckCircle2,
  CreditCard,
  Layers,
  Settings,
  Shield,
  Users,
  XCircle,
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import {
  formatDateTime,
  formatMXN,
  type AccountStatus,
  type AuditLogEntry,
  type AuthUser,
  type ContactInquiryRecord,
  type CorporateClient,
  type PaymentRecord,
  type ServicePlan,
  type StaffMember,
  type SystemSettings,
  type UserRole,
} from '../../utils/helpdesk';

interface AdminPanelProps {
  onPlansUpdated: () => Promise<void>;
}

type AdminTab = 'payments' | 'plans' | 'users' | 'dossiers' | 'settings' | 'audit';

export function AdminPanel({ onPlansUpdated }: AdminPanelProps) {
  const [tab, setTab] = useState<AdminTab>('payments');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [clients, setClients] = useState<CorporateClient[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [integrations, setIntegrations] = useState<Record<
    string,
    { configured: boolean; statusLabel?: string; missingEnv?: string[] }
  > | null>(null);
  const [inquiries, setInquiries] = useState<ContactInquiryRecord[]>([]);

  // Plan editor modal & SPEI rejection reason state
  const [editingPlan, setEditingPlan] = useState<ServicePlan | null>(null);
  const [speiClabeInput, setSpeiClabeInput] = useState('');
  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState(
    'Abono no verificado en estado de cuenta bancario.'
  );

  const loadAdminData = async () => {
    setLoading(true);
    const [pRes, plRes, uRes, cRes, sRes, aRes, cfgRes] = await Promise.all([
      apiRequest<{ payments: PaymentRecord[] }>('/api/payments'),
      apiRequest<{ plans: ServicePlan[] }>('/api/admin/plans'),
      apiRequest<{ users: AuthUser[] }>('/api/admin/users'),
      apiRequest<{ clients: CorporateClient[] }>('/api/admin/clients'),
      apiRequest<{ staff: StaffMember[] }>('/api/admin/staff'),
      apiRequest<{ auditLogs: AuditLogEntry[] }>('/api/admin/audit-logs'),
      apiRequest<{
        settings: SystemSettings;
        integrations: typeof integrations;
        inquiries: ContactInquiryRecord[];
      }>('/api/admin/settings'),
    ]);

    if (pRes.ok && pRes.data) setPayments(pRes.data.payments);
    if (plRes.ok && plRes.data) setPlans(plRes.data.plans);
    if (uRes.ok && uRes.data) setUsers(uRes.data.users);
    if (cRes.ok && cRes.data) setClients(cRes.data.clients);
    if (sRes.ok && sRes.data) setStaff(sRes.data.staff);
    if (aRes.ok && aRes.data) setAuditLogs(aRes.data.auditLogs);
    if (cfgRes.ok && cfgRes.data) {
      setSettings(cfgRes.data.settings);
      setIntegrations(cfgRes.data.integrations);
      setInquiries(cfgRes.data.inquiries);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

  const handleApprovePayment = async (paymentId: string) => {
    setFeedback(null);
    const res = await apiRequest(`/api/admin/payments/${paymentId}/approve`, {
      method: 'POST',
      body: {},
    });
    setFeedback({ ok: res.ok, text: res.message });
    await loadAdminData();
  };

  const handleRejectPayment = async (paymentId: string) => {
    setFeedback(null);
    const res = await apiRequest(`/api/admin/payments/${paymentId}/reject`, {
      method: 'POST',
      body: { reason: rejectReason.trim() },
    });
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setRejectingPaymentId(null);
      setRejectReason('Abono no verificado en estado de cuenta bancario.');
      await loadAdminData();
    }
  };

  const handleUserUpdate = async (
    userId: number,
    patch: { role?: UserRole; accountStatus?: AccountStatus; mustChangePassword?: boolean }
  ) => {
    setFeedback(null);
    const res = await apiRequest(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: patch,
    });
    setFeedback({ ok: res.ok, text: res.message });
    await loadAdminData();
  };

  const handleSavePlan = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setFeedback(null);
    const res = await apiRequest(`/api/admin/plans/${editingPlan.code}`, {
      method: 'PUT',
      body: editingPlan,
    });
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setEditingPlan(null);
      await loadAdminData();
      await onPlansUpdated();
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setFeedback(null);
    const res = await apiRequest('/api/admin/settings', {
      method: 'PUT',
      body: {
        ...settings,
        ...(speiClabeInput.trim() ? { speiClabe: speiClabeInput.trim() } : {}),
      },
    });
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setSpeiClabeInput('');
      await loadAdminData();
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-slate-600">
        Cargando panel administrativo USAE...
      </div>
    );
  }

  const pendingSpei = payments.filter((p) => p.status === 'PAGO_EN_REVISION');

  return (
    <div className="space-y-6">
      <section className="bg-slate-900 text-white rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-blue-300 uppercase tracking-wider">
            Gobernanza y Administración General · RBAC Nivel ADMINISTRADOR
          </p>
          <h1 className="font-display text-2xl font-bold mt-1">
            Control de Pagos, Catálogo, Usuarios e Integraciones
          </h1>
        </div>
        <div className="flex gap-4 text-center text-xs">
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2">
            <p className="text-slate-400">SPEI en revisión</p>
            <p className="font-display text-lg font-bold text-amber-400 tabular-nums">
              {pendingSpei.length}
            </p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2">
            <p className="text-slate-400">Usuarios</p>
            <p className="font-display text-lg font-bold text-white tabular-nums">
              {users.length}
            </p>
          </div>
        </div>
      </section>

      {feedback && (
        <div
          role="alert"
          className={`p-3.5 rounded-lg border text-sm ${
            feedback.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'payments', label: `Pagos y SPEI (${payments.length})`, icon: CreditCard },
          { id: 'plans', label: `Catálogo Editable (${plans.length})`, icon: Layers },
          { id: 'users', label: `Usuarios y Roles (${users.length})`, icon: Users },
          { id: 'dossiers', label: 'Expedientes CLI / EMP', icon: Building2 },
          { id: 'settings', label: 'Integraciones y Sistema', icon: Settings },
          { id: 'audit', label: `Auditoría (${auditLogs.length})`, icon: Activity },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as AdminTab)}
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

      {/* TAB: PAYMENTS & SPEI VERIFICATION */}
      {tab === 'payments' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-display text-base font-bold text-slate-900">
              Conciliación de Pagos Mercado Pago y Transferencias SPEI
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-3 px-4 font-semibold">Pago</th>
                  <th className="py-3 px-4 font-semibold">Cliente</th>
                  <th className="py-3 px-4 font-semibold">Plan / Monto</th>
                  <th className="py-3 px-4 font-semibold">Método / Referencia</th>
                  <th className="py-3 px-4 font-semibold">Estado</th>
                  <th className="py-3 px-4 font-semibold text-right">Acciones Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((pay) => (
                  <tr key={pay.paymentId} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-xs font-bold text-slate-800">
                      {pay.paymentId}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-semibold text-slate-900">{pay.clientCompany}</p>
                      <p className="text-slate-500">{pay.clientEmail}</p>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-semibold text-slate-900">{pay.planCode}</p>
                      <p className="tabular-nums text-slate-700">
                        {formatMXN(pay.amountMXN)} MXN
                      </p>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-600">
                      {pay.method} ·{' '}
                      {pay.transferReference || pay.mpPaymentId || pay.transferConcept || '—'}
                    </td>
                    <td className="py-3 px-4 text-xs font-bold">
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
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      {pay.status !== 'APROBADO' && pay.status !== 'RECHAZADO' && (
                        rejectingPaymentId === pay.paymentId ? (
                          <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                            <input
                              type="text"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Motivo del rechazo (mín. 5 caracteres)"
                              className="px-2 py-1 text-xs border border-slate-300 rounded w-56"
                            />
                            <button
                              type="button"
                              onClick={() => handleRejectPayment(pay.paymentId)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-red-700 rounded hover:bg-red-800 cursor-pointer"
                            >
                              Confirmar Rechazo
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingPaymentId(null)}
                              className="px-2 py-1 text-xs text-slate-600 border border-slate-300 rounded cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprovePayment(pay.paymentId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                              Aprobar y Activar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingPaymentId(pay.paymentId);
                                setRejectReason('Abono no verificado en estado de cuenta bancario.');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                              Rechazar
                            </button>
                          </>
                        )
                      )}
                      {pay.approvedByEmail && (
                        <span className="text-[11px] text-slate-500">
                          Por {pay.approvedByEmail}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: EDITABLE CATALOG PLANS */}
      {tab === 'plans' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((p) => (
              <div
                key={p.code}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-bold text-blue-700">
                      {p.code} · v{p.version}
                    </span>
                    <span
                      className={
                        p.priceConfirmedByAdmin ? 'text-emerald-700 font-semibold' : 'text-amber-700'
                      }
                    >
                      {p.priceConfirmedByAdmin
                        ? 'Precio comercial confirmado'
                        : 'Pendiente confirmación comercial'}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-900">{p.title}</h3>
                  <p className="text-sm font-semibold text-slate-800">
                    {p.priceMXN !== null ? `${formatMXN(p.priceMXN)} MXN` : 'A cotización'} ·{' '}
                    {p.includesIva ? 'IVA incluido' : 'Más IVA / catálogo'} ·{' '}
                    {p.isPublished ? 'Publicado' : 'Oculto'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Equipos: {p.maxEquipments} · Visitas/mes: {p.monthlyVisitsIncluded} ·{' '}
                    {p.is24_7 ? '24/7' : 'Horario laboral'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPlan({ ...p })}
                  className="self-start px-3.5 py-1.5 text-xs font-semibold text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Editar Tarifa y Condiciones
                </button>
              </div>
            ))}
          </div>

          {editingPlan && (
            <form
              onSubmit={handleSavePlan}
              className="bg-white border-2 border-blue-700 rounded-xl p-6 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-display text-base font-bold text-slate-900">
                  Editar Plan {editingPlan.code}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="text-xs text-slate-500 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold">Título</span>
                  <input
                    type="text"
                    value={editingPlan.title}
                    onChange={(e) => setEditingPlan({ ...editingPlan, title: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold">Precio MXN (vacío = cotización)</span>
                  <input
                    type="number"
                    value={editingPlan.priceMXN ?? ''}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        priceMXN: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold">Límite de equipos</span>
                  <input
                    type="number"
                    value={editingPlan.maxEquipments}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, maxEquipments: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </label>
              </div>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">Nota comercial / referencia</span>
                <input
                  type="text"
                  value={editingPlan.alternativePriceNote ?? ''}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, alternativePriceNote: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>
              <div className="flex flex-wrap gap-4 text-xs">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.priceConfirmedByAdmin}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, priceConfirmedByAdmin: e.target.checked })
                    }
                  />
                  Precio comercial confirmado
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.includesIva}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, includesIva: e.target.checked })
                    }
                  />
                  Incluye IVA
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.isPublished}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, isPublished: e.target.checked })
                    }
                  />
                  Publicado en catálogo público
                </label>
              </div>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 cursor-pointer"
              >
                Guardar Versión de Plan
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB: USERS & RBAC */}
      {tab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-3 px-4 font-semibold">Usuario</th>
                  <th className="py-3 px-4 font-semibold">Rol RBAC</th>
                  <th className="py-3 px-4 font-semibold">Estado de Cuenta</th>
                  <th className="py-3 px-4 font-semibold">Cambio de Clave</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-semibold text-slate-900">{u.fullName}</p>
                      <p className="font-mono text-slate-500">
                        {u.email} · {u.clientId || u.employeeId || '—'}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          handleUserUpdate(u.id, { role: e.target.value as UserRole })
                        }
                        className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="USUARIO">USUARIO</option>
                        <option value="TÉCNICO">TÉCNICO</option>
                        <option value="SUPERVISOR">SUPERVISOR</option>
                        <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={u.accountStatus}
                        onChange={(e) =>
                          handleUserUpdate(u.id, {
                            accountStatus: e.target.value as AccountStatus,
                          })
                        }
                        className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="ACTIVA">ACTIVA</option>
                        <option value="PENDIENTE_VERIFICACION">PENDIENTE_VERIFICACION</option>
                        <option value="SUSPENDIDA">SUSPENDIDA</option>
                        <option value="BLOQUEADA">BLOQUEADA</option>
                        <option value="INACTIVA">INACTIVA</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          handleUserUpdate(u.id, { mustChangePassword: !u.mustChangePassword })
                        }
                        className={`px-2.5 py-1 rounded border cursor-pointer ${
                          u.mustChangePassword
                            ? 'bg-amber-50 border-amber-300 text-amber-800 font-semibold'
                            : 'border-slate-300 text-slate-600'
                        }`}
                      >
                        {u.mustChangePassword ? 'Forzado en próximo acceso' : 'Normal'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: CLIENTS & STAFF DOSSIERS */}
      {tab === 'dossiers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h2 className="font-display text-base font-bold text-slate-900">
              Expedientes de Clientes ({clients.length})
            </h2>
            <div className="space-y-3">
              {clients.map((c) => (
                <div key={c.clientId} className="p-3.5 rounded-lg border border-slate-200 text-xs">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>
                      {c.clientId} · {c.tradeName}
                    </span>
                    <span className="text-blue-700">{c.planStatus}</span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    {c.legalName} · RFC: <span className="font-mono">{c.rfc || '—'}</span>
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    Plan: {c.planCode} · Vigencia: {c.contractStart || '—'} / {c.contractEnd || '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h2 className="font-display text-base font-bold text-slate-900">
              Expedientes de Personal TI y Smart Campus ({staff.length})
            </h2>
            <div className="space-y-3">
              {staff.map((s) => (
                <div key={s.employeeId} className="p-3.5 rounded-lg border border-slate-200 text-xs">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>
                      {s.employeeId} · {s.fullName}
                    </span>
                    <span className="font-mono text-blue-700">{s.rbacRole}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{s.roleTitle}</p>
                  <p className="text-slate-500 mt-0.5">
                    Smart Campus: {s.smartCampusCertified ? 'Certificado' : 'Pendiente'} · NDA:{' '}
                    {s.ndaSigned ? 'Firmado' : 'Pendiente'} · Inducción: {s.inductionProgress}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: INTEGRATIONS & SYSTEM SETTINGS */}
      {tab === 'settings' && settings && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-700" aria-hidden="true" />
              Estado de Integraciones Externas (Honestidad Operativa)
            </h2>
            {integrations && (
              <div className="space-y-3 text-xs">
                {Object.entries(integrations).map(([key, val]) => (
                  <div key={key} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span className="uppercase">{key}</span>
                      <span className={val.configured ? 'text-emerald-700' : 'text-amber-700'}>
                        {val.configured ? 'Configurado' : 'Pendiente de credenciales'}
                      </span>
                    </div>
                    {val.statusLabel && <p className="text-slate-600 mt-1">{val.statusLabel}</p>}
                    {val.missingEnv && val.missingEnv.length > 0 && (
                      <p className="font-mono text-[11px] text-slate-500 mt-1">
                        Variables faltantes: {val.missingEnv.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <h3 className="font-display text-sm font-bold text-slate-900">
                Solicitudes Comerciales / Cotizaciones ({inquiries.length})
              </h3>
              <ul className="space-y-2 max-h-52 overflow-y-auto text-xs">
                {inquiries.map((q) => (
                  <li key={q.id} className="p-2.5 rounded border border-slate-200">
                    <p className="font-bold text-slate-900">
                      {q.subject} ({q.planCode || 'GENERAL'})
                    </p>
                    <p className="text-slate-600">
                      {q.fullName} · {q.email} · {q.company}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <form
            onSubmit={handleSaveSettings}
            className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <h2 className="font-display text-base font-bold text-slate-900">
              Parámetros de Horario SLA, Seguridad y SPEI
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-semibold">Inicio laboral (h)</span>
                <input
                  type="number"
                  value={settings.workStartHour}
                  onChange={(e) =>
                    setSettings({ ...settings, workStartHour: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">Fin L-V (h)</span>
                <input
                  type="number"
                  value={settings.workEndHour}
                  onChange={(e) =>
                    setSettings({ ...settings, workEndHour: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">Fin Sábado (h)</span>
                <input
                  type="number"
                  value={settings.saturdayEndHour}
                  onChange={(e) =>
                    setSettings({ ...settings, saturdayEndHour: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">Límite adjunto (MB)</span>
                <input
                  type="number"
                  value={settings.maxUploadMb}
                  onChange={(e) =>
                    setSettings({ ...settings, maxUploadMb: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>
              <label className="block space-y-1 sm:col-span-2">
                <span className="text-xs font-semibold">Expiración sesión inactiva (min)</span>
                <input
                  type="number"
                  value={settings.sessionIdleMinutes}
                  onChange={(e) =>
                    setSettings({ ...settings, sessionIdleMinutes: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
              <label className="block space-y-1">
                <span className="text-xs font-semibold">Banco SPEI</span>
                <input
                  type="text"
                  value={settings.speiBankName}
                  onChange={(e) => setSettings({ ...settings, speiBankName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">Titular SPEI</span>
                <input
                  type="text"
                  value={settings.speiAccountHolder}
                  onChange={(e) =>
                    setSettings({ ...settings, speiAccountHolder: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>
              <label className="block space-y-1 sm:col-span-2">
                <span className="text-xs font-semibold">
                  CLABE SPEI (Actual: {settings.speiClabeMasked})
                </span>
                <input
                  type="text"
                  value={speiClabeInput}
                  onChange={(e) => setSpeiClabeInput(e.target.value)}
                  placeholder="Ingresa nueva CLABE de 18 dígitos para actualizar"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                />
              </label>
            </div>

            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 cursor-pointer"
            >
              Guardar Configuración
            </button>
          </form>
        </div>
      )}

      {/* TAB: GLOBAL AUDIT LOGS */}
      {tab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-display text-base font-bold text-slate-900">
              Bitácora Inmutable de Auditoría ({auditLogs.length})
            </h2>
          </div>
          <div className="overflow-x-auto max-h-[540px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 uppercase text-slate-500">
                  <th className="py-2.5 px-4 font-semibold">Fecha</th>
                  <th className="py-2.5 px-4 font-semibold">Actor</th>
                  <th className="py-2.5 px-4 font-semibold">Evento</th>
                  <th className="py-2.5 px-4 font-semibold">Descripción</th>
                  <th className="py-2.5 px-4 font-semibold">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {formatDateTime(a.createdAt)}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-800">{a.actorEmail}</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-blue-700">{a.event}</td>
                    <td className="py-2.5 px-4 text-slate-700">{a.description}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-500">{a.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
