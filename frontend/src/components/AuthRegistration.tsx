'use client';

import { useState } from 'react';
import Image from 'next/image';

// Image constants (hosted on localhost during development)
const imgBgTexture = 'http://localhost:3845/assets/0ed93b4ee06b1a2be6f6a1da965bae9a88cbfba5.png';
const imgAvatar1 = 'http://localhost:3845/assets/29464c0d2b85ccd4054596d72dfd374c939a1ba7.png';
const imgAvatar2 = 'http://localhost:3845/assets/bae3f3ed55d7c1c5bfc3beac99bf0cefd8bbcbac.png';
const imgAvatar3 = 'http://localhost:3845/assets/98b7286129538c30755adf2bdf5bb50b3cafdae5.png';
const imgMetaMask = 'http://localhost:3845/assets/d848e55573035f864e827ce6fa972031ea190827.png';
const imgLogo = 'http://localhost:3845/assets/b114993a0afce4255240ec96eecdb2a2135309a5.svg';
const imgCheckmark = 'http://localhost:3845/assets/f6e2e4340bdcc22b09cfcae9f047cdcd22423963.svg';
const imgVcsIcon = 'http://localhost:3845/assets/a89afdd6da54d2d1fe602fcca193cf7c7f1c28da.svg';
const imgEntityIcon = 'http://localhost:3845/assets/57d899811e668e458bd16524b74e2d2f5643d521.svg';
const imgWalletIcon = 'http://localhost:3845/assets/dbc0f93d3444eab8ec72d947daffea7dded2da95.svg';
const imgDropdownArrow = 'http://localhost:3845/assets/1baa8ee18bbe1b194307d481e020da23aee820ec.svg';
const imgRoleIcon = 'http://localhost:3845/assets/82a8255be66ffc504f01baea6fbf6d94f4244441.svg';
const imgDropdownIcon = 'http://localhost:3845/assets/76c7024d7321f75ab59b4df56c5c8f20f08769f1.svg';
const imgArrowIcon = 'http://localhost:3845/assets/a863a47b17f54001aaa551fc820671c963c7f36a.svg';
const imgHelpIcon = 'http://localhost:3845/assets/e63a9d30a9e2a1b3db1b8ddee7b93948000d703b.svg';

