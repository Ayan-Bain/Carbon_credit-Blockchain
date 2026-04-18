'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { colors } from '@/lib/design-tokens';

interface SideNavigationProps {}

export default function SideNavigation({}: SideNavigationProps) {
  const pathname = usePathname();
  const menuItems = [
    { label: 'Dashboard', href: '/buyer/dashboard', icon: '💼', active: pathname === '/buyer/dashboard' },
    { label: 'Marketplace', href: '/marketplace', icon: '🛒', active: pathname === '/marketplace' },
    { label: 'Audit Trail', href: '/audit', icon: '📋', active: pathname === '/audit' },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-gradient-to-b from-[#1b4332] to-[#012d1d] text-white shadow-lg p-5">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-[#6bfe9c] text-[#012d1d] rounded-lg p-2 font-bold">
          <span className="text-lg">🌿</span>
          <span className="text-sm">BLOCK CARBON</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              item.active
                ? 'bg-[#6bfe9c] text-[#012d1d] font-semibold'
                : 'text-[rgba(193,236,212,0.8)] hover:bg-[rgba(107,254,156,0.1)]'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>


    </aside>
  );
}
