import type { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Subscription } from '../../pages/Subscription';

interface RequireSubscriptionProps {
  children: ReactNode;
}

export function RequireSubscription({ children }: RequireSubscriptionProps) {
  const { needsPayment, currentSalon, isSuperAdmin } = useAuth();

  // Super admins bypass subscription check
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // If payment is needed, show subscription page
  if (needsPayment && currentSalon) {
    return <Subscription />;
  }

  return <>{children}</>;
}
