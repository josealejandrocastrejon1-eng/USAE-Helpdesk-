import { X } from 'lucide-react';
import { USAE_CONTACT } from '../utils/helpdesk';

interface LegalModalProps {
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export function LegalModal({ type, onClose }: LegalModalProps) {
  if (!type) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={type === 'privacy' ? 'Aviso de Privacidad' : 'Términos y Condiciones'}
      className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[88vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              {type === 'privacy'
                ? 'Aviso de Privacidad Integral — USAE'
                : 'Términos y Condiciones de Servicio — USAE Helpdesk'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Versión vigente {USAE_CONTACT.policyVersion} · {USAE_CONTACT.location}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana legal"
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {type === 'privacy' ? (
          <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
            <p>
              <strong className="text-slate-900">Responsable:</strong> USAE, con domicilio operativo en{' '}
              {USAE_CONTACT.location}, es responsable del tratamiento y resguardo de los datos personales,
              corporativos y técnicos recabados a través de {USAE_CONTACT.systemName}.
            </p>
            <p>
              <strong className="text-slate-900">Finalidades primarias:</strong> Autenticación segura de cuentas,
              administración de contratos y suscripciones en MXN, atención de tickets bajo niveles de servicio (SLA),
              inventario técnico de equipos (EQP-XXX), programación de mantenimientos preventivos/correctivos y
              facturación conforme a datos fiscales proporcionados.
            </p>
            <p>
              <strong className="text-slate-900">Confidencialidad y evidencias:</strong> Las evidencias adjuntas y
              bitácoras operativas se almacenan con acceso privado restringido por rol y pertenencia. Ningún
              documento fiscal, expediente técnico o nota interna se comparte públicamente ni con terceros ajenos.
            </p>
            <p>
              <strong className="text-slate-900">Derechos ARCO y contacto:</strong> Puedes ejercer tus derechos de
              acceso, rectificación, cancelación u oposición enviando solicitud a{' '}
              <span className="font-medium text-slate-900">{USAE_CONTACT.email}</span>.
            </p>
          </div>
        ) : (
          <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
            <p>
              <strong className="text-slate-900">1. Acceso y separación de portal:</strong> El acceso al panel
              privado requiere registro, verificación de correo electrónico y autenticación con contraseña. La
              creación de tickets de soporte cubiertos exige contar con un plan vigente, pagado y confirmado.
            </p>
            <p>
              <strong className="text-slate-900">2. Activación de planes y pagos:</strong> Las contrataciones en
              MXN por Mercado Pago se activan únicamente tras confirmación verificable del servidor/webhook. Las
              transferencias SPEI permanecen en estado PAGO_EN_REVISION hasta su validación por un administrador.
            </p>
            <p>
              <strong className="text-slate-900">3. Plazos, renovaciones y cancelaciones:</strong> Los planes
              mensuales indican su plazo mínimo y límite de equipos en la ficha del catálogo. No se realizan cargos
              automáticos recurrentes sin consentimiento expreso. Al vencer el periodo, el cliente conserva acceso a
              su historial pero no puede levantar nuevos tickets hasta renovar.
            </p>
            <p>
              <strong className="text-slate-900">4. Proyectos de Desarrollo Web y Garantías:</strong> Los planes
              DEV-BASICO y DEV-PRO operan bajo esquema 50% anticipo no reembolsable una vez iniciado el proyecto y
              50% contra entrega, con garantía técnica correctiva de 30 o 60 días respectivamente.
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
