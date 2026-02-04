// Re-export multi-tenant types
export * from './multi-tenant';

export interface Client {
  id: string;
  salonId: string;           // Multi-tenant
  nom: string;               // Champ fixe
  prenom: string;            // Champ fixe
  telephone: string;         // Champ fixe
  email: string;             // Champ fixe
  notes: string;             // Champ fixe
  dateCreation: Date;
  createdBy?: string;        // Audit
  values?: Record<string, unknown>;  // Champs personnalisés
}

export interface Prestation {
  id: string;
  salonId: string;           // Multi-tenant
  clientId: string;
  date: Date;                // Champ fixe - toujours requis
  prix: number;              // Champ fixe - toujours requis
  values: Record<string, unknown>;  // Tous les autres champs (dynamiques)
  createdBy?: string;        // Audit
  createdAt?: Date;          // Audit
}
