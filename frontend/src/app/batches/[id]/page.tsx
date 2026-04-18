'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SideNavigation from '@/components/SideNavigation';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { Copy, Check, ExternalLink, ShieldCheck, Clock, FileText, Loader2 } from 'lucide-react';

const getNavItems = (role: string) => {
  let homePath = '/';
  const normalizedRole = role?.toUpperCase();
  if (normalizedRole === 'PRODUCER') homePath = '/producer';
  else if (normalizedRole === 'REGULATOR') homePath = '/regulator';
  else if (normalizedRole === 'ADMIN') homePath = '/admin';
  else if (normalizedRole === 'BUYER') homePath = '/buyer';
  else if (normalizedRole === 'MINTER') homePath = '/minting';

  return [
    { label: 'Return to Home', href: homePath, icon: '🏠' },
  ];
};

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const batchId = typeof params?.id === 'string' ? params.id : '';
  const [batch, setBatch] = useState<any>(null);
  const [producer, setProducer] = useState<any>(null);
  const [auditData, setAuditData] = useState<any>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string>('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    if (!batchId) return;

    const fetchBatch = async () => {
      setLoading(true);
      try {
        const [batchResult, auditResult, metadataResult] = await Promise.allSettled([
          api.get(`/credits/batches/${batchId}`),
          api.get(`/audit/batch/${batchId}`),
          api.get(`/credits/batches/${batchId}/metadata`),
        ]);

        let currentBatch = null;
        if (batchResult.status === 'fulfilled') {
          currentBatch = batchResult.value.data;
          setBatch(currentBatch);
        } else {
          throw batchResult.reason;
        }

        if (auditResult.status === 'fulfilled') {
          setAuditData(auditResult.value.data);
        }

        if (metadataResult.status === 'fulfilled') {
          setMetadata(metadataResult.value.data);
        }

        // Fetch producer details separately if batch has producerId
        if (currentBatch?.producerId) {
          try {
            const { data } = await api.get(`/auth/company/${currentBatch.producerId}`);
            setProducer(data);
          } catch (err) {
            console.error('Failed to fetch producer details:', err);
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Unable to load batch details.');
      } finally {
        setLoading(false);
      }
    };

    fetchBatch();
  }, [batchId]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const response = await api.get(`/credits/batches/${batchId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const extension = metadata?.originalFileName?.split('.').pop() || 'pdf';
      const cleanBatchId = batchId.slice(0, 8);
      const fileName = `Audit_Evidence_Batch_${cleanBatchId}.${extension}`;
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
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

  const statusLabel = batch?.status ? batch.status.replace(/_/g, ' ') : 'Status Unknown';
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-[#ff9800]';
      case 'APPROVED': return 'text-[#13bf66]';
      case 'MINTED': return 'text-[#13bf66]';
      case 'LISTED': return 'text-[#3b82f6]';
      default: return 'text-[#13bf66]';
    }
  };

  const proofFileName = metadata?.originalFileName || metadata?.projectName || 'Verification Asset';
  const proofs = metadata ? [{ name: proofFileName, icon: <FileText size={20} />, cid: metadata.assetCid }] : [];

  return (
    <div className="flex min-h-screen bg-[#f4fafd]">
      <SideNavigation items={getNavItems(user?.role || 'PRODUCER')} />

      <main className="flex-1 ml-64 p-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#e8f7ec] px-3 py-1 text-[9px] font-extrabold tracking-widest text-[#136d3a] uppercase mb-3 shadow-sm border border-[#d8f0dc]">
            <ShieldCheck size={11} /> Official Project Record
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-[#012d1d] mb-1">{batch?.title || `Batch #${batchId.slice(0, 8)}`}</h1>
              <div className="flex items-center gap-2 font-mono text-xs text-[#717973]">
                {batchId}
                <button onClick={() => handleCopy(batchId)} className="p-1 hover:bg-white rounded transition shadow-sm border border-transparent hover:border-[#e2e9ec]">
                  {copiedText === batchId ? <Check size={12} className="text-[#136d3a]" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-[#717973] uppercase tracking-widest mb-1.5">Current Project Status</p>
              <span className={`inline-flex px-3 py-1.5 rounded-lg bg-white border border-[#e2e9ec] shadow-sm text-xs font-bold ${getStatusColor(batch?.status)}`}>
                {statusLabel.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-[24px] border border-[#e2e9ec] shadow-sm">
            <p className="text-[9px] font-bold text-[#717973] uppercase tracking-widest mb-2">Total Carbon Offset</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-[#012d1d]">{batch?.quantity?.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-[#717973]">MTCO2e</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-[#e2e9ec] shadow-sm">
            <p className="text-[10px] font-bold text-[#717973] uppercase tracking-widest mb-3">Registry Record ID</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-black text-[#136d3a]">#{batch?.onChainBatchId || 'PEND'}</p>
              <div className="w-10 h-10 bg-[#f4fafd] rounded-full flex items-center justify-center text-[#136d3a] font-bold">⛓️</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-[#e2e9ec] shadow-sm overflow-hidden">
            <p className="text-[10px] font-bold text-[#717973] uppercase tracking-widest mb-3">Project Producer</p>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-lg">🏭</div>
               <div className="flex-1 truncate">
                 <p className="font-bold text-[#012d1d] truncate">{producer?.name || 'Loading...'}</p>
                 <div className="flex items-center gap-2">
                   <p className="text-[10px] font-mono text-[#717973] truncate opacity-60">
                     Wallet: {producer?.walletAddress ? `${producer.walletAddress.slice(0, 6)}...${producer.walletAddress.slice(-4)}` : 'N/A'}
                   </p>
                 </div>
                 {producer?.id && (
                   <div className="flex items-center gap-1.5 mt-1">
                     <p className="text-[10px] font-mono text-[#136d3a] font-bold">ID: {producer.id.slice(0, 12)}...</p>
                     <button 
                       onClick={() => handleCopy(producer.id)}
                       className="p-1 hover:bg-white rounded transition text-[#717973] hover:text-[#136d3a]"
                     >
                       {copiedText === producer.id ? <Check size={10} /> : <Copy size={10} />}
                     </button>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>

        <div className="grid gap-10 xl:grid-cols-[1.5fr_1fr]">
          {/* Timeline Section */}
          <div className="space-y-8">
            <div className="bg-white rounded-[40px] border border-[#e2e9ec] shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-[#e2e9ec] bg-[#f9fbfc]">
                <h2 className="text-xl font-bold text-[#012d1d]">Timeline</h2>
                <p className="text-sm text-[#717973]">Chronological record of the batch from submission to current state.</p>
              </div>

              <div className="divide-y divide-[#e2e9ec]">
                {(auditData?.history || []).map((event: any, idx: number) => {
                  const label = event.type.replace(/_/g, ' ');
                  const txHash = event.details?.onChainTxHash || event.details?.txHash;

                  return (
                    <div key={idx} className="p-5 hover:bg-[#fcfdfe] transition">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 w-8 h-8 rounded-lg bg-[#f4fafd] flex items-center justify-center text-[#136d3a]">
                          <Clock size={14} />
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="inline-flex rounded-lg bg-[#ecf9f0] px-3 py-1 text-[10px] font-black text-[#136d3a] uppercase tracking-widest border border-[#d8f0dc]">
                                {label}
                              </span>
                              <p className="text-xs text-[#717973] mt-2 font-medium">{new Date(event.at).toLocaleString()}</p>
                            </div>
                            {txHash && (
                              <div className="flex flex-col items-end gap-1.5">
                                <p className="text-[9px] font-bold text-[#717973] uppercase tracking-[0.2em]">Tx Proof</p>
                                <div className="flex items-center gap-2 bg-[#f9fbfc] border border-[#e2e9ec] px-3 py-1.5 rounded-xl text-xs font-mono text-[#012d1d]">
                                   {txHash.slice(0, 10)}...{txHash.slice(-8)}
                                   <button onClick={() => handleCopy(txHash)} className="p-1 hover:text-[#136d3a] transition">
                                     {copiedText === txHash ? <Check size={12} /> : <Copy size={12} />}
                                   </button>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {event.details && (Object.keys(event.details).some(k => ['unitsPurchased', 'totalPrice', 'purpose', 'quantity', 'status', 'pricePerUnit', 'availableUnits', 'producer', 'verifier', 'buyer', 'seller'].includes(k))) && (
                            <div className="bg-[#f9fbfc] border border-[#e2e9ec] rounded-2xl p-4 grid grid-cols-2 gap-4">
                               {(event.details.unitsPurchased || event.details.quantity || event.details.availableUnits) && (
                                 <div>
                                   <p className="text-[9px] font-bold text-[#717973] uppercase tracking-widest">{event.details.unitsPurchased ? 'Quantity Traded' : event.details.availableUnits ? 'Credits for Market' : 'Batch Quantity'}</p>
                                   <p className="font-bold text-[#012d1d]">{(event.details.unitsPurchased || event.details.quantity || event.details.availableUnits).toLocaleString()} MT</p>
                                 </div>
                               )}
                               {(event.details.totalPrice || event.details.pricePerUnit) && (
                                 <div>
                                   <p className="text-[9px] font-bold text-[#717973] uppercase tracking-widest">{event.details.totalPrice ? 'Total Price' : 'Price per Ton'}</p>
                                   <p className="font-bold text-[#012d1d]">${(event.details.totalPrice || event.details.pricePerUnit).toLocaleString()}</p>
                                 </div>
                               )}
                               {event.details.purpose && (
                                 <div className="col-span-2">
                                   <p className="text-[9px] font-bold text-[#717973] uppercase tracking-widest">Retirement Purpose</p>
                                   <p className="text-sm font-medium text-[#012d1d] italic font-serif">{event.details.purpose}</p>
                                 </div>
                               )}
                               {(event.details.producer || event.details.verifier || event.details.buyer || event.details.seller) && (
                                 <div className="col-span-2 pt-2 border-t border-[#e2e9ec]/60 mt-2">
                                   <p className="text-[9px] font-bold text-[#717973] uppercase tracking-widest mb-1">Executed By</p>
                                   <div className="flex items-center gap-2">
                                     <div className="w-6 h-6 rounded-full bg-white border border-[#e2e9ec] flex items-center justify-center text-[10px]">
                                       👤
                                     </div>
                                     <p className="text-xs font-bold text-[#012d1d]">
                                       {(event.details.producer || event.details.verifier || event.details.buyer || event.details.seller).name || 'Unknown Entity'}
                                     </p>
                                     <div className="flex items-center gap-1.5 ml-auto">
                                       <p className="text-[10px] font-mono text-[#717973]">
                                         {(event.details.producer || event.details.verifier || event.details.buyer || event.details.seller).id?.slice(0, 8)}
                                       </p>
                                       <button 
                                         onClick={() => handleCopy((event.details.producer || event.details.verifier || event.details.buyer || event.details.seller).id)}
                                         className="p-1 hover:bg-white rounded transition text-[#717973] hover:text-[#136d3a]"
                                       >
                                         {copiedText === (event.details.producer || event.details.verifier || event.details.buyer || event.details.seller).id ? <Check size={10} /> : <Copy size={10} />}
                                       </button>
                                     </div>
                                   </div>
                                 </div>
                               )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Proofs & Metadata */}
          <div className="space-y-6">
            <div className="bg-white rounded-[40px] border border-[#e2e9ec] shadow-sm overflow-hidden">
          <div className="border-y border-[#e2e9ec] bg-[#f9fbfc] px-8 py-6">
                 <h3 className="text-lg font-bold text-[#012d1d]">Verified Documents</h3>
                 <p className="text-xs text-[#717973] mt-1">Official certificates and environmental evidence.</p>
               </div>
               <div className="p-6 space-y-4">
                 {proofs.map((proof, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-[#f4fafd] rounded-3xl border border-[#e2e9ec]">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-[#e2e9ec] flex items-center justify-center text-[#136d3a]">
                             {proof.icon}
                           </div>
                           <div>
                             <p className="font-bold text-xs text-[#012d1d] line-clamp-1">{proof.name}</p>
                             <p className="text-[9px] font-mono text-[#717973] mt-1">CID: {proof.cid?.slice(0, 16)}...</p>
                           </div>
                        </div>
                        <button 
                          onClick={handleDownload}
                          disabled={downloading}
                          className={`p-2.5 bg-white rounded-xl shadow-sm border border-[#e2e9ec] transition text-[#136d3a] ${downloading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                        >
                          {downloading ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}
                        </button>
                    </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
