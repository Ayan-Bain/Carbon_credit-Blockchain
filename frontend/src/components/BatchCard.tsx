'use client';

interface BatchCardProps {
  projectName: string;
  location: string;
  quantity: string;
  status: 'minted' | 'pending' | 'approved';
  submissionDate: string;
  actions?: { label: string; onClick: () => void }[];
}

const statusStyles = {
  minted: 'bg-[#e8f5e9] text-[#2e7d32]',
  pending: 'bg-[#fff3e0] text-[#e65100]',
  approved: 'bg-[#e3f2fd] text-[#1565c0]',
};

export default function BatchCard({
  projectName,
  location,
  quantity,
  status,
  submissionDate,
  actions = [],
}: BatchCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 border border-[#e2e9ec] shadow-md hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#012d1d] text-lg mb-1">{projectName}</h3>
          <p className="text-sm text-[#717973]">{location}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            statusStyles[status]
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-[#e2e9ec]">
        <div>
          <p className="text-xs text-[#717973] uppercase font-bold">Quantity</p>
          <p className="text-lg font-bold text-[#012d1d]">{quantity}</p>
        </div>
        <div>
          <p className="text-xs text-[#717973] uppercase font-bold">Submission</p>
          <p className="text-lg font-bold text-[#012d1d]">{submissionDate}</p>
        </div>
      </div>

      {actions.length > 0 && (
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
        </div>
      )}
    </div>
  );
}
