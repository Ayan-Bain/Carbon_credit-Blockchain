'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SideNavigation from './SideNavigation';
import ProjectCard from './ProjectCard';
import TransactionToast, { TransactionStatus } from './TransactionToast';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

const getNavItems = (role: string) => {
  if (role === 'PRODUCER') {
    return [
      { label: 'Dashboard', href: '/producer', icon: '📊' },
      { label: 'Marketplace', href: '/marketplace', icon: '🛒' },
      { label: 'Audit Trail', href: '/audit', icon: '📋' },
    ];
  }
  return [
    { label: 'Dashboard', href: '/buyer/dashboard', icon: '📊' },
    { label: 'Marketplace', href: '/marketplace', icon: '🛒' },
    { label: 'Audit Trail', href: '/audit', icon: '📋' },
  ];
};

export default function BuyerMarketplace() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Toast State
  const [toast, setToast] = useState<{ show: boolean, status: TransactionStatus, message: string, txHash?: string }>({
    show: false,
    status: 'pending',
    message: '',
  });

  const [selectedListingId, setSelectedListingId] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');

  const fetchData = async () => {
    try {
      const [listingsRes, portfolioRes] = await Promise.all([
        api.get('/market/listings'),
        api.get('/credits/portfolio'),
      ]);
      setListings(listingsRes.data);
      setPortfolio(portfolioRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBuy = async (listingId: string, projectName: string, amount: number) => {
    setToast({ 
      show: true, 
      status: 'pending', 
      message: `Purchasing ${amount} credits from ${projectName}...` 
    });

    try {
      const { data } = await api.post(`/market/listings/${listingId}/buy`, {
        amount: amount,
      });

      setToast({ 
        show: true, 
        status: 'success', 
        message: 'Purchase confirmed on-chain!', 
        txHash: data.onChainTxHash 
      });
      fetchData(); // Refresh
    } catch (err: any) {
      setToast({ 
        show: true, 
        status: 'error', 
        message: err.response?.data?.message || 'Purchase failed.' 
      });
    }
  };

  const handleRetire = async () => {
    if (!selectedListingId || !amount) return;

    setToast({ 
      show: true, 
      status: 'pending', 
      message: 'Executing credit retirement on-chain...' 
    });

    try {
      const { data } = await api.post('/credits/retire', {
        batchId: selectedListingId,
        amount: parseInt(amount),
        purpose: purpose
      });

      setToast({ 
        show: true, 
        status: 'success', 
        message: 'Credits successfully retired and burned.', 
        txHash: data.onChainTxHash 
      });
      setAmount('');
      setPurpose('');
      fetchData();
    } catch (err: any) {
      setToast({ 
        show: true, 
        status: 'error', 
        message: err.response?.data?.message || 'Retirement failed.' 
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f4fafd]">
      <SideNavigation items={getNavItems(user?.role || 'BUYER')} />

      <main className="flex-1 ml-64 p-8">
        <div className={`grid ${user?.role === 'BUYER' ? 'grid-cols-3' : 'grid-cols-1'} gap-8`}>
          <div className={user?.role === 'BUYER' ? 'col-span-2' : ''}>
            <div className="mb-8 flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold text-[#012d1d] mb-2">Active Marketplace</h1>
                <p className="text-[#717973]">Verified ecological assets available for immediate settlement</p>
              </div>
              <button 
                onClick={logout}
                className="px-6 py-2 bg-white border border-[#e2e9ec] rounded-lg font-semibold text-[#012d1d] hover:bg-[#f4fafd] transition"
              >
                Sign Out
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-[#717973]">Loading listings...</div>
            ) : listings.length === 0 ? (
              <div className="p-12 bg-white rounded-xl text-center border border-[#e2e9ec]">
                No active listings found.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {listings.map((listing) => (
                  <ProjectCard
                    key={listing.id}
                    image="🌳"
                    title={listing.batch.id.slice(0, 8)}
                    subtitle={`Producer: ${listing.seller.name}`}
                    category="Verified Carbon"
                    price={`$${listing.pricePerUnit}/tCO2e`}
                    description={`On-chain batch ID: ${listing.batch.onChainBatchId}`}
                    available={`${listing.availableUnits.toLocaleString()} tCO2e`}
                    availableNum={listing.availableUnits}
                    canBuy={user?.role === 'BUYER'}
                    onBuy={(amount) => handleBuy(listing.id, listing.batch.id.slice(0, 8), amount)}
                    onViewDetails={() => router.push(`/batches/${listing.batch.id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {user?.role === 'BUYER' && (
            <aside className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-md sticky top-8 border border-[#e2e9ec]">
                <h3 className="text-lg font-bold text-[#012d1d] mb-6">Retirement Desk</h3>

                <div className="mb-6">
                  <label className="text-xs font-bold text-[#414844] uppercase tracking-wider block mb-2">
                    Select Asset
                  </label>
                  <select
                    value={selectedListingId}
                    onChange={(e) => setSelectedListingId(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e2e9ec] rounded-lg focus:outline-none focus:border-[#6bfe9c] text-[#012d1d]"
                  >
                    <option value="">Select an asset...</option>
                    {portfolio.map(batch => (
                      <option key={batch.id} value={batch.id}>
                        {batch.id.slice(0, 8)} ({batch.quantity} units)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="text-xs font-bold text-[#414844] uppercase tracking-wider block mb-2">
                    Amount to Burn (tCO2e)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e2e9ec] rounded-lg focus:outline-none focus:border-[#6bfe9c]"
                  />
                </div>

                <div className="mb-6">
                  <label className="text-xs font-bold text-[#414844] uppercase tracking-wider block mb-2">
                    Retirement Purpose
                  </label>
                  <textarea
                    placeholder="e.g. Q4 2025 Carbon Neutral Goal"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e2e9ec] rounded-lg focus:outline-none focus:border-[#6bfe9c] resize-none h-24"
                  />
                </div>

                <button 
                  onClick={handleRetire}
                  disabled={!selectedListingId || !amount}
                  className="w-full bg-gradient-to-r from-[#012d1d] to-[#1b4332] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Execute Retirement
                </button>
              </div>

              <div className="bg-[#f0fff4] rounded-lg p-6 border border-[#c6f6d5]">
                <h4 className="font-bold text-[#1b4332] mb-4">Impact Summary</h4>
                <div className="space-y-3 text-sm">
                  {portfolio.map(batch => (
                    <div key={batch.id} className="flex justify-between">
                      <span className="text-[#3b593f] truncate w-32">{batch.id.slice(0, 8)}</span>
                      <span className="font-semibold text-[#1b4332]">{batch.quantity.toLocaleString()} MT</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-[#c6f6d5] flex justify-between font-bold text-[#1b4332]">
                    <span>Global Balance</span>
                    <span>{portfolio.reduce((acc, b) => acc + b.quantity, 0).toLocaleString()} MT</span>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>

      <TransactionToast 
        show={toast.show}
        status={toast.status}
        message={toast.message}
        txHash={toast.txHash}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}