export default function AuthRegistration() {
  const [fullName, setFullName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [role, setRole] = useState('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ fullName, walletAddress, role });
  };

  return (
    <div
      className="flex flex-col items-start relative w-full min-h-screen bg-gradient-to-r from-[#f4fafd] to-[#ffffff]"
      style={{
        backgroundImage: 'linear-gradient(90deg, rgb(244, 250, 253) 0%, rgb(244, 250, 253) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)',
      }}
    >
      <div className="flex w-full h-screen">
        {/* Left Section - Branding */}
        <div
          className="flex flex-1 flex-col items-start justify-between p-16 relative overflow-hidden"
          style={{
            backgroundImage: 'linear-gradient(135deg, rgb(1, 45, 29) 0%, rgb(27, 67, 50) 100%)',
          }}
        >
          {/* Decorative Elements */}
          <div className="absolute bg-[rgba(0,70,33,0.2)] blur-[60px] rounded-full" style={{ width: '300px', height: '300px', top: '-50px', left: '100px', filter: 'blur(60px)' }} />
          <div className="absolute bg-[rgba(19,191,102,0.1)] blur-[40px] rounded-full" style={{ width: '400px', height: '400px', bottom: '50px', right: '-100px', filter: 'blur(40px)' }} />

          {/* Background Texture */}
          <div className="absolute inset-0 mix-blend-overlay opacity-20">
            <img
              alt="background texture"
              className="absolute h-full w-full object-cover left-[-30%]"
              src={imgBgTexture}
              style={{ width: '160%' }}
            />
          </div>

          {/* Content */}
          <div className="flex flex-col gap-8 items-start relative z-10 w-full">
            {/* Logo */}
            <div className="flex gap-3 items-center w-full">
              <div className="bg-[#6bfe9c] flex items-center justify-center rounded-lg shrink-0 size-10">
                <img alt="Veridian logo" className="w-[18px] h-5" src={imgLogo} />
              </div>
              <div>
                <h1 className="font-extrabold text-2xl text-[#6bfe9c] tracking-tight">Veridian Ledger</h1>
              </div>
            </div>

            {/* Main Heading */}
            <div className="flex flex-col items-start max-w-[576px] pt-4">
              <h2 className="font-extrabold text-[72px] text-white tracking-tight leading-[1.1]">
                The Digital <span className="text-[#6bfe9c]">Arboretum</span> of Carbon Assets.
              </h2>
            </div>

            {/* Description */}
            <div className="flex flex-col items-start max-w-[448px]">
              <p className="text-xl text-[rgba(193,236,212,0.8)] leading-relaxed">
                A high-trust registry for verified ecological impact, bridging institutional finance with decentralized environmental stewardship.
              </p>
            </div>
          </div>

          {/* Info Card */}
          <div className="relative z-10 w-full">
            <div className="backdrop-blur-[12px] bg-[rgba(221,228,230,0.6)] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-lg p-6 max-w-[398px]">
              {/* Avatars */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-start">
                  <div className="border-2 border-[#012d1d] rounded-full size-10 overflow-hidden">
                    <img alt="avatar 1" className="w-full h-full" src={imgAvatar1} />
                  </div>
                  <div className="border-2 border-[#012d1d] rounded-full size-10 overflow-hidden ml-[-12px]">
                    <img alt="avatar 2" className="w-full h-full" src={imgAvatar2} />
                  </div>
                  <div className="border-2 border-[#012d1d] rounded-full size-10 overflow-hidden ml-[-12px]">
                    <img alt="avatar 3" className="w-full h-full" src={imgAvatar3} />
                  </div>
                </div>
                <p className="font-medium text-white text-sm">Joined by 12k+ stewards</p>
              </div>

              <div className="bg-[rgba(255,255,255,0.1)] h-px my-4" />

              {/* VCS Compliance Badge */}
              <div className="flex items-center gap-2">
                <img alt="checkmark" className="w-[12.833px] h-[12.25px]" src={imgCheckmark} />
                <p className="font-bold text-[#6bfe9c] text-xs tracking-wider uppercase">Verified Carbon Standard (VCS) Compliant</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Registration Form */}
        <div className="flex flex-1 items-center justify-center bg-[#f4fafd] p-24">
          <div className="w-full max-w-[448px]">
            {/* Header */}
            <div className="mb-10">
              <h3 className="font-extrabold text-[30px] text-[#161d1f] tracking-tight mb-2">
                Onboard to Veridian
              </h3>
              <p className="text-base text-[#414844]">
                Connect your identity to the global ledger.
              </p>
            </div>

            {/* Web3 Connection */}
            <div className="mb-8">
              <label className="font-bold text-xs text-[#414844] tracking-wider uppercase block mb-4">
                Instant Authentication
              </label>

              <button
                type="button"
                className="w-full bg-white border border-[#c1c8c2] rounded-lg shadow-sm px-6 py-4 flex items-center justify-center gap-3 hover:bg-gray-50 transition"
              >
                <img alt="MetaMask" className="w-6 h-6" src={imgMetaMask} />
                <span className="font-semibold text-[#161d1f]">Sign-In with Ethereum</span>
                <img alt="arrow" className="w-5 h-3.5" src={imgArrowIcon} />
              </button>

              <p className="text-center text-xs text-[#414844] mt-4">
                By connecting, you agree to the SIWE protocol standards for secure, self-custodial identity.
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-[#e2e9ec]" />
              <span className="font-semibold text-xs text-[#c1c8c2] tracking-wider uppercase">Or Register Profile</span>
              <div className="flex-1 h-px bg-[#e2e9ec]" />
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="font-bold text-xs text-[#414844] tracking-wider uppercase block mb-2">
                  Full Entity Name
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <img alt="entity icon" className="w-4 h-4" src={imgEntityIcon} />
                  </div>
                  <input
                    type="text"
                    placeholder="Acme Conservation Group"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white border border-[#c1c8c2] rounded-lg pl-12 pr-4 py-[18px] font-medium text-[#161d1f] placeholder-[#c1c8c2] focus:outline-none focus:border-[#6bfe9c] transition shadow-sm"
                  />
                </div>
              </div>

              {/* Wallet Address */}
              <div>
                <label className="font-bold text-xs text-[#414844] tracking-wider uppercase block mb-2">
                  Wallet Address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <img alt="wallet icon" className="w-[19px] h-[18px]" src={imgWalletIcon} />
                  </div>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="w-full bg-white border border-[#c1c8c2] rounded-lg pl-12 pr-4 py-[18px] font-mono text-sm text-[#161d1f] placeholder-[#c1c8c2] focus:outline-none focus:border-[#6bfe9c] transition shadow-sm"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="font-bold text-xs text-[#414844] tracking-wider uppercase block mb-2">
                  Operational Role
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <img alt="role icon" className="w-5 h-[19px]" src={imgRoleIcon} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                    className="w-full bg-white border border-[#c1c8c2] rounded-lg pl-12 pr-4 py-4 text-left font-medium text-[#161d1f] placeholder-[#c1c8c2] focus:outline-none focus:border-[#6bfe9c] transition shadow-sm flex items-center justify-between"
                  >
                    <span>{role || 'Select your role'}</span>
                    <img alt="dropdown" className="w-3 h-[7.4px]" src={imgDropdownIcon} />
                  </button>

                  {isRoleDropdownOpen && (
                    <div className="absolute top-full mt-1 w-full bg-white border border-[#c1c8c2] rounded-lg shadow-lg z-10">
                      {['Project Developer', 'Verifier', 'Buyer', 'Registry Administrator'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setRole(option);
                            setIsRoleDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-[#f4fafd] border-b border-[#e2e9ec] last:border-b-0 transition"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-br from-[#012d1d] to-[#1b4332] text-white font-semibold py-5 rounded-lg shadow-lg hover:shadow-xl transition flex items-center justify-center gap-3 mt-8"
              >
                <span>Complete Registration</span>
                <img alt="arrow" className="w-4 h-4" src={imgArrowIcon} />
              </button>
            </form>

            {/* Footer Links */}
            <p className="text-center text-sm text-[#414844] mt-8">
              Already have an account?{' '}
              <a href="#" className="font-semibold text-[#13bf66] hover:underline">
                Log In
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Support Button */}
      <button
        type="button"
        className="fixed bottom-8 right-8 backdrop-blur-[6px] bg-[rgba(221,228,230,0.8)] rounded-full p-4 shadow-lg hover:shadow-xl transition"
      >
        <img alt="help" className="w-5 h-5" src={imgHelpIcon} />
      </button>
    </div>
  );
}
