import { Link } from 'react-router-dom';

export function MentionsLegales() {
  return (
    <div className="min-h-screen bg-cream dark:bg-gray-900 transition-colors duration-500">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link
            to="/"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gold transition-colors"
          >
            &larr; Retour à l'accueil
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-8">
          <div className="text-center mb-8">
            <h1 className="font-elegant text-3xl font-bold text-gray-900 dark:text-white">
              Mentions Légales
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Dernière mise à jour : 29 mars 2026
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Éditeur du site</h2>
            <div className="text-gray-600 dark:text-gray-400 leading-relaxed space-y-1">
              <p><strong>Prestio</strong></p>
              <p>Micro-entreprise</p>
              <p>SIRET : En cours d'immatriculation</p>
              <p>Email : contact@prestio.app</p>
              <p>Directeur de la publication : Johnny Hu</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Hébergement</h2>
            <div className="text-gray-600 dark:text-gray-400 leading-relaxed space-y-1">
              <p><strong>Vercel Inc.</strong></p>
              <p>440 N Barranca Ave #4133</p>
              <p>Covina, CA 91723, États-Unis</p>
              <p>Site : vercel.com</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Base de données</h2>
            <div className="text-gray-600 dark:text-gray-400 leading-relaxed space-y-1">
              <p><strong>Google Firebase (Firestore)</strong></p>
              <p>Google LLC</p>
              <p>1600 Amphitheatre Parkway, Mountain View, CA 94043, États-Unis</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Paiement</h2>
            <div className="text-gray-600 dark:text-gray-400 leading-relaxed space-y-1">
              <p><strong>Stripe Payments Europe, Ltd.</strong></p>
              <p>1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Irlande</p>
              <p>Les paiements sont sécurisés et traités par Stripe. Prestio ne stocke aucune donnée bancaire.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">TVA</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              TVA non applicable, article 293 B du Code Général des Impôts.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Propriété intellectuelle</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              L'ensemble du contenu du site Prestio (textes, graphismes, logo, icônes, code source) est la propriété exclusive de Prestio, sauf mention contraire. Toute reproduction, représentation, modification ou exploitation non autorisée est interdite.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Liens utiles</h2>
            <div className="flex flex-col gap-2">
              <Link to="/cgu" className="text-gold hover:underline">Conditions Générales d'Utilisation</Link>
              <Link to="/confidentialite" className="text-gold hover:underline">Politique de Confidentialité</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
