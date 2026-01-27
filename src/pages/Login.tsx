import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-900 flex items-center justify-center px-4 transition-colors duration-500">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 animate-scale-in">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.jpg"
            alt="Un temps pour soi"
            className="w-32 h-32 object-contain rounded-full shadow-lg mb-4 animate-fade-in"
          />
          <h1 className="font-elegant text-3xl font-semibold text-gray-800 dark:text-cream tracking-wide animate-fade-in stagger-1">
            Un temps pour soi
          </h1>
          <div className="flex items-center gap-2 mt-2 animate-fade-in stagger-2">
            <span className="w-8 h-px bg-gold"></span>
            <span className="text-gold text-sm">Institut</span>
            <span className="w-8 h-px bg-gold"></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm animate-fade-in border border-red-200 dark:border-red-800">
              {error}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gold text-white rounded-xl hover:bg-gold-light disabled:opacity-50 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
            style={{ backgroundColor: loading ? undefined : 'var(--color-gold)' }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
