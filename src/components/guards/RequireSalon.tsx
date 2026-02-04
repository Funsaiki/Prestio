import type { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Onboarding } from '../../pages/Onboarding';

interface RequireSalonProps {
  children: ReactNode;
}

export function RequireSalon({ children }: RequireSalonProps) {
  const { needsOnboarding, profileLoading } = useAuth();

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400 animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <Onboarding />;
  }

  return <>{children}</>;
}
