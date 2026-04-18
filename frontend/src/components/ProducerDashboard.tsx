'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SideNavigation from './SideNavigation';
import StatCard from './StatCard';
import BatchCard from './BatchCard';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

const navItems = [
  { label: 'Dashboard', href: '/producer', icon: '📊' },
  { label: 'Marketplace', href: '/marketplace', icon: '🛒' },
  { label: 'Audit Trail', href: '/audit', icon: '📋' },
];

export default function ProducerDashboard() {
  const router = useRouter();
  const { user, login, logout, address } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleListBatch = async (batchId: string, quantity: number, price: number) => {
    try {
      await api.post('/market/listings', {
        batchId,
        amount: quantity,
        price
      });
      alert('Project batch listed successfully on the marketplace.');
      fetchBatches(); // Refresh the list to show updated status or any changes
    } catch (err: any) {
      console.error('Listing failed:', err);
      alert(err.response?.data?.message || 'Failed to list the batch. Please try again.');
      throw err;
    }
  };

  const totalCredits = batches.reduce((acc, b) => acc + (b.quantity || 0), 0);
  const pendingBatches = batches.filter(b => b.status === 'PENDING').length;
  const totalVerified = batches
    .filter(b => ['VERIFIED', 'MINTED', 'LISTED', 'SOLD_OUT'].includes(b.status))
    .reduce((acc, b) => acc + (b.quantity || 0), 0);
    
  const totalRetired = batches.reduce((acc, b) => 
    acc + (b.retirements?.reduce((sum: number, r: any) => sum + (r.unitsRetired || 0), 0) || 0), 0
  );

  const verifiedCredits = totalVerified - totalRetired;

  return (
    <div className="flex min-h-screen bg-[#f4fafd]">
      <SideNavigation items={navItems} />

      <main className="flex-1 ml-64 p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#012d1d] mb-1">Project Dashboard</h1>
            <p className="text-sm text-[#717973]">Welcome back, {user?.name || 'Partner'}</p>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => router.push('/producer/submission')}
                  className="px-5 py-1.5 bg-[#6bfe9c] text-[#012d1d] rounded-lg font-semibold hover:bg-[#5ae88a] transition flex items-center gap-2 text-sm"
                >
                  <span className="text-lg">+</span> New Submission
                </button>
                <button 
                  onClick={logout}
                  className="px-5 py-1.5 bg-white border border-[#e2e9ec] rounded-lg font-semibold text-[#012d1d] hover:bg-[#f4fafd] transition text-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={login}
                className="px-5 py-1.5 bg-[#6bfe9c] text-[#012d1d] rounded-lg font-semibold hover:bg-[#5ae88a] transition text-sm"
              >
                Connect Wallet
              </button>
            )}
            {address && (
              <span className="text-[10px] font-mono bg-white px-2 py-1.5 rounded-lg border border-[#e2e9ec]">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
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

        <section className="mb-6">
          <div className="mb-4 flex justify-between items-end">
            <div>
              <h2 className="text-xl font-bold text-[#012d1d] mb-1">My Projects</h2>
              <p className="text-xs text-[#717973]">Recent submissions and their current status</p>
            </div>
            <button className="text-[#1b4332] text-sm font-semibold hover:underline">View All</button>
          </div>

          <div className="grid gap-3">
            {loading ? (
              <div className="p-12 text-center text-[#717973]">Loading your batches...</div>
            ) : batches.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-dashed border-[#ccd4d8] text-[#717973]">
                No batches found. Start by submitting your first environmental project.
              </div>
            ) : (
              batches.map((batch) => {
                const alreadyListedVolume = batch.listings?.reduce((sum: number, l: any) => sum + (l.availableUnits || 0), 0) || 0;
                
                return (
                  <BatchCard
                    key={batch.id}
                    batchId={batch.id}
                    projectName={batch.projectName || `Project #${batch.id.slice(0, 8)}`}
                    location={batch.location || 'Global Registry'}
                    quantity={`${(batch.quantity || 0).toLocaleString()} MT`}
                    totalVolume={batch.quantity || 0}
                    alreadyListedVolume={alreadyListedVolume}
                    status={batch.status.toLowerCase()}
                    submissionDate={new Date(batch.submittedAt).toLocaleDateString()}
                    onList={handleListBatch}
                    actions={[
                      { label: 'View Details', onClick: () => router.push(`/batches/${batch.id}`) }
                    ]}
                  />
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
