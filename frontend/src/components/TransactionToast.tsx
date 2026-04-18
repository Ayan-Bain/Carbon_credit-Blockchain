'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export type TransactionStatus = 'pending' | 'success' | 'error';

interface TransactionToastProps {
  show: boolean;
  status: TransactionStatus;
  message: string;
  txHash?: string;
  onClose: () => void;
}

export default function TransactionToast({ show, status, message, txHash, onClose }: TransactionToastProps) {
  useEffect(() => {
    if (show && status !== 'pending') {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, status, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-8 right-8 z-50 min-w-[320px] max-w-md bg-white rounded-xl shadow-2xl border border-[#e2e9ec] overflow-hidden"
        >
          <div className="p-4 flex items-start gap-4">
            <div className={`mt-1 p-2 rounded-full ${
              status === 'pending' ? 'bg-blue-50 text-blue-500' :
              status === 'success' ? 'bg-green-50 text-green-500' :
              'bg-red-50 text-red-500'
            }`}>
              {status === 'pending' && <Loader2 className="w-5 h-5 animate-spin" />}
              {status === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {status === 'error' && <XCircle className="w-5 h-5" />}
            </div>

            <div className="flex-1">
              <h4 className="font-bold text-[#012d1d] text-sm">
                {status === 'pending' ? 'Transaction Processing' :
                 status === 'success' ? 'Transaction Confirmed' :
                 'Transaction Failed'}
              </h4>
              <p className="text-[#717973] text-xs mt-1 leading-relaxed">
                {message}
              </p>
              
            </div>

            <button 
              onClick={onClose}
              className="text-[#ccd4d8] hover:text-[#717973] transition"
            >
              ✕
            </button>
          </div>
          
          {status === 'pending' && (
            <motion.div 
              className="h-1 bg-[#6bfe9c]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 30, ease: "linear" }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
