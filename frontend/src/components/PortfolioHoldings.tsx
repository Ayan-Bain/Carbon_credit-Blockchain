'use client';

import { useState } from 'react';
import { colors } from '@/lib/design-tokens';

interface Holding {
  id: string;
  projectName: string;
  batchId: string;
  amount: number;
  status: 'ACTIVE' | 'RETIRED' | 'PENDING';
}

interface PortfolioHoldingsProps {
  holdings: Holding[];
  onRetire: (holdingId: string) => void;
}

export default function PortfolioHoldings({ holdings, onRetire }: PortfolioHoldingsProps) {
  const [retiringId, setRetiringId] = useState<string | null>(null);

  const handleRetire = async (id: string) => {
    setRetiringId(id);
    try {
      await onRetire(id);
    } finally {
      setRetiringId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return {
          backgroundColor: colors.primary.dark,
          color: colors.primary.accent,
        };
      case 'RETIRED':
        return {
          backgroundColor: colors.borders.light,
          color: colors.text.medium,
        };
      default:
        return {
          backgroundColor: colors.status.warning,
          color: colors.primary.darkest,
        };
    }
  };

  const getRowOpacity = (status: string) => {
    return status === 'RETIRED' ? 'opacity-40' : '';
  };

  return (
    <div className="rounded-lg bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-8">
        <h2
          className="text-2xl font-extrabold"
          style={{ color: colors.primary.darkest }}
        >
          My Holdings
        </h2>
        <button
          className="flex items-center gap-1 text-sm font-semibold transition-colors"
          style={{ color: colors.primary.success }}
        >
          <span>Export Ledger</span>
          <span>↓</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100">
              <th
                className="px-8 py-4 text-left text-xs font-semibold uppercase tracking-widest"
                style={{ color: colors.text.medium }}
              >
                Project Name
              </th>
              <th
                className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-widest"
                style={{ color: colors.text.medium }}
              >
                Batch ID
              </th>
              <th
                className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-widest"
                style={{ color: colors.text.medium }}
              >
                Amount
              </th>
              <th
                className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-widest"
                style={{ color: colors.text.medium }}
              >
                Status
              </th>
              <th
                className="px-8 py-4 text-right text-xs font-semibold uppercase tracking-widest"
                style={{ color: colors.text.medium }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding, index) => (
              <tr
                key={holding.id}
                className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${getRowOpacity(
                  holding.status
                )}`}
              >
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <p
                      className="font-bold"
                      style={{ color: colors.primary.darkest }}
                    >
                      {holding.projectName}
                    </p>
                    <p style={{ color: colors.text.medium }} className="text-sm">
                      Batch: {holding.batchId}
                    </p>
                  </div>
                </td>
                <td
                  className="px-4 py-6 font-mono text-sm"
                  style={{ color: colors.text.light }}
                >
                  {holding.batchId}
                </td>
                <td className="px-4 py-6 text-right">
                  <div className="flex flex-col items-end">
                    <p
                      className="font-bold"
                      style={{ color: colors.primary.darkest }}
                    >
                      {holding.amount.toLocaleString()}
                    </p>
                    <p style={{ color: colors.text.medium }} className="text-xs">
                      tCO2e
                    </p>
                  </div>
                </td>
                <td className="px-4 py-6">
                  <span
                    className="inline-block rounded-md px-3 py-1 text-xs font-semibold uppercase"
                    style={getStatusColor(holding.status)}
                  >
                    {holding.status}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  {holding.status === 'ACTIVE' ? (
                    <button
                      onClick={() => handleRetire(holding.id)}
                      disabled={retiringId === holding.id}
                      className="rounded-lg px-6 py-2 text-sm font-semibold text-white shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: colors.primary.success }}
                    >
                      {retiringId === holding.id ? 'Retiring...' : 'Retire Credits'}
                    </button>
                  ) : (
                    <button
                      className="text-sm font-semibold underline transition-colors"
                      style={{ color: colors.primary.darkest }}
                    >
                      View Audit Trail
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {holdings.length === 0 && (
        <div className="p-8 text-center" style={{ color: colors.text.medium }}>
          <p>No holdings found. Start by buying carbon credits!</p>
        </div>
      )}
    </div>
  );
}
