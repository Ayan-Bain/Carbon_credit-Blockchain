'use client';

import SideNavigation from './SideNavigation';
import StatCard from './StatCard';

const navItems = [
  { label: 'Dashboard', href: '/regulator', icon: '📊' },
  { label: 'Verification', href: '/regulator/verification', icon: '✓', active: true },
  { label: 'History', href: '/regulator/history', icon: '📋' },
  { label: 'Standards', href: '/regulator/standards', icon: '⚖️' },
  { label: 'Audit Trail', href: '/regulator/audit', icon: '🔍' },
];

export default function RegulatorDashboard() {
  return (
    <div className="flex min-h-screen bg-[#f4fafd]">
      {/* Sidebar */}
      <SideNavigation items={navItems} />

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-[#012d1d] mb-2">Verification Queue</h1>
            <p className="text-[#717973]">Review and approve carbon credit batch submissions</p>
          </div>
          <div className="px-4 py-2 bg-[#e8f5e9] text-[#2e7d32] rounded-lg font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-[#2e7d32] rounded-full"></span>
            Regulator Power: Active
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          <StatCard
            label="Pending Review"
            value="12"
            subtext="Awaiting verification"
            icon="⏳"
          />
          <StatCard
            label="Audited"
            value="4"
            subtext="48.2% compliance"
            icon="✓"
          />
          <StatCard
            label="Rejection Rate"
            value="8.3%"
            subtext="Last 30 days"
            icon="⚠️"
          />
          <StatCard
            label="Processing Time"
            value="2.4h"
            subtext="Average completion"
            icon="⏱️"
          />
        </div>

        {/* Active Queue */}
        <section className="mb-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#012d1d] mb-2">Active Queue</h2>
            <p className="text-[#717973]">Batches pending your verification</p>
          </div>

          <div className="bg-white rounded-lg overflow-hidden shadow-md">
            {/* Tabs */}
            <div className="flex border-b border-[#e2e9ec]">
              <button className="px-6 py-4 font-semibold text-[#6bfe9c] border-b-2 border-[#6bfe9c]">
                Current Batch
              </button>
              <button className="px-6 py-4 font-semibold text-[#717973] hover:text-[#012d1d]">
                History
              </button>
              <button className="px-6 py-4 font-semibold text-[#717973] hover:text-[#012d1d]">
                Standards
              </button>
            </div>

            {/* Queue Items */}
            <div className="divide-y divide-[#e2e9ec]">
              {[1, 2, 3].map((item) => (
                <div key={item} className="p-6 hover:bg-[#f9fbfc] transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-[#012d1d]">Batch #{12345 + item}</h3>
                        <span className="px-2 py-1 bg-[#fff3e0] text-[#e65100] text-xs font-bold rounded">
                          In Approval
                        </span>
                      </div>
                      <p className="text-sm text-[#717973]">
                        Amazon Basin Reforestation • Brazil • {2500 + item * 100} tCO2e
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#012d1d]">Submitted</p>
                      <p className="text-xs text-[#717973]">2025-04-{10 + item}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4 pb-4 border-b border-[#e2e9ec]">
                    <div>
                      <p className="text-xs text-[#717973] font-bold uppercase">Location</p>
                      <p className="text-sm font-semibold text-[#012d1d]">-14.3°, -60.2°</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#717973] font-bold uppercase">Credits</p>
                      <p className="text-sm font-semibold text-[#012d1d]">{2500 + item * 100} MT</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#717973] font-bold uppercase">Evidence Files</p>
                      <p className="text-sm font-semibold text-[#6bfe9c] cursor-pointer">View Proofs</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#717973] font-bold uppercase">Risk Level</p>
                      <p className="text-sm font-semibold text-[#2e7d32]">Low</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-[#6bfe9c] text-[#012d1d] rounded-lg font-semibold text-sm hover:bg-[#5ae88a] transition">
                      ✓ Approve
                    </button>
                    <button className="px-4 py-2 bg-[#fee2e2] text-[#b8362f] rounded-lg font-semibold text-sm hover:bg-[#fecaca] transition">
                      ✕ Reject
                    </button>
                    <button className="px-4 py-2 bg-[#e2e9ec] text-[#012d1d] rounded-lg font-semibold text-sm hover:bg-[#d1d9de] transition">
                      Request Info
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Approval Section */}
        <section className="grid grid-cols-2 gap-8">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-bold text-[#012d1d] mb-4">Audit Notes</h3>
            <textarea
              placeholder="Add audit notes and observations..."
              className="w-full h-32 p-3 border border-[#e2e9ec] rounded-lg focus:outline-none focus:border-[#6bfe9c] resize-none"
            />
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-bold text-[#012d1d] mb-4">Registry Risk Profile</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#717973]">Document Risk</span>
                <span className="text-sm font-bold text-[#2e7d32]">Low</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#717973]">Verification Risk</span>
                <span className="text-sm font-bold text-[#2e7d32]">Low</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#717973]">Operational Risk</span>
                <span className="text-sm font-bold text-[#f59e0b]">Medium</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
