import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface BatchCardProps {
  batchId?: string;
  projectName: string;
  location: string;
  quantity: string;
  totalVolume: number;
  alreadyListedVolume: number;
  status: 'minted' | 'pending' | 'approved' | 'verified' | 'listing' | 'listed' | 'sold_out' | 'rejected';
  submissionDate: string;
  actions?: { label: string; onClick: () => void }[];
  onList?: (batchId: string, quantity: number, price: number) => Promise<void>;
}

const statusStyles = {
  minted: 'bg-[#e8f5e9] text-[#2e7d32]',
  pending: 'bg-[#fff3e0] text-[#e65100]',
  approved: 'bg-[#e3f2fd] text-[#1565c0]',
  verified: 'bg-[#e3f2fd] text-[#1565c0]',
  listing: 'bg-[#f0f9ff] text-[#0369a1]',
  listed: 'bg-[#fdf2f8] text-[#9d174d]',
  sold_out: 'bg-gray-100 text-gray-600',
  rejected: 'bg-red-50 text-red-600',
};

export default function BatchCard({
  batchId,
  projectName,
  location,
  quantity,
  totalVolume = 0,
  alreadyListedVolume = 0,
  status,
  submissionDate,
  actions = [],
  onList
}: BatchCardProps) {
  const [showListingMenu, setShowListingMenu] = useState(false);
  const [listQuantity, setListQuantity] = useState('');
  const [listPrice, setListPrice] = useState('');
  const [isListing, setIsListing] = useState(false);

  const remainingToList = (totalVolume || 0) - (alreadyListedVolume || 0);
  const canListMore = remainingToList > 0 && (status === 'minted' || status === 'listed');

  const handleListSubmit = async () => {
    if (!batchId || !onList) return;
    const q = parseFloat(listQuantity);
    const p = parseFloat(listPrice);
    if (isNaN(q) || isNaN(p) || q <= 0 || p <= 0) {
      alert('Please enter valid quantity and price');
      return;
    }
    if (q > remainingToList) {
      alert(`You can only list up to ${remainingToList} remaining units.`);
      return;
    }

    setIsListing(true);
    try {
      await onList(batchId, q, p);
      setShowListingMenu(false);
      setListQuantity('');
      setListPrice('');
    } catch (err) {
      console.error('Listing failed:', err);
    } finally {
      setIsListing(false);
    }
  };

  const handleListWholeBatch = () => {
    setListQuantity(remainingToList.toString());
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-[#e2e9ec] shadow-md hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#012d1d] text-lg mb-1">{projectName}</h3>
          <p className="text-sm text-[#717973]">{location}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            statusStyles[status] || 'bg-gray-100'
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      <div className={`grid ${onList ? 'grid-cols-2' : 'grid-cols-1 text-center'} gap-4 mb-4 pb-4 border-b border-[#e2e9ec]`}>
        <div>
          <p className="text-xs text-[#717973] uppercase font-bold">Total Batch Units</p>
          <p className="text-lg font-bold text-[#012d1d]">{(totalVolume || 0).toLocaleString()} MT</p>
        </div>
        {onList && (
          <div>
            <p className="text-xs text-[#717973] uppercase font-bold">Unlisted Credits</p>
            <p className="text-lg font-bold text-[#136d3a]">{remainingToList.toLocaleString()} MT</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className="flex-1 px-3 py-2 bg-[#6bfe9c] text-[#012d1d] rounded-lg font-semibold text-sm hover:bg-[#5ae88a] transition-colors"
            >
              {action.label}
            </button>
          ))}
          {canListMore && !showListingMenu && onList && (
            <button
              onClick={() => setShowListingMenu(true)}
              className="flex-1 px-3 py-2 bg-[#012d1d] text-white rounded-lg font-semibold text-sm hover:bg-[#1b4332] transition-colors"
            >
              List Credits
            </button>
          )}
        </div>

        {showListingMenu && (
          <div className="mt-2 p-5 bg-[#f9fbfc] rounded-[32px] border border-[#e2e9ec] space-y-6 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-[#717973] uppercase tracking-widest pl-2">Quantity to List (MT)</label>
                  <button 
                    onClick={handleListWholeBatch}
                    className="text-[10px] font-bold text-[#136d3a] hover:underline"
                  >
                    List Remaining ({remainingToList})
                  </button>
                </div>
                <div className="relative group">
                  <input
                    type="number"
                    min="0"
                    max={remainingToList}
                    value={listQuantity}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val < 0) return;
                      setListQuantity(e.target.value);
                    }}
                    placeholder={`Max: ${remainingToList}`}
                    className="w-full bg-white border border-[#e2e9ec] rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6bfe9c] transition shadow-sm"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none opacity-40">
                    <span className="text-xs font-bold text-[#012d1d]">MT</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#717973] uppercase tracking-widest pl-2">Price per Unit ($)</label>
                <div className="relative group">
                  <input
                    type="number"
                    min="0"
                    value={listPrice}
                    onChange={(e) => {
                       const val = parseFloat(e.target.value);
                      if (val < 0) return;
                      setListPrice(e.target.value);
                    }}
                    placeholder="e.g. 25.50"
                    className="w-full bg-white border border-[#e2e9ec] rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6bfe9c] transition shadow-sm"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none opacity-40">
                    <span className="text-xs font-bold text-[#012d1d]">$</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleListSubmit}
                disabled={isListing}
                className="flex-[2] py-3.5 bg-[#6bfe9c] text-[#012d1d] rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl hover:bg-[#5ae88a] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isListing ? <Loader2 className="animate-spin" size={18} /> : 'Publish Listing'}
              </button>
              <button
                onClick={() => setShowListingMenu(false)}
                disabled={isListing}
                className="flex-1 py-3.5 bg-white border border-[#e2e9ec] text-[#717973] rounded-2xl font-bold text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
