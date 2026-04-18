'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SideNavigation from '@/components/SideNavigation';
import StatCard from '@/components/StatCard';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { ShieldAlert, Users, CheckCircle, XCircle, Search, ExternalLink, ShieldCheck, Globe, TrendingUp, AlertCircle } from 'lucide-react';

const navItems = [
  { label: 'Admin Panel', href: '/admin', icon: '🛡️', active: true },
  { label: 'Minting Queue', href: '/minting', icon: '⛓️' },
  { label: 'History', href: '/regulator/history', icon: '📋' },
  { label: 'Audit Trail', href: '/audit', icon: '🔍' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [companiesRes, statsRes] = await Promise.all([
        api.get('/admin/companies'),
        api.get('/admin/stats/global')
      ]);
      setCompanies(companiesRes.data);
      setGlobalStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchData();
    } else if (user) {
      router.push('/');
    }
  }, [user]);

  const handleUpdateRole = async (walletAddress: string, role: string, grant: boolean) => {
    setUpdatingRole(walletAddress);
    try {
      await api.post('/admin/roles/update', { walletAddress, role, grant });
      alert(`Role ${role} ${grant ? 'granted' : 'revoked'} successfully!`);
      await fetchData();
    } catch (err: any) {
      console.error('Role update failed:', err);
      alert(err.response?.data?.message || 'Role update failed');
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleVerify = async (id: string, verified: boolean) => {
    setVerifyingId(id);
    try {
      await api.post(`/admin/companies/${id}/verify`, { verified });
      await fetchData();
    } catch (err) {
      console.error('Verification toggle failed:', err);
      alert('Verification status update failed');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleSignOut = () => {
    logout();
    router.push('/');
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.walletAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#f4fafd]">
      <SideNavigation items={navItems} />

      <main className="flex-1 ml-64 p-8">
        <div className="mb-10 flex justify-between items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#e8f7ec] px-3 py-1 text-[10px] font-extrabold tracking-widest text-[#136d3a] uppercase mb-3 shadow-sm border border-[#d8f0dc]">
              <ShieldAlert size={12} /> Registry Controller
            </div>
            <h1 className="text-4xl font-extrabold text-[#012d1d] mb-2">Nexus Command</h1>
            <p className="text-[#717973]">Master control for roles, identity verification, and ecosystem compliance.</p>
          </div>
          <button 
            onClick={handleSignOut}
            className="px-6 py-3 bg-white border border-[#e2e9ec] rounded-2xl font-bold text-[#012d1d] hover:bg-[#f4fafd] transition shadow-sm active:scale-95"
          >
            Sign Out
          </button>
        </div>

        {/* System Overview Stats */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-[#e2e9ec] flex flex-col justify-between">
             <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                   <Globe size={20} />
                </div>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">Real-time</span>
             </div>
             <div>
                <p className="text-xs font-bold text-[#717973] uppercase tracking-wider mb-1">Total Minted</p>
                <div className="flex items-baseline gap-2">
                   <p className="text-2xl font-black text-[#012d1d]">{(globalStats?.totalMinted || 0).toLocaleString()}</p>
                   <p className="text-[10px] font-bold text-[#717973]">MT</p>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-[#e2e9ec] flex flex-col justify-between">
             <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                   <TrendingUp size={20} />
                </div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Confimred</span>
             </div>
             <div>
                <p className="text-xs font-bold text-[#717973] uppercase tracking-wider mb-1">Total Retired</p>
                <div className="flex items-baseline gap-2">
                   <p className="text-2xl font-black text-[#012d1d]">{(globalStats?.totalRetired || 0).toLocaleString()}</p>
                   <p className="text-[10px] font-bold text-[#717973]">MT</p>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-[#e2e9ec] flex flex-col justify-between">
             <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                   <Users size={20} />
                </div>
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded">Active</span>
             </div>
             <div>
                <p className="text-xs font-bold text-[#717973] uppercase tracking-wider mb-1">Registry Members</p>
                <div className="flex items-baseline gap-2">
                   <p className="text-2xl font-black text-[#012d1d]">{companies.length}</p>
                   <p className="text-[10px] font-bold text-[#717973]">Entities</p>
                </div>
             </div>
          </div>

          <div className="bg-[#012d1d] rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
             <div className="absolute right-[-10%] top-[-10%] opacity-10">
                <ShieldCheck size={120} />
             </div>
             <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center">
                   <ShieldCheck size={20} />
                </div>
             </div>
             <div className="relative z-10">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Market Valuation</p>
                <p className="text-2xl font-black">${(globalStats?.totalValue || 0).toLocaleString()}</p>
                <p className="text-[10px] text-emerald-200/60 uppercase font-black">Total Circulation Value</p>
             </div>
          </div>
        </div>

        {/* Search & Tool Bar */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#717973]" size={18} />
              <input 
                type="text" 
                placeholder="Search member directory..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#e2e9ec] rounded-2xl pl-12 pr-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#6bfe9c] transition shadow-sm"
              />
           </div>
        </div>

        {/* Companies Table */}
        <section className="bg-white rounded-[40px] border border-[#e2e9ec] shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-[#e2e9ec] flex justify-between items-center bg-[#f9fbfc]">
            <h2 className="text-xl font-bold text-[#012d1d]">Global Member Directory</h2>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-[#13bf66] rounded-full animate-pulse"></span>
               <p className="text-xs text-[#717973] font-black uppercase tracking-widest">Live Ledger Sync</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fcfdfe] border-b border-[#e2e9ec]">
                  <th className="px-8 py-4 text-[10px] font-bold text-[#717973] uppercase tracking-widest">Legal Entity</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-[#717973] uppercase tracking-widest">On-Chain Identity</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-[#717973] uppercase tracking-widest">Authorized Role</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-[#717973] uppercase tracking-widest">KYC Status</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-[#717973] uppercase tracking-widest text-right">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e9ec]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-[#717973]">
                      <div className="flex flex-col items-center gap-4">
                         <div className="w-10 h-10 border-4 border-[#6bfe9c] border-t-transparent rounded-full animate-spin" />
                         <p className="font-black text-xs uppercase tracking-[0.2em]">Synchronizing Registry...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-16 text-center text-[#717973]">
                      No ecosystem members found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((company) => {
                    const isMinter = company.role === 'MINTER';
                    const isRegulator = company.role === 'REGULATOR';
                    const isAdmin = company.role === 'ADMIN';
                    const isProducer = company.role === 'PRODUCER';
                    const isSelf = company.walletAddress.toLowerCase() === user?.walletAddress?.toLowerCase();

                    return (
                      <tr key={company.id} className="hover:bg-[#fcfdfe] transition group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#f4fafd] flex items-center justify-center text-lg shadow-sm border border-[#e2e9ec] group-hover:bg-[#6bfe9c]/10 group-hover:border-[#6bfe9c]/30 transition-colors">
                               {isProducer ? '🏭' : isRegulator ? '⚖️' : isAdmin ? '🛡️' : isMinter ? '⛓️' : '🛒'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-[#012d1d]">{company.name}</p>
                                {isSelf && (
                                  <span className="text-[8px] font-black uppercase tracking-tighter bg-[#012d1d] text-white px-1.5 py-0.5 rounded">You</span>
                                )}
                              </div>
                              <p className="text-[9px] font-bold text-[#717973] uppercase tracking-tight opacity-60">Joined {new Date(company.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-xs text-[#012d1d] tracking-tighter decoration-emerald-400 underline-offset-4 pointer-events-none select-all">
                              {company.walletAddress.slice(0, 10)}...{company.walletAddress.slice(-8)}
                            </p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {updatingRole === company.walletAddress ? (
                            <span className="inline-block w-4 h-4 border-2 border-[#13bf66] border-t-transparent rounded-full animate-spin"></span>
                          ) : isSelf ? (
                            <div className="bg-[#012d1d] text-[#6bfe9c] px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-transparent">
                              Current Admin
                            </div>
                          ) : (
                            <select 
                              className="bg-[#f9fbfc] border border-[#e2e9ec] rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#6bfe9c] transition cursor-pointer hover:border-emerald-400"
                              value={company.role}
                              onChange={(e) => handleUpdateRole(company.walletAddress, e.target.value, true)}
                            >
                              <option value="BUYER">Authorized: Buyer</option>
                              <option value="PRODUCER">Authorized: Producer</option>
                              <option value="REGULATOR">Authorized: Regulator</option>
                              <option value="MINTER">Authorized: Minter</option>
                              <option value="ADMIN">Authorized: Admin</option>
                            </select>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          {verifyingId === company.id ? (
                             <span className="inline-block w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <button 
                              onClick={() => !isSelf && handleVerify(company.id, !company.kycVerified)}
                              disabled={isSelf}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                                company.kycVerified 
                                ? 'bg-emerald-50 border-emerald-100 text-[#13bf66]' 
                                : 'bg-orange-50 border-orange-100 text-orange-500'
                              } ${isSelf ? 'opacity-80 cursor-default' : ''}`}
                            >
                               {company.kycVerified ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                               <span className="text-[10px] font-black uppercase tracking-widest">{company.kycVerified ? 'Verified' : 'Unverified'}</span>
                            </button>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => router.push(`/audit/company/${company.id}`)}
                               className="px-4 py-2 bg-white border border-[#e2e9ec] text-[#012d1d] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#012d1d] hover:text-white transition flex items-center gap-2"
                             >
                               <ExternalLink size={12} /> Audit Trail
                             </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
