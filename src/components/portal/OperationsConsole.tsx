import { useEffect, useState, type FormEvent } from 'react';
import {
  BarChart3,
  BookOpen,
  Calendar,
  Download,
  HardDrive,
  Printer,
  Search,
  Ticket as TicketIcon,
  Users,
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import {
  calculateTicketMetrics,
  filterEquipments,
  filterTickets,
  formatDateShort,
  formatDateTime,
  isSlaBreached,
  type AuthUser,
  type CorporateClient,
  type EquipmentAsset,
  type MaintenanceRecord,
  type ModuleDocRecord,
  type StaffMember,
  type Ticket,
} from '../../utils/helpdesk';
import {
  EquipmentHealthLabel,
  TicketPriorityLabel,
  TicketStatusLabel,
} from '../StatusIndicator';

interface OperationsConsoleProps {
  currentUser: AuthUser;
  onOpenTicket: (ticket: Ticket) => void;
}

type OpsTab = 'tickets' | 'assets' | 'maintenances' | 'reports' | 'modules';

export function OperationsConsole({ currentUser, onOpenTicket }: OperationsConsoleProps) {
  const isSupervisorOrAdmin =
    currentUser.role === 'SUPERVISOR' || currentUser.role === 'ADMINISTRADOR';

  const [tab, setTab] = useState<OpsTab>('tickets');
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [equipments, setEquipments] = useState<EquipmentAsset[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);
  const [modules, setModules] = useState<ModuleDocRecord[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [clients, setClients] = useState<CorporateClient[]>([]);

  // Filters
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [priorityFilter, setPriorityFilter] = useState('Todas');
  const [eqQuery, setEqQuery] = useState('');
  const [eqHealth, setEqHealth] = useState('Todos');

  // Maintenance creation (Supervisor/Admin)
  const [mntClient, setMntClient] = useState('CLI-002');
  const [mntEqp, setMntEqp] = useState('');
  const [mntTech, setMntTech] = useState('Ing. Laura Méndez (N2)');
  const [mntType, setMntType] = useState('PREVENTIVO');
  const [mntLocation, setMntLocation] = useState('Sede / Remoto');
  const [mntStart, setMntStart] = useState('2026-11-20T10:00');
  const [mntEnd, setMntEnd] = useState('2026-11-20T12:00');
  const [mntChecklist, setMntChecklist] = useState(
    'Limpieza lógica, actualización de parches, revisión de respaldo y seguridad'
  );
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Module 07 Report summary
  const [reportSummary, setReportSummary] = useState<{
    total: number;
    breached: number;
    compliancePercent: number;
    avgResolutionMinutes: number;
    avgSatisfaction: number;
    byTech: Record<string, number>;
  } | null>(null);

  const loadData = async () => {
    setLoading(true);
    const reqs: Promise<unknown>[] = [
      apiRequest<{ tickets: Ticket[] }>('/api/tickets'),
      apiRequest<{ equipments: EquipmentAsset[] }>('/api/assets'),
      apiRequest<{ maintenances: MaintenanceRecord[] }>('/api/maintenances'),
      apiRequest<{ modules: ModuleDocRecord[] }>('/api/modules'),
    ];
    if (isSupervisorOrAdmin) {
      reqs.push(
        apiRequest<{ staff: StaffMember[] }>('/api/admin/staff'),
        apiRequest<{ clients: CorporateClient[] }>('/api/admin/clients'),
        apiRequest<typeof reportSummary>('/api/reports/summary')
      );
    }

    const results = await Promise.all(reqs);
    const tRes = results[0] as { ok: boolean; data?: { tickets: Ticket[] } };
    const eRes = results[1] as { ok: boolean; data?: { equipments: EquipmentAsset[] } };
    const mRes = results[2] as { ok: boolean; data?: { maintenances: MaintenanceRecord[] } };
    const dRes = results[3] as { ok: boolean; data?: { modules: ModuleDocRecord[] } };

    if (tRes.ok && tRes.data) setTickets(tRes.data.tickets);
    if (eRes.ok && eRes.data) setEquipments(eRes.data.equipments);
    if (mRes.ok && mRes.data) setMaintenances(mRes.data.maintenances);
    if (dRes.ok && dRes.data) setModules(dRes.data.modules);

    if (isSupervisorOrAdmin) {
      const sRes = results[4] as { ok: boolean; data?: { staff: StaffMember[] } };
      const cRes = results[5] as { ok: boolean; data?: { clients: CorporateClient[] } };
      const rRes = results[6] as { ok: boolean; data?: typeof reportSummary };
      if (sRes.ok && sRes.data) {
        setStaff(sRes.data.staff);
        if (
          sRes.data.staff.length > 0 &&
          !sRes.data.staff.some((s) => s.fullName === mntTech)
        ) {
          setMntTech(sRes.data.staff[0].fullName);
        }
      }
      if (cRes.ok && cRes.data) {
        setClients(cRes.data.clients);
        if (
          cRes.data.clients.length > 0 &&
          !cRes.data.clients.some((c) => c.clientId === mntClient)
        ) {
          setMntClient(cRes.data.clients[0].clientId);
        } else if (cRes.data.clients.length === 0) {
          setMntClient('');
        }
      }
      if (rRes.ok && rRes.data) setReportSummary(rRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredTickets = filterTickets(tickets, {
    query,
    status: statusFilter,
    priority: priorityFilter,
  });
  const filteredEquipments = filterEquipments(equipments, eqQuery, eqHealth);
  const metrics = calculateTicketMetrics(tickets);

  const handleScheduleMaintenance = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const res = await apiRequest('/api/maintenances', {
      method: 'POST',
      body: {
        clientCode: mntClient,
        equipmentCode: mntEqp || undefined,
        assignedTechName: mntTech,
        maintenanceType: mntType,
        siteLocation: mntLocation,
        scheduledStart: new Date(mntStart).toISOString(),
        scheduledEnd: new Date(mntEnd).toISOString(),
        checklistSummary: mntChecklist,
      },
    });
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) await loadData();
  };

  const handleUpdateMaintenanceStatus = async (
    id: string,
    status: MaintenanceRecord['status']
  ) => {
    let reason: string | undefined;
    if (status === 'CANCELADO') {
      reason = 'Cancelado operativamente por reprogramación de agenda técnica';
    }
    const res = await apiRequest(`/api/maintenances/${id}`, {
      method: 'PATCH',
      body: { status, cancellationReason: reason },
    });
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) await loadData();
  };

  const handleLogModuleConsult = async (code: string) => {
    const res = await apiRequest(`/api/modules/${code}/view`, { method: 'POST', body: {} });
    setFeedback({
      ok: res.ok,
      text: res.ok ? `Consulta de ${code} registrada en auditoría.` : res.message,
    });
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-slate-600">
        Cargando consola operativa...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Scope Notice */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-semibold text-blue-700">
            CONSOLA OPERATIVA · ROL {currentUser.role} · {currentUser.department}
          </p>
          <h1 className="font-display text-2xl font-bold text-slate-900 mt-1">
            {currentUser.role === 'TÉCNICO'
              ? 'Mis Tickets Asignados y Diagnóstico Técnico'
              : 'Supervisión Operativa, Asignaciones y Control SLA'}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {currentUser.role === 'TÉCNICO'
              ? 'Vista filtrada estrictamente por tickets y activos asignados a tu perfil.'
              : currentUser.role === 'SUPERVISOR'
                ? `Vista departamental autorizada para ${currentUser.department}.`
                : 'Acceso global de supervisión sobre todas las colas y módulos.'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
            <p className="text-xs text-slate-500">Total visibles</p>
            <p className="font-display text-lg font-bold text-slate-900 tabular-nums">
              {metrics.total}
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
            <p className="text-xs text-slate-500">En atención</p>
            <p className="font-display text-lg font-bold text-blue-700 tabular-nums">
              {metrics.enAtencion + metrics.nuevos}
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
            <p className="text-xs text-slate-500">SLA vencidos</p>
            <p className="font-display text-lg font-bold text-red-700 tabular-nums">
              {metrics.slaBreachedCount}
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
            <p className="text-xs text-slate-500">Activos</p>
            <p className="font-display text-lg font-bold text-slate-900 tabular-nums">
              {equipments.length}
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

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 print:hidden">
        {[
          { id: 'tickets', label: `Cola de Tickets (${tickets.length})`, icon: TicketIcon },
          { id: 'assets', label: `Inventario EQP (${equipments.length})`, icon: HardDrive },
          { id: 'maintenances', label: `Mantenimientos (${maintenances.length})`, icon: Calendar },
          ...(isSupervisorOrAdmin
            ? [{ id: 'reports', label: 'Reportes SLA (Mód. 07)', icon: BarChart3 }]
            : []),
          { id: 'modules', label: 'Cuaderno Módulos 00–07', icon: BookOpen },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as OpsTab)}
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

      {/* TAB: TICKETS */}
      {tab === 'tickets' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por folio, asunto, cliente o EQP..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              <option value="Todos">Todos los estados</option>
              <option value="NUEVO">NUEVO</option>
              <option value="ASIGNADO">ASIGNADO</option>
              <option value="EN PROCESO">EN PROCESO</option>
              <option value="EN ESPERA">EN ESPERA</option>
              <option value="RESUELTO">RESUELTO</option>
              <option value="CERRADO">CERRADO</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              <option value="Todas">Todas las prioridades</option>
              <option value="CRÍTICA">CRÍTICA (P1)</option>
              <option value="ALTA">ALTA (P2)</option>
              <option value="MEDIA">MEDIA (P3)</option>
              <option value="BAJA">BAJA (P4)</option>
            </select>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="py-3 px-4 font-semibold">Folio</th>
                    <th className="py-3 px-4 font-semibold">Cliente / Asunto</th>
                    <th className="py-3 px-4 font-semibold">Prioridad</th>
                    <th className="py-3 px-4 font-semibold">Estado</th>
                    <th className="py-3 px-4 font-semibold">Asignado a</th>
                    <th className="py-3 px-4 font-semibold">SLA Resolución</th>
                    <th className="py-3 px-4 font-semibold text-right">Gestionar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.map((t) => {
                    const breached = isSlaBreached(t);
                    return (
                      <tr key={t.folio} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono text-xs font-bold text-blue-700">
                          {t.folio}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900">{t.subject}</p>
                          <p className="text-xs text-slate-500">
                            {t.clientCompany} · {t.department}{' '}
                            {t.equipmentCode ? `· ${t.equipmentCode}` : ''}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <TicketPriorityLabel priority={t.priority} />
                        </td>
                        <td className="py-3 px-4">
                          <TicketStatusLabel status={t.status} />
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700">{t.assignedTech}</td>
                        <td
                          className={`py-3 px-4 text-xs font-mono ${
                            breached ? 'text-red-700 font-bold' : 'text-slate-600'
                          }`}
                        >
                          {formatDateTime(t.slaDueResolution)}
                          {breached && ' · VENCIDO'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => onOpenTicket(t)}
                            className="px-3 py-1.5 text-xs font-semibold text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer"
                          >
                            Abrir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTickets.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                        No hay tickets autorizados para los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ASSETS */}
      {tab === 'assets' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3">
            <input
              type="text"
              value={eqQuery}
              onChange={(e) => setEqQuery(e.target.value)}
              placeholder="Filtrar EQP, hostname, usuario o Perfmon..."
              className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <select
              value={eqHealth}
              onChange={(e) => setEqHealth(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              <option value="Todos">Todos los estados</option>
              <option value="ÓPTIMO">ÓPTIMO</option>
              <option value="ATENCIÓN REQUERIDA">ATENCIÓN REQUERIDA</option>
              <option value="CRÍTICO">CRÍTICO</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEquipments.map((eq) => (
              <article
                key={eq.equipmentCode}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700">
                    {eq.equipmentCode} · {eq.hostname} ({eq.clientCode})
                  </span>
                  <EquipmentHealthLabel status={eq.healthStatus} />
                </div>
                <p className="text-sm font-bold text-slate-900">{eq.brandModel}</p>
                <p className="text-xs text-slate-600">
                  Usuario: {eq.assignedUser} · SO: {eq.osName}
                </p>
                <p className="text-xs text-slate-600">
                  BIOS: {eq.biosInfo} · Secure Boot: {eq.secureBoot ? 'Activo' : 'Desactivado'}
                </p>
                <p className="text-xs text-slate-600">
                  Antivirus: {eq.antivirusStatus} · Firewall: {eq.firewallStatus} · UAC:{' '}
                  {eq.uacStatus}
                </p>
                <p className="text-xs bg-slate-50 border border-slate-100 rounded p-2 text-slate-700 font-mono">
                  Perfmon: {eq.perfmonSummary}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* TAB: MAINTENANCES (MOD 05) */}
      {tab === 'maintenances' && (
        <div className="space-y-6">
          {isSupervisorOrAdmin && (
            <form
              onSubmit={handleScheduleMaintenance}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <h2 className="font-display text-base font-bold text-slate-900">
                Programar Mantenimiento (Módulo 05)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={mntClient}
                  onChange={(e) => setMntClient(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {clients.length === 0 ? (
                    <option value="">Sin clientes corporativos registrados</option>
                  ) : (
                    clients.map((c) => (
                      <option key={c.clientId} value={c.clientId}>
                        {c.clientId} — {c.tradeName}
                      </option>
                    ))
                  )}
                </select>
                <select
                  value={mntEqp}
                  onChange={(e) => setMntEqp(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">General / Todos</option>
                  {equipments.map((eq) => (
                    <option key={eq.equipmentCode} value={eq.equipmentCode}>
                      {eq.equipmentCode} — {eq.hostname}
                    </option>
                  ))}
                </select>
                <select
                  value={mntType}
                  onChange={(e) => setMntType(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="PREVENTIVO">PREVENTIVO</option>
                  <option value="CORRECTIVO">CORRECTIVO</option>
                  <option value="AUDITORIA_SEGURIDAD">AUDITORÍA DE SEGURIDAD</option>
                </select>
                <input
                  type="text"
                  value={mntTech}
                  onChange={(e) => setMntTech(e.target.value)}
                  placeholder="Técnico responsable"
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
                <input
                  type="datetime-local"
                  value={mntStart}
                  onChange={(e) => setMntStart(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
                <input
                  type="datetime-local"
                  value={mntEnd}
                  onChange={(e) => setMntEnd(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={mntLocation}
                  onChange={(e) => setMntLocation(e.target.value)}
                  placeholder="Sede o modalidad"
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  value={mntChecklist}
                  onChange={(e) => setMntChecklist(e.target.value)}
                  placeholder="Checklist de actividades"
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <button
                type="submit"
                disabled={!mntClient}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
              >
                Programar Visita / Mantenimiento
              </button>
            </form>
          )}

          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
            {maintenances.map((m) => (
              <div
                key={m.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <p className="font-bold text-slate-900">
                    {m.id} · {m.clientCompany} ({m.clientCode}) · {m.maintenanceType}
                  </p>
                  <p className="text-slate-600">
                    {formatDateTime(m.scheduledStart)} · Técnico: {m.assignedTechName} · Sede:{' '}
                    {m.siteLocation}
                  </p>
                  <p className="text-slate-500">{m.checklistSummary}</p>
                  <p className="font-semibold text-blue-700">Estado: {m.status}</p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {m.status !== 'COMPLETADO' && m.status !== 'CANCELADO' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpdateMaintenanceStatus(m.id, 'COMPLETADO')}
                        className="px-3 py-1.5 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg cursor-pointer"
                      >
                        Completar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateMaintenanceStatus(m.id, 'CANCELADO')}
                        className="px-3 py-1.5 font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: REPORTS (MOD 07) */}
      {tab === 'reports' && isSupervisorOrAdmin && reportSummary && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Módulo 07 — Reportes y Cumplimiento SLA
              </h2>
              <p className="text-xs text-slate-600">
                Exportaciones auditadas exclusivamente sobre registros autorizados para tu rol.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <a
                href="/api/reports/export?format=csv"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Exportar CSV
              </a>
              <a
                href="/api/reports/export?format=excel"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Exportar Excel (.csv BOM)
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                Imprimir / PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Cumplimiento SLA</p>
              <p className="font-display text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
                {reportSummary.compliancePercent}%
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Tickets Vencidos</p>
              <p className="font-display text-2xl font-bold text-red-700 mt-1 tabular-nums">
                {reportSummary.breached}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Tiempo Prom. Solución</p>
              <p className="font-display text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {reportSummary.avgResolutionMinutes} min
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Satisfacción Promedio</p>
              <p className="font-display text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {reportSummary.avgSatisfaction} / 5
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-700" aria-hidden="true" />
              Carga de Trabajo por Ingeniero (Módulo 01)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {Object.entries(reportSummary.byTech).map(([tech, count]) => (
                <div
                  key={tech}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center"
                >
                  <span className="font-medium text-slate-800">{tech}</span>
                  <span className="font-mono font-bold text-blue-700">{count} tickets</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: MODULE DOCS 00-07 */}
      {tab === 'modules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((m) => (
            <article
              key={m.moduleCode}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-blue-700">
                    {m.moduleCode} · {m.version} · {m.status}
                  </span>
                  <h2 className="font-display text-base font-bold text-slate-900 mt-0.5">
                    {m.title}
                  </h2>
                </div>
                <span className="text-xs text-slate-500 shrink-0">{formatDateShort(m.updatedDate)}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{m.summary}</p>
              <ul className="space-y-1 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                {m.operationalChecklist.map((c) => (
                  <li key={c}>• {c}</li>
                ))}
              </ul>
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="font-mono text-slate-400 truncate max-w-[230px]">{m.fileName}</span>
                <button
                  type="button"
                  onClick={() => handleLogModuleConsult(m.moduleCode)}
                  className="font-semibold text-blue-700 hover:underline cursor-pointer"
                >
                  Registrar consulta
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
