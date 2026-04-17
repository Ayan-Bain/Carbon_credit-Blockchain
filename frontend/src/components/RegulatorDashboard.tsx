'use client';

import { useEffect, useState } from 'react';
import SideNavigation from './SideNavigation';
import StatCard from './StatCard';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

const navItems = [
  { label: 'Dashboard', href: '/regulator', icon: '📊' },
  { label: 'Verification', href: '/regulator/verification', icon: '✓', active: true },
  { label: 'History', href: '/regulator/history', icon: '📋' },
  { label: 'Standards', href: '/regulator/standards', icon: '⚖️' },
  { label: 'Audit Trail', href: '/regulator/audit', icon: '🔍' },
];

export default function RegulatorDashboard() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const { data } = await api.get('/admin/batches/pending');
      setBatches(data);
    } catch (err) {
      console.error('Failed to fetch pending batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'REGULATOR' || user?.role === 'ADMIN') {
      fetchPending();
    }
  }, [user]);

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/admin/batches/${id}/approve`);
      alert('Batch approved and verified on-chain!');
      setBatches(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error('Approval failed:', err);
      alert('Approval failed. See console.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/admin/batches/${id}/reject`);
      alert('Batch rejected.');
      setBatches(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error('Rejection failed:', err);
      alert('Rejection failed.');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f4fafd]">
      <SideNavigation items={navItems} />

      <main className="flex-1 ml-64 p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-[#012d1d] mb-2">Verification Queue</h1>
            <p className="text-[#717973]">Review and approve carbon credit batch submissions</p>
          </div>
          <div className="px-4 py-2 bg-[#e8f5e9] text-[#2e7d32] rounded-lg font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-[#2e7d32] rounded-full"></span>
            Regulator Power: Active
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-10">
          <StatCard
            label="Pending Review"
            value={batches.length.toString()}
            subtext="Awaiting verification"
            icon="⏳"
          />
          <StatCard
            label="Audited"
            value="42"
            subtext="Lifetime compliance"
            icon="✓"
          />
          <StatCard
            label="Rejection Rate"
            value="5.2%"
            subtext="Last 30 days"
            icon="⚠️"
          />
          <StatCard
            label="Avg Speed"
            value="1.8h"
            subtext="Per verification"
            icon="⏱️"
          />
        </div>

        <section className="mb-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#012d1d] mb-2">Active Queue</h2>
            <p className="text-[#717973]">Batches pending your verification</p>
          </div>

          <div className="bg-white rounded-lg overflow-hidden shadow-md">
            <div className="flex border-b border-[#e2e9ec]">
              <button className="px-6 py-4 font-semibold text-[#6bfe9c] border-b-2 border-[#6bfe9c]">
                Pending Approval
              </button>
            </div>

            <div className="divide-y divide-[#e2e9ec]">
              {loading ? (
                <div className="p-12 text-center text-[#717973]">Loading queue...</div>
              ) : batches.length === 0 ? (
                <div className="p-12 text-center text-[#717973]">No pending batches at the moment.</div>
              ) : (
                batches.map((batch) => (
                  <div key={batch.id} className="p-6 hover:bg-[#f9fbfc] transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-[#012d1d]">Batch #{batch.id.slice(0, 8)}</h3>
                          <span className="px-2 py-1 bg-[#fff3e0] text-[#e65100] text-xs font-bold rounded">
                            {batch.status}
                          </span>
                        </div>
                        <p className="text-sm text-[#717973]">
                          Producer: {batch.producer.name} • {batch.quantity.toLocaleString()} tCO2e
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#012d1d]">Submitted</p>
                        <p className="text-xs text-[#717973]">
                          {new Date(batch.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4 pb-4 border-b border-[#e2e9ec]">
                      <div>
                        <p className="text-xs text-[#717973] font-bold uppercase">Metadata Hash</p>
                        <p className="text-sm font-semibold text-[#012d1d] truncate w-32">
                          {batch.metadataIPFSHash}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#717973] font-bold uppercase">Credits</p>
                        <p className="text-sm font-semibold text-[#012d1d]">{batch.quantity} MT</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#717973] font-bold uppercase">Evidence</p>
                        <p className="text-sm font-semibold text-[#6bfe9c] cursor-pointer">View IPFS</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#717973] font-bold uppercase">Producer Id</p>
                        <p className="text-sm font-semibold text-[#2e7d32]">{batch.producerId.slice(0, 8)}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleApprove(batch.id)}
                        className="px-4 py-2 bg-[#6bfe9c] text-[#012d1d] rounded-lg font-semibold text-sm hover:bg-[#5ae88a] transition"
                      >
                        ✓ Approve
                      </button>
                      <button 
                        onClick={() => handleReject(batch.id)}
                        className="px-4 py-2 bg-[#fee2e2] text-[#b8362f] rounded-lg font-semibold text-sm hover:bg-[#fecaca] transition"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ) )
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

      </main>
    </div>
  );
}
