import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Client } from '../types';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'clients'), orderBy('last_name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          nom: data.last_name || '',
          prenom: data.first_name || '',
          telephone: data.phone || '',
          email: data.mail || '',
          lunettes: data.glasses || false,
          notes: data.notes || '',
          dateCreation: data.created_at?.toDate() || new Date(),
        };
      }) as Client[];
      setClients(clientsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addClient = async (client: Omit<Client, 'id' | 'dateCreation'>) => {
    await addDoc(collection(db, 'clients'), {
      first_name: client.prenom,
      last_name: client.nom,
      phone: client.telephone,
      mail: client.email,
      glasses: client.lunettes,
      notes: client.notes,
      created_at: Timestamp.now(),
    });
  };

  const updateClient = async (id: string, client: Partial<Client>) => {
    const clientRef = doc(db, 'clients', id);
    const updateData: Record<string, unknown> = {};
    if (client.prenom !== undefined) updateData.first_name = client.prenom;
    if (client.nom !== undefined) updateData.last_name = client.nom;
    if (client.telephone !== undefined) updateData.phone = client.telephone;
    if (client.email !== undefined) updateData.mail = client.email;
    if (client.lunettes !== undefined) updateData.glasses = client.lunettes;
    if (client.notes !== undefined) updateData.notes = client.notes;
    await updateDoc(clientRef, updateData);
  };

  const deleteClient = async (id: string) => {
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
  };

  return { clients, loading, addClient, updateClient, deleteClient };
}
