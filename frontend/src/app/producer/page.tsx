'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import ProducerDashboard from '@/components/ProducerDashboard';

export default function ProducerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'PRODUCER')) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'PRODUCER') {
    return null;
  }

  return <ProducerDashboard />;
}
