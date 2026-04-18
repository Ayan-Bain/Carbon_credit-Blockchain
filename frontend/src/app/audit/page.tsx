'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SideNavigation from '@/components/SideNavigation';
import PortfolioSideNavigation from '@/components/PortfolioSideNavigation';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { Search, Loader2, AlertCircle } from 'lucide-react';

export default function UnifiedAuditTrailPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'company' | 'batch' | 'tx'>('batch');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSignOut = () => {
    logout();
    router.push('/');
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query || searching) return;

    setSearching(true);
    setSearchError(null);

    try {
      if (searchScope === 'batch') {
        await api.get(`/credits/batches/${query}`);
        router.push(`/batches/${query}`);
      } else if (searchScope === 'company') {
        await api.get(`/auth/company/${query}`);
        router.push(`/audit/company/${query}`);
      } else {
        const { data } = await api.get(`/audit/tx/${query}`);
        if (data.type === 'batch') {
          router.push(`/batches/${data.id}`);
        } else {
          router.push(`/audit/company/${data.id}`);
        }
      }
    } catch (err: any) {
      const message = err.response?.status === 404
        ? `Lookup Failed: The ID ${query} does not exist in our ${searchScope} database. Please ensure you have selected the correct category (Batch vs Company) and checked for typos.`
        : 'Connection Error: Unable to reach the registry database at this time.';
      setSearchError(message);
    } finally {
      setSearching(false);
    }
  };

  const isProducer = user?.role === 'PRODUCER';
  const isBuyer = user?.role === 'BUYER';
  const isRegulator = user?.role === 'REGULATOR';
  const isAdmin = user?.role === 'ADMIN';

  const navItems = isProducer 
    ? [
        { label: 'Dashboard', href: '/producer', icon: '📊' },
        { label: 'Marketplace', href: '/marketplace', icon: '🛒' },
        { label: 'Audit Trail', href: '/audit', icon: '🔍', active: true },
      ]
    : isAdmin
    ? [
        { label: 'Admin Panel', href: '/admin', icon: '🛡️' },
        { label: 'Minting Queue', href: '/minting', icon: '⛓️' },
        { label: 'History', href: '/regulator/history', icon: '📋' },
        { label: 'Audit Trail', href: '/audit', icon: '🔍', active: true },
      ]
    : isRegulator
    ? [
        { label: 'Dashboard', href: '/regulator', icon: '📊' },
        { label: 'History', href: '/regulator/history', icon: '📋' },
        { label: 'Audit Trail', href: '/audit', icon: '🔍', active: true },
      ]
    : [];

  return (
    <div className="flex min-h-screen bg-[#f4fafd]">
      {isBuyer ? <PortfolioSideNavigation /> : <SideNavigation items={navItems} />}

      <main className="flex-1 ml-64 p-8">
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.35em] text-[#1b4332]/80 mb-3">Audit Trail</p>
            <h1 className="text-5xl font-extrabold text-[#012d1d] mb-4">Official Records</h1>
            <p className="text-[#515f55] text-base leading-7">
              Access the project's official records. Search for specific project batches or company histories to verify authenticity and environmental impact.
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center justify-center rounded-2xl border border-[#e2e9ec] bg-white px-6 py-3 text-sm font-semibold text-[#012d1d] shadow-sm transition hover:bg-[#f4fafd]"
          >
            Sign Out
          </button>
        </div>

        {/* Error Dialog Overlay */}
        {searchError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#012d1d]/20 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-[40px] border border-[#e2e9ec] shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                  <AlertCircle size={28} />
                </div>
                <h3 className="text-xl font-extrabold text-[#012d1d]">Registry Error</h3>
              </div>
              <p className="text-[#515f55] text-base leading-relaxed mb-8">
                {searchError}
              </p>
              <button
                onClick={() => setSearchError(null)}
                className="w-full py-4 bg-[#012d1d] text-white rounded-2xl font-bold hover:bg-[#1b4332] transition"
              >
                Continue Search
              </button>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto mt-12 bg-white rounded-[40px] border border-[#e2e9ec] p-10 shadow-xl">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-[#012d1d]">Registry Lookup</h2>
              <p className="text-sm text-[#717973]">Select the lookup type and enter the unique identifier</p>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setSearchScope('batch')}
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${
                  searchScope === 'batch' 
                  ? 'bg-[#1b4332] text-white shadow-lg scale-105' 
                  : 'bg-[#f4fafd] text-[#717973] border border-[#e2e9ec] hover:bg-gray-100'
                }`}
              >
                Batch ID
              </button>
              <button
                onClick={() => setSearchScope('company')}
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${
                  searchScope === 'company' 
                  ? 'bg-[#1b4332] text-white shadow-lg scale-105' 
                  : 'bg-[#f4fafd] text-[#717973] border border-[#e2e9ec] hover:bg-gray-100'
                }`}
              >
                Company ID
              </button>
              <button
                onClick={() => setSearchScope('tx')}
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${
                  searchScope === 'tx' 
                  ? 'bg-[#1b4332] text-white shadow-lg scale-105' 
                  : 'bg-[#f4fafd] text-[#717973] border border-[#e2e9ec] hover:bg-gray-100'
                }`}
              >
                Tx Hash
              </button>
            </div>

            <div className="relative group">
              <input
                type="text"
                value={searchQuery}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  searchScope === 'batch' ? "Enter batch UUID (e.g. 3477...)" : 
                  searchScope === 'company' ? "Enter company UUID (e.g. ab27...)" :
                  "Enter transaction hash (0x...)"
                }
                className="w-full bg-[#f4fafd] border-2 border-[#e2e9ec] rounded-[24px] px-8 py-5 text-[#012d1d] font-semibold text-lg focus:border-[#6bfe9c] focus:outline-none transition-all placeholder:text-[#ccd4d8]"
              />
              <button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className={`absolute right-3 top-3 bottom-3 px-8 rounded-[18px] font-bold text-sm transition shadow-md active:scale-95 flex items-center gap-2 ${
                  searching || !searchQuery.trim()
                  ? 'bg-gray-100 text-[#ccd4d8] cursor-not-allowed'
                  : 'bg-[#6bfe9c] text-[#012d1d] hover:bg-[#5ae88a]'
                }`}
              >
                {searching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                Search Records
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6">
              <div className="p-6 bg-[#f9fbfc] rounded-3xl border border-[#e2e9ec]">
                <p className="text-xs font-bold text-[#1b4332] uppercase tracking-widest mb-1">Project Batches</p>
                <p className="text-sm text-[#717973]">Complete project documentation from start to finish.</p>
              </div>
              <div className="p-6 bg-[#f9fbfc] rounded-3xl border border-[#e2e9ec]">
                <p className="text-xs font-bold text-[#1b4332] uppercase tracking-widest mb-1">On-Chain Proofs</p>
                <p className="text-sm text-[#717973]">Locate actions directly using blockchain transaction identifiers.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
