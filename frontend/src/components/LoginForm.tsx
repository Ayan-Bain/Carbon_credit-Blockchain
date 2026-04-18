'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

// Image constants from Figma
const imgSectionLeftSideDigitalArboretumBrandImagery = "http://localhost:3845/assets/775fa3e9fb419f403c091806f3ff7e82d247ff5f.png";
const imgImageBackgroundBorder = "http://localhost:3845/assets/3445392391e3a8a5a86cc060173327554168df17.png";
const imgImageBackgroundBorder1 = "http://localhost:3845/assets/096b0de6c90852e3933775d1cd077a5757b794d6.png";
const imgContainer = "http://localhost:3845/assets/59ac54ad8b40cb368c5af4fb4b4b97c7e6f3d805.svg";
const imgSvg = "http://localhost:3845/assets/dee67b0d9180884e22a7e50613666beacb533243.svg";
const imgContainer1 = "http://localhost:3845/assets/3f77785e2af0d4d5a8b9b8c9d1d373456bb98de6.svg";
const imgContainer2 = "http://localhost:3845/assets/018ae4e4a75b3267f96765c9f986214f9f11f187.svg";

export default function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleEthereumLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await login();
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message === 'SIGN_IN_CANCELLED') {
        setLoginError('Sign-in cancelled. Please try again when ready.');
      } else {
        setLoginError('Authentication failed. Please verify your connection.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleTraditionalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implement traditional login with email/password
    // For now, just call Ethereum login
    await handleEthereumLogin();
  };

  return (
    <div className="flex min-h-screen bg-[#f4fafd]">
      {/* Left Side - Brand Imagery */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            alt=""
            className="absolute h-full left-[-30%] max-w-none top-0 w-[160%]"
            src={imgSectionLeftSideDigitalArboretumBrandImagery}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(1,45,29,0.4)] to-[rgba(1,45,29,0.7)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#012d1d] to-transparent opacity-60" />
        <div className="relative z-10 flex flex-col justify-between h-full p-16 text-white">
          <div className="flex items-center gap-3">
            <img alt="Logo" className="w-6 h-6" src={imgContainer} />
            <h1 className="text-2xl font-bold font-manrope">Block Carbon</h1>
          </div>
          <div className="max-w-md">
            <h2 className="text-5xl font-extrabold font-manrope mb-6 leading-tight">
              Securing the<br />world's natural<br />assets.
            </h2>
            <p className="text-lg mb-6 text-[#dde4e6] font-inter">
              Access the Block Carbon Ecosystem, where institutional assets meet the official transparency of the global registry.
            </p>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full border-2 border-[#012d1d] bg-[#e8eff1] overflow-hidden">
                  <img alt="Avatar 1" src={imgImageBackgroundBorder} className="w-full h-full object-cover" />
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-[#012d1d] bg-[#e8eff1] overflow-hidden">
                  <img alt="Avatar 2" src={imgImageBackgroundBorder1} className="w-full h-full object-cover" />
                </div>
              </div>
              <p className="text-[#dde4e6] text-sm">Join 2,400+ institutional partners</p>
            </div>
          </div>
          <div className="text-[#dde4e6] text-xs uppercase tracking-wider opacity-80 font-inter">
            VERIFIED CARBON REGISTRY © 2024
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-12 bg-[#f4fafd]">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-[#012d1d] mb-2 font-manrope">Welcome Back</h1>
            <p className="text-[#414844] font-inter">Secure access to your environmental portfolio.</p>
          </div>

          <div className="space-y-4">
            {/* Sign-In with Ethereum */}
            <button
              onClick={handleEthereumLogin}
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-[#012d1d] to-[#1b4332] text-white py-4 px-6 rounded-lg font-semibold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 font-inter"
            >
              <img alt="Wallet" src={imgSvg} className="w-6 h-6" />
              {isLoggingIn ? 'Connecting...' : 'Sign-In with Wallet'}
            </button>

            {loginError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-semibold text-center animate-in fade-in duration-300">
                {loginError}
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 py-4">
              <div className="flex-1 h-px bg-[#c1c8c2]" />
              <span className="text-xs font-medium text-[#414844] uppercase tracking-wider font-inter">OR TRADITIONAL LOGIN</span>
              <div className="flex-1 h-px bg-[#c1c8c2]" />
            </div>

            {/* Traditional Login Form */}
            <form onSubmit={handleTraditionalLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#161d1f] mb-2 font-inter">
                  Institutional Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full px-4 py-3 bg-[#e8eff1] rounded-lg text-[#717973] placeholder-[#717973] focus:outline-none focus:ring-2 focus:ring-[#13bf66] font-inter"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-[#161d1f] font-inter">Password</label>
                  <a href="#" className="text-xs font-medium text-[#13bf66] hover:underline font-inter">
                    Forgot password?
                  </a>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-[#e8eff1] rounded-lg text-[#717973] placeholder-[#717973] focus:outline-none focus:ring-2 focus:ring-[#13bf66] font-inter"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-[#dde4e6] text-[#012d1d] py-4 px-6 rounded-lg font-semibold hover:bg-[#d0d7d9] transition-colors disabled:opacity-50 font-inter"
              >
                {isLoggingIn ? 'Signing in...' : 'Continue'}
              </button>
            </form>
          </div>

          {/* Footer Links */}
          <div className="text-center mt-8">
            <p className="text-[#414844] font-inter">
              New to Block Carbon?{' '}
              <a href="#" className="text-[#13bf66] font-semibold hover:underline font-inter">
                Register here
              </a>
            </p>
          </div>

          {/* Security Proof */}
          <div className="border-t border-[#e2e9ec] pt-8 mt-8 opacity-60">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <img alt="Lock" src={imgContainer1} className="w-3 h-3" />
                <span className="text-xs font-semibold text-[#161d1f] uppercase tracking-wider font-inter">
                  AES-256 ENCRYPTED
                </span>
              </div>
              <div className="flex items-center gap-2">
                <img alt="Shield" src={imgContainer2} className="w-3 h-3" />
                <span className="text-xs font-semibold text-[#161d1f] uppercase tracking-wider font-inter">
                  OFFICIAL REGISTRY DOCUMENTS
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 flex justify-between items-center px-10 py-8 text-xs">
        <p className="text-[#012d1d] opacity-40 uppercase tracking-wider font-inter">
          © {new Date().getFullYear()} BLOCK CARBON. UNIVERSAL CREDIT REGISTRY.
        </p>
        <div className="flex gap-6">
          <a href="#" className="text-[#414844] uppercase tracking-wider hover:text-[#012d1d] transition-colors font-inter">
            SECURITY AUDIT
          </a>
          <a href="#" className="text-[#414844] uppercase tracking-wider hover:text-[#012d1d] transition-colors font-inter">
            PRIVACY POLICY
          </a>
        </div>
      </div>
    </div>
  );
}