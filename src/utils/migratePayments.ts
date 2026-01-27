import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Mapping des variations vers la valeur normalisée
const PAYMENT_NORMALIZATION: Record<string, string> = {
  // Espèces
  'espèce': 'Espèces',
  'espèces': 'Espèces',
  'espece': 'Espèces',
  'especes': 'Espèces',
  'ESPÈCES': 'Espèces',
  'ESPÈCE': 'Espèces',
  'ESPECES': 'Espèces',
  'ESPECE': 'Espèces',
  'Espèce': 'Espèces',
  'Espece': 'Espèces',
  'Especes': 'Espèces',
  'cash': 'Espèces',
  'Cash': 'Espèces',
  'CASH': 'Espèces',
  'liquide': 'Espèces',
  'Liquide': 'Espèces',

  // Carte bancaire
  'carte': 'Carte bancaire',
  'Carte': 'Carte bancaire',
  'CARTE': 'Carte bancaire',
  'cb': 'Carte bancaire',
  'CB': 'Carte bancaire',
  'Cb': 'Carte bancaire',
  'carte bancaire': 'Carte bancaire',
  'CARTE BANCAIRE': 'Carte bancaire',
  'carte bleue': 'Carte bancaire',
  'Carte bleue': 'Carte bancaire',
  'CARTE BLEUE': 'Carte bancaire',

  // Chèque
  'chèque': 'Chèque',
  'cheque': 'Chèque',
  'CHÈQUE': 'Chèque',
  'CHEQUE': 'Chèque',
  'Cheque': 'Chèque',

  // Virement
  'virement': 'Virement',
  'Virement': 'Virement',
  'VIREMENT': 'Virement',
  'virement bancaire': 'Virement',
  'Virement Bancaire': 'Virement',
  'VIREMENT BANCAIRE': 'Virement',

  // PayPal
  'paypal': 'PayPal',
  'Paypal': 'PayPal',
  'PAYPAL': 'PayPal',
  'pay pal': 'PayPal',

  // Chèque cadeau
  'chèque cadeau': 'Chèque cadeau',
  'cheque cadeau': 'Chèque cadeau',
  'CHÈQUE CADEAU': 'Chèque cadeau',
  'CHEQUE CADEAU': 'Chèque cadeau',
  'bon cadeau': 'Chèque cadeau',
  'Bon cadeau': 'Chèque cadeau',
  'BON CADEAU': 'Chèque cadeau',
};

function normalizePayment(payment: string): string {
  if (!payment) return '';

  const trimmed = payment.trim();

  // Cherche une correspondance exacte d'abord
  if (PAYMENT_NORMALIZATION[trimmed]) {
    return PAYMENT_NORMALIZATION[trimmed];
  }

  // Cherche une correspondance insensible à la casse
  const lowerCase = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(PAYMENT_NORMALIZATION)) {
    if (key.toLowerCase() === lowerCase) {
      return value;
    }
  }

  // Si déjà une valeur standard, la retourner
  const standardValues = ['Carte bancaire', 'Espèces', 'Chèque', 'Virement', 'PayPal', 'Chèque cadeau'];
  if (standardValues.includes(trimmed)) {
    return trimmed;
  }

  // Sinon retourner la valeur originale (capitalisée)
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export async function migratePayments(): Promise<{
  total: number;
  updated: number;
  changes: Array<{ id: string; before: string; after: string }>;
}> {
  const prestationsRef = collection(db, 'prestations');
  const snapshot = await getDocs(prestationsRef);

  const changes: Array<{ id: string; before: string; after: string }> = [];
  let updated = 0;

  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data();
    const currentPayment = data.payment || '';
    const normalizedPayment = normalizePayment(currentPayment);

    if (currentPayment !== normalizedPayment && currentPayment !== '') {
      changes.push({
        id: docSnapshot.id,
        before: currentPayment,
        after: normalizedPayment,
      });

      await updateDoc(doc(db, 'prestations', docSnapshot.id), {
        payment: normalizedPayment,
      });

      updated++;
    }
  }

  return {
    total: snapshot.docs.length,
    updated,
    changes,
  };
}

// Fonction pour prévisualiser les changements sans les appliquer
export async function previewPaymentMigration(): Promise<{
  total: number;
  toUpdate: number;
  changes: Array<{ id: string; before: string; after: string }>;
}> {
  const prestationsRef = collection(db, 'prestations');
  const snapshot = await getDocs(prestationsRef);

  const changes: Array<{ id: string; before: string; after: string }> = [];

  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data();
    const currentPayment = data.payment || '';
    const normalizedPayment = normalizePayment(currentPayment);

    if (currentPayment !== normalizedPayment && currentPayment !== '') {
      changes.push({
        id: docSnapshot.id,
        before: currentPayment,
        after: normalizedPayment,
      });
    }
  }

  return {
    total: snapshot.docs.length,
    toUpdate: changes.length,
    changes,
  };
}
