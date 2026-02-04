// ===== Rôles et statuts =====

export type UserRole = 'super_admin' | 'owner' | 'employee';
export type UserStatus = 'active' | 'invited' | 'disabled';
export type SalonStatus = 'active' | 'pending_payment' | 'suspended' | 'expired';
export type SubscriptionStatus = 'pending' | 'active' | 'past_due' | 'canceled' | 'expired';

// ===== Prix =====

export const SUBSCRIPTION_PRICE = 20; // euros/mois

// ===== Salon =====

export interface Salon {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo: string | null;
  primaryColor: string;
  createdAt: Date;
  createdBy: string;
  status: SalonStatus;
  // Abonnement
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndsAt: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

// ===== User Profile =====

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  salonId: string | null;
  createdAt: Date;
  lastLoginAt: Date;
  status: UserStatus;
  invitedBy: string | null;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
}

// ===== Salon Config (formulaires personnalisables) =====

export interface SalonConfig {
  salonId: string;
  prestationFields: CustomField[];  // Champs pour les prestations (hors date/prix)
  clientFields: CustomField[];      // Champs pour les clients (hors nom/prénom/tel/email)
}

export interface SelectOption {
  value: string;
  label: string;
}

export type CustomFieldType = 'text' | 'number' | 'select' | 'checkbox' | 'textarea';

export interface CustomField {
  id: string;
  name: string;           // Identifiant interne (ex: "type_pose")
  label: string;          // Libellé affiché (ex: "Type de pose")
  type: CustomFieldType;
  options?: SelectOption[];          // Pour type 'select'
  required: boolean;
  order: number;
  defaultPrices?: Record<string, number>;  // Pour type 'select': prix par défaut par option
  unit?: string;          // Unité pour type 'number' (ex: "mm", "min")
  placeholder?: string;   // Placeholder pour text/textarea
}

// ===== Config par défaut pour nouveaux salons (extensions cils) =====

export const DEFAULT_PRESTATION_FIELDS: CustomField[] = [
  {
    id: 'type_pose',
    name: 'type_pose',
    label: 'Type de pose',
    type: 'select',
    required: true,
    order: 0,
    options: [
      { value: 'cil_a_cil', label: 'Cil à cil' },
      { value: 'mixte', label: 'Mixte' },
      { value: 'volume_russe', label: 'Volume russe' },
      { value: 'mega_volume', label: 'Mega volume' },
    ],
    defaultPrices: {},
  },
  {
    id: 'courbe',
    name: 'courbe',
    label: 'Courbure',
    type: 'select',
    required: false,
    order: 1,
    options: [
      { value: 'C', label: 'C' },
      { value: 'D', label: 'D' },
      { value: 'L', label: 'L' },
      { value: 'M', label: 'M' },
    ],
  },
  {
    id: 'longueur',
    name: 'longueur',
    label: 'Longueur',
    type: 'number',
    required: false,
    order: 2,
    unit: 'mm',
  },
  {
    id: 'mapping',
    name: 'mapping',
    label: 'Mapping',
    type: 'text',
    required: false,
    order: 3,
  },
  {
    id: 'mode_paiement',
    name: 'mode_paiement',
    label: 'Mode de paiement',
    type: 'select',
    required: false,
    order: 4,
    options: [
      { value: 'carte_bancaire', label: 'Carte bancaire' },
      { value: 'especes', label: 'Espèces' },
      { value: 'cheque', label: 'Chèque' },
      { value: 'virement', label: 'Virement bancaire' },
      { value: 'paypal', label: 'PayPal' },
      { value: 'cheque_cadeau', label: 'Chèque cadeau' },
      { value: 'autre', label: 'Autre' },
    ],
  },
];

export const DEFAULT_CLIENT_FIELDS: CustomField[] = [
  // Les champs de base (nom, prénom, tel, email, notes) sont gérés en dur
  // Ici on peut ajouter des champs supplémentaires par défaut
];

export const DEFAULT_SALON_CONFIG: Omit<SalonConfig, 'salonId'> = {
  prestationFields: DEFAULT_PRESTATION_FIELDS,
  clientFields: DEFAULT_CLIENT_FIELDS,
};

// ===== Helpers pour vérifier l'abonnement =====

export function isSubscriptionActive(salon: Salon): boolean {
  return salon.subscriptionStatus === 'active';
}

export function isSubscriptionPending(salon: Salon): boolean {
  return salon.subscriptionStatus === 'pending';
}

export function needsPayment(salon: Salon): boolean {
  return salon.subscriptionStatus === 'pending' ||
         salon.subscriptionStatus === 'expired' ||
         salon.subscriptionStatus === 'canceled';
}
