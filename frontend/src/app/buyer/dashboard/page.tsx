'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import BuyerDashboard from '@/components/BuyerDashboard';

export default function BuyerDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'BUYER')) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'BUYER') {
    return null;
  }

  return <BuyerDashboard />;
}
