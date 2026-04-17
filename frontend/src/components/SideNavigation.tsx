'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon?: string;
  active?: boolean;
}

interface SideNavigationProps {
  items: NavItem[];
  currentPath?: string;
}

export default function SideNavigation({ items, currentPath = '/' }: SideNavigationProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-[#1b4332] to-[#012d1d] text-white shadow-lg p-6 z-40">
      {/* Branding */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 bg-[#6bfe9c] text-[#012d1d] rounded-lg p-2.5 font-bold">
          <span className="text-lg">🌿</span>
          <span>VL</span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="space-y-2">
        {items.map((item) => {
          const isActive = item.active || currentPath.includes(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#6bfe9c] text-[#012d1d] font-semibold'
                  : 'text-[rgba(193,236,212,0.8)] hover:bg-[rgba(107,254,156,0.1)]'
              }`}
            >
              {item.icon && <span className="text-lg">{item.icon}</span>}
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-6 left-6 right-6">
        <button className="w-full px-4 py-2 bg-[rgba(107,254,156,0.1)] text-[#6bfe9c] rounded-lg text-sm font-medium hover:bg-[rgba(107,254,156,0.2)] transition-colors">
          Settings
        </button>
      </div>
    </aside>
  );
}
