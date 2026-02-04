import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type {
  UserProfile,
  Salon,
  SalonConfig,
} from '../types/multi-tenant';
import { needsPayment, DEFAULT_PRESTATION_FIELDS, DEFAULT_CLIENT_FIELDS } from '../types/multi-tenant';

// ===== Types =====

interface AuthContextType {
  // Firebase Auth
  firebaseUser: User | null;

  // User Profile from Firestore
  userProfile: UserProfile | null;

  // Current Salon (can be different from user's salon for super admin)
  currentSalon: Salon | null;

  // Salon Config
  salonConfig: SalonConfig | null;

  // Loading states
  loading: boolean;
  profileLoading: boolean;

  // Auth methods
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  // Profile state
  needsOnboarding: boolean;
  needsEmailVerification: boolean;
  needsPayment: boolean;

  // Role checks
  isSuperAdmin: boolean;
  isOwner: boolean;
  isEmployee: boolean;

  // Permissions
  canManageEmployees: boolean;
  canViewStatistics: boolean;
  canDeleteClients: boolean;
  canManageSettings: boolean;

  // Refresh methods
  refreshSalon: () => Promise<void>;

  // Super Admin: switch salon
  switchSalon: (salonId: string | null) => Promise<void>;
  isViewingOtherSalon: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ===== Super Admin Email =====
const SUPER_ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

// ===== Hook =====

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ===== Provider =====

export function AuthProvider({ children }: { children: ReactNode }) {
  // Firebase Auth state
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Salon state
  const [currentSalon, setCurrentSalon] = useState<Salon | null>(null);
  const [salonConfig, setSalonConfig] = useState<SalonConfig | null>(null);

  // Super Admin: track if viewing another salon
  const [viewingSalonId, setViewingSalonId] = useState<string | null>(null);

  // ===== Load User Profile =====

  const loadUserProfile = useCallback(async (user: User) => {
    setProfileLoading(true);

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // New user - create profile
        const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL;
        const newProfile: Omit<UserProfile, 'id'> = {
          email: user.email || '',
          displayName: '',
          role: isSuperAdmin ? 'super_admin' : 'owner',
          salonId: null,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          status: 'active',
          invitedBy: null,
          emailVerified: isSuperAdmin, // Super admin is auto-verified
          emailVerifiedAt: isSuperAdmin ? new Date() : null,
        };

        await setDoc(userRef, {
          ...newProfile,
          createdAt: Timestamp.now(),
          lastLoginAt: Timestamp.now(),
          emailVerifiedAt: newProfile.emailVerifiedAt ? Timestamp.now() : null,
        });

        setUserProfile({ id: user.uid, ...newProfile });
      } else {
        // Existing user - load profile
        const data = userDoc.data();
        const profile: UserProfile = {
          id: userDoc.id,
          email: data.email || '',
          displayName: data.displayName || '',
          role: data.role || 'owner',
          salonId: data.salonId || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
          status: data.status || 'active',
          invitedBy: data.invitedBy || null,
          emailVerified: data.emailVerified || false,
          emailVerifiedAt: data.emailVerifiedAt?.toDate() || null,
        };

        setUserProfile(profile);

        // Update last login
        await setDoc(userRef, { lastLoginAt: Timestamp.now() }, { merge: true });

        // Load salon if user has one
        if (profile.salonId) {
          await loadSalon(profile.salonId);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // ===== Load Salon =====

  const loadSalon = useCallback(async (salonId: string) => {
    try {
      // Load salon document
      const salonRef = doc(db, 'salons', salonId);
      const salonDoc = await getDoc(salonRef);

      if (salonDoc.exists()) {
        const data = salonDoc.data();
        const salon: Salon = {
          id: salonDoc.id,
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          logo: data.logo || null,
          primaryColor: data.primaryColor || '#c9a86c',
          createdAt: data.createdAt?.toDate() || new Date(),
          createdBy: data.createdBy || '',
          status: data.status || 'pending_payment',
          subscriptionStatus: data.subscriptionStatus || 'pending',
          subscriptionEndsAt: data.subscriptionEndsAt?.toDate() || null,
          stripeCustomerId: data.stripeCustomerId || null,
          stripeSubscriptionId: data.stripeSubscriptionId || null,
        };
        setCurrentSalon(salon);
      } else {
        setCurrentSalon(null);
      }

      // Load salon config
      const configRef = doc(db, 'salonConfigs', salonId);
      const configDoc = await getDoc(configRef);

      if (configDoc.exists()) {
        const data = configDoc.data();
        const config: SalonConfig = {
          salonId: configDoc.id,
          // Utiliser les valeurs par défaut si le tableau est vide ou absent
          prestationFields: data.prestationFields?.length > 0 ? data.prestationFields : DEFAULT_PRESTATION_FIELDS,
          clientFields: data.clientFields?.length > 0 ? data.clientFields : DEFAULT_CLIENT_FIELDS,
        };
        setSalonConfig(config);
      } else {
        // Pas de config existante - créer avec les valeurs par défaut
        setSalonConfig({
          salonId: salonId,
          prestationFields: DEFAULT_PRESTATION_FIELDS,
          clientFields: DEFAULT_CLIENT_FIELDS,
        });
      }
    } catch (error) {
      console.error('Error loading salon:', error);
    }
  }, []);

  // ===== Switch Salon (Super Admin only) =====

  const switchSalon = useCallback(async (salonId: string | null) => {
    if (salonId === null) {
      // Return to own salon
      setViewingSalonId(null);
      if (userProfile?.salonId) {
        await loadSalon(userProfile.salonId);
      } else {
        setCurrentSalon(null);
        setSalonConfig(null);
      }
    } else {
      // Switch to another salon
      setViewingSalonId(salonId);
      await loadSalon(salonId);
    }
  }, [userProfile?.salonId, loadSalon]);

  // ===== Refresh Salon =====

  const refreshSalon = useCallback(async () => {
    const salonIdToLoad = viewingSalonId || userProfile?.salonId;
    if (salonIdToLoad) {
      await loadSalon(salonIdToLoad);
    }
  }, [viewingSalonId, userProfile?.salonId, loadSalon]);

  // ===== Firebase Auth Listener =====

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (user) {
        await loadUserProfile(user);
      } else {
        setUserProfile(null);
        setCurrentSalon(null);
        setSalonConfig(null);
        setViewingSalonId(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserProfile]);

  // ===== Real-time User Profile Updates =====

  useEffect(() => {
    if (!firebaseUser?.uid) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', firebaseUser.uid),
      async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const profile: UserProfile = {
            id: docSnapshot.id,
            email: data.email || '',
            displayName: data.displayName || '',
            role: data.role || 'owner',
            salonId: data.salonId || null,
            createdAt: data.createdAt?.toDate() || new Date(),
            lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
            status: data.status || 'active',
            invitedBy: data.invitedBy || null,
            emailVerified: data.emailVerified || false,
            emailVerifiedAt: data.emailVerifiedAt?.toDate() || null,
          };

          // Check if salonId changed
          const previousSalonId = userProfile?.salonId;
          setUserProfile(profile);

          // If salonId changed and we're not viewing another salon, load the new salon
          if (profile.salonId && profile.salonId !== previousSalonId && !viewingSalonId) {
            await loadSalon(profile.salonId);
          }
        }
      }
    );

    return () => unsubscribe();
  }, [firebaseUser?.uid, loadSalon, viewingSalonId]);

  // ===== Real-time Salon Updates =====

  useEffect(() => {
    const salonIdToWatch = viewingSalonId || userProfile?.salonId;
    if (!salonIdToWatch) return;

    const unsubscribe = onSnapshot(
      doc(db, 'salons', salonIdToWatch),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setCurrentSalon({
            id: doc.id,
            name: data.name || '',
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            logo: data.logo || null,
            primaryColor: data.primaryColor || '#c9a86c',
            createdAt: data.createdAt?.toDate() || new Date(),
            createdBy: data.createdBy || '',
            status: data.status || 'pending_payment',
            subscriptionStatus: data.subscriptionStatus || 'pending',
            subscriptionEndsAt: data.subscriptionEndsAt?.toDate() || null,
            stripeCustomerId: data.stripeCustomerId || null,
            stripeSubscriptionId: data.stripeSubscriptionId || null,
          });
        }
      }
    );

    return () => unsubscribe();
  }, [viewingSalonId, userProfile?.salonId]);

  // ===== Auth Methods =====

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUserProfile(null);
    setCurrentSalon(null);
    setSalonConfig(null);
    setViewingSalonId(null);
  }, []);

  // ===== Computed Values =====

  const needsEmailVerification = userProfile !== null && !userProfile.emailVerified && userProfile.role !== 'super_admin';

  const needsOnboarding = userProfile !== null && userProfile.salonId === null && userProfile.role !== 'super_admin' && userProfile.emailVerified;

  const needsPaymentCheck = currentSalon !== null && needsPayment(currentSalon) && userProfile?.role !== 'super_admin';

  // Role checks
  const isSuperAdmin = userProfile?.role === 'super_admin';
  const isOwner = userProfile?.role === 'owner';
  const isEmployee = userProfile?.role === 'employee';

  // Permissions
  const canManageEmployees = isSuperAdmin || isOwner;
  const canViewStatistics = isSuperAdmin || isOwner;
  const canDeleteClients = isSuperAdmin || isOwner;
  const canManageSettings = isSuperAdmin || isOwner;

  // Is viewing another salon (not own)
  const isViewingOtherSalon = viewingSalonId !== null && viewingSalonId !== userProfile?.salonId;

  // ===== Context Value =====

  const value: AuthContextType = {
    firebaseUser,
    userProfile,
    currentSalon,
    salonConfig,
    loading,
    profileLoading,
    login,
    register,
    logout,
    needsOnboarding,
    needsEmailVerification,
    needsPayment: needsPaymentCheck,
    isSuperAdmin,
    isOwner,
    isEmployee,
    canManageEmployees,
    canViewStatistics,
    canDeleteClients,
    canManageSettings,
    refreshSalon,
    switchSalon,
    isViewingOtherSalon,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
