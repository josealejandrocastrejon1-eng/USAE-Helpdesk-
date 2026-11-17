import { useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, Lock, MailCheck, UserPlus } from 'lucide-react';
import { apiRequest, setCsrfToken } from '../../utils/api';
import type { AuthUser, SubscriptionRecord } from '../../utils/helpdesk';

export interface DemoAccountOption {
  email: string;
  password: string;
  role: string;
  label: string;
  planStateLabel: string;
}

interface AuthPageProps {
  demoMode: boolean;
  demoAccounts: DemoAccountOption[];
  onAuthSuccess: (user: AuthUser, subscription: SubscriptionRecord | null) => void;
  onOpenLegal: (type: 'privacy' | 'terms') => void;
}

type AuthTab = 'login' | 'register' | 'verify' | 'forgot';

export function AuthPage({
  demoMode,
  demoAccounts,
  onAuthSuccess,
  onOpenLegal,
}: AuthPageProps) {
  const [tab, setTab] = useState<AuthTab>('login');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regRfc, setRegRfc] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Verify token state
  const [verifyToken, setVerifyToken] = useState('');

  // Forgot/Reset password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await apiRequest<{
      user: AuthUser;
      csrfToken: string;
      subscription: SubscriptionRecord | null;
    }>('/api/auth/login', {
      method: 'POST',
      body: { email: loginEmail, password: loginPassword },
    });
    setBusy(false);

    if (!res.ok || !res.data) {
      setMessage({ ok: false, text: res.message });
      return;
    }

    setCsrfToken(res.data.csrfToken);
    onAuthSuccess(res.data.user, res.data.subscription ?? null);
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await apiRequest<{
      email: string;
      devVerificationToken?: string;
    }>('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: regName,
        email: regEmail,
        phone: regPhone,
        companyName: regCompany,
        rfc: regRfc,
        password: regPassword,
        confirmPassword: regConfirm,
        privacyAccepted,
        termsAccepted,
      },
    });
    setBusy(false);

    if (!res.ok) {
      setMessage({ ok: false, text: res.message });
      return;
    }

    if (res.data?.devVerificationToken) {
      setVerifyToken(res.data.devVerificationToken);
      setMessage({
        ok: true,
        text: 'Cuenta registrada con estado SIN_PLAN. SMTP no está configurado en entorno local; se prellenó tu token único de verificación para completar el paso.',
      });
    } else {
      setMessage({
        ok: true,
        text: 'Cuenta registrada. Ingresa el token de verificación enviado a tu correo electrónico.',
      });
    }
    setLoginEmail(regEmail);
    setTab('verify');
  };

  const handleVerifyEmail = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await apiRequest('/api/auth/verify-email', {
      method: 'POST',
      body: { token: verifyToken },
    });
    setBusy(false);
    setMessage({ ok: res.ok, text: res.message });
    if (res.ok) {
      setVerifyToken('');
      setTab('login');
    }
  };

  const handleForgotRequest = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await apiRequest<{ devResetToken?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: forgotEmail },
    });
    setBusy(false);
    if (res.data?.devResetToken) {
      setResetToken(res.data.devResetToken);
    }
    setMessage({ ok: res.ok, text: res.message });
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: resetToken,
        newPassword,
        confirmPassword: confirmNewPassword,
      },
    });
    setBusy(false);
    setMessage({ ok: res.ok, text: res.message });
    if (res.ok) {
      setResetToken('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTab('login');
    }
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Acceso al Portal Privado USAE
          </h1>
          <p className="text-sm text-slate-600">
            Todos los usuarios (clientes y personal interno) deben autenticarse para entrar al
            portal.
          </p>
        </div>

        {/* Auth Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {[
            { id: 'login', label: 'Iniciar Sesión', icon: Lock },
            { id: 'register', label: 'Crear Cuenta', icon: UserPlus },
            { id: 'verify', label: 'Verificar Correo', icon: MailCheck },
            { id: 'forgot', label: 'Recuperar Contraseña', icon: KeyRound },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id as AuthTab);
                  setMessage(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                {t.label}
              </button>
            );
          })}
        </div>

        {message && (
          <div
            role="alert"
            className={`p-3.5 rounded-lg border text-sm flex items-start gap-2 ${
              message.ok
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message.ok ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-700">Correo electrónico</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="usuario@empresa.mx"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-700">Contraseña</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 cursor-pointer"
            >
              {busy ? 'Autenticando...' : 'Iniciar Sesión'}
            </button>
          </form>
        )}

        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">Nombre y apellidos *</span>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">Correo electrónico *</span>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">Teléfono *</span>
                <input
                  type="tel"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+52 55..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">
                  Razón social / Empresa *
                </span>
                <input
                  type="text"
                  required
                  value={regCompany}
                  onChange={(e) => setRegCompany(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>
              <label className="block space-y-1 sm:col-span-2">
                <span className="text-xs font-semibold text-slate-700">
                  RFC para facturación (opcional)
                </span>
                <input
                  type="text"
                  value={regRfc}
                  onChange={(e) => setRegRfc(e.target.value.toUpperCase())}
                  placeholder="XAXX010101000"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">
                  Contraseña (mín. 8, Mayús/Minús/Número) *
                </span>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">Confirmar contraseña *</span>
                <input
                  type="password"
                  required
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>
            </div>

            <div className="space-y-2 text-xs text-slate-600 pt-1">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  Acepto el{' '}
                  <button
                    type="button"
                    onClick={() => onOpenLegal('privacy')}
                    className="text-blue-700 underline cursor-pointer"
                  >
                    Aviso de Privacidad Integral
                  </button>
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  Acepto los{' '}
                  <button
                    type="button"
                    onClick={() => onOpenLegal('terms')}
                    className="text-blue-700 underline cursor-pointer"
                  >
                    Términos y Condiciones de Servicio
                  </button>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 cursor-pointer"
            >
              {busy ? 'Creando cuenta...' : 'Registrarme (Estado inicial SIN_PLAN)'}
            </button>
          </form>
        )}

        {tab === 'verify' && (
          <form onSubmit={handleVerifyEmail} className="space-y-4">
            <p className="text-xs text-slate-600">
              Ingresa el token único de verificación de correo para activar tu cuenta.
            </p>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-700">Token de verificación</span>
              <input
                type="text"
                required
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                placeholder="Pega aquí tu token..."
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 cursor-pointer"
            >
              {busy ? 'Verificando...' : 'Confirmar Correo Electrónico'}
            </button>
          </form>
        )}

        {tab === 'forgot' && (
          <div className="space-y-6">
            <form onSubmit={handleForgotRequest} className="space-y-3 border-b border-slate-200 pb-5">
              <h2 className="font-display text-sm font-bold text-slate-900">
                1. Solicitar token temporal de recuperación
              </h2>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">Correo registrado</span>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                Solicitar Token (30 min)
              </button>
            </form>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <h2 className="font-display text-sm font-bold text-slate-900">
                2. Restablecer contraseña con token único
              </h2>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">Token de recuperación</span>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Nueva contraseña</span>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Confirmar contraseña</span>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 cursor-pointer"
              >
                Actualizar Contraseña
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Right Column: Security Notice + Dev Demo Accounts */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-3">
          <h2 className="font-display text-base font-bold">Reglas de Seguridad y Vigencia</h2>
          <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <li>• Sesiones cifradas en cookies HttpOnly con protección CSRF y límite de intentos.</li>
            <li>• Registrar una cuenta no otorga un plan pagado; el estado inicial es SIN_PLAN.</li>
            <li>
              • La activación de suscripciones solo ocurre por confirmación verificada de pago (nunca
              desde el navegador).
            </li>
          </ul>
        </div>

        {demoMode && demoAccounts.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
            <h2 className="font-display text-sm font-bold text-slate-900">
              Cuentas de Demostración (Entorno de Desarrollo)
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Haz clic para rellenar el formulario de inicio de sesión y probar los permisos RBAC y
              estados de suscripción:
            </p>
            <div className="space-y-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setLoginEmail(acc.email);
                    setLoginPassword(acc.password);
                    setMessage(null);
                  }}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-600 hover:bg-blue-50/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900">{acc.label}</span>
                    <span className="font-mono text-[11px] font-semibold text-blue-700">
                      {acc.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5 text-[11px] text-slate-500">
                    <span className="font-mono">{acc.email}</span>
                    <span>{acc.planStateLabel}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
