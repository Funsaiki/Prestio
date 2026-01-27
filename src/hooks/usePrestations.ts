import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Prestation } from '../types';

export function usePrestations(clientId?: string) {
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q;
    if (clientId) {
      q = query(
        collection(db, 'prestations'),
        where('client_id', '==', clientId)
      );
    } else {
      q = query(collection(db, 'prestations'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prestationsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          clientId: data.client_id || '',
          typePose: data.type || 'cil_a_cil',
          date: data.date?.toDate() || new Date(),
          courbe: data.curve || '',
          longueur: data.length || '',
          mapping: data.mapping || '',
          modePaiement: data.payment || '',
          prix: data.price || 0,
        };
      }) as Prestation[];
      // Tri côté client (plus récent en premier)
      prestationsData.sort((a, b) => b.date.getTime() - a.date.getTime());
      setPrestations(prestationsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [clientId]);

  const addPrestation = useCallback(async (prestation: Omit<Prestation, 'id'>) => {
    await addDoc(collection(db, 'prestations'), {
      client_id: prestation.clientId,
      type: prestation.typePose,
      date: Timestamp.fromDate(prestation.date),
      curve: prestation.courbe,
      length: prestation.longueur,
      mapping: prestation.mapping,
      payment: prestation.modePaiement,
      price: prestation.prix,
    });
  }, []);

  const updatePrestation = useCallback(async (id: string, prestation: Partial<Prestation>) => {
    const prestationRef = doc(db, 'prestations', id);
    const updateData: Record<string, unknown> = {};
    if (prestation.clientId !== undefined) updateData.client_id = prestation.clientId;
    if (prestation.typePose !== undefined) updateData.type = prestation.typePose;
    if (prestation.date !== undefined) updateData.date = Timestamp.fromDate(prestation.date);
    if (prestation.courbe !== undefined) updateData.curve = prestation.courbe;
    if (prestation.longueur !== undefined) updateData.length = prestation.longueur;
    if (prestation.mapping !== undefined) updateData.mapping = prestation.mapping;
    if (prestation.modePaiement !== undefined) updateData.payment = prestation.modePaiement;
    if (prestation.prix !== undefined) updateData.price = prestation.prix;
    await updateDoc(prestationRef, updateData);
  }, []);

  const deletePrestation = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'prestations', id));
  }, []);

  return { prestations, loading, addPrestation, updatePrestation, deletePrestation };
}
