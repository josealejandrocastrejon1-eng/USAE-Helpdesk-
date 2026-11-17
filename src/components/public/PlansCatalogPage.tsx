import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  X,
} from 'lucide-react';
import { formatMXN, type ServicePlan } from '../../utils/helpdesk';

interface PlansCatalogPageProps {
  plans: ServicePlan[];
  onSelectPlanForCheckout: (plan: ServicePlan) => void;
  onRequestQuote: (plan: ServicePlan) => void;
}

const CATEGORIES = [
  'Todos',
  'TI / Infraestructura',
  'Desarrollo Web',
  'Ciberseguridad',
  'Servicios Personalizados',
] as const;

export function PlansCatalogPage({
  plans,
  onSelectPlanForCheckout,
  onRequestQuote,
}: PlansCatalogPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [detailPlan, setDetailPlan] = useState<ServicePlan | null>(null);

  const visiblePlans =
    selectedCategory === 'Todos'
      ? plans
      : plans.filter((p) => p.category === selectedCategory);

  const hasUnconfirmed = plans.some((p) => !p.priceConfirmedByAdmin);

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
          Catálogo Comercial Completo · Moneda MXN
        </p>
        <h1 className="font-display text-3xl font-bold text-slate-900">
          Planes, Alcances, Límites y Condiciones
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl">
          Todos nuestros planes muestran explícitamente su precio de referencia, periodicidad o
          proyecto único, límite de equipos cubiertos, horario SLA, garantías y reglas de
          cancelación.
        </p>
      </div>

      {hasUnconfirmed && (
        <div
          role="note"
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-sm text-amber-900"
        >
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold">Transparencia de precios de catálogo</p>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              Algunos planes incluyen referencias promocionales o contractuales alternativas en la
              documentación fuente; cualquier tarifa alternativa está marcada como{' '}
              <strong>&ldquo;sujeta a validación comercial&rdquo;</strong> hasta que Administración
              publique la campaña definitiva.
            </p>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar planes por categoría">
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                active
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Plans Grid (All 8 visible cleanly) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visiblePlans.map((plan) => {
          const isExpanded = expandedPlan === plan.code;
          const isCustom = plan.priceMXN === null || plan.billingPeriod === 'COTIZACION';

          return (
            <article
              key={plan.code}
              className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-slate-500">
                    {plan.code} · v{plan.version}
                  </span>
                  <span className="text-xs font-medium text-blue-700">{plan.category}</span>
                </div>

                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900">{plan.title}</h2>
                  <p className="font-display text-2xl font-bold text-slate-900 mt-2 tabular-nums">
                    {plan.priceMXN !== null ? formatMXN(plan.priceMXN) : 'A cotización'}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      {plan.billingPeriod === 'MENSUAL'
                        ? `MXN / mes ${plan.includesIva ? '(IVA incl.)' : '(tarifa catálogo)'}`
                        : plan.billingPeriod === 'PROYECTO_UNICO'
                          ? 'MXN · Proyecto único'
                          : ''}
                    </span>
                  </p>
                </div>

                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <p>
                    <strong className="text-slate-800">Plazo / duración:</strong> {plan.duration}
                  </p>
                  <p>
                    <strong className="text-slate-800">Horario / SLA:</strong> {plan.slaSummary}
                  </p>
                  <p>
                    <strong className="text-slate-800">Límite equipos:</strong>{' '}
                    {isCustom ? 'Según proyecto' : `Hasta ${plan.maxEquipments} equipos`}
                    {plan.monthlyVisitsIncluded > 0 &&
                      ` · ${plan.monthlyVisitsIncluded} visitas en sitio/mes`}
                  </p>
                </div>

                {plan.alternativePriceNote && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" aria-hidden="true" />
                    <span>{plan.alternativePriceNote}</span>
                  </p>
                )}

                <ul className="space-y-1.5 pt-1">
                  {plan.scope.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2
                        className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => setExpandedPlan(isExpanded ? null : plan.code)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 pt-1 cursor-pointer"
                >
                  {isExpanded ? (
                    <>
                      Ocultar condiciones contractuales
                      <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                    </>
                  ) : (
                    <>
                      Ver condiciones, garantías y cancelación
                      <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                    </>
                  )}
                </button>

                {isExpanded && (
                  <div className="text-xs text-slate-600 space-y-1.5 border-t border-slate-100 pt-2.5">
                    <p>
                      <strong className="text-slate-800">Condiciones:</strong> {plan.contractTerms}
                    </p>
                    <p>
                      <strong className="text-slate-800">Garantía:</strong> {plan.guaranteeRule}
                    </p>
                    <p>
                      <strong className="text-slate-800">Cancelación:</strong> {plan.cancellationRule}
                    </p>
                    <p>
                      <strong className="text-slate-800">Categorías cubiertas:</strong>{' '}
                      {plan.coveredCategories.join(', ')}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setDetailPlan(plan)}
                  className="px-3.5 py-2.5 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Detalle
                </button>
                {isCustom ? (
                  <button
                    type="button"
                    onClick={() => onRequestQuote(plan)}
                    className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
                  >
                    Solicitar Cotización
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectPlanForCheckout(plan)}
                    className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 cursor-pointer"
                  >
                    Contratar / Renovar
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Comparison Matrix */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Tabla Comparativa de Límites, SLA y Cobertura
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-3 px-4 font-semibold">Código</th>
                <th className="py-3 px-4 font-semibold">Plan</th>
                <th className="py-3 px-4 font-semibold">Precio Ref. MXN</th>
                <th className="py-3 px-4 font-semibold">Plazo</th>
                <th className="py-3 px-4 font-semibold">Equipos</th>
                <th className="py-3 px-4 font-semibold">Visitas/Mes</th>
                <th className="py-3 px-4 font-semibold">Cobertura SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plans.map((p) => (
                <tr key={p.code} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-700">
                    {p.code}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">{p.title}</td>
                  <td className="py-3 px-4 tabular-nums font-semibold text-slate-900">
                    {p.priceMXN !== null ? formatMXN(p.priceMXN) : 'A cotización'}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">{p.duration}</td>
                  <td className="py-3 px-4 tabular-nums text-xs text-slate-700">
                    {p.billingPeriod === 'COTIZACION' ? 'Variable' : `Hasta ${p.maxEquipments}`}
                  </td>
                  <td className="py-3 px-4 tabular-nums text-xs text-slate-700">
                    {p.monthlyVisitsIncluded}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">{p.slaSummary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detail Modal */}
      {detailPlan && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Detalle del plan ${detailPlan.title}`}
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 space-y-4 max-h-[88vh] overflow-y-auto shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <p className="font-mono text-xs text-slate-500">
                  {detailPlan.code} · Versión de condiciones v{detailPlan.version}
                </p>
                <h3 className="font-display text-xl font-bold text-slate-900 mt-0.5">
                  {detailPlan.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailPlan(null)}
                aria-label="Cerrar detalle del plan"
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <p className="text-xs text-slate-500">Importe de referencia</p>
                <p className="font-display font-bold text-slate-900 tabular-nums">
                  {detailPlan.priceMXN !== null ? `${formatMXN(detailPlan.priceMXN)} MXN` : 'A cotización'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Plazo / Duración</p>
                <p className="font-medium text-slate-900">{detailPlan.duration}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Horario / SLA</p>
                <p className="font-medium text-slate-900">{detailPlan.slaSummary}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Equipos / Visitas</p>
                <p className="font-medium text-slate-900">
                  Hasta {detailPlan.maxEquipments} eq. · {detailPlan.monthlyVisitsIncluded} visitas/mes
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-display text-sm font-bold text-slate-900">Alcance incluido</h4>
              <ul className="space-y-1.5">
                {detailPlan.scope.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-200 pt-3">
              <p>
                <strong className="text-slate-900">Términos de contratación:</strong>{' '}
                {detailPlan.contractTerms}
              </p>
              <p>
                <strong className="text-slate-900">Garantía:</strong> {detailPlan.guaranteeRule}
              </p>
              <p>
                <strong className="text-slate-900">Cancelación:</strong> {detailPlan.cancellationRule}
              </p>
              {detailPlan.alternativePriceNote && (
                <p className="text-amber-800 font-medium pt-1">{detailPlan.alternativePriceNote}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailPlan(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cerrar
              </button>
              {detailPlan.priceMXN === null ? (
                <button
                  type="button"
                  onClick={() => {
                    const p = detailPlan;
                    setDetailPlan(null);
                    onRequestQuote(p);
                  }}
                  className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  Solicitar Cotización
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const p = detailPlan;
                    setDetailPlan(null);
                    onSelectPlanForCheckout(p);
                  }}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 cursor-pointer"
                >
                  Contratar este Plan
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
