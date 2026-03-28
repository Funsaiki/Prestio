import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onSwitchToRegister: () => void;
}

export function Login({ onSwitchToRegister }: LoginProps) {
  const { login, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await login(email, password);
    } catch {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Veuillez entrer votre email pour réinitialiser votre mot de passe');
      return;
    }
    setError('');
    setSuccess('');

    try {
      await resetPassword(email);
      setSuccess('Un email de réinitialisation a été envoyé à ' + email);
    } catch {
      setError('Impossible d\'envoyer l\'email de réinitialisation');
    }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-900 flex items-center justify-center px-4 transition-colors duration-500">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 animate-scale-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full shadow-lg bg-gold flex items-center justify-center mb-4 animate-fade-in">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="font-elegant text-2xl font-semibold text-gray-800 dark:text-cream tracking-wide animate-fade-in stagger-1">
            Connexion
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 animate-fade-in stagger-2">
            Accédez à votre espace Prestio
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm animate-fade-in border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-sm animate-fade-in border border-green-200 dark:border-green-800">
              {success}
            </div>
          )}

          <div className="animate-fade-in stagger-2">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
            />
          </div>

          <div className="animate-fade-in stagger-3">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
            />
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={handleResetPassword}
              className="text-sm text-gold hover:underline cursor-pointer"
            >
              Mot de passe oublié ?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gold text-white rounded-xl hover:bg-gold-light disabled:opacity-50 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pas encore de compte ?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-gold hover:underline font-medium cursor-pointer"
            >
              Créer un compte
            </button>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link
            to="/"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            &larr; Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
