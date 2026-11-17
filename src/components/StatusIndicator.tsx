import {
  AlertTriangle,
  Archive,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  CircleDot,
  Clock,
  Minus,
  PauseCircle,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import {
  SLA_POLICIES,
  type EquipmentHealthStatus,
  type TicketPriority,
  type TicketStatus,
} from '../utils/helpdesk';

export function TicketStatusLabel({ status }: { status: TicketStatus }) {
  switch (status) {
    case 'NUEVO':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 whitespace-nowrap">
          <CircleDot className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>NUEVO</span>
        </span>
      );
    case 'ASIGNADO':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 whitespace-nowrap">
          <UserCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>ASIGNADO</span>
        </span>
      );
    case 'EN PROCESO':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>EN PROCESO</span>
        </span>
      );
    case 'EN ESPERA':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
          <PauseCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>EN ESPERA</span>
        </span>
      );
    case 'RESUELTO':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>RESUELTO</span>
        </span>
      );
    case 'CERRADO':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 whitespace-nowrap">
          <Archive className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>CERRADO</span>
        </span>
      );
  }
}

export function TicketPriorityLabel({ priority }: { priority: TicketPriority }) {
  const code = SLA_POLICIES[priority].code;
  switch (priority) {
    case 'CRÍTICA':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>
            {code} · {priority}
          </span>
        </span>
      );
    case 'ALTA':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 whitespace-nowrap">
          <ArrowUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>
            {code} · {priority}
          </span>
        </span>
      );
    case 'MEDIA':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 whitespace-nowrap">
          <Minus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>
            {code} · {priority}
          </span>
        </span>
      );
    case 'BAJA':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 whitespace-nowrap">
          <ArrowDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>
            {code} · {priority}
          </span>
        </span>
      );
  }
}

export function EquipmentHealthLabel({ status }: { status: EquipmentHealthStatus }) {
  switch (status) {
    case 'ÓPTIMO':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>ÓPTIMO</span>
        </span>
      );
    case 'ATENCIÓN REQUERIDA':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>ATENCIÓN REQUERIDA</span>
        </span>
      );
    case 'CRÍTICO':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 whitespace-nowrap">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>CRÍTICO</span>
        </span>
      );
  }
}
