import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Lock,
  MessageSquare,
  Paperclip,
  Printer,
  RotateCcw,
  Star,
  UserCheck,
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import {
  formatDateTime,
  isSlaBreached,
  SLA_POLICIES,
  type AuthUser,
  type StaffMember,
  type Ticket,
  type TicketStatus,
} from '../../utils/helpdesk';
import { BrandLogo } from '../BrandLogo';
import { TicketPriorityLabel, TicketStatusLabel } from '../StatusIndicator';

interface TicketDetailViewProps {
  ticket: Ticket;
  currentUser: AuthUser;
  staffList: StaffMember[];
  onBack: () => void;
  onTicketUpdated: (updated: Ticket) => void;
}

export function TicketDetailView({
  ticket,
  currentUser,
  staffList,
  onBack,
  onTicketUpdated,
}: TicketDetailViewProps) {
  const isStaff = currentUser.role !== 'USUARIO';
  const canAssign = currentUser.role === 'SUPERVISOR' || currentUser.role === 'ADMINISTRADOR';
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Comment state
  const [commentMsg, setCommentMsg] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  // Activity state (Mod 02)
  const [actType, setActType] = useState('DIAGNÓSTICO');
  const [actDesc, setActDesc] = useState('');
  const [actMinutes, setActMinutes] = useState(30);
  const [actResult, setActResult] = useState('');
  const [actNextStep, setActNextStep] = useState('');
  const [actInternal, setActInternal] = useState(false);

  // Assignment & Status state (Mod 01)
  const [assignTechId, setAssignTechId] = useState<string>(
    ticket.assignedTechId ? String(ticket.assignedTechId) : ''
  );
  const [assignReason, setAssignReason] = useState('');
  const [nextStatus, setNextStatus] = useState<TicketStatus>(ticket.status);
  const [pauseReason, setPauseReason] = useState('');

  // Resolution / Closure state (Mod 04)
  const [rootCause, setRootCause] = useState(ticket.rootCause || '');
  const [activitiesPerf, setActivitiesPerf] = useState(ticket.activitiesPerformed || '');
  const [solutionDetails, setSolutionDetails] = useState(ticket.solutionDetails || '');
  const [recommendations, setRecommendations] = useState(ticket.recommendations || '');
  const [checklist, setChecklist] = useState(
    ticket.diagnosisChecklist ?? {
      reproduced: false,
      rootCauseIdentified: false,
      securityVerified: false,
      backupVerified: false,
    }
  );
  const [clientScore, setClientScore] = useState(ticket.satisfactionScore ?? 5);
  const [reopenReason, setReopenReason] = useState('');

  // Print Service Sheet state
  const [showServiceSheet, setShowServiceSheet] = useState(false);

  useEffect(() => {
    setAssignTechId(ticket.assignedTechId ? String(ticket.assignedTechId) : '');
    const validSelectStatus: TicketStatus =
      ticket.status === 'NUEVO' ||
      ticket.status === 'ASIGNADO' ||
      ticket.status === 'EN PROCESO' ||
      ticket.status === 'EN ESPERA'
        ? ticket.status
        : 'EN PROCESO';
    setNextStatus(validSelectStatus);
    setRootCause(ticket.rootCause || '');
    setActivitiesPerf(ticket.activitiesPerformed || '');
    setSolutionDetails(ticket.solutionDetails || '');
    setRecommendations(ticket.recommendations || '');
    setChecklist(
      ticket.diagnosisChecklist ?? {
        reproduced: false,
        rootCauseIdentified: false,
        securityVerified: false,
        backupVerified: false,
      }
    );
    setClientScore(ticket.satisfactionScore ?? 5);
  }, [
    ticket.folio,
    ticket.status,
    ticket.assignedTechId,
    ticket.updatedAt,
    ticket.rootCause,
    ticket.activitiesPerformed,
    ticket.solutionDetails,
    ticket.recommendations,
    ticket.diagnosisChecklist,
    ticket.satisfactionScore,
  ]);

  const breached = isSlaBreached(ticket);
  const slaPolicy = SLA_POLICIES[ticket.priority];

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    const res = await apiRequest<{ ticket: Ticket }>(`/api/tickets/${ticket.folio}/comments`, {
      method: 'POST',
      body: {
        message: commentMsg,
        isInternal: isStaff ? isInternalNote : false,
      },
    });
    setBusy(false);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok && res.data?.ticket) {
      setCommentMsg('');
      setIsInternalNote(false);
      onTicketUpdated(res.data.ticket);
    }
  };

  const handleActivitySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    const res = await apiRequest<{ ticket: Ticket }>(`/api/tickets/${ticket.folio}/activities`, {
      method: 'POST',
      body: {
        activityType: actType,
        description: actDesc,
        durationMinutes: Number(actMinutes),
        resultSummary: actResult,
        nextStep: actNextStep,
        isInternal: actInternal,
      },
    });
    setBusy(false);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok && res.data?.ticket) {
      setActDesc('');
      setActResult('');
      setActNextStep('');
      onTicketUpdated(res.data.ticket);
    }
  };

  const handleAssignSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!assignTechId) return;
    setBusy(true);
    setFeedback(null);
    const res = await apiRequest<{ ticket: Ticket }>(`/api/tickets/${ticket.folio}/assign`, {
      method: 'POST',
      body: {
        techUserId: Number(assignTechId),
        reason: assignReason,
      },
    });
    setBusy(false);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok && res.data?.ticket) {
      setAssignReason('');
      onTicketUpdated(res.data.ticket);
    }
  };

  const handleStatusSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    const res = await apiRequest<{ ticket: Ticket }>(`/api/tickets/${ticket.folio}/status`, {
      method: 'POST',
      body: {
        status: nextStatus,
        pauseReason,
      },
    });
    setBusy(false);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok && res.data?.ticket) {
      setPauseReason('');
      onTicketUpdated(res.data.ticket);
    }
  };

  const handleStaffResolve = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    const res = await apiRequest<{ ticket: Ticket }>(`/api/tickets/${ticket.folio}/close`, {
      method: 'POST',
      body: {
        rootCause,
        activitiesPerformed: activitiesPerf,
        solutionDetails,
        recommendations,
        diagnosisChecklist: checklist,
        finalStatus: 'RESUELTO',
      },
    });
    setBusy(false);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok && res.data?.ticket) {
      onTicketUpdated(res.data.ticket);
    }
  };

  const handleClientConfirmClose = async () => {
    setBusy(true);
    setFeedback(null);
    const res = await apiRequest<{ ticket: Ticket }>(`/api/tickets/${ticket.folio}/close`, {
      method: 'POST',
      body: { satisfactionScore: clientScore },
    });
    setBusy(false);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok && res.data?.ticket) {
      onTicketUpdated(res.data.ticket);
    }
  };

  const handleReopen = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    const res = await apiRequest<{ ticket: Ticket }>(`/api/tickets/${ticket.folio}/reopen`, {
      method: 'POST',
      body: { reason: reopenReason },
    });
    setBusy(false);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok && res.data?.ticket) {
      setReopenReason('');
      onTicketUpdated(res.data.ticket);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setFeedback({ ok: false, text: 'El archivo excede el límite máximo de 10 MB.' });
      return;
    }

    setBusy(true);
    setFeedback(null);

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('READ_ERROR'));
      reader.readAsDataURL(file);
    }).catch(() => '');

    if (!base64) {
      setBusy(false);
      setFeedback({ ok: false, text: 'No fue posible leer el archivo seleccionado.' });
      return;
    }

    const res = await apiRequest<{ ticket: Ticket }>(`/api/tickets/${ticket.folio}/attachments`, {
      method: 'POST',
      body: {
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        contentBase64: base64,
        category: 'EVIDENCIA',
      },
    });
    setBusy(false);
    e.target.value = '';
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok && res.data?.ticket) {
      onTicketUpdated(res.data.ticket);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Volver al listado
        </button>

        <button
          type="button"
          onClick={() => setShowServiceSheet((prev) => !prev)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
        >
          <Printer className="w-4 h-4" aria-hidden="true" />
          {showServiceSheet ? 'Ocultar Hoja de Servicio' : 'Hoja de Servicio Imprimible'}
        </button>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`p-3.5 rounded-lg border text-sm print:hidden ${
            feedback.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Printable On-Site Service Sheet (Module 04 / Section 9.2) */}
      {showServiceSheet && (
        <section className="bg-white border-2 border-slate-900 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-300 pb-4">
            <BrandLogo />
            <div className="text-left sm:text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Hoja de Servicio en Sitio / Conformidad
              </p>
              <p className="font-mono text-lg font-bold text-slate-900">{ticket.folio}</p>
              <p className="text-xs text-slate-600">
                Fecha de emisión: {formatDateTime(new Date().toISOString())}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="border border-slate-200 rounded-lg p-3 space-y-1">
              <p className="font-bold text-slate-900 uppercase">Datos del Cliente</p>
              <p>Empresa: {ticket.clientCompany}</p>
              <p>Solicitante: {ticket.requesterName}</p>
              <p>Correo: {ticket.requesterEmail}</p>
              <p>Modalidad: {ticket.serviceMode || 'REMOTO'}</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 space-y-1">
              <p className="font-bold text-slate-900 uppercase">Activo y Atención</p>
              <p>Equipo vinculado: {ticket.equipmentCode || 'No especificado'}</p>
              <p>Departamento: {ticket.department}</p>
              <p>Técnico asignado: {ticket.assignedTech}</p>
              <p>Estado actual: {ticket.status}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <p className="font-bold text-slate-900 uppercase">Diagnóstico y Solución</p>
            <p className="text-slate-700">
              <strong>Incidencia:</strong> {ticket.description}
            </p>
            <p className="text-slate-700">
              <strong>Causa raíz:</strong> {ticket.rootCause || 'En validación técnica'}
            </p>
            <p className="text-slate-700">
              <strong>Actividades ejecutadas:</strong>{' '}
              {ticket.activitiesPerformed || 'Ver bitácora de seguimiento'}
            </p>
            <p className="text-slate-700">
              <strong>Solución aplicada:</strong> {ticket.solutionDetails || 'Pendiente de cierre'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-xs text-center">
            <div>
              <div className="border-b border-slate-400 h-10 mb-2" />
              <p className="font-semibold text-slate-900">{ticket.assignedTech}</p>
              <p className="text-slate-500">Nombre y Firma del Ingeniero USAE</p>
            </div>
            <div>
              <div className="border-b border-slate-400 h-10 mb-2" />
              <p className="font-semibold text-slate-900">{ticket.requesterName}</p>
              <p className="text-slate-500">
                Nombre y Firma de Conformidad del Cliente · Calificación:{' '}
                {ticket.satisfactionScore ? `${ticket.satisfactionScore}/5` : '___/5'}
              </p>
            </div>
          </div>

          <div className="flex justify-end print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <Printer className="w-4 h-4" aria-hidden="true" />
              Imprimir / Guardar PDF
            </button>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:hidden">
        {/* Left Main Content */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-blue-700">{ticket.folio}</span>
                <h1 className="font-display text-xl font-bold text-slate-900 mt-1">
                  {ticket.subject}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <TicketPriorityLabel priority={ticket.priority} />
                <TicketStatusLabel status={ticket.status} />
              </div>
            </div>

            <div className="text-xs text-slate-500 flex flex-wrap gap-x-6 gap-y-1">
              <span>
                Solicitante: <strong className="text-slate-800">{ticket.requesterName}</strong> (
                {ticket.clientCompany})
              </span>
              <span>Categoría: {ticket.category}</span>
              <span>Departamento: {ticket.department}</span>
              <span>Creado: {formatDateTime(ticket.createdAt)}</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </div>

            {/* Module 03 — Protected Attachments */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-blue-700" aria-hidden="true" />
                  Evidencias Adjuntas (Resguardo Privado · Máx. 10 MB)
                </h2>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={busy}
                    className="sr-only"
                  />
                  + Adjuntar evidencia
                </label>
              </div>

              {ticket.attachments.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Sin archivos adjuntos. Formatos admitidos: PNG, JPG, WEBP, PDF, TXT, CSV, LOG,
                  XLSX, DOCX.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                  {ticket.attachments.map((att) => (
                    <li
                      key={att.id}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{att.fileName}</p>
                        <p className="text-slate-500">
                          {att.fileSizeKb} KB · {att.fileType} · Subido por {att.uploadedByEmail}
                        </p>
                      </div>
                      {att.downloadUrl ? (
                        <a
                          href={att.downloadUrl}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 font-semibold text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50 shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" aria-hidden="true" />
                          Descargar
                        </a>
                      ) : (
                        <span className="text-slate-400">Referencia semilla</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Comments Thread */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-700" aria-hidden="true" />
              Comentarios y Seguimiento
            </h2>

            <div className="space-y-3">
              {ticket.comments.length === 0 ? (
                <p className="text-xs text-slate-500">Aún no hay comentarios registrados.</p>
              ) : (
                ticket.comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3.5 rounded-lg border text-sm ${
                      c.isInternal
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-900">
                        {c.author} · <span className="font-mono text-slate-500">{c.role}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        {c.isInternal && (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-800">
                            <Lock className="w-3 h-3" aria-hidden="true" />
                            Nota interna (Solo personal)
                          </span>
                        )}
                        <span className="text-slate-500">{formatDateTime(c.createdAt)}</span>
                      </div>
                    </div>
                    <p className="mt-1.5 text-slate-700 whitespace-pre-wrap">{c.message}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleCommentSubmit} className="space-y-3 pt-2 border-t border-slate-100">
              <textarea
                rows={3}
                required
                value={commentMsg}
                onChange={(e) => setCommentMsg(e.target.value)}
                placeholder={
                  isStaff && isInternalNote
                    ? 'Escribe una nota técnica interna (nunca visible para el cliente)...'
                    : 'Escribe un comentario visible en la conversación del ticket...'
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                {isStaff ? (
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-amber-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                    />
                    Marcar como nota interna (oculta al cliente)
                  </label>
                ) : (
                  <span className="text-xs text-slate-500">Comentario visible para soporte USAE</span>
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 cursor-pointer"
                >
                  Enviar Comentario
                </button>
              </div>
            </form>
          </div>

          {/* Module 02 — Activities & Time Log */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-700" aria-hidden="true" />
              Bitácora de Actividades (Módulo 02)
            </h2>

            {(ticket.activities ?? []).length === 0 ? (
              <p className="text-xs text-slate-500">Sin actividades registradas en bitácora.</p>
            ) : (
              <div className="space-y-2">
                {(ticket.activities ?? []).map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900">
                        {act.activityType} · {act.actorName}
                      </span>
                      <span className="font-mono text-slate-500">
                        {act.durationMinutes} min · {formatDateTime(act.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-700">{act.description}</p>
                    {act.resultSummary && (
                      <p className="text-slate-600">
                        <strong>Resultado:</strong> {act.resultSummary}
                      </p>
                    )}
                    {act.nextStep && (
                      <p className="text-slate-600">
                        <strong>Siguiente paso:</strong> {act.nextStep}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isStaff && (
              <form
                onSubmit={handleActivitySubmit}
                className="border-t border-slate-100 pt-4 space-y-3"
              >
                <p className="text-xs font-bold text-slate-800">Registrar actividad técnica</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={actType}
                    onChange={(e) => setActType(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="DIAGNÓSTICO">DIAGNÓSTICO</option>
                    <option value="SOPORTE_REMOTO">SOPORTE REMOTO</option>
                    <option value="VISITA_EN_SITIO">VISITA EN SITIO</option>
                    <option value="CONTENCIÓN_SEGURIDAD">CONTENCIÓN SEGURIDAD</option>
                    <option value="VALIDACIÓN_CLIENTE">VALIDACIÓN CLIENTE</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    value={actMinutes}
                    onChange={(e) => setActMinutes(Number(e.target.value))}
                    placeholder="Minutos invertidos"
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={actDesc}
                  onChange={(e) => setActDesc(e.target.value)}
                  placeholder="Descripción de la actividad ejecutada..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={actResult}
                    onChange={(e) => setActResult(e.target.value)}
                    placeholder="Resultado obtenido (opcional)"
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={actNextStep}
                    onChange={(e) => setActNextStep(e.target.value)}
                    placeholder="Siguiente paso (opcional)"
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actInternal}
                      onChange={(e) => setActInternal(e.target.checked)}
                    />
                    Actividad interna
                  </label>
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
                  >
                    Guardar Actividad
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Sidebar: SLA, Assignment, Resolution & Reopen */}
        <div className="lg:col-span-4 space-y-5">
          {/* SLA & Metadata Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-xs">
            <h2 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-700" aria-hidden="true" />
              Compromiso SLA y Datos del Activo
            </h2>
            <div className="space-y-2 border-t border-slate-100 pt-2.5 text-slate-600">
              <p>
                <strong className="text-slate-900">Nivel aplicado:</strong> {slaPolicy.code} (
                {ticket.slaIs24_7 ? '24/7' : 'Horario laboral'})
              </p>
              <p>
                <strong className="text-slate-900">Plan vigente al crear:</strong>{' '}
                {ticket.slaPlanCode || 'N/A'} (v{ticket.slaVersion ?? 1})
              </p>
              <p>
                <strong className="text-slate-900">Venc. 1ra respuesta:</strong>{' '}
                {formatDateTime(ticket.slaDueResponse)}
              </p>
              <p className={breached ? 'text-red-700 font-semibold' : 'text-slate-700'}>
                <strong>Venc. resolución:</strong> {formatDateTime(ticket.slaDueResolution)}
                {breached && ' · SLA VENCIDO'}
              </p>
              {(ticket.pausedMinutes ?? 0) > 0 && (
                <p className="text-amber-700">
                  <strong>Tiempo pausado en espera:</strong> {ticket.pausedMinutes} min
                </p>
              )}
              <p>
                <strong className="text-slate-900">Ingeniero asignado:</strong>{' '}
                {ticket.assignedTech}
              </p>
              <p>
                <strong className="text-slate-900">Equipo EQP:</strong>{' '}
                {ticket.equipmentCode || 'No vinculado'}
              </p>
            </div>
          </div>

          {/* Module 01 Assignment & Status (Staff) */}
          {isStaff && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              {canAssign && (
                <form onSubmit={handleAssignSubmit} className="space-y-2.5 border-b border-slate-100 pb-4">
                  <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
                    Módulo 01 · Asignar Ingeniero
                  </h3>
                  <select
                    value={assignTechId}
                    onChange={(e) => setAssignTechId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Selecciona ingeniero...</option>
                    {staffList
                      .filter((s) => s.userId)
                      .map((s) => (
                        <option key={s.employeeId} value={String(s.userId)}>
                          {s.fullName} ({s.rbacRole})
                        </option>
                      ))}
                  </select>
                  <input
                    type="text"
                    value={assignReason}
                    onChange={(e) => setAssignReason(e.target.value)}
                    placeholder="Motivo (obligatorio al reasignar)"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                  <button
                    type="submit"
                    disabled={busy || !assignTechId}
                    className="w-full py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                  >
                    Aplicar Asignación
                  </button>
                </form>
              )}

              <form onSubmit={handleStatusSubmit} className="space-y-2.5">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-800">
                  Flujo de Estado
                </h3>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value as TicketStatus)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="NUEVO">NUEVO</option>
                  <option value="ASIGNADO">ASIGNADO</option>
                  <option value="EN PROCESO">EN PROCESO</option>
                  <option value="EN ESPERA">EN ESPERA (Pausa SLA)</option>
                </select>
                {nextStatus === 'EN ESPERA' && (
                  <input
                    type="text"
                    required
                    value={pauseReason}
                    onChange={(e) => setPauseReason(e.target.value)}
                    placeholder="Motivo obligatorio de pausa / espera..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-2 text-xs font-semibold text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Actualizar Estado
                </button>
              </form>
            </div>
          )}

          {/* Module 04 — Resolution / Validation / Reopen */}
          {isStaff && ticket.status !== 'CERRADO' && (
            <form
              onSubmit={handleStaffResolve}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
            >
              <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                Módulo 04 · Resolución Técnica
              </h3>
              <div className="space-y-1.5 text-xs text-slate-700">
                {[
                  { key: 'reproduced', label: 'Incidencia reproducida y verificada' },
                  { key: 'rootCauseIdentified', label: 'Causa raíz documentada' },
                  { key: 'securityVerified', label: 'Antivirus/Firewall validados' },
                  { key: 'backupVerified', label: 'Integridad / respaldo verificado' },
                ].map((chk) => (
                  <label key={chk.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(checklist[chk.key as keyof typeof checklist])}
                      onChange={(e) =>
                        setChecklist((prev) => ({ ...prev, [chk.key]: e.target.checked }))
                      }
                    />
                    <span>{chk.label}</span>
                  </label>
                ))}
              </div>
              <input
                type="text"
                required
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                placeholder="Causa raíz identificada *"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <textarea
                rows={2}
                required
                value={activitiesPerf}
                onChange={(e) => setActivitiesPerf(e.target.value)}
                placeholder="Actividades realizadas *"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <textarea
                rows={2}
                required
                value={solutionDetails}
                onChange={(e) => setSolutionDetails(e.target.value)}
                placeholder="Solución aplicada *"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="Recomendaciones preventivas (opcional)"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 cursor-pointer"
              >
                Marcar como RESUELTO
              </button>
            </form>
          )}

          {/* Client Validation & Satisfaction (Mod 04) */}
          {currentUser.role === 'USUARIO' && ticket.status === 'RESUELTO' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3">
              <h3 className="font-display text-sm font-bold text-emerald-900">
                Confirmar Resolución y Calificar
              </h3>
              <p className="text-xs text-emerald-800">
                <strong>Solución reportada:</strong> {ticket.solutionDetails}
              </p>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setClientScore(star)}
                    aria-label={`Calificar con ${star} estrellas`}
                    className={`p-1.5 rounded cursor-pointer ${
                      star <= clientScore ? 'text-amber-500' : 'text-slate-300'
                    }`}
                  >
                    <Star className="w-5 h-5 fill-current" aria-hidden="true" />
                  </button>
                ))}
                <span className="text-xs font-semibold text-slate-700 ml-1">{clientScore}/5</span>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={handleClientConfirmClose}
                className="w-full py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 cursor-pointer"
              >
                Confirmar Cierre del Ticket
              </button>
            </div>
          )}

          {/* Controlled Reopen */}
          {(ticket.status === 'RESUELTO' || ticket.status === 'CERRADO') && (
            <form
              onSubmit={handleReopen}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5"
            >
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
                Reapertura Controlada
              </h3>
              <textarea
                rows={2}
                required
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Motivo obligatorio de reapertura (mín. 10 caracteres)..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full py-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 cursor-pointer"
              >
                Solicitar Reapertura
              </button>
            </form>
          )}

          {/* Immutable History */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              Historial Inmutable
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 max-h-64 overflow-y-auto">
              {ticket.history.map((h) => (
                <li key={h.id} className="border-l-2 border-slate-200 pl-2.5 py-0.5">
                  <p className="font-semibold text-slate-800">{h.action}</p>
                  <p>
                    {h.actor}
                    {h.previousState ? ` · ${h.previousState} → ${h.newState}` : ''}
                  </p>
                  {h.reason && <p className="text-slate-500">Motivo: {h.reason}</p>}
                  <p className="text-[11px] text-slate-400">{formatDateTime(h.createdAt)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
