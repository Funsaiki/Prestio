import { Link } from 'react-router-dom';

export function Legal() {
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
              Conditions Générales d'Utilisation
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Dernière mise à jour : 29 mars 2026
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">1. Objet</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Les présentes Conditions Générales d'Utilisation (ci-après "CGU") ont pour objet de définir les modalités et conditions d'utilisation de l'application Prestio (ci-après "le Service"), accessible en ligne, ainsi que les droits et obligations des parties dans ce cadre.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">2. Description du Service</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Prestio est une application de gestion de clientèle et de suivi des prestations destinée aux professionnels. Le Service permet notamment :
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 ml-2">
              <li>La gestion des fiches clients</li>
              <li>L'enregistrement et le suivi des prestations</li>
              <li>La consultation de statistiques</li>
              <li>La personnalisation des champs de saisie</li>
              <li>La gestion multi-utilisateurs</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">3. Inscription et compte</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              L'utilisation du Service nécessite la création d'un compte. L'utilisateur s'engage à fournir des informations exactes et à les maintenir à jour. L'utilisateur est responsable de la confidentialité de ses identifiants de connexion.
            </p>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Chaque utilisateur ne peut créer qu'un seul compte. Tout accès frauduleux ou utilisation abusive du Service pourra entraîner la suspension ou la suppression du compte.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">4. Abonnement et paiement</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              L'accès au Service est soumis à un abonnement mensuel dont le tarif est indiqué lors de l'inscription. Le paiement est effectué par carte bancaire via la plateforme sécurisée Stripe.
            </p>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              L'abonnement est renouvelé automatiquement chaque mois. L'utilisateur peut annuler son abonnement à tout moment depuis les paramètres de son compte. L'annulation prend effet à la fin de la période de facturation en cours.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">5. Protection des données personnelles</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Prestio s'engage à protéger les données personnelles de ses utilisateurs conformément au Règlement Général sur la Protection des Données (RGPD). Les données collectées sont utilisées uniquement dans le cadre du fonctionnement du Service.
            </p>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Les données des clients enregistrées par l'utilisateur dans l'application sont sous sa responsabilité. L'utilisateur s'engage à respecter la réglementation en vigueur concernant la collecte et le traitement des données personnelles de ses propres clients.
            </p>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              L'utilisateur peut demander la suppression de son compte et de ses données à tout moment en contactant le support.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">6. Propriété intellectuelle</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              L'ensemble des éléments du Service (interface, design, code, logo) sont la propriété exclusive de Prestio. Toute reproduction, modification ou utilisation non autorisée est strictement interdite.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">7. Responsabilité</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Prestio met tout en oeuvre pour assurer la disponibilité et le bon fonctionnement du Service. Cependant, Prestio ne saurait être tenu responsable en cas d'interruption temporaire du Service pour maintenance ou mise à jour.
            </p>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Prestio ne saurait être tenu responsable des données saisies par l'utilisateur ni de l'usage qu'il fait du Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">8. Modification des CGU</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Prestio se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification par email ou notification dans l'application. La poursuite de l'utilisation du Service après modification vaut acceptation des nouvelles CGU.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">9. Résiliation</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              L'utilisateur peut résilier son compte à tout moment. Prestio se réserve le droit de suspendre ou supprimer un compte en cas de violation des présentes CGU, sans préavis ni indemnité.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">10. Droit applicable</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Les présentes CGU sont soumises au droit français. Tout litige relatif à l'utilisation du Service sera soumis à la compétence des tribunaux français.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">11. Contact</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Pour toute question relative aux présentes CGU ou au Service, vous pouvez nous contacter par email à l'adresse indiquée dans l'application.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
