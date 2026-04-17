'use client';

import StatCard from './StatCard';

export default function MintingQueueDashboard() {
  return (
    <div className="min-h-screen bg-[#f4fafd]">
      {/* Network Status Bar */}
      <div className="bg-white border-b border-[#e2e9ec] px-8 py-3 flex items-center gap-2 sticky top-0 z-30">
        <span className="w-2 h-2 bg-[#13bf66] rounded-full"></span>
        <span className="text-sm font-semibold text-[#012d1d]">Network: Mainnet</span>
      </div>

      {/* Main Content */}
      <main className="p-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-[#012d1d] mb-2">Minting Queue</h1>
          <p className="text-[#717973]">Execute on-chain minting for regulator-approved batches</p>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-lg p-6 shadow-md border border-[#e2e9ec]">
            <p className="text-xs font-bold text-[#414844] tracking-wider uppercase mb-2">
              Ready to Mint
            </p>
            <p className="text-4xl font-bold text-[#012d1d] mb-1">8</p>
            <p className="text-sm text-[#717973] mb-4">14,500 MT Total</p>
            <div className="w-full bg-[#e2e9ec] rounded-full h-2">
              <div
                className="bg-[#6bfe9c] h-2 rounded-full"
                style={{ width: '35%' }}
              />
            </div>
            <p className="text-xs text-[#717973] mt-2">35% Complete</p>
          </div>

          <StatCard
            label="Recent On-Chain Activity"
            value="4"
            subtext="Transactions (last 24h)"
            icon="⛓️"
          />

          <div className="bg-white rounded-lg p-6 shadow-md border border-[#e2e9ec]">
            <p className="text-xs font-bold text-[#414844] tracking-wider uppercase mb-2">
              Contract Status
            </p>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 bg-[#13bf66] rounded-full"></span>
              <p className="text-2xl font-bold text-[#012d1d]">Active</p>
            </div>
            <p className="text-sm text-[#717973]">Gas Level: Optimal</p>
          </div>
        </div>

        {/* Active Batches Table */}
        <section className="mb-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#012d1d] mb-2">Active Batches</h2>
            <p className="text-[#717973]">Batches approved and ready for on-chain minting</p>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-5 gap-4 px-6 py-4 bg-[#f9fbfc] border-b border-[#e2e9ec] font-bold text-[#414844] text-sm uppercase tracking-wider">
              <div>Batch ID</div>
              <div>Project Name</div>
              <div>Quantity (MT)</div>
              <div>Regulator Approval</div>
              <div>Action</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-[#e2e9ec]">
              {[
                {
                  id: '#BAT-8921',
                  project: 'Amazon Basin Reforestation',
                  category: 'Reforestation',
                  quantity: '2,500 MT',
                  approval: 'Approved',
                },
                {
                  id: '#BAT-8922',
                  project: 'Punjab Landfill Project',
                  category: 'Methane',
                  quantity: '1,800 MT',
                  approval: 'Approved',
                },
                {
                  id: '#BAT-8923',
                  project: 'Sahara Wind Farm Phase II',
                  category: 'Wind',
                  quantity: '3,200 MT',
                  approval: 'Approved',
                },
                {
                  id: '#BAT-8924',
                  project: 'Alpine Carbon Capture',
                  category: 'DAC',
                  quantity: '5,000 MT',
                  approval: 'Approved',
                },
              ].map((batch, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-5 gap-4 px-6 py-4 items-center hover:bg-[#f9fbfc] transition"
                >
                  <div className="font-mono text-sm font-semibold text-[#012d1d]">
                    {batch.id}
                  </div>
                  <div>
                    <p className="font-semibold text-[#012d1d] text-sm">{batch.project}</p>
                    <p className="text-xs text-[#717973]">{batch.category}</p>
                  </div>
                  <div className="font-semibold text-[#012d1d]">{batch.quantity}</div>
                  <div>
                    <span className="px-2 py-1 bg-[#e8f5e9] text-[#2e7d32] text-xs font-bold rounded">
                      ✓ {batch.approval}
                    </span>
                  </div>
                  <button className="px-4 py-2 bg-[#6bfe9c] text-[#012d1d] rounded-lg font-semibold text-sm hover:bg-[#5ae88a] transition">
                    Mint Asset
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* On-Chain Logs */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#012d1d] mb-2">Recent On-Chain Logs</h2>
            <p className="text-[#717973]">Latest minting transactions and blockchain activity</p>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Log Header */}
            <div className="grid grid-cols-4 gap-4 px-6 py-4 bg-[#f9fbfc] border-b border-[#e2e9ec] font-bold text-[#414844] text-sm uppercase tracking-wider">
              <div>Transaction Hash</div>
              <div>Batch</div>
              <div>Status</div>
              <div>Timestamp</div>
            </div>

            {/* Log Entries */}
            <div className="divide-y divide-[#e2e9ec]">
              {[
                { hash: '0x2f3...8c9e', batch: '#BAT-8924', status: 'SUCCESS', time: '2 mins ago' },
                { hash: '0x5a1...d2f7', batch: '#BAT-8923', status: 'SUCCESS', time: '15 mins ago' },
                { hash: '0x8b4...e1c3', batch: '#BAT-8922', status: 'SUCCESS', time: '1 hour ago' },
                { hash: '0x1d9...f5b2', batch: '#BAT-8921', status: 'SUCCESS', time: '3 hours ago' },
              ].map((log, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-4 gap-4 px-6 py-4 items-center hover:bg-[#f9fbfc] transition"
                >
                  <div className="font-mono text-sm text-[#717973]">{log.hash}</div>
                  <div className="font-semibold text-[#012d1d]">{log.batch}</div>
                  <div>
                    <span className="px-3 py-1 bg-[#e8f5e9] text-[#2e7d32] text-xs font-bold rounded-full">
                      ✓ {log.status}
                    </span>
                  </div>
                  <div className="text-sm text-[#717973]">{log.time}</div>
                </div>
              ))}
            </div>

            {/* View All Link */}
            <div className="px-6 py-4 border-t border-[#e2e9ec] text-center">
              <button className="text-[#6bfe9c] font-semibold hover:underline">
                View all transactions →
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
