import { Link } from 'react-router-dom';

export function PrivacyPolicy() {
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
              Politique de Confidentialité
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Dernière mise à jour : 29 mars 2026
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">1. Responsable du traitement</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Le responsable du traitement des données personnelles est Prestio, micro-entreprise, joignable par email à l'adresse prestio.app@gmail.com.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">2. Données collectées</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Nous collectons les données suivantes :
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 ml-2">
              <li><strong>Données du compte</strong> : adresse email, mot de passe (hashé par Firebase Auth)</li>
              <li><strong>Données de l'établissement</strong> : nom, adresse, téléphone, email professionnel</li>
              <li><strong>Données de facturation</strong> : traitées directement par Stripe, Prestio ne stocke aucune donnée bancaire</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Les données des clients finaux (fiches clients, prestations) sont saisies et gérées par l'utilisateur sous sa propre responsabilité.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">3. Finalités du traitement</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Les données sont collectées pour :
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 ml-2">
              <li>La création et la gestion du compte utilisateur</li>
              <li>La fourniture du service (gestion de clientèle et prestations)</li>
              <li>La gestion de l'abonnement et de la facturation</li>
              <li>L'envoi d'emails transactionnels (vérification de compte, réinitialisation de mot de passe)</li>
              <li>L'amélioration du service</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">4. Base légale</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Le traitement des données repose sur :
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 ml-2">
              <li><strong>L'exécution du contrat</strong> : les données sont nécessaires à la fourniture du service souscrit</li>
              <li><strong>Le consentement</strong> : acceptation des CGU lors de l'inscription</li>
              <li><strong>L'obligation légale</strong> : conservation des données de facturation</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">5. Sous-traitants</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Vos données peuvent être transmises aux sous-traitants suivants, dans le cadre strict de la fourniture du service :
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-600 dark:text-gray-400 mt-2">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 pr-4 font-semibold text-gray-900 dark:text-white">Sous-traitant</th>
                    <th className="text-left py-2 pr-4 font-semibold text-gray-900 dark:text-white">Usage</th>
                    <th className="text-left py-2 font-semibold text-gray-900 dark:text-white">Localisation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  <tr>
                    <td className="py-2 pr-4">Google Firebase</td>
                    <td className="py-2 pr-4">Authentification, base de données</td>
                    <td className="py-2">UE / États-Unis</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Vercel</td>
                    <td className="py-2 pr-4">Hébergement de l'application</td>
                    <td className="py-2">États-Unis</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Stripe</td>
                    <td className="py-2 pr-4">Paiement et facturation</td>
                    <td className="py-2">Irlande / États-Unis</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">EmailJS</td>
                    <td className="py-2 pr-4">Envoi d'emails transactionnels</td>
                    <td className="py-2">États-Unis</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-2">
              Ces sous-traitants sont conformes au RGPD ou bénéficient de garanties appropriées (Data Privacy Framework).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">6. Durée de conservation</h2>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 ml-2">
              <li><strong>Données du compte</strong> : conservées tant que le compte est actif, supprimées sur demande</li>
              <li><strong>Données de facturation</strong> : conservées 10 ans (obligation légale)</li>
              <li><strong>Données des clients finaux</strong> : supprimées avec le compte de l'utilisateur ou sur demande</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">7. Vos droits</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 ml-2">
              <li><strong>Droit d'accès</strong> : obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification</strong> : corriger vos données inexactes ou incomplètes</li>
              <li><strong>Droit à l'effacement</strong> : demander la suppression de vos données</li>
              <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
              <li><strong>Droit d'opposition</strong> : vous opposer au traitement de vos données</li>
              <li><strong>Droit à la limitation</strong> : demander la limitation du traitement</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Pour exercer ces droits, contactez-nous à prestio.app@gmail.com. Nous répondrons dans un délai de 30 jours.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">8. Cookies</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Prestio utilise uniquement des cookies strictement nécessaires au fonctionnement du service (authentification, préférences de thème). Aucun cookie de tracking ou publicitaire n'est utilisé. Ces cookies étant essentiels, ils ne nécessitent pas de consentement selon la directive ePrivacy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">9. Sécurité</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Nous mettons en oeuvre les mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement des communications (HTTPS), authentification sécurisée (Firebase Auth), règles de sécurité sur la base de données (Firestore Security Rules), et aucun stockage de données bancaires.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">10. Réclamation</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Si vous estimez que le traitement de vos données ne respecte pas la réglementation, vous pouvez introduire une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) : <span className="text-gold">cnil.fr</span>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">11. Contact</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Pour toute question relative à cette politique de confidentialité, contactez-nous à prestio.app@gmail.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
