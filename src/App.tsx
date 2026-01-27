import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ClientList } from './pages/ClientList';
import { ClientDetail } from './pages/ClientDetail';
import { Login } from './pages/Login';
import { ThemeToggle } from './components/ThemeToggle';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-gray-900 flex items-center justify-center transition-colors duration-500">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <img src="/logo.jpg" alt="Logo" className="w-20 h-20 rounded-full shadow-lg" />
          <div className="text-gray-500 dark:text-gray-400">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col bg-cream dark:bg-gray-900 transition-colors duration-300 overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm px-4 py-3 flex justify-between items-center transition-colors duration-300 flex-shrink-0">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo.jpg"
              alt="Logo"
              className="w-10 h-10 rounded-full shadow-md transition-transform duration-200 group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-elegant text-xl font-semibold text-gray-800 dark:text-gray-100 tracking-wide">
                Un temps pour soi
              </span>
              <span className="text-xs text-gold -mt-1">Institut</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={logout}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
              aria-label="Déconnexion"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 animate-fade-in overflow-hidden">
          <Routes>
            <Route path="/" element={<ClientList />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
