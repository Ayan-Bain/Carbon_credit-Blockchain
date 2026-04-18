'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SideNavigation from '@/components/SideNavigation';
import StatCard from '@/components/StatCard';
import BatchCard from '@/components/BatchCard';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';



export default function RegulatorHistoryPage() {
  const router = useRouter();
  const { user, login, logout, address } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/regulator/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleSignOut = () => {
    logout();
    router.push('/');
  };

  const isAdmin = user?.role === 'ADMIN';

  const navItems = isAdmin ? [
    { label: 'Admin Panel', href: '/admin', icon: '🛡️' },
    { label: 'Minting Queue', href: '/minting', icon: '⛓️' },
    { label: 'History', href: '/regulator/history', icon: '📋', active: true },
    { label: 'Audit Trail', href: '/audit', icon: '🔍' },
  ] : [
    { label: 'Dashboard', href: '/regulator', icon: '📊' },
    { label: 'History', href: '/regulator/history', icon: '📋', active: true },
    { label: 'Audit Trail', href: '/audit', icon: '🔍' },
  ];

  return (
    <div className="flex min-h-screen bg-[#f4fafd]">
      <SideNavigation items={navItems} />

      <main className="flex-1 ml-64 p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-[#012d1d] mb-2">Verification History</h1>
            <p className="text-[#717973]">Review your past audit decisions and compliance records</p>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <button 
                onClick={handleSignOut}
                className="px-6 py-2 bg-white border border-[#e2e9ec] rounded-lg font-semibold text-[#012d1d] hover:bg-[#f4fafd] transition"
              >
                Sign Out
              </button>
            ) : (
              <button 
                onClick={login}
                className="px-6 py-2 bg-[#6bfe9c] text-[#012d1d] rounded-lg font-semibold hover:bg-[#5ae88a] transition"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-10">
          <StatCard
            label="Total Verified"
            value={stats?.lifetimeVerified?.toString() || '0'}
            subtext="Lifetime certifications"
            icon="✓"
          />
          <StatCard
            label="Total Rejected"
            value={stats?.lifetimeRejected?.toString() || '0'}
            subtext="Compliance failures"
            icon="⚠️"
          />
          <StatCard
            label="Total Audited"
            value={stats?.totalAudited?.toString() || '0'}
            subtext="Total processed batches"
            icon="📋"
          />
        </div>

        <section className="mb-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#012d1d] mb-2">Audit Chronicle</h2>
            <p className="text-[#717973]">Historical ledger of your verification actions</p>
          </div>

          <div className="grid gap-4">
            {loading ? (
              <div className="p-12 text-center text-[#717973]">Loading history...</div>
            ) : !stats?.history || stats.history.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-dashed border-[#ccd4d8] text-[#717973]">
                You haven't processed any credit batches yet.
              </div>
            ) : (
              stats.history.map((batch: any) => (
                <BatchCard
                  key={batch.id}
                  projectName={batch.id.slice(0, 8)}
                  location={batch.producer?.name || 'Unknown Producer'}
                  totalVolume={batch.quantity}
                  alreadyListedVolume={0}
                  status={batch.status.toLowerCase()}
                  submissionDate={new Date(batch.verifiedAt || batch.submittedAt).toLocaleDateString()}
                  actions={[
                    { label: 'View Details', onClick: () => router.push(`/batches/${batch.id}`) }
                  ]}
                />
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
