'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { colors, shadows } from '@/lib/design-tokens';
import SideNavigation from './PortfolioSideNavigation';
import PortfolioHoldings from './PortfolioHoldings';
import AssetDistribution from './AssetDistribution';
import RecentActivity from './RecentActivity';

interface HoldingItem {
  id: string;
  projectName: string;
  batchId: string;
  amount: number;
  status: 'ACTIVE' | 'RETIRED' | 'PENDING';
  retireAction?: () => void;
}

interface ActivityItem {
  id: string;
  type: 'PURCHASE' | 'RETIRED';
  projectName: string;
  date: string;
  amount: number;
}

interface DistributionData {
  label: string;
  percentage: number;
  color: string;
}

export default function BuyerPortfolio() {
  const router = useRouter();
  const [holdings, setHoldings] = useState<HoldingItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [distributionData, setDistributionData] = useState<DistributionData[]>([]);
  const [totals, setTotals] = useState({
    totalCredits: 0,
    lifetimeOffset: 0,
    portfolioValue: 0,
    quarterlyGrowth: '+12%',
  });
  const [activeTab, setActiveTab] = useState<'portfolio' | 'insights' | 'governance'>('portfolio');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch portfolio holdings
      const [holdingsRes, activityRes, statsRes] = await Promise.all([
        api.get('/portfolio/holdings'),
        api.get('/portfolio/activity'),
        api.get('/portfolio/stats'),
      ]);

      // Process holdings data
      const holdingsData = holdingsRes.data.map((item: any) => ({
        id: item.id,
        projectName: item.projectName,
        batchId: item.batchId,
        amount: item.quantity,
        status: item.status,
      }));

      // Process recent activity
      const activityData = activityRes.data.map((item: any) => ({
        id: item.id,
        type: item.type,
        projectName: item.projectName,
        date: new Date(item.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        amount: item.amount,
      }));

      // Calculate distribution from holdings
      const distribution = calculateDistribution(holdingsData);

      // Update state
      setHoldings(holdingsData);
      setRecentActivity(activityData.slice(0, 5)); // Show last 5 activities
      setDistributionData(distribution);

      // Update totals
      setTotals({
        totalCredits: statsRes.data.totalCredits || 0,
        lifetimeOffset: statsRes.data.lifetimeOffset || 0,
        portfolioValue: statsRes.data.portfolioValue || 0,
        quarterlyGrowth: statsRes.data.quarterlyGrowth || '+12%',
      });
    } catch (err) {
      console.error('Failed to fetch portfolio data:', err);
      setError('Failed to load portfolio data. Please try again.');
      // Set mock data for development
      setMockData();
    } finally {
      setLoading(false);
    }
  };

  const calculateDistribution = (holdings: HoldingItem[]) => {
    const distribution: { [key: string]: number } = {};
    let total = 0;

    holdings.forEach((holding) => {
      const projectType = holding.projectName.split(' ')[0].toLowerCase();
      distribution[projectType] = (distribution[projectType] || 0) + holding.amount;
      total += holding.amount;
    });

    const colors = ['#1b4332', '#13bf66', '#6bfe9c'];
    let colorIndex = 0;

    return Object.entries(distribution)
      .map(([label, amount]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        percentage: Math.round((amount / total) * 100),
        color: colors[colorIndex++ % colors.length],
      }));
  };

  const setMockData = () => {
    const mockHoldings: HoldingItem[] = [
      {
        id: '1',
        projectName: 'Amazonian Reforestation',
        batchId: '#TRX-99821-X',
        amount: 2500,
        status: 'ACTIVE',
      },
      {
        id: '2',
        projectName: 'Great Barrier Blue Carbon',
        batchId: '#TRX-11204-Q',
        amount: 1200,
        status: 'ACTIVE',
      },
      {
        id: '3',
        projectName: 'Sahara Solar Offset',
        batchId: '#TRX-88712-Z',
        amount: 5000,
        status: 'RETIRED',
      },
    ];

    const mockActivity: ActivityItem[] = [
      {
        id: '1',
        type: 'PURCHASE',
        projectName: 'Amazonian Reforestation',
        date: 'May 24, 2024',
        amount: 1200,
      },
      {
        id: '2',
        type: 'RETIRED',
        projectName: 'Sahara Solar Offset',
        date: 'April 18, 2024',
        amount: 5000,
      },
      {
        id: '3',
        type: 'PURCHASE',
        projectName: 'Amazonian Reforestation',
        date: 'March 12, 2024',
        amount: 1300,
      },
    ];

    const mockDistribution: DistributionData[] = [
      { label: 'Reforestation', percentage: 45, color: '#1b4332' },
      { label: 'Blue Carbon', percentage: 30, color: '#13bf66' },
      { label: 'Solar Energy', percentage: 25, color: '#6bfe9c' },
    ];

    setHoldings(mockHoldings);
    setRecentActivity(mockActivity);
    setDistributionData(mockDistribution);
    setTotals({
      totalCredits: 12450,
      lifetimeOffset: 8120,
      portfolioValue: 342800,
      quarterlyGrowth: '+12%',
    });
  };

  const handleRetireCredits = async (holdingId: string) => {
    try {
      await api.post(`/portfolio/retire/${holdingId}`);
      await fetchPortfolioData();
    } catch (err) {
      console.error('Failed to retire credits:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-900 border-t-green-400" />
          <p className="mt-4 text-gray-600">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen w-full overflow-hidden bg-gradient-to-r from-slate-50 to-white"
      style={{
        backgroundImage:
          'linear-gradient(90deg, rgb(244, 250, 253) 0%, rgb(244, 250, 253) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)',
      }}
    >
      {/* Sidebar Navigation */}
      <SideNavigation activeTab="portfolio" />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-auto">
        {/* Top Navigation */}
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-100 bg-white/60 px-8 py-4 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-semibold tracking-tight text-green-950">Arboretum Finance</h1>
            <div className="flex gap-6">
              <Link
                href="/buyer/portfolio"
                className={`border-b-2 pb-1.5 text-base font-medium transition-colors ${
                  activeTab === 'portfolio'
                    ? 'border-green-500 text-green-500'
                    : 'border-transparent text-gray-700 hover:text-gray-900'
                }`}
              >
                Portfolio
              </Link>
              <button
                onClick={() => setActiveTab('insights')}
                className={`border-b-2 pb-1.5 text-base font-medium transition-colors ${
                  activeTab === 'insights'
                    ? 'border-green-500 text-green-500'
                    : 'border-transparent text-gray-700 hover:text-gray-900'
                }`}
              >
                Insights
              </button>
              <button
                onClick={() => setActiveTab('governance')}
                className={`border-b-2 pb-1.5 text-base font-medium transition-colors ${
                  activeTab === 'governance'
                    ? 'border-green-500 text-green-500'
                    : 'border-transparent text-gray-700 hover:text-gray-900'
                }`}
              >
                Governance
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="rounded-full p-2 hover:bg-gray-100">
              <span className="text-xl">📋</span>
            </button>
            <button className="rounded-full p-2 hover:bg-gray-100">
              <span className="text-xl">🔔</span>
            </button>
            <div className="h-8 w-8 rounded-full border border-gray-300 bg-gradient-to-br from-green-400 to-blue-500" />
          </div>
        </div>

        {/* Portfolio Content */}
        {activeTab === 'portfolio' && (
          <div className="flex-1 overflow-auto">
            <div className="flex flex-col gap-8 p-8">
              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-red-700">
                  <p>{error}</p>
                </div>
              )}

              {/* Impact Summary Section */}
              <div className="grid grid-cols-3 gap-6">
                {/* Total Credits Card */}
              <div
                className="rounded-xl p-8 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary.dark} 0%, ${colors.primary.dark} 100%)`,
                }}
              >
                <div className="mb-4 flex flex-col gap-2">
                  <p className="text-sm font-semibold" style={{ color: colors.primary.accent }}>
                    Total Credits
                  </p>
                  <div className="flex items-baseline gap-2">
                    <h2
                      className="text-4xl font-extrabold tracking-tight"
                      style={{ color: colors.primary.accent }}
                    >
                      {totals.totalCredits.toLocaleString()}
                    </h2>
                    <p
                      className="text-lg font-normal opacity-70"
                      style={{ color: colors.primary.accent }}
                    >
                      tCO2e
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-2">
                  <div
                    className="h-1.5 w-2 rounded-full"
                    style={{ backgroundColor: colors.primary.accent }}
                  />
                  <p className="text-sm font-medium" style={{ color: colors.primary.accent }}>
                    {totals.quarterlyGrowth} from last quarter
                  </p>
                </div>
              </div>

                {/* Lifetime Offset Card */}
                <div className="rounded-xl bg-white p-8 shadow-lg">
                  <div className="mb-6 flex flex-col gap-2">
                    <p className="text-sm font-semibold" style={{ color: colors.text.medium }}>
                      Lifetime Offset
                    </p>
                    <div className="flex items-baseline gap-2">
                      <h2
                        className="text-4xl font-extrabold tracking-tight"
                        style={{ color: colors.primary.darkest }}
                      >
                        {totals.lifetimeOffset.toLocaleString()}
                      </h2>
                      <p className="text-lg font-normal" style={{ color: colors.text.medium }}>
                        Retired
                      </p>
                    </div>
                  </div>
                  <div
                    className="h-2 w-full rounded-full"
                    style={{ backgroundColor: colors.borders.light }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: '33%', backgroundColor: colors.primary.success }}
                    />
                  </div>
                </div>

                {/* Active Portfolio Value Card */}
                <div className="rounded-xl bg-white p-8 shadow-lg">
                  <div className="mb-4 flex flex-col gap-2">
                    <p className="text-sm font-semibold" style={{ color: colors.text.medium }}>
                      Active Portfolio Value
                    </p>
                    <h2
                      className="text-4xl font-extrabold tracking-tight"
                      style={{ color: colors.primary.darkest }}
                    >
                      ${(totals.portfolioValue / 1000).toFixed(0)}K
                    </h2>
                  </div>
                  <div
                    className="inline-block rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: colors.primary.dark,
                      color: colors.primary.accent,
                    }}
                  >
                    EST. MARKET PRICE: $27.53/t
                  </div>
                </div>
              </div>

              {/* Holdings and Distribution Section */}
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                  <PortfolioHoldings
                    holdings={holdings}
                    onRetire={handleRetireCredits}
                  />
                </div>
                <div className="flex flex-col gap-6">
                  <AssetDistribution distribution={distributionData} />
                  <RecentActivity activities={recentActivity} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="flex items-center justify-center p-8">
            <p className="text-gray-500">Insights coming soon...</p>
          </div>
        )}

        {/* Governance Tab */}
        {activeTab === 'governance' && (
          <div className="flex items-center justify-center p-8">
            <p className="text-gray-500">Governance features coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
