'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import RegulatorDashboard from '@/components/RegulatorDashboard';

export default function RegulatorPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'REGULATOR' && user.role !== 'ADMIN'))) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user || (user.role !== 'REGULATOR' && user.role !== 'ADMIN')) {
    return null;
  }

  return <RegulatorDashboard />;
}
