'use client';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  subtext?: string;
  progressBar?: boolean;
  progressPercent?: number;
}

export default function StatCard({
  label,
  value,
  icon,
  subtext,
  progressBar = false,
  progressPercent = 0,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-md border border-[#e2e9ec] hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-bold text-[#414844] tracking-wider uppercase mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-[#012d1d]">{value}</p>
          {subtext && <p className="text-sm text-[#717973] mt-1">{subtext}</p>}
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>

      {progressBar && (
        <div className="w-full bg-[#e2e9ec] rounded-full h-2">
          <div
            className="bg-[#6bfe9c] h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}
