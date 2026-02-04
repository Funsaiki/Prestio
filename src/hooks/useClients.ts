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
  getDocs,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Client } from '../types';

export function useClients() {
  const { currentSalon, firebaseUser } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentSalon?.id) {
      setClients([]);
      setLoading(false);
      return;
    }

    // Requête optimisée avec index (salonId + last_name)
    const q = query(
      collection(db, 'clients'),
      where('salonId', '==', currentSalon.id),
      orderBy('last_name', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();

        // Support ancien format et nouveau format
        let values: Record<string, unknown> = {};
        if (data.values) {
          values = data.values;
        } else {
          // Migration: ancien champ 'glasses' vers values
          if (data.glasses !== undefined) {
            values.lunettes = data.glasses;
          }
        }

        return {
          id: docSnap.id,
          salonId: data.salonId || currentSalon.id,
          nom: data.last_name || '',
          prenom: data.first_name || '',
          telephone: data.phone || '',
          email: data.mail || '',
          notes: data.notes || '',
          dateCreation: data.created_at?.toDate() || new Date(),
          createdBy: data.createdBy,
          values,
        };
      }) as Client[];

      // Déjà trié par Firestore, pas besoin de tri côté client
      setClients(clientsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentSalon?.id]);

  const addClient = useCallback(async (client: Omit<Client, 'id' | 'dateCreation' | 'salonId' | 'createdBy'>) => {
    if (!currentSalon?.id) throw new Error('No salon selected');

    await addDoc(collection(db, 'clients'), {
      salonId: currentSalon.id,
      createdBy: firebaseUser?.uid,
      first_name: client.prenom,
      last_name: client.nom,
      phone: client.telephone,
      mail: client.email,
      notes: client.notes,
      values: client.values || {},
      created_at: Timestamp.now(),
    });
  }, [currentSalon?.id, firebaseUser?.uid]);

  const updateClient = useCallback(async (id: string, client: Partial<Client>) => {
    const clientRef = doc(db, 'clients', id);
    const updateData: Record<string, unknown> = {};

    if (client.prenom !== undefined) updateData.first_name = client.prenom;
    if (client.nom !== undefined) updateData.last_name = client.nom;
    if (client.telephone !== undefined) updateData.phone = client.telephone;
    if (client.email !== undefined) updateData.mail = client.email;
    if (client.notes !== undefined) updateData.notes = client.notes;
    if (client.values !== undefined) updateData.values = client.values;

    await updateDoc(clientRef, updateData);
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    // Supprimer toutes les prestations du client
    const prestationsQuery = query(
      collection(db, 'prestations'),
      where('client_id', '==', id)
    );
    const prestationsSnapshot = await getDocs(prestationsQuery);
    const deletePromises = prestationsSnapshot.docs.map((doc) =>
      deleteDoc(doc.ref)
    );
    await Promise.all(deletePromises);

    // Supprimer le client
    await deleteDoc(doc(db, 'clients', id));
  }, []);

  return { clients, loading, addClient, updateClient, deleteClient };
}
