'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TransactionsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/audit');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4fafd]">
      <p className="text-[#717973]">Redirecting to Audit Trail...</p>
    </div>
  );
}
