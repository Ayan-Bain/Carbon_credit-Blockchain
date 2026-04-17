'use client';

import { useState } from 'react';
import SideNavigation from './SideNavigation';
import ProjectCard from './ProjectCard';

const navItems = [
  { label: 'Dashboard', href: '/buyer', icon: '📊' },
  { label: 'Marketplace', href: '/buyer/marketplace', icon: '🛒', active: true },
  { label: 'Portfolio', href: '/buyer/portfolio', icon: '💼' },
  { label: 'Transactions', href: '/buyer/transactions', icon: '📋' },
  { label: 'Settings', href: '/buyer/settings', icon: '⚙️' },
];

const projects = [
  {
    id: 1,
    title: 'Amazon Basin',
    subtitle: 'Rainforest Reforestation',
    category: 'Reforestation',
    price: '$12.50/tCO2e',
    description: 'Large-scale reforestation project in the Amazon Basin',
    available: '50,000 tCO2e',
    image: '🌳',
  },
  {
    id: 2,
    title: 'Punjab Landfill',
    subtitle: 'Methane Capture',
    category: 'Methane',
    price: '$8.75/tCO2e',
    description: 'Methane capture from active landfill in Punjab, India',
    available: '18,500 tCO2e',
    image: '♻️',
  },
  {
    id: 3,
    title: 'Sahara Wind Farm',
    subtitle: 'Renewable Energy',
    category: 'Wind',
    price: '$15.00/tCO2e',
    description: 'Wind farm development reducing coal dependency',
    available: '75,200 tCO2e',
    image: '💨',
  },
  {
    id: 4,
    title: 'Alpine Carbon',
    subtitle: 'Direct Air Capture',
    category: 'DAC',
    price: '$25.00/tCO2e',
    description: 'Direct air capture facility in the Swiss Alps',
    available: '12,000 tCO2e',
    image: '⛰️',
  },
  {
    id: 5,
    title: 'Coastal Seagrass',
    subtitle: 'Blue Carbon',
    category: 'Seagrass',
    price: '$18.50/tCO2e',
    description: 'Seagrass restoration and protection project',
    available: '35,400 tCO2e',
    image: '🌊',
  },
  {
    id: 6,
    title: 'Temperate Forest',
    subtitle: 'Conservation',
    category: 'Conservation',
    price: '$11.00/tCO2e',
    description: 'Old growth forest protection in North America',
    available: '42,300 tCO2e',
    image: '🌲',
  },
];

export default function BuyerMarketplace() {
  const [selectedAsset, setSelectedAsset] = useState('Amazon Rainforest Reforestation');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');

  return (
    <div className="flex min-h-screen bg-[#f4fafd]">
      {/* Sidebar */}
      <SideNavigation items={navItems} />

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Left - Marketplace */}
          <div className="col-span-2">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-[#012d1d] mb-2">Active Marketplace</h1>
              <p className="text-[#717973]">Browse and purchase verified carbon credits from our registry</p>
            </div>

            {/* Filter & Sort */}
            <div className="flex gap-4 mb-8">
              <input
                type="text"
                placeholder="Search projects..."
                className="flex-1 px-4 py-2 border border-[#e2e9ec] rounded-lg focus:outline-none focus:border-[#6bfe9c]"
              />
              <select className="px-4 py-2 border border-[#e2e9ec] rounded-lg focus:outline-none focus:border-[#6bfe9c] bg-white">
                <option>All Categories</option>
                <option>Reforestation</option>
                <option>Renewable Energy</option>
                <option>Methane Capture</option>
              </select>
              <select className="px-4 py-2 border border-[#e2e9ec] rounded-lg focus:outline-none focus:border-[#6bfe9c] bg-white">
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest</option>
              </select>
            </div>

            {/* Project Grid */}
            <div className="grid grid-cols-2 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  image={project.image}
                  title={project.title}
                  subtitle={project.subtitle}
                  category={project.category}
                  price={project.price}
                  description={project.description}
                  available={project.available}
                  onBuy={() => setSelectedAsset(project.title)}
                />
              ))}
            </div>
          </div>

          {/* Right - Portfolio */}
          <aside className="space-y-6">
            {/* Portfolio Card */}
            <div className="bg-white rounded-lg p-6 shadow-md sticky top-8">
              <h3 className="text-lg font-bold text-[#012d1d] mb-6">My Portfolio</h3>

              {/* Asset Selector */}
              <div className="mb-6">
                <label className="text-xs font-bold text-[#414844] uppercase tracking-wider block mb-2">
                  Retire Credits
                </label>
                <select
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e2e9ec] rounded-lg focus:outline-none focus:border-[#6bfe9c] text-[#012d1d]"
                >
                  <option>Amazon Rainforest Reforestation</option>
                  <option>Renewable Energy Fund</option>
                  <option>Conservation Portfolio</option>
                </select>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <label className="text-xs font-bold text-[#414844] uppercase tracking-wider block mb-2">
                  Amount (tCO2e)
                </label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e2e9ec] rounded-lg focus:outline-none focus:border-[#6bfe9c]"
                />
              </div>

              {/* Purpose Input */}
              <div className="mb-6">
                <label className="text-xs font-bold text-[#414844] uppercase tracking-wider block mb-2">
                  Purpose
                </label>
                <textarea
                  placeholder="Why are you retiring these credits?"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e2e9ec] rounded-lg focus:outline-none focus:border-[#6bfe9c] resize-none h-24"
                />
              </div>

              {/* Execute Button */}
              <button className="w-full bg-gradient-to-r from-[#012d1d] to-[#1b4332] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition">
                Execute Retirement
              </button>
            </div>

            {/* Holdings Card */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h4 className="font-bold text-[#012d1d] mb-4">Active Holdings</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#717973]">Amazon Basin</span>
                  <span className="font-semibold text-[#012d1d]">12,500 tCO2e</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#717973]">Rainforest Conservation</span>
                  <span className="font-semibold text-[#012d1d]">8,200 tCO2e</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#717973]">Wind Energy</span>
                  <span className="font-semibold text-[#012d1d]">5,400 tCO2e</span>
                </div>
                <div className="pt-3 border-t border-[#e2e9ec] flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-[#6bfe9c]">26,100 tCO2e</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
