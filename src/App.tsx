import { useEffect, useState } from 'react';
import { Footer } from './components/Footer';
import { Header, type AppRoute, type PrivateRoute } from './components/Header';
import { LegalModal } from './components/LegalModal';
import { AdminPanel } from './components/portal/AdminPanel';
import { ClientPortal } from './components/portal/ClientPortal';
import { OperationsConsole } from './components/portal/OperationsConsole';
import { TicketDetailView } from './components/portal/TicketDetailView';
import { AuthPage, type DemoAccountOption } from './components/public/AuthPage';
import { FaqAndContactPage } from './components/public/FaqAndContactPage';
import { HowItWorksAndAboutPage } from './components/public/HowItWorksAndAboutPage';
import { PlansCatalogPage } from './components/public/PlansCatalogPage';
import { PublicHome } from './components/public/PublicHome';
import { ServicesPage } from './components/public/ServicesPage';
import { apiRequest, setCsrfToken } from './utils/api';
import type {
  AuthUser,
  ServicePlan,
  StaffMember,
  SubscriptionRecord,
  Ticket,
} from './utils/helpdesk';

const PRIVATE_ROUTES: PrivateRoute[] = [
  'mi-portal',
  'ticket-detalle',
  'consola-operativa',
  'administracion',
];

function getDefaultRouteForRole(user: AuthUser): PrivateRoute {
  if (user.role === 'ADMINISTRADOR') return 'administracion';
  if (user.role === 'SUPERVISOR' || user.role === 'TÉCNICO') return 'consola-operativa';
  return 'mi-portal';
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>('inicio');
  const [bootstrapping, setBootstrapping] = useState(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccountOption[]>([]);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<ServicePlan | null>(null);
  const [quotePlanCode, setQuotePlanCode] = useState<string | undefined>(undefined);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const loadPublicCatalog = async (): Promise<boolean> => {
    const [plansRes, cfgRes] = await Promise.all([
      apiRequest<{ plans: ServicePlan[] }>('/api/catalog/plans'),
      apiRequest<{
        authenticated?: boolean;
        demoMode: boolean;
        demoAccounts: DemoAccountOption[];
      }>('/api/public/config'),
    ]);
    if (plansRes.ok && plansRes.data?.plans) setPlans(plansRes.data.plans);
    if (cfgRes.ok && cfgRes.data) {
      setDemoMode(Boolean(cfgRes.data.demoMode));
      setDemoAccounts(cfgRes.data.demoAccounts || []);
      return Boolean(cfgRes.data.authenticated);
    }
    return false;
  };

  const refreshSession = async () => {
    const meRes = await apiRequest<{
      user: AuthUser;
      csrfToken: string;
      subscription: SubscriptionRecord | null;
    }>('/api/auth/me');
    if (meRes.ok && meRes.data?.user) {
      setCurrentUser(meRes.data.user);
      setCsrfToken(meRes.data.csrfToken);
      if (
        meRes.data.user.role === 'ADMINISTRADOR' ||
        meRes.data.user.role === 'SUPERVISOR'
      ) {
        const sRes = await apiRequest<{ staff: StaffMember[] }>('/api/admin/staff');
        if (sRes.ok && sRes.data) setStaffList(sRes.data.staff);
      } else {
        setStaffList([]);
      }
    } else {
      setCurrentUser(null);
      setCsrfToken('');
    }
  };

  useEffect(() => {
    const init = async () => {
      const hasSession = await loadPublicCatalog();
      if (hasSession) {
        await refreshSession();
      }
      // Never auto-activate plan on redirect return; simply inform user cleanly
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment')) {
        setBannerNotice(
          'Retornaste desde la pasarela de pago. La activación de tu plan ocurre únicamente tras la confirmación verificada del servidor.'
        );
      }
      setBootstrapping(false);
    };
    void init();
  }, []);

  const navigate = (next: AppRoute) => {
    if (PRIVATE_ROUTES.includes(next as PrivateRoute) && !currentUser) {
      setBannerNotice('Inicia sesión para acceder al portal privado de USAE Helpdesk.');
      setRoute('auth');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (next === 'administracion' && currentUser?.role !== 'ADMINISTRADOR') {
      setRoute(currentUser ? getDefaultRouteForRole(currentUser) : 'auth');
      return;
    }

    if (
      next === 'consola-operativa' &&
      currentUser &&
      currentUser.role === 'USUARIO'
    ) {
      setRoute('mi-portal');
      return;
    }

    setRoute(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = async (user: AuthUser, _sub: SubscriptionRecord | null) => {
    setCurrentUser(user);
    setBannerNotice(null);
    if (user.role === 'ADMINISTRADOR' || user.role === 'SUPERVISOR') {
      const sRes = await apiRequest<{ staff: StaffMember[] }>('/api/admin/staff');
      if (sRes.ok && sRes.data) setStaffList(sRes.data.staff);
    } else {
      setStaffList([]);
    }
    if (selectedPlanForCheckout && user.role === 'USUARIO') {
      setRoute('mi-portal');
    } else {
      setRoute(getDefaultRouteForRole(user));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await apiRequest('/api/auth/logout', { method: 'POST', body: {} });
    setCsrfToken('');
    setCurrentUser(null);
    setSelectedTicket(null);
    setSelectedPlanForCheckout(null);
    setStaffList([]);
    setRoute('inicio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPlanForCheckout = (plan: ServicePlan) => {
    setSelectedPlanForCheckout(plan);
    if (!currentUser) {
      setBannerNotice(
        `Seleccionaste ${plan.title}. Inicia sesión o regístrate para generar tu orden de pago.`
      );
      setRoute('auth');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (currentUser.role !== 'USUARIO') {
      setBannerNotice('La contratación de planes aplica únicamente a cuentas de cliente.');
      return;
    }
    setRoute('mi-portal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequestQuote = (plan?: ServicePlan) => {
    setQuotePlanCode(plan?.code || 'CUSTOM');
    setRoute('contacto');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenTicket = async (ticket: Ticket) => {
    const res = await apiRequest<{ ticket: Ticket }>(`/api/tickets/${ticket.folio}`);
    if (res.ok && res.data?.ticket) {
      setSelectedTicket(res.data.ticket);
      setRoute('ticket-detalle');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (bootstrapping) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-600">
        Inicializando USAE Helpdesk...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        activeRoute={route}
        currentUser={currentUser}
        onNavigate={navigate}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        {bannerNotice && (
          <div
            role="status"
            className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-900 flex items-center justify-between gap-4 print:hidden"
          >
            <span>{bannerNotice}</span>
            <button
              type="button"
              onClick={() => setBannerNotice(null)}
              className="text-xs font-semibold underline shrink-0 cursor-pointer"
            >
              Ocultar
            </button>
          </div>
        )}

        {currentUser?.mustChangePassword && (
          <div
            role="alert"
            className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-950"
          >
            Administración solicitó el cambio obligatorio de tu contraseña. Actualízala en la
            pestaña Cuenta de tu portal.
          </div>
        )}

        {/* ZONA PÚBLICA COMERCIAL */}
        {route === 'inicio' && (
          <PublicHome
            plans={plans}
            currentUser={currentUser}
            onNavigate={navigate}
            onSelectPlanForAction={handleSelectPlanForCheckout}
          />
        )}

        {route === 'servicios' && <ServicesPage onNavigate={navigate} />}

        {route === 'planes' && (
          <PlansCatalogPage
            plans={plans}
            onSelectPlanForCheckout={handleSelectPlanForCheckout}
            onRequestQuote={handleRequestQuote}
          />
        )}

        {route === 'como-funciona' && (
          <HowItWorksAndAboutPage mode="how-it-works" onNavigate={navigate} />
        )}

        {route === 'nosotros' && (
          <HowItWorksAndAboutPage mode="about" onNavigate={navigate} />
        )}

        {route === 'faq' && (
          <FaqAndContactPage
            mode="faq"
            plans={plans}
            onOpenLegal={(type) => setLegalModal(type)}
          />
        )}

        {route === 'contacto' && (
          <FaqAndContactPage
            mode="contact"
            plans={plans}
            initialPlanCode={quotePlanCode}
            onOpenLegal={(type) => setLegalModal(type)}
          />
        )}

        {route === 'auth' && (
          <AuthPage
            demoMode={demoMode}
            demoAccounts={demoAccounts}
            onAuthSuccess={handleAuthSuccess}
            onOpenLegal={(type) => setLegalModal(type)}
          />
        )}

        {/* ZONA PRIVADA AUTENTICADA */}
        {route === 'mi-portal' && currentUser && currentUser.role === 'USUARIO' && (
          <ClientPortal
            currentUser={currentUser}
            plans={plans}
            initialCheckoutPlan={selectedPlanForCheckout}
            onClearCheckoutPlan={() => setSelectedPlanForCheckout(null)}
            onOpenTicket={handleOpenTicket}
            onRequestQuote={handleRequestQuote}
            onRefreshSession={refreshSession}
          />
        )}

        {route === 'consola-operativa' &&
          currentUser &&
          currentUser.role !== 'USUARIO' && (
            <OperationsConsole
              currentUser={currentUser}
              onOpenTicket={handleOpenTicket}
            />
          )}

        {route === 'administracion' &&
          currentUser &&
          currentUser.role === 'ADMINISTRADOR' && (
            <AdminPanel
              onPlansUpdated={async () => {
                await loadPublicCatalog();
              }}
            />
          )}

        {route === 'ticket-detalle' && currentUser && selectedTicket && (
          <TicketDetailView
            ticket={selectedTicket}
            currentUser={currentUser}
            staffList={staffList}
            onBack={() =>
              navigate(
                currentUser.role === 'USUARIO' ? 'mi-portal' : 'consola-operativa'
              )
            }
            onTicketUpdated={(updated) => setSelectedTicket(updated)}
          />
        )}
      </main>

      <Footer
        onNavigate={navigate}
        onOpenLegal={(type) => setLegalModal(type)}
      />
      <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
    </div>
  );
}
