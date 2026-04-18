'use client';

import { useEffect, useState } from 'react';
import StatCard from './StatCard';
import SideNavigation from './SideNavigation';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import TransactionToast, { TransactionStatus } from './TransactionToast';

import { Copy, History, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';



export default function MintingQueueDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean, status: TransactionStatus, message: string, txHash?: string }>({
    show: false,
    message: '',
  });
  const [securityDetails, setSecurityDetails] = useState<any>(null);

  const fetchApproved = async () => {
    try {
      const { data } = await api.get('/admin/batches/approved');
      setBatches(data);
    } catch (err) {
      console.error('Failed to fetch approved batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApproved();
  }, []);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMint = async (batchId: string) => {
    setToast({
      show: true,
      status: 'pending',
      message: 'Submitting mint transaction to blockchain...',
    });
    setSecurityDetails(null);

    try {
      const { data } = await api.post(`/credits/batches/${batchId}/mint`);
      
      setToast({
        show: true,
        status: 'success',
        message: 'Successfully minted carbon credits on-chain!',
        txHash: data.txHash,
      });

      // Remove from queue
      setBatches(prev => prev.filter(b => b.id !== batchId));
    } catch (err: any) {
      console.error('Minting failed:', err);
      
      const errorData = err.response?.data;
      if (errorData?.error === 'SECURITY_MISMATCH') {
        setSecurityDetails({
          regulatorHash: errorData.regulatorHash,
          unauthorizedHash: errorData.unauthorizedHash,
          quantity: errorData.currentQuantity,
        });
        setToast({
          show: true,
          status: 'security_mismatch',
          message: errorData.message,
        });
      } else {
        setToast({
          show: true,
          status: 'error',
          message: errorData?.message || 'Minting execution failed. Please verify network status.',
        });
      }
    }
  };

    const handleSignOut = () => {
    logout();
    router.push('/');
  };

  const isAdmin = user?.role === 'ADMIN';

  const navItems = isAdmin ? [
    { label: 'Admin Panel', href: '/admin', icon: '🛡️' },
    { label: 'Minting Queue', href: '/minting', icon: '⛓️', active: true },
    { label: 'History', href: '/regulator/history', icon: '📋' },
    { label: 'Audit Trail', href: '/audit', icon: '🔍' },
  ] : [
    { label: 'Minting Queue', href: '/minting', icon: '⛓️', active: true },
    { label: 'Audit Trail', href: '/audit', icon: '📋' },
  ];

  return (
    <div className="flex min-h-screen bg-[#f4fafd]">
      <SideNavigation items={navItems} />

      <main className="flex-1 ml-64 p-8">
        {/* Network Status Bar */}
        <div className="bg-white border-b border-[#e2e9ec] px-8 py-3 flex items-center justify-between sticky top-0 z-30 -m-8 mb-8">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#13bf66] rounded-full"></span>
            <span className="text-sm font-semibold text-[#012d1d]">Network: Hardhat (Local)</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono bg-gray-50 px-3 py-1 rounded border border-[#e2e9ec]">
              {user?.walletAddress.slice(0, 6)}...{user?.walletAddress.slice(-4)}
            </span>
            <button 
              onClick={handleSignOut}
              className="px-6 py-2 bg-white border border-[#e2e9ec] rounded-lg font-semibold text-xs text-[#012d1d] hover:bg-[#f4fafd] transition"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-[#012d1d] mb-2">Minting Queue</h1>
          <p className="text-[#717973]">Execute on-chain minting for regulator-approved batches</p>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-lg p-6 shadow-md border border-[#e2e9ec]">
            <p className="text-xs font-bold text-[#414844] tracking-wider uppercase mb-2">
              Ready to Mint
            </p>
            <p className="text-4xl font-bold text-[#012d1d] mb-1">{batches.length}</p>
            <p className="text-sm text-[#717973] mb-4">
              {batches.reduce((acc, b) => acc + (b.quantity || 0), 0).toLocaleString()} MT Total
            </p>
            <div className="w-full bg-[#e2e9ec] rounded-full h-2">
              <div
                className="bg-[#6bfe9c] h-2 rounded-full transition-all duration-500"
                style={{ width: batches.length > 0 ? '45%' : '100%' }}
              />
            </div>
          </div>

          <StatCard
            label="Pending Execution"
            value={batches.length.toString()}
            subtext="Approved by Regulator"
            icon="⏳"
          />

          <div className="bg-white rounded-lg p-6 shadow-md border border-[#e2e9ec]">
            <p className="text-xs font-bold text-[#414844] tracking-wider uppercase mb-2">
              Contract Status
            </p>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 bg-[#13bf66] rounded-full"></span>
              <p className="text-2xl font-bold text-[#012d1d]">Active</p>
            </div>
            <p className="text-sm text-[#717973]">Gas Level: Optimal</p>
          </div>
        </div>

        {/* Active Batches Table */}
        <section className="mb-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#012d1d] mb-2">Active Batches</h2>
            <p className="text-[#717973]">Batches approved and ready for on-chain minting</p>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-[#e2e9ec]">
            {/* Table Header */}
            <div className="grid grid-cols-5 gap-4 px-6 py-4 bg-[#f9fbfc] border-b border-[#e2e9ec] font-bold text-[#414844] text-sm uppercase tracking-wider">
              <div>Batch ID</div>
              <div>Producer</div>
              <div>Quantity (MT)</div>
              <div>Verification</div>
              <div>Action</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-[#e2e9ec]">
              {loading ? (
                <div className="p-12 text-center text-[#717973]">Loading minting queue...</div>
              ) : batches.length === 0 ? (
                <div className="p-12 text-center text-[#717973]">No batches currently awaiting execution.</div>
              ) : (
                batches.map((batch) => (
                  <div
                    key={batch.id}
                    className="grid grid-cols-5 gap-4 px-6 py-4 items-center hover:bg-[#f9fbfc] transition"
                  >
                    <div className="flex items-center gap-2 font-mono text-sm font-semibold text-[#1b4332]">
                      #{batch.id.slice(0, 8)}
                      <button 
                        onClick={() => handleCopy(batch.id)}
                        className="p-1 hover:bg-gray-100 rounded transition text-[#717973]"
                        title="Copy Full ID"
                      >
                        {copiedId === batch.id ? <Check size={14} className="text-[#6bfe9c]" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div>
                      <p className="font-semibold text-[#012d1d] text-sm">{batch.producer?.name || 'Unknown'}</p>
                      <p className="text-xs text-[#717973] truncate">{batch.producer?.walletAddress}</p>
                    </div>
                    <div className="font-semibold text-[#012d1d]">{batch.quantity.toLocaleString()} MT</div>
                    <div>
                      <span className="px-2 py-1 bg-[#e8f5e9] text-[#2e7d32] text-xs font-bold rounded">
                        ✓ Approved
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => router.push(`/batches/${batch.id}`)}
                        className="p-2 bg-white border border-[#e2e9ec] text-[#012d1d] rounded-lg hover:bg-gray-50 transition shadow-sm"
                        title="View History"
                      >
                        <History size={16} />
                      </button>
                      <button 
                        onClick={() => handleMint(batch.id)}
                        className="px-4 py-2 bg-[#6bfe9c] text-[#012d1d] rounded-lg font-semibold text-sm hover:bg-[#5ae88a] transition shadow-sm"
                      >
                        Mint Asset
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      <TransactionToast 
        show={toast.show}
        status={toast.status as any}
        message={toast.message}
        txHash={toast.txHash}
        securityDetails={securityDetails}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}

