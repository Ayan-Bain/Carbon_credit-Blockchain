'use client';

import Link from 'next/link';
import { colors } from '@/lib/design-tokens';

interface SideNavigationProps {
  activeTab?: string;
}

export default function SideNavigation({ activeTab = 'portfolio' }: SideNavigationProps) {
  const menuItems = [
    { label: 'Dashboard', href: '/buyer', icon: '📊' },
    { label: 'Portfolio', href: '/buyer/portfolio', icon: '💼', active: activeTab === 'portfolio' },
    { label: 'Verification', href: '/buyer/verification', icon: '✓' },
    { label: 'Marketplace', href: '/buyer/marketplace', icon: '🛒' },
    { label: 'Audit Trail', href: '/buyer/audit', icon: '📋' },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-100 bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b border-gray-100 p-6">
        <h3
          className="text-lg font-bold"
          style={{ color: colors.primary.darkest }}
        >
          Carbon Assets
        </h3>
        <p
          className="mt-1 text-xs font-semibold uppercase tracking-wider"
          style={{ color: colors.text.medium }}
        >
          Institutional Grade
        </p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex flex-col gap-1 p-4">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all"
            style={
              item.active
                ? {
                    backgroundColor: colors.primary.dark,
                    color: colors.primary.accent,
                    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                  }
                : {
                    color: colors.text.medium,
                  }
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 w-64 border-t border-gray-100 bg-white p-4">
        <div className="flex flex-col gap-3">
          <button
            className="w-full rounded-lg px-4 py-3 text-sm font-semibold shadow-lg transition-colors"
            style={{
              backgroundColor: colors.primary.dark,
              color: colors.primary.accent,
            }}
          >
            Buy Credits
          </button>
          <div className="flex flex-col gap-2 text-sm">
            <button
              className="flex items-center gap-2 transition-colors"
              style={{ color: colors.text.medium }}
            >
              <span>⚙️</span>
              <span>Settings</span>
            </button>
            <button
              className="flex items-center gap-2 transition-colors"
              style={{ color: colors.text.medium }}
            >
              <span>❓</span>
              <span>Support</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
