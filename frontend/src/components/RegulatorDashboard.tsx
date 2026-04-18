'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SideNavigation from './SideNavigation';
import StatCard from './StatCard';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

const navItems = [
  { label: 'Dashboard', href: '/regulator', icon: '📊' },
  { label: 'History', href: '/regulator/history', icon: '📋' },
  { label: 'Audit Trail', href: '/audit', icon: '🔍' },
];

export default function RegulatorDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyNames, setCompanyNames] = useState<Record<string, string>>({});
  const [batchMetadata, setBatchMetadata] = useState<Record<string, any>>({});
  const [approvalAmounts, setApprovalAmounts] = useState<Record<string, string>>({});
  const [downloadingBatchId, setDownloadingBatchId] = useState<string | null>(null);

  const fetchBatchMetadata = async (batchId: string) => {
    try {
      const { data } = await api.get(`/credits/batches/${batchId}/metadata`);
      return data;
    } catch (err) {
      console.error('Failed to fetch batch metadata:', err);
      return null;
    }
  };

  const fetchAllBatchMetadata = async (batches: any[]) => {
    const metadataPromises = batches.map(async (batch) => {
      const metadata = await fetchBatchMetadata(batch.id);
      return { batchId: batch.id, metadata };
    });

    const results = await Promise.all(metadataPromises);
    const metadataMap = results.reduce((acc, { batchId, metadata }) => {
      if (metadata) {
        acc[batchId] = metadata;
      }
      return acc;
    }, {} as Record<string, any>);

    setBatchMetadata(metadataMap);
  };

  const fetchCompanyName = async (producerId: string) => {
    try {
      const { data } = await api.get(`/auth/company/${producerId}`);
      return data.name || 'Unknown Company';
    } catch (err) {
      console.error('Failed to fetch company name:', err);
      return 'Unknown Company';
    }
  };

  const fetchCompanyNames = async (batches: any[]) => {
    const uniqueProducerIds = [...new Set(batches.map(b => b.producerId).filter(Boolean))];
    const namePromises = uniqueProducerIds.map(async (producerId) => {
      const name = await fetchCompanyName(producerId);
      return { producerId, name };
    });

    const results = await Promise.all(namePromises);
    const namesMap = results.reduce((acc, { producerId, name }) => {
      acc[producerId] = name;
      return acc;
    }, {} as Record<string, string>);

    setCompanyNames(namesMap);
  };

  const fetchPending = async () => {
    try {
      const { data } = await api.get('/admin/batches/pending');
      setBatches(data);
      if (data.length > 0) {
        await fetchCompanyNames(data);
        await fetchAllBatchMetadata(data);
      }
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
    const batch = batches.find(b => b.id === id);
    const amount = approvalAmounts[id] || batch?.quantity?.toString();
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount of credits to approve.');
      return;
    }

    try {
      await api.post(`/admin/batches/${id}/approve`, { quantity: parseFloat(amount) });
      alert('Project approved and registered!');
      setBatches(prev => prev.filter(b => b.id !== id));
      setBatchMetadata(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      setApprovalAmounts(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } catch (err) {
      console.error('Approval failed:', err);
      alert('Approval failed. See console.');
    }
  };

  const handleDownload = async (batchId: string) => {
    if (downloadingBatchId) return; // Prevent multiple downloads

    setDownloadingBatchId(batchId);
    try {
      const response = await api.get(`/credits/batches/${batchId}/download`, {
        responseType: 'blob', // Important for file downloads
      });

      // Create a blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Get filename from metadata or use default
      const metadata = batchMetadata[batchId];
      const filename = metadata?.filename || `batch-${batchId}-verification-proof.pdf`;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download file:', err);
      alert('Failed to download verification proof. Please try again.');
    } finally {
      setDownloadingBatchId(null);
    }
  };

  const handleAmountChange = (batchId: string, amount: string) => {
    setApprovalAmounts(prev => ({
      ...prev,
      [batchId]: amount
    }));
  };

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      // Optional: Show a brief success message
      alert('Batch ID copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy ID:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = id;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Batch ID copied to clipboard!');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/admin/batches/${id}/reject`);
      alert('Batch rejected.');
      setBatches(prev => prev.filter(b => b.id !== id));
      setBatchMetadata(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } catch (err) {
      console.error('Rejection failed:', err);
      alert('Rejection failed.');
    }
  };

  const handleSignOut = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="flex min-h-screen bg-[#f4fafd]">
      <SideNavigation items={navItems} />

      <main className="flex-1 ml-64 p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-[#012d1d] mb-2">Project Review</h1>
            <p className="text-[#717973]">Review and approve carbon credit project submissions</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-[#e8f5e9] text-[#2e7d32] rounded-lg font-semibold flex items-center gap-2">
              <span className="w-2 h-2 bg-[#2e7d32] rounded-full"></span>
              Verifier Access: Active
            </div>
            <button 
              onClick={handleSignOut}
              className="px-6 py-2 bg-white border border-[#e2e9ec] rounded-lg font-semibold text-[#012d1d] hover:bg-[#f4fafd] transition"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-10 max-w-md">
          <StatCard
            label="Pending Review"
            value={batches.length.toString()}
            subtext="Awaiting verification"
            icon="⏳"
          />
        </div>

        <section className="mb-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#012d1d] mb-2">Pending Review</h2>
            <p className="text-[#717973]">Projects waiting for your approval</p>
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
                  <div key={batch.id || Math.random()} className="p-6 hover:bg-[#f9fbfc] transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-[#012d1d]">Batch #{batch.id?.slice(0, 8) || 'N/A'}</h3>
                          <button
                            onClick={() => handleCopyId(batch.id)}
                            className="text-[#717973] hover:text-[#012d1d] hover:bg-[#f4fafd] transition-colors p-1 rounded"
                            title="Copy Batch ID"
                          >
                            Copy ID
                          </button>
                          <span className="px-2 py-1 bg-[#fff3e0] text-[#e65100] text-xs font-bold rounded">
                            {batch.status || 'Unknown'}
                          </span>
                        </div>
                        <p className="text-sm text-[#717973]">
                          Producer: {batch.producerId ? (companyNames[batch.producerId] || 'Loading...') : 'Unknown'} • {batch.quantity?.toLocaleString() || '0'} tCO2e
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#012d1d]">Submitted</p>
                        <p className="text-xs text-[#717973]">
                          {batch.submittedAt ? new Date(batch.submittedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-[#e2e9ec]">
                      <div>
                        <p className="text-xs text-[#717973] font-bold uppercase">Credits</p>
                        <p className="text-sm font-semibold text-[#012d1d]">{batch.quantity || '0'} MT</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#717973] font-bold uppercase">Download</p>
                        <button
                          onClick={() => handleDownload(batch.id)}
                          disabled={downloadingBatchId === batch.id}
                          className={`text-sm font-semibold transition ${
                            downloadingBatchId === batch.id
                              ? 'text-[#717973] cursor-not-allowed'
                              : 'text-[#6bfe9c] hover:text-[#4ade80] cursor-pointer'
                          }`}
                        >
                          {downloadingBatchId === batch.id ? (
                            <span className="flex items-center gap-2">
                              <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></span>
                              Downloading...
                            </span>
                          ) : (
                            'Download Certificate'
                          )}
                        </button>
                      </div>
                      <div>
                        <p className="text-xs text-[#717973] font-bold uppercase">Producer Id</p>
                        <p className="text-sm font-semibold text-[#2e7d32]">{batch.producerId?.slice(0, 8) || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-[#012d1d]">Credits to Approve:</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder={batch.quantity?.toString() || '0'}
                          value={approvalAmounts[batch.id] || ''}
                          onChange={(e) => handleAmountChange(batch.id, e.target.value)}
                          className="px-3 py-2 border border-[#e2e9ec] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6bfe9c] focus:border-transparent w-24"
                        />
                      </div>
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
