'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { BrowserProvider, getAddress } from 'ethers';
import { SiweMessage } from 'siwe';
import api from './api';

interface User {
  id: string;
  name: string;
  walletAddress: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  isConnected: boolean;
  address: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
        
        // Also check for wallet connection
        if (window.ethereum) {
          try {
            const provider = new BrowserProvider(window.ethereum);
            const accounts = await provider.send('eth_accounts', []);
            if (accounts.length > 0) {
              setAddress(getAddress(accounts[0]));
              setIsConnected(true);
            }
          } catch (err) {
            console.error('Failed to auto-reconnect wallet:', err);
          }
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask');
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const address = getAddress(accounts[0]);
      setAddress(address);
      setIsConnected(true);

      // 1. Get nonce from server
      const { data: { nonce } } = await api.get('/auth/nonce');

      // 2. Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address: address,
        statement: 'Sign in with Ethereum to Carbon Credit Registry.',
        uri: window.location.origin,
        version: '1',
        chainId: 31337, // Local Hardhat
        nonce: nonce,
      });

      const signer = await provider.getSigner();
      const preparedMessage = message.prepareMessage();
      const signature = await signer.signMessage(preparedMessage);

      // 3. Verify on server
      const { data } = await api.post('/auth/login', {
        message: preparedMessage,
        signature: signature,
      });

      const { accessToken, user: loggedUser } = data;

      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error.code === 4001 || error.message?.includes('user rejected')) {
        throw new Error('SIGN_IN_CANCELLED');
      }
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setAddress(null);
    setIsConnected(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isConnected, address }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
