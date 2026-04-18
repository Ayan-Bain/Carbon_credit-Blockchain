'use client';

import { useRouter } from 'next/navigation';
import ProducerCreditSubmission from '@/components/ProducerCreditSubmission';

export default function ProducerSubmissionPage() {
  const router = useRouter();

  return (
    <ProducerCreditSubmission
      onSuccess={() => {
        setTimeout(() => {
          router.push('/producer');
        }, 1500);
      }}
      onClose={() => router.back()}
    />
  );
}
