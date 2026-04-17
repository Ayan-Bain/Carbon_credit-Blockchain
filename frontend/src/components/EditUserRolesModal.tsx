'use client';

import { useState } from 'react';

interface EditUserRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userAvatar?: string;
}

export default function EditUserRolesModal({
  isOpen,
  onClose,
  userName = 'Elena Verdant',
  userAvatar = '👤',
}: EditUserRolesModalProps) {
  const [role, setRole] = useState('producer');
  const [permissions, setPermissions] = useState({
    minter: true,
    regulator: false,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e9ec]">
          <h2 className="text-xl font-bold text-[#012d1d]">Edit User Roles</h2>
          <button
            onClick={onClose}
            className="text-[#717973] hover:text-[#012d1d] text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Profile */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#6bfe9c] to-[#1b4332] rounded-full flex items-center justify-center text-2xl">
              {userAvatar}
            </div>
            <div>
              <h3 className="font-bold text-[#012d1d]">{userName}</h3>
              <p className="text-sm text-[#717973] font-mono">0x8f2...7b41</p>
            </div>
          </div>

          {/* Base Role Assignment */}
          <div>
            <p className="text-xs font-bold text-[#414844] uppercase tracking-wider mb-3">
              Base Role
            </p>
            <div className="flex gap-3">
              {['Producer', 'Buyer'].map((option) => (
                <button
                  key={option}
                  onClick={() => setRole(option.toLowerCase())}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                    role === option.toLowerCase()
                      ? 'bg-[#6bfe9c] text-[#012d1d]'
                      : 'bg-[#e2e9ec] text-[#717973] hover:bg-[#d1d9de]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Permissions Promotion */}
          <div>
            <p className="text-xs font-bold text-[#414844] uppercase tracking-wider mb-3">
              Permissions (Promotion)
            </p>
            <div className="space-y-3">
              {[
                {
                  id: 'minter',
                  name: 'MINTER',
                  description: 'Execute on-chain minting of approved batches',
                },
                {
                  id: 'regulator',
                  name: 'REGULATOR',
                  description: 'Verify and approve carbon credit submissions',
                },
              ].map((perm) => (
                <label
                  key={perm.id}
                  className="flex items-start gap-3 p-3 border border-[#e2e9ec] rounded-lg cursor-pointer hover:bg-[#f9fbfc] transition"
                >
                  <input
                    type="checkbox"
                    checked={permissions[perm.id as keyof typeof permissions]}
                    onChange={(e) =>
                      setPermissions({
                        ...permissions,
                        [perm.id]: e.target.checked,
                      })
                    }
                    className="mt-1 w-4 h-4 accent-[#6bfe9c]"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-[#012d1d] text-sm">{perm.name}</p>
                    <p className="text-xs text-[#717973]">{perm.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Warning Alert */}
          {permissions.regulator && (
            <div className="p-4 bg-[#fee2e2] border border-[#fecaca] rounded-lg">
              <p className="text-sm text-[#b8362f] font-semibold">
                ⚠️ Regulator permissions grant review authority. This role can affect all batches in the registry.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-[#e2e9ec] bg-[#f9fbfc]">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-[#e2e9ec] rounded-lg font-semibold text-[#012d1d] hover:bg-[#f4fafd] transition"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-[#6bfe9c] text-[#012d1d] rounded-lg font-semibold hover:bg-[#5ae88a] transition"
          >
            Confirm Changes
          </button>
        </div>
      </div>
    </div>
  );
}
