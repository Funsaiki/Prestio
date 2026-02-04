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
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Prestation } from '../types';

export function usePrestations(clientId?: string) {
  const { currentSalon, firebaseUser } = useAuth();
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentSalon?.id) {
      setPrestations([]);
      setLoading(false);
      return;
    }

    // Requêtes optimisées avec index composites
    let q;
    if (clientId) {
      q = query(
        collection(db, 'prestations'),
        where('client_id', '==', clientId),
        where('salonId', '==', currentSalon.id),
        orderBy('date', 'desc')
      );
    } else {
      q = query(
        collection(db, 'prestations'),
        where('salonId', '==', currentSalon.id),
        orderBy('date', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prestationsData = snapshot.docs.map((doc) => {
        const data = doc.data();

        // Support ancien format (migration) et nouveau format
        let values: Record<string, unknown> = {};

        if (data.values) {
          // Nouveau format
          values = data.values;
        } else {
          // Ancien format - migrer les champs vers values
          if (data.type) values.type_pose = data.type;
          if (data.curve) values.courbe = data.curve;
          if (data.length) values.longueur = data.length;
          if (data.mapping) values.mapping = data.mapping;
          if (data.payment) values.mode_paiement = data.payment;
        }

        return {
          id: doc.id,
          salonId: data.salonId || currentSalon.id,
          clientId: data.client_id || '',
          date: data.date?.toDate() || new Date(),
          prix: data.price ?? data.prix ?? 0,
          values,
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toDate(),
        };
      }) as Prestation[];

      // Déjà trié par Firestore, pas besoin de tri côté client
      setPrestations(prestationsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [clientId, currentSalon?.id]);

  const addPrestation = useCallback(async (prestation: Omit<Prestation, 'id' | 'salonId' | 'createdBy' | 'createdAt'>) => {
    if (!currentSalon?.id) throw new Error('No salon selected');

    await addDoc(collection(db, 'prestations'), {
      salonId: currentSalon.id,
      createdBy: firebaseUser?.uid,
      createdAt: Timestamp.now(),
      client_id: prestation.clientId,
      date: Timestamp.fromDate(prestation.date),
      price: prestation.prix,
      values: prestation.values || {},
    });
  }, [currentSalon?.id, firebaseUser?.uid]);

  const updatePrestation = useCallback(async (id: string, prestation: Partial<Prestation>) => {
    const prestationRef = doc(db, 'prestations', id);
    const updateData: Record<string, unknown> = {};

    if (prestation.clientId !== undefined) updateData.client_id = prestation.clientId;
    if (prestation.date !== undefined) updateData.date = Timestamp.fromDate(prestation.date);
    if (prestation.prix !== undefined) updateData.price = prestation.prix;
    if (prestation.values !== undefined) updateData.values = prestation.values;

    await updateDoc(prestationRef, updateData);
  }, []);

  const deletePrestation = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'prestations', id));
  }, []);

  return { prestations, loading, addPrestation, updatePrestation, deletePrestation };
}
