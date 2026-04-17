'use client';

import SideNavigation from './SideNavigation';
import StatCard from './StatCard';
import BatchCard from './BatchCard';

const navItems = [
  { label: 'Dashboard', href: '/producer', icon: '📊', active: true },
  { label: 'Submissions', href: '/producer/submissions', icon: '📤' },
  { label: 'Verification', href: '/producer/verification', icon: '✓' },
  { label: 'Marketplace', href: '/producer/marketplace', icon: '🛒' },
  { label: 'Audit Trail', href: '/producer/audit', icon: '📋' },
];

const assetCards = [
  {
    id: 1,
    title: 'Amazon Basin Core',
    category: 'Reforestation',
    location: 'Brazil',
    image: '🌳',
  },
  {
    id: 2,
    title: 'Old Growth Sanctuary',
    category: 'Conservation',
    location: 'Pacific Northwest',
    image: '🌲',
  },
  {
    id: 3,
    title: 'Temperate Ridge Project',
    category: 'Afforestation',
    location: 'Oregon, USA',
    image: '⛰️',
  },
  {
    id: 4,
    title: 'Alpine Sequestration',
    category: 'Carbon Capture',
    location: 'Swiss Alps',
    image: '🏔️',
  },
];

export default function ProducerDashboard() {
  return (
    <div className="flex min-h-screen bg-[#f4fafd]">
      {/* Sidebar */}
      <SideNavigation items={navItems} />

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-[#012d1d] mb-2">Producer Dashboard</h1>
            <p className="text-[#717973]">Manage your carbon credit submissions and portfolio</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-6 py-2 bg-white border border-[#e2e9ec] rounded-lg font-semibold text-[#012d1d] hover:bg-[#f4fafd] transition">
              👤 Profile
            </button>
            <button className="px-6 py-2 bg-[#6bfe9c] text-[#012d1d] rounded-lg font-semibold hover:bg-[#5ae88a] transition">
              💳 Connect Wallet
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          <StatCard
            label="Total Assets"
            value="12,840.50"
            subtext="tCO2e Carbon Credits"
            icon="📈"
          />
          <StatCard
            label="In Review"
            value="3"
            subtext="Pending Verification"
            icon="⏳"
          />
          <StatCard
            label="Available to List"
            value="8,420.75"
            subtext="Ready for Marketplace"
            icon="✓"
          />
        </div>

        {/* My Batches */}
        <section className="mb-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#012d1d] mb-2">My Batches</h2>
            <p className="text-[#717973]">Recent submissions and their verification status</p>
          </div>

          <div className="grid gap-4">
            <BatchCard
              projectName="Amazon Basin Reforestation"
              location="Brazil"
              quantity="2,500 tCO2e"
              status="approved"
              submissionDate="2025-03-15"
              actions={[{ label: 'Mint Asset', onClick: () => {} }]}
            />
            <BatchCard
              projectName="Punjab Landfill Methane Capture"
              location="India"
              quantity="1,800 tCO2e"
              status="pending"
              submissionDate="2025-04-10"
              actions={[
                { label: 'View Details', onClick: () => {} },
                { label: 'Upload Proofs', onClick: () => {} },
              ]}
            />
            <BatchCard
              projectName="Sahara Wind Farm Phase II"
              location="Morocco"
              quantity="3,200 tCO2e"
              status="minted"
              submissionDate="2025-02-28"
              actions={[
                { label: 'List for Sale', onClick: () => {} },
                { label: 'View on Chain', onClick: () => {} },
              ]}
            />
          </div>
        </section>

        {/* Registered Assets */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#012d1d] mb-2">Registered Assets</h2>
            <p className="text-[#717973]">Your verified carbon credit projects</p>
          </div>

          <div className="grid grid-cols-4 gap-6">
            {assetCards.map((asset) => (
              <div
                key={asset.id}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all"
              >
                <div className="h-32 bg-gradient-to-br from-[#1b4332] to-[#012d1d] flex items-center justify-center text-5xl">
                  {asset.image}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-[#012d1d] mb-1">{asset.title}</h3>
                  <p className="text-sm text-[#717973] mb-2">{asset.location}</p>
                  <span className="text-xs font-bold bg-[#e3f2fd] text-[#1565c0] px-2 py-1 rounded">
                    {asset.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
