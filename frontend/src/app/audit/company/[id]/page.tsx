'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SideNavigation from '@/components/SideNavigation';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { Copy, Check, ExternalLink } from 'lucide-react';

const getNavItems = (role: string) => {
  let homePath = '/';
  const r = role?.toUpperCase();
  if (r === 'PRODUCER') homePath = '/producer';
  else if (r === 'REGULATOR') homePath = '/regulator';
  else if (r === 'ADMIN') homePath = '/admin';
  else if (r === 'BUYER') homePath = '/buyer';
  else if (r === 'MINTER') homePath = '/minting';

  return [
    { label: 'Return to Home', href: homePath, icon: '🏠' },
  ];
};

export default function CompanyAuditPage() {
  const params = useParams();
  const { user } = useAuth();
  const companyId = typeof params?.id === 'string' ? params.id : '';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const fetchAudit = async () => {
      try {
        const response = await api.get(`/audit/company/${companyId}`);
        setData(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Unable to load company audit history.');
      } finally {
        setLoading(false);
      }
    };

    fetchAudit();
  }, [companyId]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#f4fafd]">
        <SideNavigation items={getNavItems(user?.role || 'PRODUCER')} />
        <main className="flex-1 ml-64 p-8 flex items-center justify-center">
          <p className="text-[#012d1d] font-bold animate-pulse">Loading project records...</p>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen bg-[#f4fafd]">
        <SideNavigation items={getNavItems(user?.role || 'PRODUCER')} />
        <main className="flex-1 ml-64 p-8">
          <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-red-700">
            {error || 'Company not found.'}
          </div>
        </main>
      </div>
    );
  }

  const { company, history } = data;

  return (
    <div className="flex min-h-screen bg-[#f4fafd]">
      <SideNavigation items={getNavItems(user?.role || 'PRODUCER')} />

      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#e2e9ec] px-4 py-1 text-[10px] font-bold tracking-widest text-[#414844] uppercase mb-4">
            Identity Audit
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-extrabold text-[#012d1d] mb-2">{company.name}</h1>
              <div className="flex items-center gap-3 font-mono text-sm text-[#717973]">
                {company.id}
                <button onClick={() => handleCopy(company.id)} className="p-1 hover:bg-white rounded transition">
                  {copiedText === company.id ? <Check size={14} className="text-[#13bf66]" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <span className={`px-4 py-2 rounded-xl border text-sm font-bold ${
                company.role === 'PRODUCER' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                company.role === 'BUYER' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                'bg-gray-50 text-gray-700 border-gray-100'
              }`}>
                {company.role}
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-[32px] border border-[#e2e9ec] shadow-sm">
            <p className="text-xs font-bold text-[#717973] uppercase tracking-widest mb-2">Wallet Address</p>
            <p className="font-mono text-sm text-[#012d1d]">
              {company.walletAddress.slice(0, 8)}...{company.walletAddress.slice(-6)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-[#e2e9ec] shadow-sm">
            <p className="text-xs font-bold text-[#717973] uppercase tracking-widest mb-2">Status</p>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${company.kycVerified ? 'bg-[#13bf66]' : 'bg-orange-400'}`} />
              <p className="font-bold text-[#012d1d]">{company.kycVerified ? 'KYC Verified' : 'Compliance Pending'}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-[#e2e9ec] shadow-sm">
            <p className="text-xs font-bold text-[#717973] uppercase tracking-widest mb-2">Network Join Date</p>
            <p className="font-bold text-[#012d1d]">{new Date(company.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-[40px] border border-[#e2e9ec] shadow-sm overflow-hidden">
          <div className="bg-[#f9fbfc] border-b border-[#e2e9ec] px-8 py-6">
            <h2 className="text-xl font-bold text-[#012d1d]">Official Activity Log</h2>
            <p className="text-sm text-[#717973]">Every action performed is officially registered and documented below.</p>
          </div>

          <div className="divide-y divide-[#e2e9ec]">
            {(history || []).map((item: any, idx: number) => {
              const label = (item.action || 'Unknown').replace(/_/g, ' ');
              const details = item.payload || {};
              const isPurchase = item.action === 'SALE';
              const isRetirement = item.action === 'RETIREMENT';
              const isCreation = item.action === 'COMPANY_CREATED';

              return (
                <div key={idx} className="p-5 hover:bg-[#fcfdfe] transition group">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${
                        isCreation ? 'bg-gray-100 text-gray-500' :
                        isPurchase ? 'bg-blue-50 text-blue-600' :
                        isRetirement ? 'bg-purple-50 text-purple-600' :
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        {isCreation ? '🏢' : isPurchase ? '💳' : isRetirement ? '🌿' : '📋'}
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                            isCreation ? 'bg-gray-100 text-gray-600' :
                            isPurchase ? 'bg-blue-100 text-blue-700' :
                            isRetirement ? 'bg-purple-100 text-purple-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {label}
                          </span>
                          <p className="text-sm text-[#717973] mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                        </div>
                        {item.txHash && (
                          <div className="flex flex-col items-end">
                            <p className="text-[10px] font-bold text-[#717973] uppercase tracking-widest mb-1">Transaction Hash</p>
                            <div className="flex items-center gap-2 font-mono text-xs bg-[#f4fafd] px-3 py-1.5 rounded-lg border border-[#e2e9ec]">
                              {item.txHash.slice(0, 10)}...{item.txHash.slice(-8)}
                              <button onClick={() => handleCopy(item.txHash)} className="hover:text-[#13bf66]">
                                {copiedText === item.txHash ? <Check size={12} /> : <Copy size={12} />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      { (isCreation || isPurchase || isRetirement || details.producer || details.seller || details.verifier) && (
                        <div className="grid grid-cols-2 gap-8 py-4 px-6 bg-[#f9fbfc] rounded-3xl border border-[#e2e9ec]">
                        {isCreation ? (
                          <>
                            <div>
                              <p className="text-[10px] font-bold text-[#717973] uppercase tracking-widest">Initial Role</p>
                              <p className="font-bold text-[#012d1d] mt-1">{details.role}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-[#717973] uppercase tracking-widest">Verification Status</p>
                              <p className="font-bold text-[#012d1d] mt-1">{details.kycVerified ? 'Verified' : 'Unverified'}</p>
                            </div>
                          </>
                        ) : isPurchase ? (
                          <>
                            <div>
                              <p className="text-[10px] font-bold text-[#717973] uppercase tracking-widest">Quantity</p>
                              <p className="font-extrabold text-[#012d1d] mt-1 text-lg">{details.unitsPurchased.toLocaleString()} MT</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-[#717973] uppercase tracking-widest">On-Chain Batch</p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="font-mono text-xs text-[#136d3a] font-bold">#{details.onChainBatchId}</p>
                              </div>
                            </div>
                          </>
                        ) : isRetirement ? (
                          <>
                            <div>
                              <p className="text-[10px] font-bold text-[#717973] uppercase tracking-widest">Retired</p>
                              <p className="font-extrabold text-[#136d3a] mt-1 text-lg">{details.unitsRetired.toLocaleString()} MT</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-[#717973] uppercase tracking-widest">Purpose</p>
                              <p className="text-sm font-semibold text-[#012d1d] mt-1 line-clamp-1 italic">{details.purpose}</p>
                            </div>
                          </>
                        ) : null}
                        
                        {(details.producer || details.seller || details.verifier) && (
                          <div className="col-span-2 pt-4 border-t border-[#e2e9ec]/60 mt-2">
                            <p className="text-[9px] font-bold text-[#717973] uppercase tracking-widest mb-1">Executed By</p>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-white border border-[#e2e9ec] flex items-center justify-center text-[10px]">
                                👤
                              </div>
                              <p className="text-xs font-bold text-[#012d1d]">
                                {(details.producer || details.seller || details.verifier).name}
                              </p>
                              <div className="flex items-center gap-1.5 ml-auto">
                                <p className="text-[10px] font-mono text-[#717973]">
                                  {(details.producer || details.seller || details.verifier).id.slice(0, 8)}
                                </p>
                                <button 
                                  onClick={() => handleCopy((details.producer || details.seller || details.verifier).id)}
                                  className="p-1 hover:text-[#136d3a] transition"
                                >
                                  {copiedText === (details.producer || details.seller || details.verifier).id ? <Check size={10} /> : <Copy size={10} />}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                      {!isCreation && item.batchId && (
                        <div className="flex justify-end pt-4">
                           <a 
                             href={`/batches/${item.batchId}`} 
                             className="inline-flex items-center gap-2 text-xs font-bold text-[#136d3a] hover:underline"
                           >
                             Inspect Batch Details <ExternalLink size={12} />
                           </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
