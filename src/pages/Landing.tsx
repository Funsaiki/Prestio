import { Link } from 'react-router-dom';
import { SUBSCRIPTION_PRICE } from '../types/multi-tenant';

interface LandingProps {
  onLogin: () => void;
  onRegister: () => void;
}

export function Landing({ onLogin, onRegister }: LandingProps) {
  return (
    <div className="min-h-screen bg-cream dark:bg-gray-900 transition-colors duration-500">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <span className="font-elegant text-2xl font-bold text-gold tracking-wide">Prestio</span>
          <div className="flex items-center gap-3">
            <button
              onClick={onLogin}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gold transition-colors font-medium cursor-pointer"
            >
              Connexion
            </button>
            <button
              onClick={onRegister}
              className="px-5 py-2 bg-gold text-white rounded-xl hover:bg-gold-light transition-all duration-200 font-medium shadow-md cursor-pointer"
            >
              Essayer gratuitement
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-elegant text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
            Gérez vos clients et prestations{' '}
            <span className="text-gold">en toute simplicité</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            L'outil tout-en-un pour les professionnels. Suivi clients, historique des prestations, statistiques et plus encore.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onRegister}
              className="px-8 py-3.5 bg-gold text-white rounded-xl hover:bg-gold-light transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg cursor-pointer"
            >
              Commencer maintenant
            </button>
            <a
              href="#features"
              className="px-8 py-3.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:border-gold hover:text-gold transition-all duration-200 font-medium text-lg cursor-pointer"
            >
              Voir les fonctionnalités
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-elegant text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Tout ce dont vous avez besoin
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
              Des outils pensés pour votre quotidien professionnel
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Gestion de clients',
                description: 'Fiches clients complètes avec historique, notes et champs personnalisables.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                ),
              },
              {
                title: 'Suivi des prestations',
                description: 'Enregistrez chaque prestation avec prix, détails et mode de paiement.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                ),
              },
              {
                title: 'Statistiques détaillées',
                description: 'Chiffre d\'affaires, top clients, répartitions et tendances en un coup d\'oeil.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                ),
              },
              {
                title: 'Formulaires personnalisables',
                description: 'Adaptez les champs de saisie à votre activité : coiffure, esthétique, bien-être...',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                ),
              },
              {
                title: 'Multi-utilisateurs',
                description: 'Invitez vos employés et gérez les accès avec des rôles dédiés.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                ),
              },
              {
                title: 'Accessible partout',
                description: 'Application web responsive, utilisable sur ordinateur, tablette et smartphone.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                ),
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-700/50 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                  <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="font-elegant text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Un tarif simple et transparent
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-12">
            Pas d'engagement, annulation à tout moment
          </p>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-gold">
            <div className="mb-6">
              <span className="text-5xl font-bold text-gold">{SUBSCRIPTION_PRICE}€</span>
              <span className="text-gray-500 dark:text-gray-400 text-lg">/mois</span>
            </div>

            <ul className="space-y-3 text-left mb-8">
              {[
                'Clients illimités',
                'Prestations illimitées',
                'Statistiques complètes',
                'Formulaires personnalisables',
                'Multi-utilisateurs',
                'Support prioritaire',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={onRegister}
              className="w-full py-3 bg-gold text-white rounded-xl hover:bg-gold-light transition-all duration-200 font-medium shadow-md hover:shadow-lg cursor-pointer text-lg"
            >
              Commencer maintenant
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-elegant text-lg font-bold text-gold">Prestio</span>
          <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
            <Link to="/cgu" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gold transition-colors">
              CGU
            </Link>
            <Link to="/confidentialite" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gold transition-colors">
              Confidentialité
            </Link>
            <Link to="/mentions-legales" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gold transition-colors">
              Mentions légales
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Prestio. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
