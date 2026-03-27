import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeToggle } from './components/ThemeToggle';
import { SalonSelector } from './components/SalonSelector';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RequireSalon } from './components/guards/RequireSalon';
import { RequireSubscription } from './components/guards/RequireSubscription';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy loading des pages
const ClientList = lazy(() => import('./pages/ClientList').then(m => ({ default: m.ClientList })));
const ClientDetail = lazy(() => import('./pages/ClientDetail').then(m => ({ default: m.ClientDetail })));
const Statistics = lazy(() => import('./pages/Statistics').then(m => ({ default: m.Statistics })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const SuperAdmin = lazy(() => import('./pages/SuperAdmin').then(m => ({ default: m.SuperAdmin })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail').then(m => ({ default: m.VerifyEmail })));
const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));

// Composant de chargement
function PageLoader() {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="text-gray-500 dark:text-gray-400 animate-pulse">Chargement...</div>
    </div>
  );
}

function PublicRoutes() {
  const navigate = useNavigate();

  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen bg-cream dark:bg-gray-900 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400 animate-pulse">Chargement...</div>
        </div>
      }>
        <Routes>
          <Route path="/login" element={<Login onSwitchToRegister={() => navigate('/register')} />} />
          <Route path="/register" element={<Register onSwitchToLogin={() => navigate('/login')} />} />
          <Route path="*" element={<Landing onLogin={() => navigate('/login')} onRegister={() => navigate('/register')} />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

function AppContent() {
  const { firebaseUser, currentSalon, loading, logout, isSuperAdmin, isViewingOtherSalon, switchSalon, needsEmailVerification, canManageSettings } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-gray-900 flex items-center justify-center transition-colors duration-500">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-20 h-20 rounded-full shadow-lg bg-gold flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="text-gray-500 dark:text-gray-400">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return <PublicRoutes />;
  }

  // Redirect away from public routes after login
  const location = useLocation();
  if (['/login', '/register'].includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  // User needs to verify email first
  if (needsEmailVerification) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-cream dark:bg-gray-900 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400 animate-pulse">Chargement...</div>
        </div>
      }>
        <VerifyEmail />
      </Suspense>
    );
  }

  // User is authenticated and verified - show app with guards
  return (
    <RequireSalon>
      <RequireSubscription>
          <div className="h-screen flex flex-col bg-cream dark:bg-gray-900 transition-colors duration-300 overflow-hidden">
            {/* Banner when viewing another salon */}
            {isViewingOtherSalon && (
              <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm font-medium">
                    Mode visualisation : {currentSalon?.name}
                  </span>
                </div>
                <button
                  onClick={() => switchSalon(null)}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  Revenir à mon établissement
                </button>
              </div>
            )}

            <header className="bg-white dark:bg-gray-800 shadow-sm px-4 py-3 flex justify-between items-center transition-colors duration-300 flex-shrink-0">
              <Link to="/" className="flex items-center gap-3 group">
                {currentSalon?.logo ? (
                  <img
                    src={currentSalon.logo}
                    alt={currentSalon.name}
                    className="w-10 h-10 rounded-full shadow-md transition-transform duration-200 group-hover:scale-105 object-cover"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full shadow-md flex items-center justify-center text-white font-semibold transition-transform duration-200 group-hover:scale-105"
                    style={{ backgroundColor: currentSalon?.primaryColor || '#c9a86c' }}
                  >
                    {currentSalon?.name?.charAt(0).toUpperCase() || 'S'}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-elegant text-xl font-semibold text-gray-800 dark:text-gray-100 tracking-wide">
                    {currentSalon?.name || 'Mon Établissement'}
                  </span>
                  {isSuperAdmin && !isViewingOtherSalon && (
                    <span className="text-xs text-gold -mt-1">Super Admin</span>
                  )}
                </div>
              </Link>
              <div className="flex items-center gap-2">
                {/* Salon selector for super admin */}
                <SalonSelector />

                {/* Super Admin link */}
                {isSuperAdmin && (
                  <Link
                    to="/superadmin"
                    className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer"
                    aria-label="Super Admin"
                    title="Gestion des établissements"
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </Link>
                )}

                {/* Settings link */}
                {canManageSettings && (
                  <Link
                    to="/settings"
                    className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer"
                    aria-label="Paramètres"
                    title="Paramètres de l'établissement"
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Link>
                )}

                <Link
                  to="/statistiques"
                  className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer"
                  aria-label="Statistiques"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </Link>
                <ThemeToggle />
                <button
                  onClick={logout}
                  className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer"
                  aria-label="Déconnexion"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </header>
            <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 animate-fade-in overflow-hidden">
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<ClientList />} />
                    <Route path="/clients/:id" element={<ClientDetail />} />
                    <Route path="/statistiques" element={<Statistics />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/superadmin" element={<SuperAdmin />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </main>
          </div>
      </RequireSubscription>
    </RequireSalon>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
