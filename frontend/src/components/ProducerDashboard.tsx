'use client';

import { useEffect, useState } from 'react';
import SideNavigation from './SideNavigation';
import StatCard from './StatCard';
import BatchCard from './BatchCard';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

const navItems = [
  { label: 'Dashboard', href: '/producer', icon: '📊', active: true },
  { label: 'Submissions', href: '/producer/submissions', icon: '📤' },
  { label: 'Verification', href: '/producer/verification', icon: '✓' },
  { label: 'Marketplace', href: '/producer/marketplace', icon: '🛒' },
  { label: 'Audit Trail', href: '/producer/audit', icon: '📋' },
];

export default function ProducerDashboard() {
  const { user, login, logout, address } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/credits/batches');
      setBatches(data);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBatches();
    }
  }, [user]);

  const totalCredits = batches.reduce((acc, b) => acc + (b.quantity || 0), 0);
  const pendingBatches = batches.filter(b => b.status === 'PENDING').length;
  const verifiedCredits = batches
    .filter(b => b.status === 'VERIFIED' || b.status === 'MINTED')
    .reduce((acc, b) => acc + (b.quantity || 0), 0);

  return (
    <div className="flex min-h-screen bg-[#f4fafd]">
      <SideNavigation items={navItems} />

      <main className="flex-1 ml-64 p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-[#012d1d] mb-2">Producer Dashboard</h1>
            <p className="text-[#717973]">Welcome back, {user?.name || 'Producer'}</p>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-2 bg-[#6bfe9c] text-[#012d1d] rounded-lg font-semibold hover:bg-[#5ae88a] transition flex items-center gap-2"
                >
                  <span className="text-lg">+</span> New Submission
                </button>
                <button 
                  onClick={logout}
                  className="px-6 py-2 bg-white border border-[#e2e9ec] rounded-lg font-semibold text-[#012d1d] hover:bg-[#f4fafd] transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={login}
                className="px-6 py-2 bg-[#6bfe9c] text-[#012d1d] rounded-lg font-semibold hover:bg-[#5ae88a] transition"
              >
                Connect Wallet
              </button>
            )}
            {address && (
              <span className="text-xs font-mono bg-white px-3 py-2 rounded-lg border border-[#e2e9ec]">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-10">
          <StatCard
            label="Total Registered"
            value={totalCredits.toLocaleString()}
            subtext="Total units submitted"
            icon="📈"
          />
          <StatCard
            label="In Review"
            value={pendingBatches.toString()}
            subtext="Pending Verification"
            icon="⏳"
          />
          <StatCard
            label="Verified Credits"
            value={verifiedCredits.toLocaleString()}
            subtext="Ready for Marketplace"
            icon="✓"
          />
        </div>

        <section className="mb-10">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold text-[#012d1d] mb-2">My Batches</h2>
              <p className="text-[#717973]">Recent submissions and their status</p>
            </div>
            <button className="text-[#1b4332] font-semibold hover:underline">View All</button>
          </div>

          <div className="grid gap-4">
            {loading ? (
              <div className="p-12 text-center text-[#717973]">Loading your batches...</div>
            ) : batches.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-dashed border-[#ccd4d8] text-[#717973]">
                No batches found. Start by submitting your first environmental project.
              </div>
            ) : (
              batches.map((batch) => (
                <BatchCard
                  key={batch.id}
                  projectName={batch.id.slice(0, 8)} // Fallback if name missing
                  location="Global" // Placeholder
                  quantity={`${batch.quantity.toLocaleString()} tCO2e`}
                  status={batch.status.toLowerCase()}
                  submissionDate={new Date(batch.submittedAt).toLocaleDateString()}
                  actions={[
                    { label: 'View Details', onClick: () => console.log('Details', batch.id) },
                    ...(batch.status === 'VERIFIED' ? [{ label: 'List for Sale', onClick: () => {} }] : [])
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
