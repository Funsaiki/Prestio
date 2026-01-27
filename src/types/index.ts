export interface Client {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  lunettes: boolean;
  notes: string;
  dateCreation: Date;
}

export interface Prestation {
  id: string;
  clientId: string;
  typePose: TypePose;
  date: Date;
  courbe: Courbe | '';
  longueur: string;
  mapping: string;
  modePaiement: string;
  prix: number;
}

export type TypePose =
  | 'cil_a_cil'
  | 'mixte'
  | 'volume_russe'
  | 'mega_volume';

export const TYPE_POSE_LABELS: Record<TypePose, string> = {
  cil_a_cil: 'Cil à cil',
  mixte: 'Mixte',
  volume_russe: 'Volume russe',
  mega_volume: 'Mega volume',
};

export type Courbe = 'C' | 'D' | 'L' | 'M';

export const COURBE_OPTIONS: Courbe[] = ['C', 'D', 'L', 'M'];
