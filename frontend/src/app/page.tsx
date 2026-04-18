'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import AuthRegistration from '@/components/AuthRegistration';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const role = user.role.toLowerCase();
      if (role === 'producer') router.push('/producer');
      else if (role === 'regulator') router.push('/regulator');
      else if (role === 'admin') router.push('/admin');
      else if (role === 'buyer') router.push('/buyer');
      else if (role === 'minter') router.push('/minting');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4fafd]">
        <Loader2 className="w-12 h-12 text-[#6bfe9c] animate-spin mb-4" />
        <p className="text-[#012d1d] font-semibold">Opening the Carbon Registry...</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4fafd]">
        <Loader2 className="w-12 h-12 text-[#6bfe9c] animate-spin mb-4" />
        <p className="text-[#012d1d] font-semibold">Almost there...</p>
      </div>
    );
  }

  return <AuthRegistration />;
}
