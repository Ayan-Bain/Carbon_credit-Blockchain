'use client';

import Link from 'next/link';
import { useState } from 'react';
import EditUserRolesModal from '@/components/EditUserRolesModal';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const designs = [
    {
      id: 1,
      name: 'Auth & Registration',
      description: 'User authentication and registration interface',
      href: '/auth',
      icon: '🔐',
      color: 'from-[#1b4332] to-[#012d1d]',
    },
    {
      id: 2,
      name: 'Producer Dashboard',
      description: 'Dashboard for carbon credit producers',
      href: '/producer',
      icon: '📊',
      color: 'from-[#0d7377] to-[#14919b]',
    },
    {
      id: 3,
      name: 'Regulator Dashboard',
      description: 'Interface for regulatory verification and approval',
      href: '/regulator',
      icon: '✓',
      color: 'from-[#d62828] to-[#f77f00]',
    },
    {
      id: 4,
      name: 'Buyer Marketplace',
      description: 'Browse and purchase verified carbon credits',
      href: '/buyer',
      icon: '🛒',
      color: 'from-[#06a77d] to-[#118b7c]',
    },
    {
      id: 5,
      name: 'Minting Queue',
      description: 'Execute on-chain minting of approved batches',
      href: '/minting',
      icon: '⛓️',
      color: 'from-[#5a189a] to-[#3c096c]',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4fafd] to-[#e8f0f5]">
      {/* Hero Section */}
      <div className="relative overflow-hidden px-6 py-24 sm:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-extrabold text-[#012d1d] mb-6">
            🌿 Veridian Ledger
          </h1>
          <p className="text-xl text-[#414844] mb-4">
            Carbon Credit Registry & Management Platform
          </p>
          <p className="text-lg text-[#717973] max-w-2xl mx-auto">
            Implemented Figma designs showcasing authentication, dashboards, marketplaces, and regulatory workflows
          </p>
        </div>
      </div>

      {/* Designs Grid */}
      <div className="max-w-6xl mx-auto px-6 sm:px-12 lg:px-20 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {designs.map((design) => (
            <Link
              key={design.id}
              href={design.href}
              className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              {/* Background gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${design.color} opacity-10 group-hover:opacity-20 transition`}
              />

              {/* Card content */}
              <div className="relative p-8 bg-white/90 backdrop-blur-sm h-full flex flex-col justify-between">
                <div>
                  <div className="text-5xl mb-4">{design.icon}</div>
                  <h3 className="text-xl font-bold text-[#012d1d] mb-2">
                    {design.name}
                  </h3>
                  <p className="text-sm text-[#717973]">
                    {design.description}
                  </p>
                </div>

                {/* Arrow indicator */}
                <div className="flex items-center gap-2 text-[#6bfe9c] font-semibold mt-4 group-hover:gap-3 transition-all">
                  <span>View Design</span>
                  <span>→</span>
                </div>
              </div>

              {/* Colored bottom border */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${design.color}`} />
            </Link>
          ))}

          {/* Modal Demo Card */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-left bg-white/90 backdrop-blur-sm p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#f39c12] to-[#e67e22] opacity-10 group-hover:opacity-20 transition" />

            <div className="relative h-full flex flex-col justify-between">
              <div>
                <div className="text-5xl mb-4">👥</div>
                <h3 className="text-xl font-bold text-[#012d1d] mb-2">
                  Edit User Roles Modal
                </h3>
                <p className="text-sm text-[#717973]">
                  Modal dialog for managing user permissions
                </p>
              </div>

              <div className="flex items-center gap-2 text-[#6bfe9c] font-semibold mt-4 group-hover:gap-3 transition-all">
                <span>View Modal</span>
                <span>→</span>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f39c12] to-[#e67e22]" />
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white/50 backdrop-blur-sm border-t border-[#e2e9ec] py-16">
        <div className="max-w-6xl mx-auto px-6 sm:px-12 lg:px-20">
          <h2 className="text-3xl font-bold text-[#012d1d] mb-12 text-center">
            Design System & Implementation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-[#012d1d] mb-3 flex items-center gap-2">
                <span className="text-2xl">🎨</span> Consistent Design
              </h3>
              <p className="text-[#717973]">
                All 5+ components built on unified color palette, typography, and spacing system
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[#012d1d] mb-3 flex items-center gap-2">
                <span className="text-2xl">⚛️</span> React + TypeScript
              </h3>
              <p className="text-[#717973]">
                Type-safe components with full TypeScript support and modern React patterns
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[#012d1d] mb-3 flex items-center gap-2">
                <span className="text-2xl">🎯</span> Tailwind CSS
              </h3>
              <p className="text-[#717973]">
                Utility-first styling with responsive design and hover/interaction states
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 px-6 text-center text-[#717973] border-t border-[#e2e9ec]">
        <p>All designs implemented from Figma • Built with Next.js 16 + React 19 + Tailwind CSS</p>
      </div>

      {/* Modal */}
      <EditUserRolesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userName="Elena Verdant"
        userAvatar="👤"
      />
    </div>
  );
}
