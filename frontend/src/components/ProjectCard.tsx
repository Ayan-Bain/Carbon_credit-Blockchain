import { useState } from 'react';

interface ProjectCardProps {
  image: string;
  title: string;
  subtitle: string;
  category: string;
  price: string;
  description: string;
  available: string;
  availableNum: number;
  onBuy: (amount: number) => void;
  onViewDetails?: () => void;
  canBuy?: boolean;
}

export default function ProjectCard({
  image,
  title,
  subtitle,
  category,
  price,
  description,
  available,
  availableNum,
  onBuy,
  onViewDetails,
  canBuy = true,
}: ProjectCardProps) {
  const [amount, setAmount] = useState(1);

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all border border-[#e2e9ec]">
      {/* ... (image section unchanged) */}
      <div className="relative h-40 bg-gradient-to-br from-[#1b4332] to-[#012d1d] flex items-center justify-center text-white text-3xl">
        <span className="text-5xl">🌲</span>
      </div>

      <div className="p-4">
        {/* ... (header section unchanged) */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-[#012d1d]">{title}</h3>
          <span className="text-xs font-bold bg-[#f0fff4] text-[#1b4332] px-2 py-1 rounded">
            {category}
          </span>
        </div>

        <p className="text-sm text-[#717973] mb-3">{subtitle}</p>
        <p className="text-xs text-[#717973] line-clamp-2 mb-3 leading-relaxed">{description}</p>

        <div className="grid grid-cols-2 gap-3 mb-6 bg-[#f4fafd] p-3 rounded-lg border border-[#e2e9ec]">
          <div>
            <p className="text-[10px] text-[#717973] font-bold uppercase tracking-wider">Price/tCO2e</p>
            <p className="font-bold text-[#012d1d]">{price}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#717973] font-bold uppercase tracking-wider">Remaining</p>
            <p className="font-bold text-[#012d1d]">{available}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center border border-[#c1c8c2] rounded-lg">
              <button 
                onClick={() => setAmount(Math.max(1, amount - 1))}
                disabled={!canBuy}
                className="px-3 py-2 text-[#012d1d] hover:bg-gray-50 transition font-bold disabled:opacity-30 disabled:cursor-not-allowed"
              >
                -
              </button>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.min(availableNum, Math.max(1, parseInt(e.target.value) || 1)))}
                disabled={!canBuy}
                className="w-full text-center border-x border-[#c1c8c2] py-2 focus:outline-none font-bold text-[#012d1d] disabled:opacity-30 disabled:cursor-not-allowed"
              />
              <button 
                onClick={() => setAmount(Math.min(availableNum, amount + 1))}
                disabled={!canBuy}
                className="px-3 py-2 text-[#012d1d] hover:bg-gray-50 transition font-bold disabled:opacity-30 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
            <p className="text-xs font-bold text-[#717973]">tCO2e</p>
          </div>

          <button
            onClick={() => onBuy(amount)}
            disabled={!canBuy}
            title={!canBuy ? "Authorized Buyers only. Access restricted for your role." : ""}
            className="w-full bg-gradient-to-r from-[#012d1d] to-[#1b4332] text-white py-3 rounded-lg font-bold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
          >
            Buy {amount} Credits
          </button>
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="w-full border border-[#e2e9ec] text-[#012d1d] bg-white py-3 rounded-lg font-semibold text-sm hover:bg-[#f4fafd] transition-all"
            >
              View Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
